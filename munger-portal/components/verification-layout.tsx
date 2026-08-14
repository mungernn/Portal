"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { PortalBrandingHeader } from "@/components/portal-branding-header";

export function VerificationLayout({
  loading,
  error,
  title,
  children,
}: {
  loading: boolean;
  error: string | null;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 via-white to-white">
      <PortalBrandingHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </div>
          ) : error ? (
            <div role="alert" className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Could not verify this document</p>
                <p className="mt-1 text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <div role="status" className="mb-5 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm font-semibold text-green-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Verified Genuine — Munger Nagar Nigam
              </div>
              <h1 className="mb-4 text-lg font-semibold text-slate-900">{title}</h1>
              <dl className="space-y-3">{children}</dl>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export function VerificationField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5 text-sm last:border-0">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}