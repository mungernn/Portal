import { pool } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { shopRepository } from "../repositories/shop.repository";

/**
 * Deletes a shop entirely, including its agreement and every
 * administrative/in-progress record tied to it - but ONLY if the shop
 * has no real financial or legal history on file (rent payments
 * actually collected, demand notices issued, or violation notices
 * issued). Those represent things that genuinely happened and
 * shouldn't be erasable; a shop with any of them must be
 * archived/handled some other way, not deleted. This is meant for
 * correcting data-entry mistakes (a duplicate or wrongly-numbered
 * shop entered in error), not for removing a shop that's actually
 * been operating.
 */
export async function deleteShopCompletely(shopNo: string): Promise<void> {
  const shop = await shopRepository.findByShopNo(shopNo);
  if (!shop) throw ApiError.notFound(`Shop not found: ${shopNo}`);

  const { rows: blockCheck } = await pool.query<{ payments: string; demands: string; violations: string }>(
    `SELECT
       (SELECT COUNT(*) FROM shop_rent_payments WHERE shop_no = $1) AS payments,
       (SELECT COUNT(*) FROM shop_rent_demands WHERE shop_no = $1) AS demands,
       (SELECT COUNT(*) FROM shop_violation_notices WHERE shop_no = $1) AS violations`,
    [shopNo],
  );
  const { payments, demands, violations } = blockCheck[0]!;
  if (Number(payments) > 0 || Number(demands) > 0 || Number(violations) > 0) {
    const parts: string[] = [];
    if (Number(payments) > 0) parts.push(`${payments} rent payment(s)`);
    if (Number(demands) > 0) parts.push(`${demands} demand notice(s)`);
    if (Number(violations) > 0) parts.push(`${violations} violation notice(s)`);
    throw ApiError.badRequest(
      `Cannot delete shop ${shopNo} - it has ${parts.join(", ")} on file. These are real municipal records and can't be erased.`,
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
