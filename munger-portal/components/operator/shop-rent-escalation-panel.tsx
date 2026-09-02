"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Plus, Trash2, History } from "lucide-react";
import {
  fetchEscalationPeriods,
  addEscalationPeriod,
  deleteEscalationPeriod,
  type ShopRentEscalationPeriod,
} from "@/lib/shop-api";

const inputClass =
  "w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";

/**
 * A shop's rent history as a sequence of periods - shows what's on
 * file, and lets whoever's reviewing the agreement add a new period
 * (which automatically closes out the previous open one) or delete a
 * mistaken entry. Nothing here is required - a shop with no periods
 * simply uses the older legacy rent fields/formula instead.
 */
export function ShopRentEscalationPanel({ shopNo }: { shopNo: string }) {
  const [periods, setPeriods] = useState<ShopRentEscalationPeriod[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [periodStartDate, setPeriodStartDate] = useState("");
  const [baseRent, setBaseRent] = useState("");
  const [escalationPercent, setEscalationPercent] = useState("");
  const [escalationIntervalYears, setEscalationIntervalYears] = useState("");
  const [sourceNote, setSourceNote] = useState("");

  function load() {
    fetchEscalationPeriods(shopNo)
      .then(setPeriods)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load rent history."));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopNo]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!periodStartDate || !baseRent || !sourceNote.trim()) {
      setError("Start date, base rent, and a source note are all required to add a period.");
      return;
    }
    if ((escalationPercent === "") !== (escalationIntervalYears === "")) {
      setError("Enter both an escalation percent and interval, or leave both blank if the terms aren't known yet.");
      return;
    }
    setSubmitting(true);
    try {
      await addEscalationPeriod(shopNo, {
        periodStartDate,
        baseRent: Number(baseRent),
        escalationPercent: escalationPercent ? Number(escalationPercent) : null,
        escalationIntervalYears: escalationIntervalYears ? Number(escalationIntervalYears) : null,
        sourceNote,
      });
      setPeriodStartDate("");
      setBaseRent("");
      setEscalationPercent("");
      setEscalationIntervalYears("");
      setSourceNote("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this period.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this rent period? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteEscalationPeriod(shopNo, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this period.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <History className="h-4 w-4" />
          Rent History (Escalation Periods)
        </h3>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1 text-xs font-semibold text-nnm-blue hover:underline">
          <Plus className="h-3.5 w-3.5" />
          {showForm ? "Cancel" : "Add Period"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Period start date</label>
              <input type="date" value={periodStartDate} onChange={(e) => setPeriodStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Base rent (₹)</label>
              <input type="number" min="0" value={baseRent} onChange={(e) => setBaseRent(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Escalation % (optional)</label>
              <input type="number" min="0" step="0.01" value={escalationPercent} onChange={(e) => setEscalationPercent(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Every N years (optional)</label>
              <input type="number" min="1" value={escalationIntervalYears} onChange={(e) => setEscalationIntervalYears(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Source (where this came from)</label>
            <input
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              placeholder="e.g. Agreement dated 12-Mar-2023, clause 4"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-nnm-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add Period"}
          </button>
        </form>
      )}

      {!periods ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : periods.length === 0 ? (
        <p className="text-xs text-slate-400">
          No rent periods on file yet - this shop uses the older rent fields/formula until periods are added here.
        </p>
      ) : (
        <div className="space-y-2">
          {periods.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-xs">
              <div>
                <p className="font-semibold text-slate-800">
                  ₹{p.base_rent} from {p.period_start_date.slice(0, 10)}
                  {p.period_end_date ? ` to ${p.period_end_date.slice(0, 10)}` : " (current)"}
                </p>
                <p className="text-slate-500">
                  {p.escalation_percent !== null
                    ? `+${p.escalation_percent}% every ${p.escalation_interval_years} year(s)`
                    : "Escalation terms not yet known - flagged for review"}
                </p>
                <p className="text-slate-400">{p.source_note}</p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                className="rounded-md p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                aria-label="Delete period"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
