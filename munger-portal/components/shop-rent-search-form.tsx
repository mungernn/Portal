"use client";

import { useId, useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";

export interface ShopRentSearchFormProps {
  onSearch: (shopNo: string, mobileNo: string) => void;
  loading?: boolean;
}

export function ShopRentSearchForm({ onSearch, loading = false }: ShopRentSearchFormProps) {
  const shopId = useId();
  const mobileId = useId();
  const errorId = `${shopId}-error`;

  const [shopValue, setShopValue] = useState("");
  const [mobileValue, setMobileValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const shopTrimmed = shopValue.trim();
    const mobileTrimmed = mobileValue.trim();
    if (!shopTrimmed || !mobileTrimmed) {
      setError("Enter both the shop number and the registered mobile number to search.");
      return;
    }
    setError(null);
    onSearch(shopTrimmed, mobileTrimmed);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="rounded-[10px] border border-line bg-card p-6 sm:p-7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={shopId} className="mb-1.5 block text-sm font-medium text-ink">
            Shop number
          </label>
          <input
            id={shopId}
            type="text"
            placeholder="e.g. SHOP-001"
            value={shopValue}
            onChange={(e) => setShopValue(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
          />
        </div>
        <div>
          <label htmlFor={mobileId} className="mb-1.5 block text-sm font-medium text-ink">
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
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        {loading ? "Searching…" : "Search"}
      </button>

      {error ? (
        <p id={errorId} className="mt-2 text-xs text-red-600">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-soft">
          Both the shop number and its registered mobile number are required, to keep your rent details private
          from anyone else.
        </p>
      )}
    </form>
  );
}