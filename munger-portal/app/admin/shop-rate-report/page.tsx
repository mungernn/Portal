"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { fetchPerSqftReport, type PerSqftRateEntry } from "@/lib/admin-shop-api";

function money(v: number): string {
  return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ShopRateReportPage() {
  const admin = useAdminGuard();
  const [entries, setEntries] = useState<PerSqftRateEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    fetchPerSqftReport()
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the report."));
  }, [admin]);

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  const knownRates = entries?.filter((e) => e.ratePerSqft !== null) ?? [];
  const unknownRates = entries?.filter((e) => e.ratePerSqft === null) ?? [];
  const medianRate =
    knownRates.length > 0
      ? [...knownRates].sort((a, b) => (a.ratePerSqft ?? 0) - (b.ratePerSqft ?? 0))[Math.floor(knownRates.length / 2)]!.ratePerSqft!
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Shop Rent — Rate per Sqft</h1>
        <p className="mb-6 text-sm text-slate-500">
          Current effective monthly rent ÷ area, for every occupied shop — sorted lowest first, so an underpriced
          shop is easy to spot rather than needing to be hunted for.
        </p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!entries ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-400">No occupied shops with an active agreement found.</p>
        ) : (
          <div className="space-y-6">
            {medianRate !== null && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm">
                <span className="text-slate-500">Median rate across {knownRates.length} shop(s) with known area: </span>
                <span className="font-mono font-semibold text-nnm-blue">₹{money(medianRate)}/sqft/month</span>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Shop</th>
                    <th className="px-4 py-2.5 font-medium">Holder</th>
                    <th className="px-4 py-2.5 font-medium">Area (sqft)</th>
                    <th className="px-4 py-2.5 font-medium">Current Rent</th>
                    <th className="px-4 py-2.5 font-medium">₹/sqft/mo</th>
                  </tr>
                </thead>
                <tbody>
                  {knownRates.map((e) => {
                    const isLow = medianRate !== null && e.ratePerSqft !== null && e.ratePerSqft < medianRate * 0.5;
                    return (
                      <tr key={e.shopNo} className={`border-b border-slate-100 last:border-0 ${isLow ? "bg-red-50" : ""}`}>
                        <td className="px-4 py-2.5">
                          <span className="font-mono font-semibold text-slate-900">{e.shopNo}</span>
                          <span className="block text-xs text-slate-400">
                            {e.marketName ? `${e.marketName} — ` : ""}
                            {e.location}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">{e.holderName}</td>
                        <td className="px-4 py-2.5">
                          {e.areaBasisUsed === "built_up" ? e.builtUpAreaSqft : e.totalAreaSqft}
                          <span className="ml-1 text-xs text-slate-400">({e.areaBasisUsed === "built_up" ? "built-up" : "total"})</span>
                        </td>
                        <td className="px-4 py-2.5">₹{money(e.currentMonthlyRent)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`font-mono font-semibold ${isLow ? "text-red-700" : "text-slate-900"}`}>
                            ₹{money(e.ratePerSqft!)}
                          </span>
                          {isLow && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                              <AlertTriangle className="h-3 w-3" />
                              Below market
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {unknownRates.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">
                  {unknownRates.length} shop(s) with no area recorded — rate cannot be calculated
                </h2>
                <ul className="space-y-1 text-sm text-slate-500">
                  {unknownRates.map((e) => (
                    <li key={e.shopNo}>
                      <span className="font-mono">{e.shopNo}</span> — {e.holderName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}