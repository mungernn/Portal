"use client";

import { Printer, X } from "lucide-react";
import type { PrintableViolationNotice } from "@/lib/shop-api";
import { DocumentVerificationQR } from "./document-verification-qr";

export function ViolationNoticePrintView({
  notice,
  onClose,
}: {
  notice: PrintableViolationNotice;
  onClose: () => void;
}) {
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
            <div className="text-[13px] text-slate-500">MUNICIPAL SHOP — VIOLATION NOTICE</div>
          </div>
          <div className="w-[64px] shrink-0" aria-hidden="true" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1">
          <div>
            <b className="inline-block w-[150px]">Shop No</b> {notice.shopNo}
          </div>
          <div>
            <b className="inline-block w-[150px]">Market</b> {notice.marketName ?? "—"}
          </div>
          <div className="col-span-2">
            <b className="inline-block w-[150px]">Location</b> {notice.location}
          </div>
          <div>
            <b className="inline-block w-[150px]">Issued Date</b>{" "}
            {new Date(notice.issuedDate).toLocaleDateString("en-IN")}
          </div>
          <div>
            <b className="inline-block w-[150px]">Status</b>{" "}
            <span className="uppercase">{notice.status}</span>
          </div>
        </div>

        <h2 className="mt-5 border-b border-slate-300 pb-1 text-[13px] font-bold text-nnm-blue">Violation Details</h2>
        <div className="mt-2 space-y-2">
          <div>
            <b className="inline-block w-[150px]">Category</b> {notice.violationCategory}
          </div>
          <div>
            <b className="mb-1 block">Description</b>
            <p className="rounded border border-slate-200 bg-slate-50 p-2">{notice.description}</p>
          </div>
        </div>

        {notice.status !== "issued" && (
          <>
            <h2 className="mt-5 border-b border-slate-300 pb-1 text-[13px] font-bold text-nnm-blue">Resolution</h2>
            <div className="mt-2 space-y-2">
              {notice.resolvedNotes && (
                <div>
                  <b className="mb-1 block">Notes</b>
                  <p className="rounded border border-slate-200 bg-slate-50 p-2">{notice.resolvedNotes}</p>
                </div>
              )}
              {notice.resolvedAt && (
                <div>
                  <b className="inline-block w-[150px]">Resolved On</b>{" "}
                  {new Date(notice.resolvedAt).toLocaleDateString("en-IN")}
                </div>
              )}
            </div>
          </>
        )}

        <p className="mt-6 text-[10px] text-slate-500">
          This is a computer generated notice issued by Munger Nagar Nigam against the above shop. Issued by{" "}
          {notice.issuedBy}.
        </p>
      </div>
    </div>
  );
}
