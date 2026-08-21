"use client";

import { useState } from "react";
import { AlertCircle, SearchX } from "lucide-react";
import { PropertySearchForm } from "@/components/property-search-form";
import { PropertyResultCard } from "@/components/property-result-card";
import { HoldingTaxContactFootnote } from "@/components/holding-tax-contact-footnote";
import {
  searchPropertyByHoldingNumber,
  type PropertyRecord,
  type PropertySearchOutcome,
} from "@/lib/property-tax";

type Status = "idle" | "loading" | "success" | "empty" | "error";

export function PropertyTaxSearch() {
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<PropertyRecord[]>([]);
  const [outcome, setOutcome] = useState<PropertySearchOutcome | null>(null);
  const [lastQuery, setLastQuery] = useState("");

  async function handleSearch(holdingNumber: string, mobileNumber: string) {
    setStatus("loading");
    setLastQuery(holdingNumber);
    try {
      const result = await searchPropertyByHoldingNumber(holdingNumber, mobileNumber);
      setResults(result.records);
      setOutcome(result);
      setStatus(result.records.length === 0 ? "empty" : "success");
    } catch {
      setResults([]);
      setOutcome(null);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-8">
      <PropertySearchForm onSearch={handleSearch} loading={status === "loading"} />

      {status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[10px] border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            Something went wrong while searching. Please try again in a
            moment.
          </span>
        </div>
      )}

      {status === "empty" && outcome?.notFoundReason === "mobile_mismatch" && (
        <div className="flex items-start gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <SearchX className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <span>
            The mobile number entered doesn&apos;t match our records for holding number{" "}
            <span className="font-mono text-ink">&ldquo;{lastQuery}&rdquo;</span>.
            {outcome.registeredMobileLastTwoDigits ? (
              <>
                {" "}
                The registered number ends in{" "}
                <span className="font-mono font-semibold text-ink">
                  &hellip;{outcome.registeredMobileLastTwoDigits}
                </span>
                .
              </>
            ) : null}{" "}
            If this still doesn&apos;t look right, please contact the Holding Tax Section at the Municipal
            Corporation Office, Munger.
          </span>
        </div>
      )}

      {status === "empty" && outcome?.notFoundReason !== "mobile_mismatch" && (
        <div className="flex items-start gap-3 rounded-[10px] border border-line bg-card p-5 text-sm text-ink-soft">
          <SearchX className="mt-0.5 h-5 w-5 shrink-0 text-ganga-teal" />
          <span>
            No matching property found for holding number{" "}
            <span className="font-mono text-ink">&ldquo;{lastQuery}&rdquo;</span>. Please contact the Holding
            Tax Section at the Municipal Corporation Office, Munger.
          </span>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-5">
          <p className="text-sm text-ink-soft">
            {results.length} {results.length === 1 ? "result" : "results"}{" "}
            found for &ldquo;{lastQuery}&rdquo;
          </p>
          {results.map((record) => (
            <PropertyResultCard key={record.propertyId} record={record} />
          ))}
        </div>
      )}

      <HoldingTaxContactFootnote />
    </div>
  );
}