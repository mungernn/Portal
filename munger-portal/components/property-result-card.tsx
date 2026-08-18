"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { formatINR, totalPayable, type PropertyRecord } from "@/lib/property-tax";
import { initiateOnlinePayment } from "@/lib/online-payment";
import { TaxCollectorCodeInput } from "@/components/tax-collector-code-input";

// Mirrors the backend's ONLINE_PAYMENT_ENABLED kill switch (see
// nnm-property-tax-api/src/config/env.ts) - kept in sync manually since
// this is a separate deployment with its own env vars. Even if this
// somehow drifted out of sync, the backend check is the one that
// actually matters; this just avoids showing a button that would fail.
const ONLINE_PAYMENT_ENABLED = process.env.NEXT_PUBLIC_ONLINE_PAYMENT_ENABLED === "true";

export interface PropertyResultCardProps {
  record: PropertyRecord;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">
        {label}
      </span>
      <span className="block text-sm text-ink">{value}</span>
    </div>
  );
}

export function PropertyResultCard({ record }: PropertyResultCardProps) {
  const total = totalPayable(record);
  const nothingDue = total <= 0;
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxCollectorCode, setTaxCollectorCode] = useState("");

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      const { redirectUrl } = await initiateOnlinePayment(record.holdingNumber, total, taxCollectorCode.trim() || undefined);
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment. Please try again.");
      setPaying(false);
    }
  }

  return (
    <article className="rounded-[10px] border border-line bg-card">
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-7">
        <Field label="Property ID" value={record.propertyId} />
        <Field label="Holding Number" value={record.holdingNumber} />
        <Field label="Owner Name" value={record.ownerName} />
        <Field label="Property Address" value={record.address} />
      </div>

      {record.currentCyclePaid && (
        <div className="mx-6 mb-2 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800 sm:mx-7">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Tax paid/cleared up to <b>{record.paidThroughYear ?? "current year"}</b>. The current-year amount below
            is shown for reference — it is not currently due.
          </span>
        </div>
      )}

      <div className="perforation" />

      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-soft">
              {record.currentCyclePaid ? "Current year tax (paid)" : "Current tax due"}
            </span>
            <span className={`block font-mono text-base ${record.currentCyclePaid ? "text-green-700" : "text-ink"}`}>
              {formatINR(record.currentTaxDue)}
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-soft">
              Arrears
            </span>
            <span className="block font-mono text-base text-ink">
              {formatINR(record.arrears)}
            </span>
          </div>
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-soft">
              {record.currentCyclePaid ? "Solid waste charge (paid)" : "Solid waste charge"}
            </span>
            <span className={`block font-mono text-base ${record.currentCyclePaid ? "text-green-700" : "text-ink"}`}>
              {formatINR(record.solidWasteCharge)}
            </span>
          </div>
          {record.penalty > 0 && (
            <div>
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-red-600">
                Penalty
              </span>
              <span className="block font-mono text-base text-red-700">
                {formatINR(record.penalty)}
              </span>
            </div>
          )}
          {record.rebate > 0 && (
            <div>
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">
                Rebate applied
              </span>
              <span className="block font-mono text-base text-ganga-teal">
                − {formatINR(record.rebate)}
              </span>
            </div>
          )}
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">
              Total payable
            </span>
            <span className="block font-mono text-lg font-semibold text-nnm-blue">
              {formatINR(total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {!nothingDue && ONLINE_PAYMENT_ENABLED && (
            <div className="w-full max-w-[220px]">
              <TaxCollectorCodeInput
                value={taxCollectorCode}
                onChange={setTaxCollectorCode}
                inputClassName="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
                labelClassName="mb-1 block text-right font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-soft"
              />
            </div>
          )}
          {nothingDue ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-6 py-2.5 text-sm font-semibold text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              No dues pending
            </span>
          ) : !ONLINE_PAYMENT_ENABLED ? (
            <span className="max-w-xs rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-right text-sm text-amber-800">
              Online payment is temporarily unavailable. Please pay at the Nagar Nigam office counter.
            </span>
          ) : (
            <button
              onClick={handlePay}
              disabled={paying}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-nnm-gold px-6 py-2.5 text-sm font-semibold text-[#20240a] shadow-[0_3px_0_#96791b] transition-transform hover:-translate-y-px disabled:opacity-60"
            >
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              {paying ? "Redirecting to bank…" : "Pay Property Tax"}
            </button>
          )}
          {error && <p className="max-w-xs text-right text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </article>
  );
}