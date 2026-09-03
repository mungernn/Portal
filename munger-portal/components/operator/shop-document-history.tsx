"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Printer, Receipt, ShieldAlert, XCircle } from "lucide-react";
import {
  fetchShopDemandHistory,
  fetchPrintableDemandNotice,
  fetchShopPaymentHistory,
  fetchShopReceiptReprint,
  fetchViolationNotices,
  fetchPrintableViolationNotice,
  requestDemandAction,
  type ShopDemandHistoryEntry,
  type PrintableShopDemand,
  type ShopPaymentHistoryEntry,
  type PrintableShopReceiptHistory,
  type ViolationNotice,
  type PrintableViolationNotice,
  type ShopDemandActionType,
} from "@/lib/shop-api";
import { ShopNoticeView } from "./shop-notice-view";
import { ShopReceiptReprintView } from "./shop-receipt-reprint-view";
import { ViolationNoticePrintView } from "./violation-notice-print-view";

export function ShopDocumentHistory({ shopNo }: { shopNo: string }) {
  const [demandHistory, setDemandHistory] = useState<ShopDemandHistoryEntry[] | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<ShopPaymentHistoryEntry[] | null>(null);
  const [violations, setViolations] = useState<ViolationNotice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const [demandView, setDemandView] = useState<PrintableShopDemand | null>(null);
  const [receiptView, setReceiptView] = useState<PrintableShopReceiptHistory | null>(null);
  const [violationView, setViolationView] = useState<PrintableViolationNotice | null>(null);

  // Which item currently has its "request action" reason box open -
  // "demand-cancel-<no>" / "demand-supersede" (shop-wide) / "receipt-cancel-<no>".
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    setDemandHistory(null);
    setPaymentHistory(null);
    setViolations(null);
    fetchShopDemandHistory(shopNo)
      .then(setDemandHistory)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load demand history."));
    fetchShopPaymentHistory(shopNo)
      .then(setPaymentHistory)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load payment history."));
    fetchViolationNotices(shopNo)
      .then((r) => setViolations(r.notices))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load violation notices."));
  }, [shopNo]);

  async function handleOpenDemand(demandNo: string) {
    setLoadingItem(`demand-${demandNo}`);
    try {
      setDemandView(await fetchPrintableDemandNotice(demandNo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this notice.");
    } finally {
      setLoadingItem(null);
    }
  }

  async function handleOpenReceipt(receiptNo: string) {
    setLoadingItem(`receipt-${receiptNo}`);
    try {
      setReceiptView(await fetchShopReceiptReprint(receiptNo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this receipt.");
    } finally {
      setLoadingItem(null);
    }
  }

  async function handleOpenViolation(id: number) {
    setLoadingItem(`violation-${id}`);
    try {
      setViolationView(await fetchPrintableViolationNotice(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this violation notice.");
    } finally {
      setLoadingItem(null);
    }
  }

  async function handleRequestAction(actionType: ShopDemandActionType, targetId: string) {
    if (!actionReason.trim()) {
      setError("A reason is required to submit this request.");
      return;
    }
    setActionSubmitting(true);
    setError(null);
    try {
      await requestDemandAction(actionType, targetId, shopNo, actionReason);
      setActionMessage("Request submitted - nothing changes until Stall Prabhari and City Manager both approve.");
      setActionKey(null);
      setActionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this request.");
    } finally {
      setActionSubmitting(false);
    }
  }

  if (demandView) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <ShopNoticeView notice={demandView} onClose={() => setDemandView(null)} />
      </section>
    );
  }
  if (receiptView) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <ShopReceiptReprintView receipt={receiptView} onClose={() => setReceiptView(null)} />
      </section>
    );
  }
  if (violationView) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <ViolationNoticePrintView notice={violationView} onClose={() => setViolationView(null)} />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Document History</h2>
      <p className="mb-4 text-xs text-slate-500">
        Past rent demands, receipts, and violation notices — view only, nothing here can be edited.
      </p>

      {actionMessage && (
        <div role="status" className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {actionMessage}
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4" />
            Rent Demands
          </h3>
          {!demandHistory ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : demandHistory.length === 0 ? (
            <p className="text-sm text-slate-400">None generated yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {demandHistory.map((d) => (
                <li key={d.demandNo} className="rounded-md border border-slate-200 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-mono font-semibold text-slate-800">{d.demandDate}</span>
                      <span className="text-slate-500">
                        ₹{Number(d.totalAmountDemanded).toLocaleString("en-IN")} -{" "}
                        {d.cancelled ? "cancelled" : d.superseded ? "superseded" : d.settled ? "settled" : "unsettled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDemand(d.demandNo)}
                        disabled={loadingItem === `demand-${d.demandNo}`}
                        className="inline-flex items-center gap-1 rounded border border-nnm-blue px-2 py-1 font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                      >
                        {loadingItem === `demand-${d.demandNo}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                        View
                      </button>
                      {!d.settled && !d.cancelled && !d.superseded && (
                        <button
                          onClick={() => {
                            setActionKey(`demand-cancel-${d.demandNo}`);
                            setActionReason("");
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 font-semibold text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  {actionKey === `demand-cancel-${d.demandNo}` && (
                    <div className="mt-2 space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-2">
                      <input
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Reason for cancelling this demand"
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction("cancel_demand", d.demandNo)}
                          disabled={actionSubmitting}
                          className="rounded bg-red-600 px-2 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {actionSubmitting ? "Submitting…" : "Submit Request"}
                        </button>
                        <button onClick={() => setActionKey(null)} className="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {demandHistory && demandHistory.length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              {actionKey === "demand-supersede" ? (
                <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-2">
                  <p className="text-[11px] text-amber-800">
                    Issues a fresh notice covering everything currently unpaid, superseding every unpaid notice above.
                  </p>
                  <input
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Reason for superseding (e.g. tenant unresponsive)"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction("supersede_demand", shopNo)}
                      disabled={actionSubmitting}
                      className="rounded bg-nnm-blue px-2 py-1 text-xs font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
                    >
                      {actionSubmitting ? "Submitting…" : "Submit Request"}
                    </button>
                    <button onClick={() => setActionKey(null)} className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActionKey("demand-supersede");
                    setActionReason("");
                    setError(null);
                  }}
                  className="text-[11px] font-semibold text-nnm-blue hover:underline"
                >
                  Issue superseding notice (2nd/3rd reminder) for all unpaid demands
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <Receipt className="h-4 w-4" />
            Payment Receipts
          </h3>
          {!paymentHistory ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : paymentHistory.length === 0 ? (
            <p className="text-sm text-slate-400">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {paymentHistory.map((p) => (
                <li key={p.receiptNo} className="rounded-md border border-slate-200 p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-mono font-semibold text-slate-800">{p.date}</span>
                      <span className="text-slate-500">
                        ₹{Number(p.amountReceived).toLocaleString("en-IN")} - {p.paymentMode}
                        {p.cancelled ? " - cancelled" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenReceipt(p.receiptNo)}
                        disabled={loadingItem === `receipt-${p.receiptNo}`}
                        className="inline-flex items-center gap-1 rounded border border-nnm-blue px-2 py-1 font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                      >
                        {loadingItem === `receipt-${p.receiptNo}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                        View
                      </button>
                      {!p.cancelled && (
                        <button
                          onClick={() => {
                            setActionKey(`receipt-cancel-${p.receiptNo}`);
                            setActionReason("");
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-red-200 px-2 py-1 font-semibold text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  {actionKey === `receipt-cancel-${p.receiptNo}` && (
                    <div className="mt-2 space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-2">
                      <p className="text-[11px] text-amber-800">Cancelling reverses this payment - its demand becomes payable again.</p>
                      <input
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder="Reason for cancelling this receipt"
                        className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestAction("cancel_receipt", p.receiptNo)}
                          disabled={actionSubmitting}
                          className="rounded bg-red-600 px-2 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {actionSubmitting ? "Submitting…" : "Submit Request"}
                        </button>
                        <button onClick={() => setActionKey(null)} className="rounded border border-slate-300 px-2 py-1 text-slate-600 hover:bg-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <ShieldAlert className="h-4 w-4" />
            Violation Notices
          </h3>
          {!violations ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : violations.length === 0 ? (
            <p className="text-sm text-slate-400">None issued.</p>
          ) : (
            <ul className="space-y-1.5">
              {violations.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2.5 text-xs">
                  <div>
                    <span className="block font-semibold text-slate-800">{v.violation_category}</span>
                    <span className="text-slate-500">
                      {new Date(v.issued_date).toLocaleDateString("en-IN")} — {v.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenViolation(v.id)}
                    disabled={loadingItem === `violation-${v.id}`}
                    className="inline-flex items-center gap-1 rounded border border-nnm-blue px-2 py-1 font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                  >
                    {loadingItem === `violation-${v.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                    View
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}