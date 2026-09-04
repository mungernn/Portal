"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import {
  renumberHolding,
  renameHolding,
  deletePropertyHolding,
  fixHoldingNoSpaces,
  fetchSpacedHoldings,
  bulkDeleteSpacedHoldings,
  removeDuplicateFloors,
  type SpaceRemovalResult,
  type SpacedHoldingPreview,
  type BulkDeleteResult,
  type DuplicateFloorsCleanupResult,
} from "@/lib/admin-api";

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

  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [renameResult, setRenameResult] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSubmitting, setRenameSubmitting] = useState(false);

  const [deleteHoldingNo, setDeleteHoldingNo] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [spacedList, setSpacedList] = useState<SpacedHoldingPreview[] | null>(null);
  const [spacedListLoading, setSpacedListLoading] = useState(false);
  const [spacedListError, setSpacedListError] = useState<string | null>(null);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<BulkDeleteResult | null>(null);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteRunning, setBulkDeleteRunning] = useState(false);

  const [floorsCleanupResult, setFloorsCleanupResult] = useState<DuplicateFloorsCleanupResult | null>(null);
  const [floorsCleanupError, setFloorsCleanupError] = useState<string | null>(null);
  const [floorsCleanupRunning, setFloorsCleanupRunning] = useState(false);

  async function handleLoadSpacedHoldings() {
    setSpacedListError(null);
    setSpacedListLoading(true);
    try {
      setSpacedList(await fetchSpacedHoldings());
    } catch (err) {
      setSpacedListError(err instanceof Error ? err.message : "Could not load spaced holdings.");
    } finally {
      setSpacedListLoading(false);
    }
  }

  async function handleBulkDeleteSpaced() {
    if (!spacedList || spacedList.length === 0) return;
    if (!window.confirm(`Delete ${spacedList.length} holding(s) with a space in their number? Any with an actual payment on file will be skipped, not deleted. This cannot be undone.`)) {
      return;
    }
    setBulkDeleteError(null);
    setBulkDeleteResult(null);
    setBulkDeleteRunning(true);
    try {
      const result = await bulkDeleteSpacedHoldings();
      setBulkDeleteResult(result);
      setSpacedList(null);
    } catch (err) {
      setBulkDeleteError(err instanceof Error ? err.message : "Could not delete these holdings.");
    } finally {
      setBulkDeleteRunning(false);
    }
  }

  async function handleRemoveDuplicateFloors() {
    if (!window.confirm("Remove exact-duplicate floor rows left over from a re-uploaded bulk import? This cannot be undone.")) {
      return;
    }
    setFloorsCleanupError(null);
    setFloorsCleanupResult(null);
    setFloorsCleanupRunning(true);
    try {
      setFloorsCleanupResult(await removeDuplicateFloors());
    } catch (err) {
      setFloorsCleanupError(err instanceof Error ? err.message : "Could not remove duplicate floors.");
    } finally {
      setFloorsCleanupRunning(false);
    }
  }

  async function handleRename() {
    const from = renameFrom.trim();
    const to = renameTo.trim();
    if (!from || !to) return;
    if (!window.confirm(`Rename holding ${from} to ${to}? This moves all its floors, tax history, demand notices, and payment receipts to the new number. This cannot be undone.`)) {
      return;
    }
    setRenameError(null);
    setRenameResult(null);
    setRenameSubmitting(true);
    try {
      const res = await renameHolding(from, to);
      setRenameResult(`Renamed ${from} to ${res.newHoldingNo}.`);
      setRenameFrom("");
      setRenameTo("");
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Could not rename this holding.");
    } finally {
      setRenameSubmitting(false);
    }
  }

  async function handleDelete() {
    const trimmed = deleteHoldingNo.trim();
    if (!trimmed || deleteConfirmation.trim() !== trimmed) return;
    setDeleteError(null);
    setDeleteResult(null);
    setDeleteSubmitting(true);
    try {
      await deletePropertyHolding(trimmed, deleteConfirmation.trim());
      setDeleteResult(`Deleted holding ${trimmed}.`);
      setDeleteHoldingNo("");
      setDeleteConfirmation("");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete this holding.");
    } finally {
      setDeleteSubmitting(false);
    }
  }

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

        <h2 className="mb-1 mt-8 text-lg font-semibold text-slate-900">Rename Holding to a Specific Number</h2>
        <p className="mb-6 text-sm text-slate-500">
          For correcting a data-entry mistake where a holding was given the wrong number entirely (e.g. a typo like
          &quot;MUNG-14582&quot; that should have been &quot;MUNG-14882&quot;) - unlike Renumber above, you choose the exact
          target number.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Current holding number</label>
              <input
                value={renameFrom}
                onChange={(e) => setRenameFrom(e.target.value)}
                placeholder="e.g. MUNG- 14582"
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">New holding number</label>
              <input
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value)}
                placeholder="e.g. MUNG-14882"
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
              />
            </div>
            <button
              onClick={handleRename}
              disabled={renameSubmitting || !renameFrom.trim() || !renameTo.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-nnm-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              {renameSubmitting ? "Renaming…" : "Rename"}
            </button>
          </div>
          {renameError && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {renameError}
            </div>
          )}
          {renameResult && (
            <div role="status" className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {renameResult}
            </div>
          )}
        </div>

        <h2 className="mb-1 mt-8 text-lg font-semibold text-slate-900">Delete a Holding</h2>
        <p className="mb-6 text-sm text-slate-500">
          For a duplicate or wrongly-entered holding with materially incorrect data - not for a holding that&apos;s
          actually been assessed. An issued-but-unpaid demand notice doesn&apos;t block deletion (it&apos;s removed along
          with everything else); an actual payment on file does. Type the holding number to confirm.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Holding number to delete</label>
              <input
                value={deleteHoldingNo}
                onChange={(e) => setDeleteHoldingNo(e.target.value)}
                placeholder="e.g. MUNG-11608"
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Type the holding number to confirm</label>
              <input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              />
            </div>
            <button
              onClick={handleDelete}
              disabled={deleteSubmitting || !deleteHoldingNo.trim() || deleteConfirmation.trim() !== deleteHoldingNo.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Delete
            </button>
          </div>
          {deleteError && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {deleteError}
            </div>
          )}
          {deleteResult && (
            <div role="status" className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {deleteResult}
            </div>
          )}
        </div>

        <h2 className="mb-1 mt-8 text-lg font-semibold text-slate-900">Clean Up an Accidental Re-upload</h2>
        <p className="mb-6 text-sm text-slate-500">
          If a bulk-import file was re-uploaded after some of its holdings were already space-fixed, the exact-match check
          used at the time wouldn&apos;t have recognized them as already existing, and would have created fresh spaced
          duplicates. Review and delete those here.
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <button
            onClick={handleLoadSpacedHoldings}
            disabled={spacedListLoading}
            className="inline-flex items-center gap-2 rounded-md border border-nnm-blue px-4 py-2.5 text-sm font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
          >
            {spacedListLoading ? "Loading…" : "Review Holdings With a Space"}
          </button>

          {spacedListError && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {spacedListError}
            </div>
          )}

          {spacedList && (
            <div className="mt-4">
              {spacedList.length === 0 ? (
                <p className="text-sm text-slate-400">No holdings with a space in their number - nothing to clean up.</p>
              ) : (
                <>
                  <div className="mb-3 max-h-64 overflow-y-auto rounded-md border border-slate-200">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-3 py-2 font-medium">Holding No</th>
                          <th className="px-3 py-2 font-medium">Owner</th>
                          <th className="px-3 py-2 font-medium">Created</th>
                          <th className="px-3 py-2 font-medium">Payments?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spacedList.map((h) => (
                          <tr key={h.holdingNo} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-mono">{h.holdingNo}</td>
                            <td className="px-3 py-2">{h.ownerName}</td>
                            <td className="px-3 py-2">{new Date(h.createdDate).toLocaleDateString("en-IN")}</td>
                            <td className="px-3 py-2">
                              {h.hasPayments ? <span className="font-semibold text-red-600">Yes - will be skipped</span> : "No"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={handleBulkDeleteSpaced}
                    disabled={bulkDeleteRunning}
                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {bulkDeleteRunning ? "Deleting…" : `Delete All ${spacedList.length} Holding(s) Above`}
                  </button>
                </>
              )}
            </div>
          )}

          {bulkDeleteError && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {bulkDeleteError}
            </div>
          )}
          {bulkDeleteResult && (
            <div className="mt-4 space-y-2">
              <div role="status" className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Deleted {bulkDeleteResult.deleted.length} holding(s).
              </div>
              {bulkDeleteResult.skipped.length > 0 && (
                <details className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <summary className="cursor-pointer font-semibold">{bulkDeleteResult.skipped.length} skipped - needs case-by-case review</summary>
                  <ul className="mt-2 space-y-1">
                    {bulkDeleteResult.skipped.map((s, i) => (
                      <li key={i}>
                        <span className="font-mono">{s.holdingNo}</span>: {s.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <p className="mb-3 text-sm text-slate-500">
              Separately, a re-upload can also leave exact-duplicate floor rows behind on holdings that weren&apos;t
              themselves duplicated.
            </p>
            <button
              onClick={handleRemoveDuplicateFloors}
              disabled={floorsCleanupRunning}
              className="inline-flex items-center gap-2 rounded-md border border-nnm-blue px-4 py-2.5 text-sm font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
            >
              {floorsCleanupRunning ? "Cleaning…" : "Remove Duplicate Floor Rows"}
            </button>
            {floorsCleanupError && (
              <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {floorsCleanupError}
              </div>
            )}
            {floorsCleanupResult && (
              <div role="status" className="mt-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Removed {floorsCleanupResult.rowsDeleted} duplicate floor row(s) across {floorsCleanupResult.affectedHoldings.length} holding(s).
              </div>
            )}
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
