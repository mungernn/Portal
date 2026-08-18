"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { lookupTaxCollectorByCode } from "@/lib/tax-collector";

/**
 * Optional field on both the operator's counter-payment form and the
 * citizen-facing payment page — records which tax collector (field
 * agent), if any, facilitated a given payment. Debounced so it doesn't
 * fire a lookup on every keystroke; resolves to the collector's name so
 * whoever's entering the code can confirm they typed it right before
 * submitting.
 */
export function TaxCollectorCodeInput({
  value,
  onChange,
  inputClassName,
  labelClassName,
}: {
  value: string;
  onChange: (code: string) => void;
  inputClassName: string;
  labelClassName: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "not-found" | "error">("idle");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const code = value.trim();
    if (!code) {
      setStatus("idle");
      setResolvedName(null);
      return;
    }

    setStatus("loading");
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await lookupTaxCollectorByCode(code);
        if (result) {
          setStatus("found");
          setResolvedName(result.name);
        } else {
          setStatus("not-found");
          setResolvedName(null);
        }
      } catch {
        setStatus("error");
        setResolvedName(null);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  return (
    <div>
      <label className={labelClassName}>Tax Collector Code (optional)</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Leave blank if not applicable"
        className={inputClassName}
      />
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {status === "loading" && (
          <span className="flex items-center gap-1 text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking…
          </span>
        )}
        {status === "found" && (
          <span className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            {resolvedName}
          </span>
        )}
        {status === "not-found" && (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="h-3 w-3" />
            No tax collector found with this code.
          </span>
        )}
        {status === "error" && <span className="text-slate-400">Could not check this code right now.</span>}
      </div>
    </div>
  );
}