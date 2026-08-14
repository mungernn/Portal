"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2, Printer, Receipt } from "lucide-react";
import {
  fetchDemandNoticeHistory,
  fetchDemandNoticeReprint,
  fetchPaymentHistory,
  fetchReceiptReprint,
  type DemandNoticeHistoryEntry,
  type PaymentHistoryEntry,
  type PrintableDemandNoticeHistory,
  type PrintableReceiptHistory,
} from "@/lib/operator-api";
import { DemandNoticeReprintView } from "./demand-notice-reprint-view";
import { ReceiptReprintView } from "./receipt-reprint-view";

export function PropertyDocumentHistory({ holdingNo }: { holdingNo: string }) {
  const [noticeHistory, setNoticeHistory] = useState<DemandNoticeHistoryEntry[] | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [noticeReprint, setNoticeReprint] = useState<PrintableDemandNoticeHistory | null>(null);
  const [receiptReprint, setReceiptReprint] = useState<PrintableReceiptHistory | null>(null);

  useEffect(() => {
    setNoticeHistory(null);
    setPaymentHistory(null);
    fetchDemandNoticeHistory(holdingNo)
      .then(setNoticeHistory)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load demand notice history."));
    fetchPaymentHistory(holdingNo)
      .then(setPaymentHistory)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load payment history."));
  }, [holdingNo]);

  async function handleOpenNotice(demandNo: string) {
    setLoadingItem(`notice-${demandNo}`);
    try {
      setNoticeReprint(await fetchDemandNoticeReprint(demandNo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this notice.");
    } finally {
      setLoadingItem(null);
    }
  }

  async function handleOpenReceipt(receiptNo: string) {
    setLoadingItem(`receipt-${receiptNo}`);
    try {
      setReceiptReprint(await fetchReceiptReprint(receiptNo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this receipt.");
    } finally {
      setLoadingItem(null);
    }
  }

  if (noticeReprint) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <DemandNoticeReprintView notice={noticeReprint} onClose={() => setNoticeReprint(null)} />
      </section>
    );
  }
  if (receiptReprint) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <ReceiptReprintView receipt={receiptReprint} onClose={() => setReceiptReprint(null)} />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Document History</h2>
      <p className="mb-4 text-xs text-slate-500">Past demand notices and payment receipts — view only, nothing here can be edited.</p>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4" />
            Demand Notices
          </h3>
          {!noticeHistory ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : noticeHistory.length === 0 ? (
            <p className="text-sm text-slate-400">None generated yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {noticeHistory.map((n) => (
                <li key={n.demandNo} className="flex items-center justify-between rounded-md border border-slate-200 p-2.5 text-xs">
                  <div>
                    <span className="block font-mono font-semibold text-slate-800">{n.date}</span>
                    <span className="text-slate-500">
                      ₹{Number(n.totalAmountDemanded).toLocaleString("en-IN")} — {n.settled ? "settled" : "unsettled"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenNotice(n.demandNo)}
                    disabled={loadingItem === `notice-${n.demandNo}`}
                    className="inline-flex items-center gap-1 rounded border border-nnm-blue px-2 py-1 font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                  >
                    {loadingItem === `notice-${n.demandNo}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                    View
                  </button>
                </li>
              ))}
            </ul>
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
                <li key={p.receiptNo} className="flex items-center justify-between rounded-md border border-slate-200 p-2.5 text-xs">
                  <div>
                    <span className="block font-mono font-semibold text-slate-800">{p.date}</span>
                    <span className="text-slate-500">
                      ₹{Number(p.amountReceived).toLocaleString("en-IN")} — {p.paymentMode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenReceipt(p.receiptNo)}
                    disabled={loadingItem === `receipt-${p.receiptNo}`}
                    className="inline-flex items-center gap-1 rounded border border-nnm-blue px-2 py-1 font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                  >
                    {loadingItem === `receipt-${p.receiptNo}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
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