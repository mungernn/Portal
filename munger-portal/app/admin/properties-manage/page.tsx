"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { renumberHolding, fixHoldingNoSpaces, type SpaceRemovalResult } from "@/lib/admin-api";

/** Commissioner-only holding renumber - for correcting a holding accidentally created under a number that turned out to already belong to a different, not-yet-migrated holding. */
export default function PropertiesManagePage() {
  const admin = useAdminGuard();
  const [holdingNo, setHoldingNo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [spaceFixResult, setSpaceFixResult] = useState<SpaceRemovalResult | null>(null);
  const [spaceFixError, setSpaceFixError] = useState<string | null>(null);
  const [spaceFixRunning, setSpaceFixRunning] = useState(false);

  async function handleFixSpaces() {
    if (!window.confirm("Fix holding numbers with a stray space (e.g. \"MUNG- 12345\" → \"MUNG-12345\")? This only touches holding_no, never the old holding number. This cannot be undone.")) {
      return;
    }
    setSpaceFixError(null);
    setSpaceFixResult(null);
    setSpaceFixRunning(true);
    try {
      setSpaceFixResult(await fixHoldingNoSpaces());
    } catch (err) {
      setSpaceFixError(err instanceof Error ? err.message : "Could not fix holding numbers.");
    } finally {
      setSpaceFixRunning(false);
    }
  }

  async function handleRenumber() {
    const trimmed = holdingNo.trim();
    if (!trimmed) return;
    if (!window.confirm(`Renumber holding ${trimmed} to a new, auto-assigned number? This moves all its floors, tax history, demand notices, and payment receipts to the new number. This cannot be undone.`)) {
      return;
    }
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const { newHoldingNo } = await renumberHolding(trimmed);
      setResult(`Holding ${trimmed} is now ${newHoldingNo}.`);
      setHoldingNo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not renumber this holding.");
    } finally {
      setSubmitting(false);
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
            Renumbering a holding is restricted to the Municipal Commissioner.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Renumber Holding</h1>
        <p className="mb-6 text-sm text-slate-500">
          Moves a holding to a fresh, auto-assigned number in its own series (MMC- or MUNGMC-). Use this to fix a holding
          that was accidentally created under a number that turns out to already belong to a different, not-yet-migrated
          holding - everything tied to it (floors, tax history, demand notices, payment receipts) moves with it.
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {result && (
            <div role="status" className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {result}
            </div>
          )}
          {error && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <label className="mb-1.5 block text-sm font-medium text-slate-700">Holding number to renumber</label>
          <div className="flex gap-2">
            <input
              value={holdingNo}
              onChange={(e) => setHoldingNo(e.target.value)}
              placeholder="e.g. MMC-0000001"
              className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
            />
            <button
              onClick={handleRenumber}
              disabled={submitting || !holdingNo.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-nnm-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {submitting ? "Renumbering…" : "Renumber"}
            </button>
          </div>
        </div>

        <h2 className="mb-1 mt-8 text-lg font-semibold text-slate-900">Fix Holding Numbers With a Stray Space</h2>
        <p className="mb-6 text-sm text-slate-500">
          Some holdings imported from a backup ended up with a space in their holding number (e.g. &quot;MUNG- 12345&quot;
          instead of &quot;MUNG-12345&quot;), making them impossible to find by search. This fixes every affected holding at
          once - only <span className="font-mono">holding_no</span> is touched, never the old holding number.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <button
            onClick={handleFixSpaces}
            disabled={spaceFixRunning}
            className="inline-flex items-center gap-2 rounded-md bg-nnm-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {spaceFixRunning ? "Fixing…" : "Fix All Holding Numbers With Spaces"}
          </button>

          {spaceFixError && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {spaceFixError}
            </div>
          )}

          {spaceFixResult && (
            <div className="mt-4 space-y-3">
              <div role="status" className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Fixed {spaceFixResult.fixed.length} holding(s).
              </div>
              {spaceFixResult.fixed.length > 0 && (
                <details className="rounded-md border border-slate-200 p-3 text-xs text-slate-600">
                  <summary className="cursor-pointer font-semibold text-slate-700">View fixed holdings</summary>
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono">
                    {spaceFixResult.fixed.map((f, i) => (
                      <li key={i}>
                        {f.from} → {f.to}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {spaceFixResult.skipped.length > 0 && (
                <details className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <summary className="cursor-pointer font-semibold">{spaceFixResult.skipped.length} skipped - needs manual review</summary>
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {spaceFixResult.skipped.map((s, i) => (
                      <li key={i}>
                        <span className="font-mono">{s.holdingNo}</span>: {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
