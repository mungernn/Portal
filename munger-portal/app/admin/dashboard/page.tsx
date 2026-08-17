"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileClock, FileWarning, LayoutGrid, ShoppingBag, Store, BarChart3, Award, Archive, Download } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { DashboardSummaryWidget } from "@/components/dashboard-summary-widget";
import { useAdminGuard } from "@/lib/use-admin-guard";
import {
  fetchChangeRequests,
  fetchDashboardSummaryAdmin,
  fetchDashboardHoldingsAdmin,
  fetchDashboardPropertyChangesAdmin,
  fetchDashboardShopsAdmin,
  fetchDashboardShopApplicationsAdmin,
  fetchDashboardTradeLicenseApplicationsAdmin,
  fetchDashboardTradeLicensesIssuedAdmin,
} from "@/lib/admin-api";
import { fetchShopAgreementRequests, fetchRentalApplications } from "@/lib/admin-shop-api";
import { fetchTradeLicenseApplications } from "@/lib/admin-trade-license-api";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-auth";

export default function AdminDashboardPage() {
  const admin = useAdminGuard();
  const [myStagePendingCount, setMyStagePendingCount] = useState<number | null>(null);
  const [myShopStagePendingCount, setMyShopStagePendingCount] = useState<number | null>(null);
  const [myRentalAppPendingCount, setMyRentalAppPendingCount] = useState<number | null>(null);
  const [myTradeLicensePendingCount, setMyTradeLicensePendingCount] = useState<number | null>(null);

  useEffect(() => {
    if (!admin) return;
    fetchChangeRequests({ status: "pending", myStage: true })
      .then((r) => setMyStagePendingCount(r.requests.length))
      .catch(() => setMyStagePendingCount(null));
    fetchShopAgreementRequests({ status: "pending", myStage: true })
      .then((r) => setMyShopStagePendingCount(r.requests.length))
      .catch(() => setMyShopStagePendingCount(null));
    fetchRentalApplications({ status: "pending", myStage: true })
      .then((r) => setMyRentalAppPendingCount(r.applications.length))
      .catch(() => setMyRentalAppPendingCount(null));
    fetchTradeLicenseApplications({ status: "pending", myStage: true })
      .then((r) => setMyTradeLicensePendingCount(r.applications.length))
      .catch(() => setMyTradeLicensePendingCount(null));
  }, [admin]);

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Welcome, {admin.displayName}</h1>
        <p className="mb-8 text-sm text-slate-500">Signed in as {ADMIN_ROLE_LABELS[admin.role]}.</p>

        <DashboardSummaryWidget
          fetchSummary={fetchDashboardSummaryAdmin}
          fetchHoldings={fetchDashboardHoldingsAdmin}
          fetchPropertyChanges={fetchDashboardPropertyChangesAdmin}
          fetchShops={fetchDashboardShopsAdmin}
          fetchShopApplications={fetchDashboardShopApplicationsAdmin}
          fetchTradeLicenseApplications={fetchDashboardTradeLicenseApplicationsAdmin}
          fetchTradeLicensesIssued={fetchDashboardTradeLicensesIssuedAdmin}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/change-requests"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <FileClock className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Mutation Approvals</h3>
            <p className="text-sm text-slate-500">
              {myStagePendingCount === null
                ? "Review property change requests waiting on your desk."
                : `${myStagePendingCount} request${myStagePendingCount === 1 ? "" : "s"} currently waiting on your desk.`}
            </p>
          </Link>

          <Link
            href="/admin/shop-agreement-requests"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <ShoppingBag className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Shop Agreement Approvals</h3>
            <p className="text-sm text-slate-500">
              {myShopStagePendingCount === null
                ? "Review shop agreement requests waiting on your desk."
                : `${myShopStagePendingCount} request${myShopStagePendingCount === 1 ? "" : "s"} currently waiting on your desk.`}
            </p>
          </Link>

          <Link
            href="/admin/shop-rental-applications"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <Store className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Shop Rental Applications</h3>
            <p className="text-sm text-slate-500">
              {myRentalAppPendingCount === null
                ? "Review new tenant applications waiting on your desk."
                : `${myRentalAppPendingCount} application${myRentalAppPendingCount === 1 ? "" : "s"} currently waiting on your desk.`}
            </p>
          </Link>

          <Link
            href="/admin/shop-rate-report"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <BarChart3 className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Shop Rate per Sqft</h3>
            <p className="text-sm text-slate-500">See which occupied shops are renting below market rate.</p>
          </Link>

          <Link
            href="/admin/trade-license-requests"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <Award className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Trade License Applications</h3>
            <p className="text-sm text-slate-500">
              {myTradeLicensePendingCount === null
                ? "Review trade license applications waiting on your desk."
                : `${myTradeLicensePendingCount} application${myTradeLicensePendingCount === 1 ? "" : "s"} currently waiting on your desk.`}
            </p>
          </Link>

          <Link
            href="/admin/trade-license-dashboard"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <BarChart3 className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Trade License — Reporting</h3>
            <p className="text-sm text-slate-500">Received, pendency, disposal rate, and anything overdue 2+ weeks.</p>
          </Link>

          <Link
            href="/admin/operators"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <Users className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Operators</h3>
            <p className="text-sm text-slate-500">Activate or deactivate counter operator accounts.</p>
          </Link>

          <Link
            href="/admin/demand-notices"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <FileWarning className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Bulk Demand Notices</h3>
            <p className="text-sm text-slate-500">Generate demand notices for every holding that doesn&apos;t have one yet.</p>
          </Link>

          <Link
            href="/admin/document-archive"
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
              <Archive className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h3 className="mb-1.5 text-base font-semibold text-slate-900">Document Archive</h3>
            <p className="text-sm text-slate-500">Look up any past demand notice, receipt, or violation notice — view only.</p>
          </Link>

          {admin.role === "commissioner" && (
            <Link
              href="/admin/all-changes"
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
                <LayoutGrid className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h3 className="mb-1.5 text-base font-semibold text-slate-900">All Property Changes</h3>
              <p className="text-sm text-slate-500">Every mutation request, done and in process, grouped by category.</p>
            </Link>
          )}

          {admin.role === "commissioner" && (
            <Link
              href="/admin/attendance-report"
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
                <Download className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h3 className="mb-1.5 text-base font-semibold text-slate-900">Field Staff Attendance Report</h3>
              <p className="text-sm text-slate-500">Download the monthly attendance CSV for sanitation staff and drivers.</p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}