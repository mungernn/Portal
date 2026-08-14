import { CheckCircle2, AlertTriangle } from "lucide-react";
import { formatINR, type ShopRentRecord } from "@/lib/shop-rent-tax";

export function ShopRentResultCard({ record }: { record: ShopRentRecord }) {
  const nothingDue = record.totalPending <= 0;

  return (
    <article className="rounded-[10px] border border-line bg-card">
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-7">
        <div>
          <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">Shop Number</span>
          <span className="block text-sm text-ink">{record.shopNo}</span>
        </div>
        <div>
          <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">Location</span>
          <span className="block text-sm text-ink">{record.marketName ? `${record.marketName} — ` : ""}{record.location}</span>
        </div>
        <div>
          <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">Agreement Holder</span>
          <span className="block text-sm text-ink">{record.holderName}</span>
        </div>
        <div>
          <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">Rent Paid Till</span>
          <span className="block text-sm text-ink">{record.rentPaidTillMonth ?? "Never"}</span>
        </div>
      </div>

      <div className="perforation" />

      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-soft">Monthly Rent</span>
            <span className="block font-mono text-base text-ink">{formatINR(record.baseMonthlyRent)}</span>
          </div>
          {record.totalPenalty > 0 && (
            <div>
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-red-600">Penalty</span>
              <span className="block font-mono text-base text-red-700">{formatINR(record.totalPenalty)}</span>
            </div>
          )}
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-ganga-teal">Total Pending</span>
            <span className="block font-mono text-lg font-semibold text-nnm-blue">{formatINR(record.totalPending)}</span>
          </div>
        </div>

        {nothingDue ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-6 py-2.5 text-sm font-semibold text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            Rent paid up to date
          </span>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:max-w-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {record.pendingMonthsCount} month{record.pendingMonthsCount === 1 ? "" : "s"} pending. Please pay at
              the Nagar Nigam counter with this shop number.
            </span>
          </div>
        )}
      </div>
    </article>
  );
}