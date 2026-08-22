"use client";

import { useState } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { OperatorHeader } from "@/components/operator-header";
import { useOperatorGuard } from "@/lib/use-operator-guard";
import { downloadReceiptsExport, type ReceiptExportRange } from "@/lib/operator-api";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function OperatorReceiptsPage() {
  const operator = useOperatorGuard();
  const [date, setDate] = useState(todayIso());
  const [downloading, setDownloading] = useState<ReceiptExportRange | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!operator) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  async function handleDownload(range: ReceiptExportRange) {
    setDownloading(range);
    setError(null);
    try {
      await downloadReceiptsExport(range, range === "overall" ? undefined : date);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OperatorHeader operator={operator} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Tax Receipt Data</h1>
        <p className="mb-8 text-sm text-slate-500">Download collected receipts as an Excel file.</p>

        {error && (
          <div role="alert" className="mb-6 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Date (for Daily / Monthly)</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            <p className="mt-1.5 text-xs text-slate-400">For monthly, any date within the target month works - only the year and month are used.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => handleDownload("daily")}
              disabled={downloading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {downloading === "daily" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Daily
            </button>
            <button
              onClick={() => handleDownload("monthly")}
              disabled={downloading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {downloading === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Monthly
            </button>
            <button
              onClick={() => handleDownload("overall")}
              disabled={downloading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-nnm-blue px-4 py-3 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
            >
              {downloading === "overall" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Overall
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
