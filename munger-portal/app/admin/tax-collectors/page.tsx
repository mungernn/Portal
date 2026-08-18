"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2, UserPlus } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import {
  fetchTaxCollectors,
  createTaxCollectorAdmin,
  setTaxCollectorActiveAdmin,
  fetchAvailableWards,
  fetchTaxCollectorWards,
  setTaxCollectorWardsAdmin,
  type TaxCollectorSummary,
} from "@/lib/admin-api";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

function WardTagger({
  collector,
  canEdit,
  availableWards,
}: {
  collector: TaxCollectorSummary;
  canEdit: boolean;
  availableWards: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [wards, setWards] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!expanded || wards !== null) return;
    fetchTaxCollectorWards(collector.id)
      .then((w) => {
        setWards(w);
        setSelected(new Set(w));
      })
      .catch(() => setWards([]));
  }, [expanded, wards, collector.id]);

  function toggle(ward: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ward)) next.delete(ward);
      else next.add(ward);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await setTaxCollectorWardsAdmin(collector.id, Array.from(selected));
      setWards(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-nnm-blue hover:underline"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {canEdit ? "Manage Wards" : "View Wards"}
      </button>

      {expanded && (
        <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          {wards === null ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </div>
          ) : !canEdit ? (
            wards.length === 0 ? (
              <p className="text-xs text-slate-400">No wards tagged yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {wards.map((w) => (
                  <span key={w} className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-nnm-blue">
                    Ward {w}
                  </span>
                ))}
              </div>
            )
          ) : (
            <>
              {availableWards.length === 0 ? (
                <p className="text-xs text-slate-400">No wards found on any property yet.</p>
              ) : (
                <div className="mb-3 flex flex-wrap gap-2">
                  {availableWards.map((w) => (
                    <label
                      key={w}
                      className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        selected.has(w) ? "bg-nnm-blue text-white" : "border border-slate-300 text-slate-600"
                      }`}
                    >
                      <input type="checkbox" checked={selected.has(w)} onChange={() => toggle(w)} className="sr-only" />
                      Ward {w}
                    </label>
                  ))}
                </div>
              )}
              {saveError && <p className="mb-2 text-xs text-red-600">{saveError}</p>}
              {saved && (
                <p className="mb-2 flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved.
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-nnm-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Wards"}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default function AdminTaxCollectorsPage() {
  const admin = useAdminGuard();
  const [collectors, setCollectors] = useState<TaxCollectorSummary[] | null>(null);
  const [availableWards, setAvailableWards] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const canTagWards = admin?.role === "tax_daroga";

  useEffect(() => {
    if (!admin) return;
    fetchTaxCollectors()
      .then(setCollectors)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load tax collectors."));
    fetchAvailableWards()
      .then(setAvailableWards)
      .catch(() => setAvailableWards([]));
  }, [admin]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreated(false);
    setCreating(true);
    try {
      const collector = await createTaxCollectorAdmin(code.trim(), name.trim());
      setCollectors((prev) => [...(prev ?? []), collector].sort((a, b) => a.name.localeCompare(b.name)));
      setCode("");
      setName("");
      setCreated(true);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create tax collector.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(c: TaxCollectorSummary) {
    setUpdatingId(c.id);
    setError(null);
    try {
      const updated = await setTaxCollectorActiveAdmin(c.id, !c.active);
      setCollectors((list) => list!.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update tax collector status.");
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
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Tax Collectors</h1>
        <p className="mb-2 text-sm text-slate-500">
          Field agents who collect property tax on behalf of the Nigam. Their code is entered (optionally) at the
          time of payment, on both the operator counter and the citizen&apos;s online payment page — the backend
          checks that the collector is tagged for the property&apos;s ward before accepting it.
        </p>
        <p className="mb-6 text-xs text-slate-400">
          {canTagWards
            ? "You can tag wards to any collector below, since you're signed in as Tax Daroga."
            : "Ward tagging is managed by Tax Daroga — you can view tags here, but not change them."}
        </p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserPlus className="h-4 w-4" />
            Add Tax Collector
          </h2>

          {createError && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {createError}
            </div>
          )}
          {created && (
            <div role="status" className="mb-4 flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Tax collector added. Tag their wards below before they can be used for a payment.
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Code</label>
              <input required value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="e.g. TC001" />
            </div>
            <div>
              <label className={labelClass}>Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-md bg-nnm-blue py-3 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60 sm:w-auto sm:px-8"
              >
                {creating ? "Adding…" : "Add Tax Collector"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">All Tax Collectors</h2>
          {!collectors ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : collectors.length === 0 ? (
            <p className="text-sm text-slate-400">No tax collectors added yet.</p>
          ) : (
            <div className="space-y-3">
              {collectors.map((c) => (
                <div key={c.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-slate-500">{c.code}</span>
                      <span className="ml-2 font-medium text-slate-900">{c.name}</span>
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          c.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.active ? "Active" : "Deactivated"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggle(c)}
                      disabled={updatingId === c.id}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                        c.active
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {updatingId === c.id ? "…" : c.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>

                  <div className="mt-2">
                    <WardTagger collector={c} canEdit={canTagWards} availableWards={availableWards} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}