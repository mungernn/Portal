"use client";

import { Printer, X } from "lucide-react";
import type { PrintableShopDemand } from "@/lib/shop-api";
import { DocumentVerificationQR } from "./document-verification-qr";

function money(v: string | number | undefined | null): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ShopNoticeView({ notice, onClose }: { notice: PrintableShopDemand; onClose: () => void }) {
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-nnm-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
        <button onClick={onClose} className="inline-flex items-center gap-1.5 text-sm font-medium text-nnm-blue hover:underline">
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      <div className="printable-area rounded-xl border border-slate-200 bg-white p-8 text-[12px] text-[#222]" style={{ fontFamily: "Arial, sans-serif" }}>
        <div className="flex items-start justify-between gap-3 border-b-2 border-nnm-blue pb-2">
          <DocumentVerificationQR url={notice.verificationUrl} />
          <div className="flex-1 text-center">
            <h1 className="m-0 text-xl font-bold text-nnm-blue">MUNGER NAGAR NIGAM</h1>
            <div className="text-[13px] text-slate-500">MUNICIPAL SHOP RENT — DEMAND NOTICE</div>
          </div>
          <div className="w-[170px] shrink-0 text-right text-[11px]">
            <div>
              <b className="text-nnm-blue">Demand Notice No -</b> {notice.formattedDemandNo}
            </div>
            <div>
              <b className="text-nnm-blue">Notice Date -</b> {notice.demandDate}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] font-semibold">
          THIS IS NOT THE PAYMENT RECEIPT. KINDLY COLLECT THE PAYMENT RECEIPT WHEN YOU PAY THE RENT.
        </p>

        <div className="mt-3.5 flex gap-5">
          <div className="flex-1 space-y-0.5">
            <div>
              <b className="inline-block w-[140px]">Shop No</b> {notice.shopNo}
            </div>
            <div>
              <b className="inline-block w-[140px]">Market</b> {notice.marketName ?? "—"}
            </div>
            <div>
              <b className="inline-block w-[140px]">Location</b> {notice.location}
            </div>
          </div>
          <div className="flex-1 space-y-0.5">
            <div>
              <b className="inline-block w-[140px]">Holder Name</b> {notice.holderName}
            </div>
            <div>
              <b className="inline-block w-[140px]">Mobile No</b> {notice.holderMobile ?? "—"}
            </div>
            <div>
              <b className="inline-block w-[140px]">Address</b> {notice.holderAddress ?? "—"}
            </div>
          </div>
        </div>

        <table className="mt-3.5 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-400 p-1.5 text-left">Particulars</th>
              <th className="border border-slate-400 p-1.5 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-400 p-1.5">Rent Due ({notice.periodStartMonth} to {notice.periodEndMonth})</td>
              <td className="border border-slate-400 p-1.5 text-right">{money(notice.baseRentAmount)}</td>
            </tr>
            {Number(notice.penaltyAmount) > 0 && (
              <tr>
                <td className="border border-slate-400 p-1.5">Late Fee / Penalty (2% compounded, overdue &gt;1 year)</td>
                <td className="border border-slate-400 p-1.5 text-right">{money(notice.penaltyAmount)}</td>
              </tr>
            )}
            {Number(notice.miscCostAmount) > 0 && (
              <tr>
                <td className="border border-slate-400 p-1.5">Misc Cost{notice.miscCostReason ? ` (${notice.miscCostReason})` : ""}</td>
                <td className="border border-slate-400 p-1.5 text-right">{money(notice.miscCostAmount)}</td>
              </tr>
            )}
            {Number(notice.miscRebateAmount) > 0 && (
              <tr>
                <td className="border border-slate-400 p-1.5">Rebate{notice.miscRebateReason ? ` (${notice.miscRebateReason})` : ""}</td>
                <td className="border border-slate-400 p-1.5 text-right">-{money(notice.miscRebateAmount)}</td>
              </tr>
            )}
            <tr className="bg-slate-50 font-bold">
              <td className="border border-slate-400 p-1.5">Total Amount Due</td>
              <td className="border border-slate-400 p-1.5 text-right">{money(notice.totalAmountDemanded)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-4 text-[11px]">
          You are hereby notified that an amount of ₹{money(notice.totalAmountDemanded)} is outstanding against Shop
          No {notice.shopNo}. Please clear the dues at the earliest at the Nagar Nigam counter to avoid penal
          charges.
        </p>

        {notice.settled && (
          <p className="mt-2 text-[11px] font-semibold text-green-700">This demand has already been settled.</p>
        )}

        <p className="mt-4 text-[10px] text-slate-500">
          This is a computer generated demand notice. This notice is not a payment receipt. Generated by{" "}
          {notice.generatedBy}.
        </p>
      </div>
    </div>
  );
}
