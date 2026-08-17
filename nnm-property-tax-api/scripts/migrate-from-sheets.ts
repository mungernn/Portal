/**
 * One-time (or repeatable) migration: reads every tab from the existing
 * NNM Property Tax Google Sheet and loads it into PostgreSQL.
 *
 * Usage:
 *   1. Create a Google Cloud service account, enable the Sheets API,
 *      download its JSON key to ./service-account.json (or point
 *      GOOGLE_APPLICATION_CREDENTIALS at it).
 *   2. Share the target Google Sheet with the service account's email
 *      (Viewer access is enough).
 *   3. Set GOOGLE_SHEETS_SPREADSHEET_ID in .env (the long ID in the
 *      sheet's URL).
 *   4. Run migrations first: npm run migrate
 *   5. Then: npm run migrate:sheets
 *
 * This script is idempotent per table: it TRUNCATEs each target table
 * (in FK-safe order) and reloads from the sheet, so it's safe to re-run
 * during the transition period while the Apps Script system is still
 * the system of record. Do NOT run it against a database that also has
 * live writes coming from the new Express API, or you'll lose them.
 */
import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { google } from "googleapis";
import { Pool } from "pg";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
if (!SPREADSHEET_ID) {
  console.error("GOOGLE_SHEETS_SPREADSHEET_ID is not set in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getSheetRows(sheetName: string): Promise<Record<string, string>[]> {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });

  const values = data.values ?? [];
  if (values.length === 0) return [];

  const [headerRow, ...dataRows] = values;
  const headers = headerRow as string[];

  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (row[i] ?? "").toString();
    });
    return record;
  });
}

const yesNo = (v: string | undefined) => String(v ?? "").trim().toLowerCase() === "yes";
const numOrZero = (v: string | undefined) => {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};
const orNull = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);
const intOrZero = (v: string | undefined) => parseInt(v ?? "", 10) || 0;

async function migrateProperties() {
  const rows = await getSheetRows("Master");
  console.log(`Master: ${rows.length} rows`);

  await pool.query("TRUNCATE properties CASCADE");

  for (const r of rows) {
    await pool.query(
      `INSERT INTO properties (
        holding_no, old_holding_no, old_pid, owner_name, relation_type, relation_name,
        mobile_no, area_sqft, address, ward, zone, pincode, assessment_year, road_type,
        vacant_area_sqft, rain_water_harvesting, solar_rooftop, arrear_tax,
        solid_waste_charge_type, solid_waste_months, solid_waste_charge,
        penal_charge, water_charge, boring_charge, form_fee,
        misc_cost, misc_cost_reason, misc_rebate, misc_rebate_reason,
        arv, tax_payable, holding_creation_year, tax_paid_till_year,
        present_holding_name, present_category,
        created_by, created_date, last_modified_by, last_modified_date
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38
      )
      ON CONFLICT (holding_no) DO NOTHING`,
      [
        r.HoldingNo,
        orNull(r.OldHoldingNo),
        orNull(r.OldPID),
        r.OwnerName,
        orNull(r.RelationType),
        orNull(r.RelationName),
        orNull(r.MobileNo),
        numOrZero(r.AreaSqft),
        r.Address,
        orNull(r.Ward),
        orNull(r.Zone),
        orNull(r.Pincode),
        r.AssessmentYear,
        r.RoadType,
        numOrZero(r.VacantAreaSqft),
        yesNo(r.RainWaterHarvesting),
        yesNo(r.SolarRooftop),
        numOrZero(r.ArrearTax),
        orNull(r.SolidWasteUserChargeType),
        intOrZero(r.SolidWasteMonths) || 12,
        numOrZero(r.SolidWasteCharge),
        numOrZero(r.PenalCharge),
        numOrZero(r.WaterCharge),
        numOrZero(r.BoringCharge),
        numOrZero(r.FormFee),
        numOrZero(r.MiscCost),
        orNull(r.MiscCostReason),
        numOrZero(r.MiscRebate),
        orNull(r.MiscRebateReason),
        numOrZero(r.ARV),
        numOrZero(r.TaxPayable),
        r.HoldingCreationYear,
        orNull(r.TaxPaidTillYear),
        orNull(r.PresentHoldingName),
        orNull(r.PresentCategory),
        r.CreatedBy || "migration",
        r.CreatedDate ? new Date(r.CreatedDate) : new Date(),
        orNull(r.LastModifiedBy),
        r.LastModifiedDate ? new Date(r.LastModifiedDate) : null,
      ],
    );
  }
}

