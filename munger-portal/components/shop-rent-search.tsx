"use client";

import { useState } from "react";
import { AlertCircle, SearchX } from "lucide-react";
import { ShopRentSearchForm } from "@/components/shop-rent-search-form";
import { ShopRentResultCard } from "@/components/shop-rent-result-card";
import { lookupShopRent, type ShopRentRecord } from "@/lib/shop-rent-tax";

type Status = "idle" | "loading" | "success" | "empty" | "error";

export function ShopRentSearch() {
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<ShopRentRecord[]>([]);
  const [lastQuery, setLastQuery] = useState("");

  async function handleSearch(shopNo: string, mobileNo: string) {
    setStatus("loading");
    setLastQuery(shopNo);
    try {
      const records = await lookupShopRent(shopNo, mobileNo);
      setResults(records);
      setStatus(records.length === 0 ? "empty" : "success");
    } catch {
      setResults([]);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <ShopRentSearchForm onSearch={handleSearch} loading={status === "loading"} />

      {status === "error" && (
        <div role="alert" className="flex items-start gap-3 rounded-[10px] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>Something went wrong while searching. Please try again in a moment.</span>
        </div>
      )}

      {status === "empty" && (
        <div className="flex items-start gap-3 rounded-[10px] border border-line bg-card p-5 text-sm text-ink-soft">
          <SearchX className="mt-0.5 h-5 w-5 shrink-0 text-ganga-teal" />
          <span>
            No matching shop found for shop number <span className="font-mono text-ink">&ldquo;{lastQuery}&rdquo;</span>.
            Please double-check both the shop number and the registered mobile number, or visit your ward office
            for help.
          </span>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-5">
          <p className="text-sm text-ink-soft">
            {results.length} {results.length === 1 ? "result" : "results"} found for &ldquo;{lastQuery}&rdquo;
          </p>
          {results.map((record) => (
            <ShopRentResultCard key={record.shopNo} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}