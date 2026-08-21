"use client";

import { useId, useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { sanitizeHoldingNoInput } from "@/lib/holding-no";

export interface PropertySearchFormProps {
  onSearch: (holdingNumber: string, mobileNumber: string) => void;
  loading?: boolean;
}

export function PropertySearchForm({
  onSearch,
  loading = false,
}: PropertySearchFormProps) {
  const holdingId = useId();
  const mobileId = useId();
  const errorId = `${holdingId}-error`;

  const [holdingValue, setHoldingValue] = useState("");
  const [mobileValue, setMobileValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const holdingTrimmed = holdingValue.trim();
    const mobileTrimmed = mobileValue.trim();
    if (!holdingTrimmed || !mobileTrimmed) {
      setError("Enter both the holding number and the registered mobile number to search.");
      return;
    }
    setError(null);
    onSearch(holdingTrimmed, mobileTrimmed);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-[10px] border border-line bg-card p-6 sm:p-7"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={holdingId}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Holding number
          </label>
          <input
            id={holdingId}
            type="text"
            placeholder="e.g. MUNG-08257"
            value={holdingValue}
            onChange={(e) => setHoldingValue(sanitizeHoldingNoInput(e.target.value))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
          />
        </div>
        <div>
          <label
            htmlFor={mobileId}
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Registered mobile number
          </label>
          <input
            id={mobileId}
            type="tel"
            placeholder="10-digit mobile number on file"
            value={mobileValue}
            onChange={(e) => setMobileValue(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-md bg-nnm-blue px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nnm-blue-dark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {loading ? "Searching…" : "Search"}
      </button>

      {error ? (
        <p id={errorId} className="mt-2 text-xs text-red-600">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-soft">
          Both the holding number and its registered mobile number are required, to keep your property details
          private from anyone else.
        </p>
      )}
    </form>
  );
}