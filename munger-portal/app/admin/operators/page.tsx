"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { fetchOperators, setOperatorActive, type OperatorSummary } from "@/lib/admin-api";

export default function AdminOperatorsPage() {
  const admin = useAdminGuard();
  const [operators, setOperators] = useState<OperatorSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!admin) return;
    fetchOperators()
      .then(setOperators)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load operators."));
  }, [admin]);

  async function handleToggle(op: OperatorSummary) {
    setUpdatingId(op.id);
    setError(null);
    try {
      const updated = await setOperatorActive(op.id, !op.active);
      setOperators((ops) => ops!.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update operator status.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Operators</h1>
        <p className="mb-6 text-sm text-slate-500">
          Deactivating an operator immediately blocks them from logging in — it doesn&apos;t undo anything they&apos;ve already saved.
        </p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!operators ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => (
                  <tr key={op.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{op.display_name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{op.username}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          op.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {op.active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggle(op)}
                        disabled={updatingId === op.id}
                        className={`rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                          op.active
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {updatingId === op.id ? "…" : op.active ? "Deactivate" : "Activate"}
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