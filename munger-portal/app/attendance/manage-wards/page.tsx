"use client";

import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { useAttendanceGuard } from "@/lib/use-attendance-guard";
import { fetchAttendanceWardsWithUsage, deleteAttendanceWard, deleteAllUnusedWards, type AttendanceWardUsage } from "@/lib/attendance-api";

export default function ManageWardsPage() {
  const user = useAttendanceGuard(["attendance_admin"]);

  const [wards, setWards] = useState<AttendanceWardUsage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function loadWards() {
    try {
      setWards(await fetchAttendanceWardsWithUsage());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load ward usage.");
    }
  }

  useEffect(() => {
    if (!user) return;
    loadWards();
  }, [user]);

  async function handleDeleteOne(w: AttendanceWardUsage) {
    setError(null);
    if (!window.confirm(`Permanently delete the ward "${w.wardName}"? This cannot be undone.`)) return;
    setDeletingId(w.id);
    try {
      await deleteAttendanceWard(w.id);
      await loadWards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this ward.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteAllUnused() {
    setError(null);
    const unusedCount = (wards ?? []).filter((w) => w.usageCount === 0).length;
    if (unusedCount === 0) return;
    if (
      !window.confirm(
        `Permanently delete all ${unusedCount} ward(s) with zero references (shown in the "Unused" section below)? This cannot be undone.`,
      )
    )
      return;
    setBulkDeleting(true);
    try {
      await deleteAllUnusedWards();
      await loadWards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete unused wards.");
    } finally {
      setBulkDeleting(false);
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  const unusedWards = (wards ?? []).filter((w) => w.usageCount === 0);
  const usedWards = (wards ?? []).filter((w) => w.usageCount > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AttendanceHeader user={user} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Manage Wards</h1>
        <p className="mb-6 text-sm text-slate-500">
          Wards are shared across attendance, fleet, street lights, and pyau. A ward can only be deleted once nothing references it
          anywhere in the system - useful for cleaning up garbage wards a badly-formatted CSV bulk upload may have auto-created.
        </p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!wards ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <section className="mb-8 rounded-xl border border-red-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Unused Wards ({unusedWards.length})
                </h2>
                {unusedWards.length > 0 && (
                  <button
                    onClick={handleDeleteAllUnused}
                    disabled={bulkDeleting}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {bulkDeleting ? "Deleting..." : `Delete All ${unusedWards.length} Unused Wards`}
                  </button>
                )}
              </div>
              {unusedWards.length === 0 ? (
                <p className="text-sm text-slate-400">No unused wards found - nothing to clean up.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200">
                  <table className="w-full text-sm">
                    <tbody>
                      {unusedWards.map((w) => (
                        <tr key={w.id} className="border-b border-slate-100 last:border-0">
                          <td className="px-3 py-2">{w.wardName}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => handleDeleteOne(w)}
                              disabled={deletingId === w.id}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              {deletingId === w.id ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Active Wards ({usedWards.length})
              </h2>
              <p className="mb-3 text-xs text-slate-500">These wards have at least one record referencing them and cannot be deleted.</p>
              <div className="max-h-96 overflow-y-auto rounded-md border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2 font-medium">Ward</th>
                      <th className="px-3 py-2 font-medium">Records Referencing It</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usedWards.map((w) => (
                      <tr key={w.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2">{w.wardName}</td>
                        <td className="px-3 py-2 text-slate-500">{w.usageCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
