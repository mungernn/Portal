"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import type { PrintableShopAgreement } from "@/lib/shop-api";
import { DocumentVerificationQR } from "./document-verification-qr";
import { printElementInNewWindow } from "@/lib/print-in-new-window";

function money(v: string | number | undefined | null): string {
  const n = Number(v ?? 0);
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateStr(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export function ShopAgreementPermitView({ permit, onClose }: { permit: PrintableShopAgreement; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);
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

      <div ref={printRef}
        className="printable-area rounded-xl border border-slate-200 bg-white p-8 text-[12px] text-[#222]" style={{ fontFamily: "Arial, sans-serif" }}>
        <div className="flex items-start justify-between gap-3 border-b-2 border-nnm-blue pb-2">
          <DocumentVerificationQR url={permit.verificationUrl} />
          <div className="flex-1 text-center">
            <h1 className="m-0 text-xl font-bold text-nnm-blue">MUNGER NAGAR NIGAM</h1>
            <div className="text-[13px] text-slate-500">MUNICIPAL SHOP RENTAL AGREEMENT / PERMIT</div>
            {permit.status !== "active" && (
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-red-600">
                Status: {permit.status}
              </div>
            )}
          </div>
          <div className="w-[64px] shrink-0" aria-hidden="true" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1">
          <div>
            <b className="inline-block w-[150px]">Shop No</b> {permit.shopNo}
          </div>
          <div>
            <b className="inline-block w-[150px]">Agreement No</b> {permit.agreementNumber ?? "—"}
          </div>
          <div>
            <b className="inline-block w-[150px]">Market</b> {permit.marketName ?? "—"}
          </div>
          <div>
            <b className="inline-block w-[150px]">Location</b> {permit.location}
          </div>
        </div>

        <h2 className="mt-5 border-b border-slate-300 pb-1 text-[13px] font-bold text-nnm-blue">Holder Details</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1">
          <div>
            <b className="inline-block w-[150px]">Holder Name</b> {permit.holderName}
          </div>
          <div>
            <b className="inline-block w-[150px]">{permit.holderRelationType ?? "Relation"}</b> {permit.holderRelationName ?? "—"}
          </div>
          <div>
            <b className="inline-block w-[150px]">Mobile No</b> {permit.holderMobile ?? "—"}
          </div>
          <div>
            <b className="inline-block w-[150px]">ID Proof No</b> {permit.idProofNumber ?? "—"}
          </div>
          <div className="col-span-2">
            <b className="inline-block w-[150px]">Address</b> {permit.holderAddress ?? "—"}
          </div>
          <div className="col-span-2">
            <b className="inline-block w-[150px]">Business Name</b> {permit.businessName ?? "—"}
          </div>
          {permit.jointHolderName && (
            <div className="col-span-2">
              <b className="inline-block w-[150px]">Joint Holder</b> {permit.jointHolderName}
              {permit.jointHolderRelation ? ` (${permit.jointHolderRelation})` : ""}
            </div>
          )}
        </div>

        <h2 className="mt-5 border-b border-slate-300 pb-1 text-[13px] font-bold text-nnm-blue">Terms</h2>
        {permit.rentPeriodsInconsistent && (
          <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
            ⚠ The entered period rates don&apos;t match the standard escalation formula — flagged for Deputy
            Municipal Commissioner review.
          </p>
        )}
        <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1">
          <div>
            <b className="inline-block w-[150px]">Base Monthly Rent</b> ₹{money(permit.baseMonthlyRent)}
          </div>
          <div>
            <b className="inline-block w-[150px]">Current Effective Rent</b> ₹{money(permit.currentEffectiveMonthlyRent)}/mo
          </div>
          <div>
            <b className="inline-block w-[150px]">Rent (pre-2019-20)</b> {permit.rentPre2019 ? `₹${money(permit.rentPre2019)}` : "—"}
          </div>
          <div>
            <b className="inline-block w-[150px]">Rent (2019-20)</b> {permit.rent201920 ? `₹${money(permit.rent201920)}` : "—"}
          </div>
          <div>
            <b className="inline-block w-[150px]">Rent (2020-21 onwards)</b> {permit.rent202021Onwards ? `₹${money(permit.rent202021Onwards)}` : "—"}
          </div>
          <div>
            <b className="inline-block w-[150px]">Security Deposit</b> ₹{money(permit.securityDeposit)}
          </div>
          {Number(permit.miscCost) > 0 && (
            <div>
              <b className="inline-block w-[150px]">Misc Cost</b> ₹{money(permit.miscCost)} ({permit.miscCostReason})
            </div>
          )}
          {Number(permit.miscRebate) > 0 && (
            <div>
              <b className="inline-block w-[150px]">Rebate</b> ₹{money(permit.miscRebate)} ({permit.miscRebateReason})
            </div>
          )}
          <div>
            <b className="inline-block w-[150px]">Agreement Start</b> {dateStr(permit.agreementStartDate)}
          </div>
          <div>
            <b className="inline-block w-[150px]">Agreement End</b> {dateStr(permit.agreementEndDate)}

          </div>
        </div>

        <div className="mt-10 flex justify-between text-[11px]">
          <div>
            <div className="mb-8">&nbsp;</div>
            <div className="w-[180px] border-t border-slate-400 pt-1 text-center">Holder Signature</div>
          </div>
          <div>
            <div className="mb-8">&nbsp;</div>
            <div className="w-[180px] border-t border-slate-400 pt-1 text-center">Authorized Signatory, NNM</div>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-slate-500">
          This is a computer generated document issued as proof of the municipal shop rental agreement recorded with
          Munger Nagar Nigam.
        </p>
      </div>
    </div>
  );
}
