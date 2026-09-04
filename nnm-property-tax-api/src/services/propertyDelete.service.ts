import { pool } from "../config/db";
import { ApiError } from "../utils/ApiError";

/**
 * Deletes a property holding entirely, including every record
 * attached to it - but ONLY if it has no actual payment receipts on
 * file (real money collected - an official municipal record that
 * must never be silently erased). An issued-but-unpaid demand notice
 * does NOT block deletion on its own - it's cascade-deleted along
 * with everything else, since a notice with nothing collected against
 * it doesn't represent money that changed hands. A holding that DOES
 * have a payment receipt is left for case-by-case human judgment
 * rather than an automatic block-or-allow rule. This is meant for
 * correcting genuine data-entry mistakes - a duplicate holding
 * created in error, wrongly numbered, or entered with materially
 * incorrect details - not for removing a holding that's actually
 * been collected against.
 *
 * Requires the caller to type the holding number itself as a
 * confirmation phrase, matching the shop-deletion pattern - deleting
 * a property record is irreversible and touches real government
 * data, so this forces a deliberate, specific action.
 */
export async function deletePropertyCompletely(holdingNo: string, confirmationPhrase: string, actorDisplayName: string): Promise<void> {
  const { rows: existsRows } = await pool.query(`SELECT 1 FROM properties WHERE holding_no = $1`, [holdingNo]);
  if (existsRows.length === 0) throw ApiError.notFound(`Holding not found: ${holdingNo}`);

  if (confirmationPhrase.trim() !== holdingNo) {
    throw ApiError.badRequest(`Confirmation phrase doesn't match. Type the holding number "${holdingNo}" exactly to confirm deletion.`);
  }

  const { rows: blockCheck } = await pool.query<{ payments: string }>(
    `SELECT (SELECT COUNT(*) FROM transactions WHERE holding_no = $1) AS payments`,
    [holdingNo],
  );
  const { payments } = blockCheck[0]!;
  if (Number(payments) > 0) {
    throw ApiError.badRequest(
      `Cannot delete holding ${holdingNo} - it has ${payments} payment(s) on file. This needs a case-by-case decision, not an automatic deletion.`,
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM demand_notices WHERE holding_no = $1`, [holdingNo]);
    await client.query(`DELETE FROM floors WHERE holding_no = $1`, [holdingNo]);
    await client.query(`DELETE FROM tax_history_stages WHERE holding_no = $1`, [holdingNo]);
    await client.query(`DELETE FROM property_history WHERE holding_no = $1`, [holdingNo]);
    await client.query(`DELETE FROM property_change_requests WHERE holding_no = $1`, [holdingNo]);
    await client.query(`UPDATE trade_license_applications SET holding_no = NULL WHERE holding_no = $1`, [holdingNo]);
    await client.query(`DELETE FROM cancellation_requests WHERE holding_no = $1`, [holdingNo]);
    await client.query(`DELETE FROM properties WHERE holding_no = $1`, [holdingNo]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  void actorDisplayName; // reserved for an audit log entry if one is added later
}
