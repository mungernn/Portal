/**
 * Alternative to migrate-from-sheets.ts: instead of calling the Google
 * Sheets API (which needs a service account), this reads CSV files you've
 * manually exported from each tab (Google Sheets: select the tab → File →
 * Download → Comma Separated Values).
 *
 * Usage:
 *   1. Export each tab (Master, Floors, TaxHistoryStages, Transactions,
 *      DemandNotices, PropertyHistory, Operators) as CSV into a folder
 *      named sheets-export/ at the project root, keeping those exact
 *      file names: sheets-export/Master.csv, sheets-export/Floors.csv, etc.
 *   2. Run migrations first: npm run migrate
 *   3. Then: npm run migrate:csv
 *
 * Same TRUNCATE-and-reload behavior and the same operator-password
 * handling as migrate-from-sheets.ts — see that file's header comment
 * for the full rationale (unsalted SHA-256 in the source, bcrypt +
 * forced reset here).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { Pool } from "pg";

const EXPORT_DIR = path.join(__dirname, "..", "sheets-export");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function readCsv(fileName: string): Record<string, string>[] {
  const filePath = path.join(EXPORT_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`  skip — ${fileName} not found in ${EXPORT_DIR}`);
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
}

const yesNo = (v: string | undefined) => String(v ?? "").trim().toLowerCase() === "yes";
const numOrZero = (v: string | undefined) => {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};
const orNull = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);
const intOrZero = (v: string | undefined) => parseInt(v ?? "", 10) || 0;
/** Falls back to "now" if the cell is blank or not a parseable date — never lets an Invalid Date reach Postgres. */
const dateOrNow = (v: string | undefined): Date => {
  if (!v || !v.trim()) return new Date();
  const d = new Date(v.trim());
  return Number.isNaN(d.getTime()) ? new Date() : d;
};
/** Same, but returns null (for nullable date columns) instead of "now" when unparseable. */
const dateOrNull = (v: string | undefined): Date | null => {
  if (!v || !v.trim()) return null;
  const d = new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Filters out rows referencing a HoldingNo that doesn't exist in
 * properties — an orphan row in the source sheet (e.g. a Floor entered
 * for a property that was never added to Master, or a typo in one tab
 * but not the other). Rather than let the foreign key constraint crash
 * the whole migration, skip these and print exactly which HoldingNo
 * values were dropped so they can be fixed at the source if needed.
 */
function dropOrphans(
  rows: Record<string, string>[],
  validHoldingNos: Set<string>,
  label: string,
): Record<string, string>[] {
  const kept: Record<string, string>[] = [];
  const orphanHoldingNos = new Set<string>();

  for (const r of rows) {
    const holdingNo = (r.HoldingNo ?? "").trim();
    if (validHoldingNos.has(holdingNo)) {
      kept.push(r);
    } else {
      orphanHoldingNos.add(holdingNo);
    }
  }

  if (orphanHoldingNos.size > 0) {
    console.warn(
      `  ⚠ ${label}: skipped ${rows.length - kept.length} row(s) referencing ${orphanHoldingNos.size} ` +
        `HoldingNo value(s) not found in Master: ${[...orphanHoldingNos].slice(0, 15).join(", ")}` +
        (orphanHoldingNos.size > 15 ? ", ..." : ""),
    );
  }

  return kept;
}

async function migrateProperties(): Promise<Set<string>> {
  const rows = readCsv("Master.csv");
  console.log(`Master: ${rows.length} rows`);
  const validHoldingNos = new Set<string>();
  if (rows.length === 0) return validHoldingNos;

  await pool.query("TRUNCATE properties CASCADE");

  for (const r of rows) {
    validHoldingNos.add((r.HoldingNo ?? "").trim());
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
        $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39
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
        dateOrNow(r.CreatedDate),
        orNull(r.LastModifiedBy),
        dateOrNull(r.LastModifiedDate),
      ],
    );
  }

  return validHoldingNos;
}

async function migrateFloors(validHoldingNos: Set<string>) {
  const rawRows = readCsv("Floors.csv");
  console.log(`Floors: ${rawRows.length} rows`);
  if (rawRows.length === 0) return;
  const rows = dropOrphans(rawRows, validHoldingNos, "Floors");

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

async function migrateTaxHistoryStages(validHoldingNos: Set<string>) {
  const rawRows = readCsv("TaxHistoryStages.csv");
  console.log(`TaxHistoryStages: ${rawRows.length} rows`);
  if (rawRows.length === 0) return;
  const rows = dropOrphans(rawRows, validHoldingNos, "TaxHistoryStages");

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
        dateOrNow(r.AddedDate),
      ],
    );
  }
}

async function migrateTransactions(validHoldingNos: Set<string>) {
  const rawRows = readCsv("Transactions.csv");
  console.log(`Transactions: ${rawRows.length} rows`);
  if (rawRows.length === 0) return;
  const rows = dropOrphans(rawRows, validHoldingNos, "Transactions");

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
        dateOrNow(r.Date),
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

async function migrateDemandNotices(validHoldingNos: Set<string>) {
  const rawRows = readCsv("DemandNotices.csv");
  console.log(`DemandNotices: ${rawRows.length} rows`);
  if (rawRows.length === 0) return;
  const rows = dropOrphans(rawRows, validHoldingNos, "DemandNotices");

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
        dateOrNow(r.Date),
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

async function migratePropertyHistory(validHoldingNos: Set<string>) {
  const rawRows = readCsv("PropertyHistory.csv");
  console.log(`PropertyHistory: ${rawRows.length} rows`);
  if (rawRows.length === 0) return;
  const rows = dropOrphans(rawRows, validHoldingNos, "PropertyHistory");

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
        dateOrNow(r.Timestamp),
        JSON.stringify(snapshot),
      ],
    );
  }
}

async function migrateOperators() {
  const rows = readCsv("Operators.csv");
  console.log(`Operators: ${rows.length} rows`);
  if (rows.length === 0) return;

  console.warn(
    "⚠ Operators' PasswordHash column is an UNSALTED SHA-256 digest in " +
      "the source system — not copied in as-is. Each operator instead " +
      "gets a random bcrypt-hashed temporary password, printed once " +
      "below. Distribute out-of-band and require a reset on first login.",
  );

  await pool.query("TRUNCATE operators");

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require("bcrypt");
  const crypto = require("node:crypto");

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
  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(`Folder not found: ${EXPORT_DIR}`);
    console.error("Create it and put your exported CSV files there first — see this file's header comment.");
    process.exit(1);
  }

  const validHoldingNos = await migrateProperties(); // must run first — everything else FKs to it
  await migrateFloors(validHoldingNos);
  await migrateTaxHistoryStages(validHoldingNos);
  await migrateTransactions(validHoldingNos);
  await migrateDemandNotices(validHoldingNos);
  await migratePropertyHistory(validHoldingNos);
  await migrateOperators();

  await pool.end();
  console.log("Migration from CSV exports complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});