async function migrateFloors() {
  const rows = await getSheetRows("Floors");
  console.log(`Floors: ${rows.length} rows`);

  await pool.query("TRUNCATE floors");

  for (const r of rows) {
    await pool.query(
      `INSERT INTO floors (
        holding_no, floor_label, buildup_sqft, const_type, usage_type,
        occupancy, year_built, closing_year, floor_arv, floor_tax
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        r.HoldingNo,
        r.Floor,
        numOrZero(r.BuildupSqft),
        r.ConstType,
        r.Usage,
        (r.Occupancy || "self").toLowerCase(),
        orNull(r.YearBuilt),
        orNull(r.ClosingYear),
        numOrZero(r.FloorARV),
        numOrZero(r.FloorTax),
      ],
    );
  }
}

async function migrateTaxHistoryStages() {
  const rows = await getSheetRows("TaxHistoryStages");
  console.log(`TaxHistoryStages: ${rows.length} rows`);

  await pool.query("TRUNCATE tax_history_stages");

  for (const r of rows) {
    await pool.query(
      `INSERT INTO tax_history_stages (
        holding_no, period_of_assessment, start_year_used, closing_year,
        arv_in_period, tax_rate_in_period, annual_tax_amount, years_count,
        total_amount, override_reason, override_remarks, added_by, added_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        r.HoldingNo,
        r.PeriodOfAssessment,
        intOrZero(r.StartYearUsed),
        intOrZero(r.ClosingYear),
        numOrZero(r.ARVInPeriod),
        numOrZero(r.TaxRateInPeriod),
        numOrZero(r.AnnualTaxAmount),
        intOrZero(r.YearsCount),
        numOrZero(r.TotalAmount),
        orNull(r.OverrideReason),
        orNull(r.OverrideRemarks),
        r.AddedBy || "migration",
        r.AddedDate ? new Date(r.AddedDate) : new Date(),
      ],
    );
  }
}

async function migrateTransactions() {
  const rows = await getSheetRows("Transactions");
  console.log(`Transactions: ${rows.length} rows`);

  await pool.query("TRUNCATE transactions");

  for (const r of rows) {
    await pool.query(
      `INSERT INTO transactions (
        receipt_no, holding_no, txn_date, payment_mode, amount_received,
        collected_by, counter, demand_no, arrear_periods_paid
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (receipt_no) DO NOTHING`,
      [
        r.ReceiptNo,
        r.HoldingNo,
        r.Date ? new Date(r.Date) : new Date(),
        r.PaymentMode,
        numOrZero(r.AmountReceived),
        r.CollectedBy,
        orNull(r.Counter),
        orNull(r.DemandNo),
        orNull(r.ArrearPeriodsPaid),
      ],
    );
  }
}

async function migrateDemandNotices() {
  const rows = await getSheetRows("DemandNotices");
  console.log(`DemandNotices: ${rows.length} rows`);

  await pool.query("TRUNCATE demand_notices");

  for (const r of rows) {
    await pool.query(
      `INSERT INTO demand_notices (
        demand_no, holding_no, notice_date, generated_by, arv,
        current_year_tax_net, previous_years_tax_base, total_fine_amount,
        other_charges, total_amount_demanded
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (demand_no) DO NOTHING`,
      [
        r.DemandNo,
        r.HoldingNo,
        r.Date ? new Date(r.Date) : new Date(),
        r.GeneratedBy,
        numOrZero(r.ARV),
        numOrZero(r.CurrentYearTaxNet),
        numOrZero(r.PreviousYearsTaxBase),
        numOrZero(r.TotalFineAmount),
        numOrZero(r.OtherCharges),
        numOrZero(r.TotalAmountDemanded),
      ],
    );
  }
}

async function migratePropertyHistory() {
  const rows = await getSheetRows("PropertyHistory");
  console.log(`PropertyHistory: ${rows.length} rows`);

  await pool.query("TRUNCATE property_history");

  for (const r of rows) {
    let snapshot: unknown = {};
    try {
      snapshot = JSON.parse(r.Snapshot || "{}");
    } catch {
      snapshot = { _unparsed: r.Snapshot };
    }

    await pool.query(
      `INSERT INTO property_history (
        holding_no, version, action, change_basis, change_reference,
        operator_name, ts, snapshot
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (holding_no, version) DO NOTHING`,
      [
        r.HoldingNo,
        intOrZero(r.Version) || 1,
        r.Action,
        orNull(r.ChangeBasis),
        orNull(r.ChangeReference),
        r.OperatorName,
        r.Timestamp ? new Date(r.Timestamp) : new Date(),
        JSON.stringify(snapshot),
      ],
    );
  }
}

async function migrateOperators() {
  const rows = await getSheetRows("Operators");
  console.log(`Operators: ${rows.length} rows`);
  console.warn(
    "⚠ Operators' PasswordHash column in Sheets is an UNSALTED SHA-256 " +
      "digest (see Code.gs hashPassword_). Do NOT copy it in as-is — a " +
      "single fast unsalted hash is exactly what this migration to a " +
      "'secure backend architecture' should be leaving behind. This " +
      "function creates each operator with a random temporary password " +
      "(printed once below, not stored) hashed with bcrypt; distribute " +
      "temporary passwords out-of-band and force a reset on first login.",
  );

  await pool.query("TRUNCATE operators");


  for (const r of rows) {
    const tempPassword: string = crypto.randomBytes(9).toString("base64url");
    const passwordHash: string = await bcrypt.hash(tempPassword, 12);

    await pool.query(
      `INSERT INTO operators (username, password_hash, display_name, active)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (username) DO NOTHING`,
      [r.Username, passwordHash, r.DisplayName, yesNo(r.Active) || r.Active === "TRUE"],
    );

    console.log(`  operator ${r.Username}: temporary password = ${tempPassword}`);
  }
}

async function main() {
  await migrateProperties(); // must run first — everything else FKs to it
  await migrateFloors();
  await migrateTaxHistoryStages();
  await migrateTransactions();
  await migrateDemandNotices();
  await migratePropertyHistory();
  await migrateOperators();

  await pool.end();
  console.log("Migration from Google Sheets complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});