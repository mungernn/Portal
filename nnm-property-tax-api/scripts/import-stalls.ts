/**
 * One-off import of the migrated stall/shop register into the shops +
 * shop_agreements tables.
 *
 * Usage:
 *   npm run import-stalls                 -- dry run (default), no DB writes
 *   npm run import-stalls -- --commit      -- actually writes, inside one transaction
 *
 * ALWAYS run without --commit first and read the full report. This
 * script deliberately does NOT try to silently resolve ambiguous source
 * data (joint holders, two different names for one stall, corrupted
 * dates, ambiguous rent values) — every such row is flagged in the
 * report instead, for a human to check against the paper register
 * before deciding what to do with it.
 *
 * Every imported agreement is inserted with data_status='partial' —
 * this is migrated data with known gaps (no agreement_start_date on
 * file for any of it), so completing it later goes through the lighter
 * Deputy-Commissioner-capped approval chain rather than the full one.
 * See classifyShopAgreementChange() in shopAgreementClassification.service.ts.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import { pool } from "../src/config/db";
import { deriveMarketCode } from "../src/constants/marketCodes";

const CSV_PATH = join(__dirname, "..", "data", "stall-list-import.csv");
const IMPORTED_BY = "Data Migration (Stall List Import)";

interface CsvRow {
  row_num: string;
  market: string;
  stall_no: string;
  agreement_holder_name: string;
  demand_register_holder_name: string;
  business_name: string;
  agreement_number: string;
  relation_name: string;
  id_proof: string;
  agreement_rent: string;
  demand_register_rent: string;
  rent_paid_till: string;
  comments: string;
  flags: string;
}

interface ParsedRecord {
  rowNum: number;
  shopNo: string;
  marketName: string;
  location: string;
  agreementHolderName: string | null;
  demandRegisterHolderName: string | null;
  holderName: string;
  holderRelationName: string | null;
  idProofNumber: string | null;
  businessName: string | null;
  agreementRent: number | null;
  demandRegisterRent: number | null;
  baseMonthlyRent: number;
  rentPaidTillMonth: string | null;
  notes: string | null;
  issues: string[];
}

interface SkippedRecord {
  rowNum: number;
  market: string;
  stallNo: string;
  reason: string;
}

const MONTH_NAMES: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/**
 * Parses "Month YYYY" into "YYYY-MM". Tolerates the specific typos
 * found in the source ("July 20220", "September 20229" — an extra
 * trailing digit) by taking the first 4 digits of the year token, but
 * ALWAYS flags this into the issues list — never silently trusts a
 * salvaged value without surfacing it for manual confirmation.
 */
function parseRentPaidTill(raw: string, issues: string[]): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([A-Za-z]+)\s+(\d{4,5})(-\d{2,4})?$/);
  if (!match) {
    issues.push(`Could not parse "Rent paid till" value: "${trimmed}" — needs manual entry.`);
    return null;
  }

  const monthName = match[1]!.toLowerCase();
  const monthNum = MONTH_NAMES[monthName];
  if (!monthNum) {
    issues.push(`Unrecognized month in "Rent paid till" value: "${trimmed}" — needs manual entry.`);
    return null;
  }

  let yearStr = match[2]!;
  if (yearStr.length !== 4) {
    issues.push(`"Rent paid till" year looks malformed: "${trimmed}" (using first 4 digits "${yearStr.slice(0, 4)}") — PLEASE VERIFY against the paper register.`);
    yearStr = yearStr.slice(0, 4);
  }

  if (match[3]) {
    issues.push(`"Rent paid till" had a trailing range suffix "${match[3]}" that was ignored: "${trimmed}" — PLEASE VERIFY.`);
  }

  return `${yearStr}-${String(monthNum).padStart(2, "0")}`;
}

function parseRent(raw: string, label: string, issues: string[]): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) {
    issues.push(`${label} value "${trimmed}" is not a plain number — needs manual entry.`);
    return null;
  }
  return parseInt(trimmed, 10);
}

function parseRow(row: CsvRow): ParsedRecord | { skip: SkippedRecord } {
  const rowNum = parseInt(row.row_num, 10);
  const issues: string[] = [];

  if (row.flags && row.flags.trim()) {
    for (const flag of row.flags.split(";")) {
      issues.push(`Source flag: ${flag.trim()}`);
    }
  }

  const stallNo = row.stall_no.trim();
  if (!stallNo) {
    return {
      skip: {
        rowNum,
        market: row.market,
        stallNo: "(none)",
        reason: "No stall number in source — needs manual numbering via the operator UI before it can be imported.",
      },
    };
  }

  const agreementName = row.agreement_holder_name.trim();
  const demandName = row.demand_register_holder_name.trim();
  if (!agreementName && !demandName) {
    return {
      skip: {
        rowNum,
        market: row.market,
        stallNo,
        reason: "No holder name at all — will be created as a vacant shop with no agreement.",
      },
    };
  }

  const agreementRent = parseRent(row.agreement_rent, "Rent as per agreement", issues);
  const demandRent = parseRent(row.demand_register_rent, "Rent as per demand register", issues);
  const baseMonthlyRent = demandRent ?? agreementRent;
  if (baseMonthlyRent === null) {
    issues.push("No usable rent figure at all (neither agreement nor demand-register rent parsed) — flagged for manual entry, importing with rent=0.");
  }

  const rentPaidTillMonth = parseRentPaidTill(row.rent_paid_till, issues);

  const holderName = demandName || agreementName;

  const marketName = row.market.trim();
  const shopNo = `${deriveMarketCode(marketName)}-${stallNo}`;

  return {
    rowNum,
    shopNo,
    marketName,
    location: marketName,
    agreementHolderName: agreementName || null,
    demandRegisterHolderName: demandName || null,
    holderName,
    holderRelationName: row.relation_name.trim() || null,
    idProofNumber: row.id_proof.trim() || null,
    businessName: row.business_name.trim() || null,
    agreementRent,
    demandRegisterRent: demandRent,
    baseMonthlyRent: baseMonthlyRent ?? 0,
    rentPaidTillMonth,
    notes: row.comments.trim() || null,
    issues,
  };
}

