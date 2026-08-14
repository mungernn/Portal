"use client";

import { useState } from "react";
import { OperatorHeader } from "@/components/operator-header";
import { TradeLicenseApplicationForm, TradeLicenseSubmitSuccess } from "@/components/trade-license-application-form";
import { useOperatorGuard } from "@/lib/use-operator-guard";
import type { SubmitResult } from "@/lib/trade-license-api";

export default function TradeLicenseNewEntryPage() {
  const operator = useOperatorGuard();
  const [result, setResult] = useState<SubmitResult | null>(null);

  if (!operator) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OperatorHeader operator={operator} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Record Offline Trade License Application</h1>
        <p className="mb-6 text-sm text-slate-500">
          For an application received on paper — this goes through the same 3-stage approval chain as an online
          submission.
        </p>

        {result ? (
          <div className="space-y-4">
            <TradeLicenseSubmitSuccess result={result} />
            <button
              onClick={() => setResult(null)}
              className="rounded-md bg-nnm-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark"
            >
              Record Another Application
            </button>
          </div>
        ) : (
          <TradeLicenseApplicationForm mode="operator" onSubmitted={setResult} />
        )}
      </main>
    </div>
  );
}