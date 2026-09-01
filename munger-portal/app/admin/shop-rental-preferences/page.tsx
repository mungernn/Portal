"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Trophy } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import {
  fetchRentalPreferences,
  fetchAllShopsForAdmin,
  fetchPreferencesMatchingShop,
  allotRentalPreference,
  rejectRentalPreference,
  type ShopRentalPreferenceSummary,
  type ShopRentalPreferenceStatus,
  type ShopSummaryForAllotment,
} from "@/lib/admin-shop-api";

const STATUS_TABS: { value: ShopRentalPreferenceStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "allotted", label: "Allotted" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

export default function ShopRentalPreferencesPage() {
  const admin = useAdminGuard();

  // Allotment workflow
  const [vacantShops, setVacantShops] = useState<ShopSummaryForAllotment[] | null>(null);
  const [selectedShopNo, setSelectedShopNo] = useState("");
  const [matchResult, setMatchResult] = useState<{ shop: ShopSummaryForAllotment; matches: ShopRentalPreferenceSummary[] } | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [allottingId, setAllottingId] = useState<number | null>(null);
  const [allotSuccess, setAllotSuccess] = useState<string | null>(null);

  // Overview list
  const [status, setStatus] = useState<ShopRentalPreferenceStatus | "all">("pending");
  const [preferences, setPreferences] = useState<ShopRentalPreferenceSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  useEffect(() => {
    if (!admin) return;
    fetchAllShopsForAdmin()
      .then((shops) => setVacantShops(shops.filter((s) => s.status === "vacant")))
      .catch((err) => setMatchError(err instanceof Error ? err.message : "Could not load vacant shops."));
  }, [admin]);

  useEffect(() => {
    if (!admin) return;
    setPreferences(null);
    fetchRentalPreferences(status === "all" ? undefined : status)
      .then(setPreferences)
      .catch((err) => setListError(err instanceof Error ? err.message : "Could not load preferences."));
  }, [admin, status]);

  async function loadMatches(shopNo: string) {
    setSelectedShopNo(shopNo);
    setMatchResult(null);
    setMatchError(null);
    setAllotSuccess(null);
    if (!shopNo) return;
    setMatchLoading(true);
    try {
      const result = await fetchPreferencesMatchingShop(shopNo);
      setMatchResult(result);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Could not load matching preferences.");
    } finally {
      setMatchLoading(false);
    }
  }

  async function handleAllot(preferenceId: number, applicantName: string) {
    if (!selectedShopNo) return;
    if (!window.confirm(`Allot shop ${selectedShopNo} to ${applicantName}? This creates a rental application starting the approval chain.`)) return;
    setAllottingId(preferenceId);
    setMatchError(null);
    try {
      await allotRentalPreference(preferenceId, selectedShopNo);
      setAllotSuccess(`Shop ${selectedShopNo} allotted to ${applicantName}. The application now starts the approval chain.`);
      setMatchResult(null);
      setSelectedShopNo("");
      const shops = await fetchAllShopsForAdmin();
      setVacantShops(shops.filter((s) => s.status === "vacant"));
      const refreshed = await fetchRentalPreferences(status === "all" ? undefined : status);
      setPreferences(refreshed);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "Could not allot this preference.");
    } finally {
      setAllottingId(null);
    }
  }

  async function handleReject(id: number) {
    if (!rejectNotes.trim()) {
      setListError("A reason is required to reject.");
      return;
    }
    setRejectingId(id);
    setListError(null);
    try {
      await rejectRentalPreference(id, rejectNotes);
      setRejectNotes("");
      const refreshed = await fetchRentalPreferences(status === "all" ? undefined : status);
      setPreferences(refreshed);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Could not reject this preference.");
    } finally {
      setRejectingId(null);
    }
  }

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Shop Rental Preferences</h1>
        <p className="mb-6 text-sm text-slate-500">
          Applicants list acceptable markets, a size range, and a bid instead of picking one specific shop. Pick a vacant shop
          below to see who qualifies, then allot it - that starts a normal rental application through the usual approval chain.
        </p>

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Allot a Vacant Shop</h2>
          {!vacantShops ? (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading vacant shops…
            </div>
          ) : (
            <select
              value={selectedShopNo}
              onChange={(e) => loadMatches(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
            >
              <option value="">Select a vacant shop…</option>
              {vacantShops.map((s) => (
                <option key={s.shop_no} value={s.shop_no}>
                  {s.shop_no} - {s.market_name ?? "No market"} - {s.location} ({s.area_sqft ?? "?"} sqft)
                </option>
              ))}
            </select>
          )}

          {allotSuccess && (
            <div role="status" className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {allotSuccess}
            </div>
          )}
          {matchError && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {matchError}
            </div>
          )}
          {matchLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding matching preferences…
            </div>
          )}

          {matchResult && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">
                {matchResult.matches.length} matching preference(s) for {matchResult.shop.shop_no}, ranked by bid:
              </p>
              {matchResult.matches.length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
                  No pending preferences match this shop&apos;s market and size right now.
                </p>
              ) : (
                <div className="space-y-2">
                  {matchResult.matches.map((m, i) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                      <div className="text-sm">
                        <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                          {i === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                          {m.applicant_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Bid ₹{m.bid_amount}/mo · {m.min_area_sqft}-{m.max_area_sqft} sqft · {m.markets.join(", ")}
                        </p>
                        {m.applicant_mobile && <p className="text-xs text-slate-400">{m.applicant_mobile}</p>}
                      </div>
                      <button
                        onClick={() => handleAllot(m.id, m.applicant_name)}
                        disabled={allottingId === m.id}
                        className="rounded-md bg-nnm-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
                      >
                        {allottingId === m.id ? "Allotting…" : "Allot"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">All Preferences</h2>
          <div className="mb-4 flex gap-2">
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

          {listError && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {listError}
            </div>
          )}

          {!preferences ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : preferences.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">No preferences here.</p>
          ) : (
            <div className="space-y-3">
              {preferences.map((p) => (
                <div key={p.id} className="rounded-md border border-slate-200 p-4 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{p.applicant_name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        p.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : p.status === "allotted"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Bid ₹{p.bid_amount}/mo · {p.min_area_sqft}-{p.max_area_sqft} sqft · Markets: {p.markets.join(", ")}
                  </p>
                  {p.allotted_shop_no && <p className="mt-1 text-xs text-green-700">Allotted shop: {p.allotted_shop_no}</p>}
                  {p.decision_notes && <p className="mt-1 text-xs text-slate-400">Note: {p.decision_notes}</p>}

                  {p.status === "pending" && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        value={rejectingId === p.id ? rejectNotes : ""}
                        onChange={(e) => {
                          setRejectingId(p.id);
                          setRejectNotes(e.target.value);
                        }}
                        placeholder="Reason to reject"
                        className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
                      />
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={rejectingId === p.id && !rejectNotes}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
