"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import { fetchViolationNotices, issueViolationNotice, type ViolationNotice } from "@/lib/shop-api";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

const statusStyles: Record<ViolationNotice["status"], string> = {
  issued: "bg-red-50 text-red-700 border-red-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  escalated: "bg-amber-50 text-amber-700 border-amber-200",
};

export function ShopViolationNotices({ shopNo }: { shopNo: string }) {
  const [notices, setNotices] = useState<ViolationNotice[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetchViolationNotices(shopNo)
      .then((res) => {
        setNotices(res.notices);
        setCategories(res.suggestedCategories);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load notices."));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopNo]);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!category || !description.trim()) {
      setError("Both a category and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      await issueViolationNotice(shopNo, { violationCategory: category, description });
      setCategory("");
      setDescription("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not issue notice.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Violation Notices</h2>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleIssue} className="mb-6 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
          {submitting ? "Issuing…" : "Issue Notice"}
        </button>
      </form>

      {!notices && <p className="text-sm text-slate-400">Loading…</p>}
      {notices && notices.length === 0 && <p className="text-sm text-slate-500">No violation notices on file for this shop.</p>}
      {notices && notices.length > 0 && (
        <ul className="space-y-2">
          {notices.map((n) => (
            <li key={n.id} className={`rounded-md border p-3 text-sm ${statusStyles[n.status]}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{n.violation_category}</span>
                <span className="text-xs uppercase tracking-wide">{n.status}</span>
              </div>
              <p className="mt-1">{n.description}</p>
              <p className="mt-1 text-xs opacity-75">
                Issued by {n.issued_by} on {new Date(n.issued_date).toLocaleDateString("en-IN")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}