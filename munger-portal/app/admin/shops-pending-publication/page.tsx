"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { fetchShopsPendingPublication, approveShopPublication, type ShopPendingPublication } from "@/lib/admin-shop-api";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-auth";

const STAGE_ORDER = ["stall_prabhari", "city_manager", "deputy_commissioner"] as const;

export default function ShopsPendingPublicationPage() {
  const admin = useAdminGuard();
  const [shops, setShops] = useState<ShopPendingPublication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvingShopNo, setApprovingShopNo] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState<string | null>(null);

  async function load() {
    try {
      setShops(await fetchShopsPendingPublication());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load shops pending publication approval.");
    }
  }

  useEffect(() => {
    if (!admin) return;
    load();
  }, [admin]);

  async function handleApprove(shopNo: string) {
    setError(null);
    setJustApproved(null);
    setApprovingShopNo(shopNo);
    try {
      const updated = await approveShopPublication(shopNo);
      setJustApproved(
        updated.publicationStage === "approved"
          ? `${shopNo} approved and is now publicly listed as available.`
          : `${shopNo} approved - now awaiting ${ADMIN_ROLE_LABELS[updated.publicationStage as keyof typeof ADMIN_ROLE_LABELS]}.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve this shop.");
    } finally {
      setApprovingShopNo(null);
    }
  }

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  if (!STAGE_ORDER.includes(admin.role as (typeof STAGE_ORDER)[number])) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminHeader admin={admin} />
        <main className="mx-auto max-w-2xl px-6 py-10">
          <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Shop publication approval isn&apos;t part of this login&apos;s role.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Shops Pending Publication Approval</h1>
        <p className="mb-6 text-sm text-slate-500">
          A newly-entered shop isn&apos;t shown in the public &quot;Apply for a New Rental Shop&quot; listing until Stall
          Prabhari, City Manager, and Deputy Municipal Commissioner have each reviewed it - this avoids drawing public attention
          to an unconfirmed entry. Below are shops currently waiting on your review.
        </p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {justApproved && (
          <div role="status" className="mb-5 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {justApproved}
          </div>
        )}

        {!shops ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : shops.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Nothing waiting on your review right now.
          </div>
        ) : (
          <div className="space-y-3">
            {shops.map((s) => (
              <div key={s.shopNo} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-1 flex items-center justify-between">
                  <p className="font-mono text-sm font-semibold text-slate-800">{s.shopNo}</p>
                  <button
                    onClick={() => handleApprove(s.shopNo)}
                    disabled={approvingShopNo === s.shopNo}
                    className="rounded-md bg-nnm-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
                  >
                    {approvingShopNo === s.shopNo ? "Approving…" : "Approve"}
                  </button>
                </div>
                <p className="text-sm text-slate-600">{s.location}</p>
                <p className="text-xs text-slate-400">
                  {s.marketName ?? "No market"} {s.ward ? `· ${s.ward}` : ""} {s.areaSqft ? `· ${s.areaSqft} sqft` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-400">Entered by {s.createdBy}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
