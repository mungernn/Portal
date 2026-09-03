import { pool } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { getNextNewHoldingNo, getNextPartiallyKnownHoldingNo } from "./holdingNumberSeries.service";
import { NEW_HOLDING_NO_PREFIX, PARTIALLY_KNOWN_HOLDING_NO_PREFIX } from "../constants/taxRates";

const PROPERTY_COLUMNS = [
  "old_holding_no", "old_pid", "owner_name", "relation_type", "relation_name", "mobile_no",
  "area_sqft", "address", "ward", "zone", "pincode", "assessment_year", "road_type", "vacant_area_sqft",
  "rain_water_harvesting", "solar_rooftop", "arrear_tax", "solid_waste_charge_type", "solid_waste_months",
  "solid_waste_charge", "penal_charge", "water_charge", "boring_charge", "form_fee", "misc_cost",
  "misc_cost_reason", "misc_rebate", "misc_rebate_reason", "arv", "tax_payable", "holding_creation_year",
  "tax_paid_till_year", "present_holding_name", "present_category", "created_by", "created_date",
  "last_modified_by", "last_modified_date",
];

/**
 * Renumbers an existing holding to a fresh, auto-assigned number in
 * its own series - for correcting a holding that was accidentally
 * created under a number that turned out to already belong to a
 * different, not-yet-migrated holding (e.g. from a bulk import of
 * older records that hadn't been entered into this system yet).
 *
 * holding_no is the properties table's PRIMARY KEY, and none of the
 * tables that reference it were declared ON UPDATE CASCADE, so a
 * direct UPDATE properties SET holding_no=... would fail with a
 * foreign-key violation the moment any child row exists. Instead:
 * copy the property row under the new number, repoint every
 * referencing table (both the hard foreign keys and the two
 * soft/unenforced references - trade_license_applications and
 * cancellation_requests, which store holding_no as a plain matching
 * string, not an FK) to the new number, then delete the old row -
 * all inside one transaction, so nothing is left half-migrated if any
 * step fails.
 */
export async function renumberHolding(oldHoldingNo: string, actorDisplayName: string): Promise<{ newHoldingNo: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ holding_no: string }>(`SELECT holding_no FROM properties WHERE holding_no = $1 FOR UPDATE`, [oldHoldingNo]);
    if (rows.length === 0) throw ApiError.notFound(`Holding ${oldHoldingNo} not found.`);

    const newHoldingNo = oldHoldingNo.startsWith(PARTIALLY_KNOWN_HOLDING_NO_PREFIX)
      ? await getNextPartiallyKnownHoldingNo()
      : oldHoldingNo.startsWith(NEW_HOLDING_NO_PREFIX)
        ? await getNextNewHoldingNo()
        : (() => {
            throw ApiError.badRequest(`Holding ${oldHoldingNo} doesn't match either known numbering series - can't auto-assign a new number.`);
          })();

    const colList = PROPERTY_COLUMNS.join(", ");
    const selectCols = PROPERTY_COLUMNS.map((c) => (c === "last_modified_by" ? "$3" : c === "last_modified_date" ? "now()" : c)).join(", ");
    await client.query(
      `INSERT INTO properties (holding_no, ${colList}) SELECT $1, ${selectCols} FROM properties WHERE holding_no = $2`,
      [newHoldingNo, oldHoldingNo, actorDisplayName],
    );

    // Hard foreign keys.
    await client.query(`UPDATE floors SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);
    await client.query(`UPDATE tax_history_stages SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);
    await client.query(`UPDATE transactions SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);
    await client.query(`UPDATE demand_notices SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);
    await client.query(`UPDATE property_history SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);
    await client.query(`UPDATE property_change_requests SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);

    // Soft references (no FK, just a matching string).
    await client.query(`UPDATE trade_license_applications SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);
    await client.query(`UPDATE cancellation_requests SET holding_no = $1 WHERE holding_no = $2`, [newHoldingNo, oldHoldingNo]);

    await client.query(`DELETE FROM properties WHERE holding_no = $1`, [oldHoldingNo]);

    await client.query("COMMIT");
    return { newHoldingNo };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
