"use client";

import { useState, type FormEvent } from "react";
import { Search, Plus } from "lucide-react";
import { sanitizeHoldingNoInput } from "@/lib/holding-no";

export function OperatorPropertySearch({
  onSearch,
  onNew,
  loading,
}: {
  onSearch: (holdingNo: string) => void;
  onNew: (holdingNo: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">Holding number</label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(sanitizeHoldingNoInput(e.target.value))}
          placeholder="e.g. MUNG-08257"
          className="w-full flex-1 rounded-md border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-nnm-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? "Searching…" : "Search"}
        </button>
        <button
          type="button"
          onClick={() => value.trim() && onNew(value.trim())}
          disabled={!value.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-nnm-blue px-5 py-2.5 text-sm font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          New entry
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Search an existing holding to edit it, or type a new holding number and click &ldquo;New entry&rdquo;.
      </p>
    </form>
  );
}