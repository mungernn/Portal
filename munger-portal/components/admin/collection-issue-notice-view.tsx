"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { printElementInNewWindow } from "@/lib/print-in-new-window";
import type { GeneratedCollectionIssueNotice } from "@/lib/admin-api";

function money(v: unknown): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CollectionIssueNoticeView({ notice, onClose }: { notice: GeneratedCollectionIssueNotice; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
  const dn = notice.demandNotice;

  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <button
          onClick={() => printRef.current && printElementInNewWindow(printRef.current)}
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

      <div ref={printRef} className="printable-area rounded-xl border border-slate-200 bg-white p-8 text-[12px] text-[#222]" style={{ fontFamily: "Arial, sans-serif" }}>
        {/* --- Legal notice --- */}
        <div className="border-b-2 border-nnm-blue pb-2 text-center">
          <h1 className="m-0 text-xl font-bold text-nnm-blue">MUNGER NAGAR NIGAM</h1>
          <div className="text-[13px] font-semibold uppercase text-slate-700">{notice.title}</div>
        </div>

        <div className="mt-3 flex justify-between text-[11px]">
          <div>
            <b className="text-nnm-blue">Notice No -</b> {notice.record.notice_no}
          </div>
          <div>
            <b className="text-nnm-blue">Notice Date -</b> {notice.noticeDate}
          </div>
        </div>

        <div className="mt-3 space-y-0.5">
          <div>
            <b className="inline-block w-[140px]">Holding No</b> {notice.issue.holding_no}
          </div>
          <div>
            <b className="inline-block w-[140px]">Demand Notice No</b> {notice.record.demand_no ?? "Not yet generated"}
          </div>
        </div>

        <div className="mt-4 space-y-2.5 whitespace-pre-line text-justify leading-relaxed">{notice.bodyText}</div>

        <div className="mt-4 rounded border border-slate-300 bg-slate-50 p-2.5 text-[10px] text-slate-600">
          <b>Legal Basis:</b> {notice.legalBasis}
        </div>

        <div className="mt-8 flex justify-end">
          <div className="text-center text-[11px]">
            <div className="mb-8">&nbsp;</div>
            <div className="border-t border-slate-400 pt-1">
              City Manager
              <br />
              Munger Nagar Nigam
            </div>
          </div>
        </div>

        {/* --- Attached demand notice --- */}
        {dn && (
          <div className="mt-8 border-t-4 border-double border-slate-400 pt-4" style={{ pageBreakBefore: "always" }}>
            <div className="border-b-2 border-nnm-blue pb-2 text-center">
              <h2 className="m-0 text-lg font-bold text-nnm-blue">MUNGER NAGAR NIGAM</h2>
              <div className="text-[13px] text-slate-500">PROPERTY TAX - DEMAND NOTICE (ATTACHED)</div>
            </div>
            <div className="mt-3 flex justify-between text-[11px]">
              <div>
                <b className="text-nnm-blue">Demand Notice No -</b> {String(dn.demand_no)}
              </div>
              <div>
                <b className="text-nnm-blue">Notice Date -</b> {dn.notice_date ? new Date(String(dn.notice_date)).toLocaleDateString("en-IN") : "-"}
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
                  <td className="border border-slate-400 p-1.5">Annual Rental Value (ARV)</td>
                  <td className="border border-slate-400 p-1.5 text-right">{money(dn.arv)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-1.5">Current Year Tax (net)</td>
                  <td className="border border-slate-400 p-1.5 text-right">{money(dn.current_year_tax_net)}</td>
                </tr>
                {Number(dn.previous_years_tax_base) > 0 && (
                  <tr>
                    <td className="border border-slate-400 p-1.5">Previous Years&apos; Outstanding Demand</td>
                    <td className="border border-slate-400 p-1.5 text-right">{money(dn.previous_years_tax_base)}</td>
                  </tr>
                )}
                {Number(dn.total_fine_amount) > 0 && (
                  <tr>
                    <td className="border border-slate-400 p-1.5">Fine / Penalty</td>
                    <td className="border border-slate-400 p-1.5 text-right">{money(dn.total_fine_amount)}</td>
                  </tr>
                )}
                {Number(dn.other_charges) > 0 && (
                  <tr>
                    <td className="border border-slate-400 p-1.5">Other Charges (SW, water, boring, form fee, misc)</td>
                    <td className="border border-slate-400 p-1.5 text-right">{money(dn.other_charges)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-400 p-1.5">Total Amount Demanded</td>
                  <td className="border border-slate-400 p-1.5 text-right">{money(dn.total_amount_demanded)}</td>
                </tr>
              </tbody>
            </table>
            {dn.settled ? (
              <p className="mt-3 text-[11px] font-semibold text-green-700">This demand has been settled - Receipt No {String(dn.settled_receipt_no)}.</p>
            ) : (
              <p className="mt-3 text-[11px] font-semibold text-amber-700">This demand has not yet been settled.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
