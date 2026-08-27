import { pool } from "../config/db";
import { cancellationRequestRepository } from "../repositories/cancellationRequest.repository";
import { demandNoticeRepository } from "../repositories/demandNotice.repository";
import { paymentRepository } from "../repositories/payment.repository";
import { ApiError } from "../utils/ApiError";
import type { CancellationRequestRow } from "../repositories/cancellationRequest.repository";

/**
 * Any operator can request cancellation of any demand notice or
 * receipt (not restricted to their own) - both go through the same
 * tax_daroga approval used elsewhere in this app, since a receipt
 * cancellation reverses money already collected and a demand notice
 * cancellation removes a bill that's still outstanding; neither
 * should happen unreviewed.
 */
export async function requestCancellation(
  requestType: "demand_notice" | "receipt",
  targetId: string,
  reason: string,
  requestedBy: string,
): Promise<CancellationRequestRow> {
  if (!reason.trim()) throw ApiError.badRequest("A reason is required to request a cancellation.");

  const alreadyPending = await cancellationRequestRepository.findPendingForTarget(requestType, targetId);
  if (alreadyPending) {
    throw ApiError.badRequest(`A cancellation request for this ${requestType === "demand_notice" ? "demand notice" : "receipt"} is already pending approval.`);
  }

  let holdingNo: string;
  if (requestType === "demand_notice") {
    const notice = await demandNoticeRepository.findByDemandNo(targetId);
    if (!notice) throw ApiError.notFound(`Demand notice ${targetId} not found.`);
    if (notice.cancelled) throw ApiError.badRequest("This demand notice is already cancelled.");
    if (notice.settled) {
      throw ApiError.badRequest("This demand notice has already been paid - request cancellation of its receipt instead, which will also revert this notice.");
    }
    holdingNo = notice.holding_no;
  } else {
    const txn = await paymentRepository.findByReceiptNo(targetId);
    if (!txn) throw ApiError.notFound(`Receipt ${targetId} not found.`);
    if (txn.cancelled) throw ApiError.badRequest("This receipt is already cancelled.");
    holdingNo = txn.holding_no;
  }

  return cancellationRequestRepository.create({ requestType, targetId, holdingNo, reason: reason.trim(), requestedBy });
}

export async function listPendingCancellationRequests(): Promise<CancellationRequestRow[]> {
  return cancellationRequestRepository.listPending();
}

export async function listCancellationRequests(status?: "pending" | "approved" | "rejected"): Promise<CancellationRequestRow[]> {
  return cancellationRequestRepository.list({ status });
}

/**
 * tax_daroga only. Approving a demand-notice cancellation just flags
 * the notice. Approving a receipt cancellation flags the transaction
 * AND reverts its linked demand notice back to unsettled/payable
 * again (per how this was specified) - both happen in one DB
 * transaction, so a failure partway through can never leave the
 * receipt cancelled but the notice still stuck settled, or vice
 * versa (same atomicity principle as submitPayment - see that
 * function's comment history for why this matters).
 */
export async function approveCancellation(requestId: number, reviewedBy: string, reviewNotes: string | null): Promise<CancellationRequestRow> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const request = await cancellationRequestRepository.finalize(requestId, "approved", reviewedBy, reviewNotes, client);
    if (!request) throw ApiError.badRequest("This request is no longer pending (already reviewed).");

    if (request.request_type === "demand_notice") {
      const cancelled = await demandNoticeRepository.cancel(request.target_id, request.reason, client);
      if (!cancelled) {
        throw ApiError.badRequest("Could not cancel this demand notice - it may have been settled or already cancelled since the request was made.");
      }
    } else {
      const txn = await paymentRepository.findByReceiptNo(request.target_id);
      if (!txn) throw ApiError.notFound(`Receipt ${request.target_id} not found.`);

      const cancelledTxn = await paymentRepository.cancel(request.target_id, request.reason, client);
      if (!cancelledTxn) throw ApiError.badRequest("Could not cancel this receipt - it may already be cancelled.");

      if (txn.demand_no) {
        await demandNoticeRepository.revertToUnsettled(txn.demand_no, client);
      }
    }

    await client.query("COMMIT");
    return request;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** tax_daroga only. Rejecting leaves the notice/receipt completely untouched - only the request itself is marked rejected. */
export async function rejectCancellation(requestId: number, reviewedBy: string, reviewNotes: string | null): Promise<CancellationRequestRow> {
  const request = await cancellationRequestRepository.finalize(requestId, "rejected", reviewedBy, reviewNotes);
  if (!request) throw ApiError.badRequest("This request is no longer pending (already reviewed).");
  return request;
}