async function main() {
  const commit = process.argv.includes("--commit");

  const csvContent = readFileSync(CSV_PATH, "utf-8");
  const rows: CsvRow[] = parse(csvContent, { columns: true, skip_empty_lines: true });

  const records: ParsedRecord[] = [];
  const skipped: SkippedRecord[] = [];
  const vacantOnly: SkippedRecord[] = [];

  for (const row of rows) {
    const result = parseRow(row);
    if ("skip" in result) {
      if (result.skip.reason.startsWith("No holder name")) {
        vacantOnly.push(result.skip);
      } else {
        skipped.push(result.skip);
      }
    } else {
      records.push(result);
    }
  }

  const flagged = records.filter((r) => r.issues.length > 0);
  const clean = records.filter((r) => r.issues.length === 0);

  console.log("=".repeat(70));
  console.log(commit ? "IMPORT — COMMIT MODE (writing to database)" : "IMPORT — DRY RUN (no database changes)");
  console.log("=".repeat(70));
  console.log(`Total source rows:              ${rows.length}`);
  console.log(`Agreements to import:           ${records.length} (${clean.length} clean, ${flagged.length} flagged for review)`);
  console.log(`Vacant shops (no holder name):  ${vacantOnly.length}`);
  console.log(`Skipped (needs manual number):  ${skipped.length}`);
  console.log("");

  if (skipped.length > 0) {
    console.log("--- SKIPPED: no stall number, needs manual entry via the operator UI ---");
    for (const s of skipped) {
      console.log(`  Row ${s.rowNum} (${s.market}): ${s.reason}`);
    }
    console.log("");
  }

  if (flagged.length > 0) {
    console.log(`--- FLAGGED FOR REVIEW (${flagged.length} records) — please verify against the paper register ---`);
    for (const r of flagged) {
      console.log(`  Row ${r.rowNum} — ${r.shopNo} — ${r.holderName}`);
      for (const issue of r.issues) {
        console.log(`      ⚠ ${issue}`);
      }
    }
    console.log("");
  }

  console.log("--- SAMPLE OF 10 RECORDS THAT WOULD BE CREATED ---");
  for (const r of records.slice(0, 10)) {
    console.log(
      `  ${r.shopNo} | ${r.holderName} | rent=₹${r.baseMonthlyRent} | paid_till=${r.rentPaidTillMonth ?? "unknown"} | data_status=partial`,
    );
  }
  console.log("");

  if (!commit) {
    console.log("This was a DRY RUN — nothing was written. Review the flagged records above, then re-run with:");
    console.log("  npm run import-stalls -- --commit");
    await pool.end();
    return;
  }

  console.log("Committing to database...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let shopsCreated = 0;
    let agreementsCreated = 0;

    for (const r of records) {
      await client.query(
        `INSERT INTO shops (shop_no, market_name, location, status, created_by, created_date)
         VALUES ($1,$2,$3,'occupied',$4, now())
         ON CONFLICT (shop_no) DO NOTHING`,
        [r.shopNo, r.marketName, r.location, IMPORTED_BY],
      );
      shopsCreated++;

      await client.query(
        `INSERT INTO shop_agreements (
          shop_no, agreement_holder_name, demand_register_holder_name, holder_name,
          holder_relation_name, id_proof_number, business_name, agreement_rent, demand_register_rent,
          base_monthly_rent, security_deposit,
          joint_holder_name, notes, data_status, rent_paid_till_month, status, created_by, created_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,NULL,$11,'partial',$12,'active',$13, now())`,
        [
          r.shopNo,
          r.agreementHolderName,
          r.demandRegisterHolderName,
          r.holderName,
          r.holderRelationName,
          r.idProofNumber,
          r.businessName,
          r.agreementRent,
          r.demandRegisterRent,
          r.baseMonthlyRent,
          r.notes,
          r.rentPaidTillMonth,
          IMPORTED_BY,
        ],
      );
      agreementsCreated++;
    }

    for (const v of vacantOnly) {
      const shopNo = `${deriveMarketCode(v.market)}-${v.stallNo}`;
      await client.query(
        `INSERT INTO shops (shop_no, market_name, location, status, created_by, created_date)
         VALUES ($1,$2,$3,'vacant',$4, now())
         ON CONFLICT (shop_no) DO NOTHING`,
        [shopNo, v.market, v.market, IMPORTED_BY],
      );
      shopsCreated++;
    }

    await client.query("COMMIT");
    console.log(`Done. ${shopsCreated} shops, ${agreementsCreated} agreements committed.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import failed, rolled back:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});