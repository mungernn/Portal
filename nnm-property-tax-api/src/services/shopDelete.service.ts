import { pool } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { shopRepository } from "../repositories/shop.repository";

/**
 * Deletes a shop entirely, including its agreement and every
 * administrative record tied to it - but ONLY if the shop has no real
 * FINANCIAL history on file (rent payments actually collected, or
 * demand notices issued - both represent money that changed hands or
 * was formally sought, and shouldn't be erasable). Violation notices
 * are administrative/enforcement records, not financial transactions,
 * so they no longer block deletion - a shop created purely to test
 * the notice-issuing workflow can be cleaned up along with its test
 * notices. This is meant for correcting data-entry mistakes (a
 * duplicate, wrongly-numbered, or test-only shop), not for removing
 * one that's actually been operating.
 *
 * Requires the caller to type the shop number itself as a
 * confirmation phrase - deleting a shop is irreversible, so this
 * forces a deliberate, specific action rather than a single
 * click/keystroke that could be triggered by accident.
 */
export async function deleteShopCompletely(shopNo: string, confirmationPhrase: string): Promise<void> {
  const shop = await shopRepository.findByShopNo(shopNo);
  if (!shop) throw ApiError.notFound(`Shop not found: ${shopNo}`);

  if (confirmationPhrase.trim() !== shopNo) {
    throw ApiError.badRequest(`Confirmation phrase doesn't match. Type the shop number "${shopNo}" exactly to confirm deletion.`);
  }

  const { rows: blockCheck } = await pool.query<{ payments: string; demands: string }>(
    `SELECT
       (SELECT COUNT(*) FROM shop_rent_payments WHERE shop_no = $1) AS payments,
       (SELECT COUNT(*) FROM shop_rent_demands WHERE shop_no = $1) AS demands`,
    [shopNo],
  );
  const { payments, demands } = blockCheck[0]!;
  if (Number(payments) > 0 || Number(demands) > 0) {
    const parts: string[] = [];
    if (Number(payments) > 0) parts.push(`${payments} rent payment(s)`);
    if (Number(demands) > 0) parts.push(`${demands} demand notice(s)`);
    throw ApiError.badRequest(
      `Cannot delete shop ${shopNo} - it has ${parts.join(", ")} on file. These are real municipal financial records and can't be erased.`,
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM shop_agreement_change_approvals WHERE change_request_id IN (SELECT id FROM shop_agreement_change_requests WHERE shop_no = $1)`,
      [shopNo],
    );
    await client.query(`DELETE FROM shop_agreement_change_requests WHERE shop_no = $1`, [shopNo]);
    await client.query(
      `DELETE FROM shop_edit_approvals WHERE edit_request_id IN (SELECT id FROM shop_edit_requests WHERE shop_no = $1)`,
      [shopNo],
    );
    await client.query(`DELETE FROM shop_edit_requests WHERE shop_no = $1`, [shopNo]);
    await client.query(`DELETE FROM shop_agreement_documents WHERE shop_no = $1`, [shopNo]);
    await client.query(`DELETE FROM shop_rent_escalation_periods WHERE shop_no = $1`, [shopNo]);
    await client.query(`DELETE FROM shop_rental_applications WHERE shop_no = $1`, [shopNo]);
    await client.query(
      `UPDATE shop_rental_preferences SET allotted_shop_no = NULL, allotted_application_id = NULL WHERE allotted_shop_no = $1`,
      [shopNo],
    );
    await client.query(`DELETE FROM shop_violation_notices WHERE shop_no = $1`, [shopNo]);
    await client.query(`DELETE FROM shop_agreements WHERE shop_no = $1`, [shopNo]);
    await client.query(`DELETE FROM shops WHERE shop_no = $1`, [shopNo]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
