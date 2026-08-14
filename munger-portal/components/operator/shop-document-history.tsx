"use client";

import { useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2, Printer, Receipt, ShieldAlert } from "lucide-react";
import {
  fetchShopDemandHistory,
  fetchPrintableDemandNotice,
  fetchShopPaymentHistory,
  fetchShopReceiptReprint,
  fetchViolationNotices,
  fetchPrintableViolationNotice,
  type ShopDemandHistoryEntry,
  type PrintableShopDemand,
  type ShopPaymentHistoryEntry,
  type PrintableShopReceiptHistory,
  type ViolationNotice,
  type PrintableViolationNotice,
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
                <li key={d.demandNo} className="flex items-center justify-between rounded-md border border-slate-200 p-2.5 text-xs">
                  <div>
                    <span className="block font-mono font-semibold text-slate-800">{d.demandDate}</span>
                    <span className="text-slate-500">
                      ₹{Number(d.totalAmountDemanded).toLocaleString("en-IN")} — {d.settled ? "settled" : "unsettled"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenDemand(d.demandNo)}
                    disabled={loadingItem === `demand-${d.demandNo}`}
                    className="inline-flex items-center gap-1 rounded border border-nnm-blue px-2 py-1 font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                  >
                    {loadingItem === `demand-${d.demandNo}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
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