"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Upload } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { uploadShopsCsv, type ShopCsvImportResult } from "@/lib/admin-shop-api";

export default function ShopsBulkUploadPage() {
  const admin = useAdminGuard();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ShopCsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await uploadShopsCsv(text);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  if (admin.role !== "commissioner") {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminHeader admin={admin} />
        <main className="mx-auto max-w-2xl px-6 py-10">
          <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            This bulk upload is restricted to the Municipal Commissioner.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Bulk Upload Shops</h1>
        <p className="mb-6 text-sm text-slate-500">
          Upload shop and current-tenancy data in one CSV. A row with no Holder Name is created as a vacant shop; a row with one
          also creates its agreement. Existing shop numbers are skipped, not overwritten.
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <details className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-700">Expected CSV columns (matched by header name)</summary>
            <p className="mt-2 font-medium text-slate-700">Shop details</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Shop No - required, must be unique</li>
              <li>Market Name</li>
              <li>Location - required</li>
              <li>Ward</li>
              <li>Area Sqft, Total Area Sqft, Built Up Area Sqft</li>
            </ul>
            <p className="mt-3 font-medium text-slate-700">Tenancy (leave Holder Name blank for a vacant shop)</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>
                Holder Name and Base Monthly Rent - if a Holder Name is present the shop is marked occupied, but these two
                values are <strong>not</strong> applied to the agreement directly - they&apos;re recorded as a pending-review
                note instead, since there was no clarity on which of possibly several conflicting name/rent sources should be
                treated as official. Someone reviews and confirms these on the shop before any demand can be generated.
              </li>
              <li>Agreement Number, Agreement Holder Name, Demand Register Holder Name, Agreement Rent, Demand Register Rent - reference values only, all optional</li>
              <li>Holder Relation Type (S/O, D/O, W/O, C/O), Holder Relation Name, Holder Mobile, Holder Address, ID Proof Number, Business Name</li>
              <li>
                <strong>Rent Pre-2019, Rent 2019-20, Rent 2020-21 Onwards</strong> - fill in only ONE of these three; the system
                derives the other two automatically (25% increase at 2019-20, a further 50% from 2020-21)
              </li>
              <li>Agreement Start Date, Agreement End Date (yyyy-mm-dd)</li>
              <li>Security Deposit, Misc Cost, Misc Cost Reason, Misc Rebate, Misc Rebate Reason</li>
              <li>Joint Holder Name, Joint Holder Relation, Joint Holder ID Proof Number, Notes</li>
              <li>Rent Paid Till Month (yyyy-mm) - important for calculating what&apos;s currently pending</li>
            </ul>
          </details>

          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Upload className="h-4 w-4" />
            CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelected}
            disabled={uploading}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-nnm-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-nnm-blue-dark disabled:opacity-60"
          />

          {uploading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing upload - this may take a moment for large files...
            </div>
          )}
          {error && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {result && (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="mb-2 font-semibold text-slate-700">
                Created {result.shopsCreated} shop(s) and {result.agreementsCreated} agreement(s).
              </p>
              {result.errors.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-amber-700">{result.errors.length} row(s) skipped or flagged:</p>
                  <ul className="max-h-48 list-inside list-disc space-y-0.5 overflow-y-auto text-xs text-amber-700">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
