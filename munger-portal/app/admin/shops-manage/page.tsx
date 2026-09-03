"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Search, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { fetchAllShopsForAdmin, deleteShopAdmin, type ShopSummaryForAllotment } from "@/lib/admin-shop-api";

/** Commissioner-only shop deletion - for correcting data-entry mistakes (a duplicate or wrongly-numbered shop), not for removing a shop that's actually been operating. Blocked server-side if the shop has any real financial/legal history. */
export default function ShopsManagePage() {
  const admin = useAdminGuard();
  const [shops, setShops] = useState<ShopSummaryForAllotment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingShopNo, setDeletingShopNo] = useState<string | null>(null);

  function load() {
    fetchAllShopsForAdmin()
      .then(setShops)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load shops."));
  }

  useEffect(() => {
    if (!admin) return;
    load();
  }, [admin]);

  async function handleDelete(shopNo: string) {
    if (!window.confirm(`Delete shop ${shopNo} completely? This cannot be undone, and only works if it has no payments, demands, or violation notices on file.`)) {
      return;
    }
    setError(null);
    setDeletingShopNo(shopNo);
    try {
      await deleteShopAdmin(shopNo);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this shop.");
    } finally {
      setDeletingShopNo(null);
    }
  }

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  if (admin.role !== "commissioner") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminHeader admin={admin} />
        <main className="mx-auto max-w-2xl px-6 py-10">
          <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Deleting shops is restricted to the Municipal Commissioner.
          </div>
        </main>
      </div>
    );
  }

  const filtered = shops?.filter(
    (s) =>
      !search.trim() ||
      s.shop_no.toLowerCase().includes(search.toLowerCase()) ||
      (s.market_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Manage Shops</h1>
        <p className="mb-6 text-sm text-slate-500">
          Delete a shop entered in error - a duplicate or wrongly-numbered entry. Blocked automatically if the shop has any
          rent payments, demand notices, or violation notices on file, since those are real municipal records.
        </p>

        <div className="mb-5 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shop number, market, or location"
            className="w-full text-sm outline-none"
          />
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!shops ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : filtered && filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No shops match.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Shop No</th>
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((s) => (
                  <tr key={s.shop_no} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs">{s.shop_no}</td>
                    <td className="px-4 py-3">{s.market_name ?? "-"}</td>
                    <td className="px-4 py-3">{s.location}</td>
                    <td className="px-4 py-3 text-xs capitalize text-slate-500">{s.status}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s.shop_no)}
                        disabled={deletingShopNo === s.shop_no}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingShopNo === s.shop_no ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
