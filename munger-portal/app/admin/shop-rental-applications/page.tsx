"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { StageBadge } from "@/components/admin/stage-badge";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { fetchRentalApplications, type ShopRentalApplicationSummary, type ShopApplicationStatus } from "@/lib/admin-shop-api";

const STATUS_TABS: { value: ShopApplicationStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function ShopRentalApplicationsPage() {
  const admin = useAdminGuard();
  const [status, setStatus] = useState<ShopApplicationStatus | "all">("pending");
  const [myStageOnly, setMyStageOnly] = useState(true);
  const [applications, setApplications] = useState<ShopRentalApplicationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    setApplications(null);
    fetchRentalApplications({ status: status === "all" ? undefined : status, myStage: myStageOnly })
      .then((r) => setApplications(r.applications))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load applications."));
  }, [admin, status, myStageOnly]);

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Shop Rental Applications</h1>
        <p className="mb-6 text-sm text-slate-500">
          New tenant applications for vacant shops. Moves through Stall Prabhari → Tax Daroga (NOC) → City Manager →
          Deputy Commissioner → Commissioner. The agreement is created automatically once fully approved.
        </p>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  status === tab.value ? "bg-nnm-blue text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={myStageOnly}
              onChange={(e) => setMyStageOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Only show applications at my desk
          </label>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!applications ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-400">No applications here.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => (
              <Link
                key={a.id}
                href={`/admin/shop-rental-applications/${a.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {a.shop_no} — {a.applicant_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    ₹{Number(a.proposed_monthly_rent).toLocaleString("en-IN")}/mo — requested by {a.requested_by} on{" "}
                    {new Date(a.requested_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <StageBadge status={a.status} currentStage={a.current_stage} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}