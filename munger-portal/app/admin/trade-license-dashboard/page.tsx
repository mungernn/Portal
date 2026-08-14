"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { fetchTradeLicenseStats, type TradeLicenseReportingStats } from "@/lib/admin-trade-license-api";

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`block text-2xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</span>
    </div>
  );
}

export default function TradeLicenseDashboardPage() {
  const admin = useAdminGuard();
  const [stats, setStats] = useState<TradeLicenseReportingStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    fetchTradeLicenseStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load the reporting dashboard."));
  }, [admin]);

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Trade License — Reporting Dashboard</h1>
        <p className="mb-6 text-sm text-slate-500">Applications received, pendency, and disposal rate.</p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!stats ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <StatCard label="Received" value={stats.received} />
              <StatCard label="Pending" value={stats.pending} accent="text-amber-600" />
              <StatCard label="Approved" value={stats.approved} accent="text-green-600" />
              <StatCard label="Rejected" value={stats.rejected} accent="text-red-600" />
              <StatCard label="Disposal Rate" value={`${stats.disposalRatePct.toFixed(1)}%`} accent="text-nnm-blue" />
            </div>

            <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-semibold text-amber-900">
                  Pending More Than 2 Weeks ({stats.stalePending.length})
                </h2>
              </div>
              {stats.stalePending.length === 0 ? (
                <p className="text-sm text-amber-700">Nothing overdue — every pending application is within 2 weeks.</p>
              ) : (
                <div className="space-y-2">
                  {stats.stalePending.map((a) => (
                    <Link
                      key={a.id}
                      href={`/admin/trade-license-requests/${a.id}`}
                      className="flex items-center justify-between rounded-md border border-amber-300 bg-white p-3 text-sm hover:shadow-sm"
                    >
                      <div>
                        <span className="font-mono font-semibold text-slate-900">{a.application_number}</span>
                        <span className="ml-2 text-slate-600">{a.applicant_name} — {a.entity_name}</span>
                      </div>
                      <span className="text-xs text-amber-700">
                        Since {new Date(a.requested_at).toLocaleDateString("en-IN")} — with {a.current_stage.replace(/_/g, " ")}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}