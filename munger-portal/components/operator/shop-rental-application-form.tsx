"use client";

import { useState } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { submitRentalApplication, type RentalApplicationInput } from "@/lib/shop-api";
import { sanitizeHoldingNoInput } from "@/lib/holding-no";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export function ShopRentalApplicationForm({
  shopNo,
  onSubmitted,
}: {
  shopNo: string;
  onSubmitted: (applicationId: number) => void;
}) {
  const [form, setForm] = useState<RentalApplicationInput>({
    shopNo,
    applicantName: "",
    applicantRelationType: "",
    applicantRelationName: "",
    applicantMobile: "",
    applicantAddress: "",
    applicantIdProofNumber: "",
    applicantBusinessName: "",
    proposedMonthlyRent: 0,
    applicantPropertyHoldingNo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  function update<K extends keyof RentalApplicationInput>(key: K, value: RentalApplicationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.applicantName.trim()) {
      setError("Applicant name is required.");
      return;
    }
    if (!form.proposedMonthlyRent) {
      setError("Proposed monthly rent is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitRentalApplication({
        ...form,
        applicantRelationType: form.applicantRelationType || null,
        applicantRelationName: form.applicantRelationName || null,
        applicantMobile: form.applicantMobile || null,
        applicantAddress: form.applicantAddress || null,
        applicantIdProofNumber: form.applicantIdProofNumber || null,
        applicantBusinessName: form.applicantBusinessName || null,
        applicantPropertyHoldingNo: form.applicantPropertyHoldingNo || null,
      });
      setResult(res.applicationId);
      onSubmitted(res.applicationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result !== null) {
    return (
      <div role="status" className="flex items-start gap-2.5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Application submitted (request #{result})</p>
          <p className="text-blue-700">
            Now goes through Stall Prabhari → Tax Daroga (NOC — checks the applicant&apos;s own property tax dues) →
            City Manager → Deputy Commissioner → Commissioner. The agreement is created automatically once fully
            approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Applicant Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Applicant name</label>
            <input required value={form.applicantName} onChange={(e) => update("applicantName", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Mobile number</label>
            <input value={form.applicantMobile ?? ""} onChange={(e) => update("applicantMobile", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Relation type</label>
            <select value={form.applicantRelationType ?? ""} onChange={(e) => update("applicantRelationType", e.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="S/O">S/O</option>
              <option value="D/O">D/O</option>
              <option value="W/O">W/O</option>
              <option value="C/O">C/O</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Relation name (father/husband)</label>
            <input value={form.applicantRelationName ?? ""} onChange={(e) => update("applicantRelationName", e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input value={form.applicantAddress ?? ""} onChange={(e) => update("applicantAddress", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>ID proof number</label>
            <input value={form.applicantIdProofNumber ?? ""} onChange={(e) => update("applicantIdProofNumber", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Proposed business name</label>
            <input
              value={form.applicantBusinessName ?? ""}
              onChange={(e) => update("applicantBusinessName", e.target.value)}
              placeholder="What they intend to run in the shop"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Applicant&apos;s Own Property (for Tax Daroga&apos;s check)</h2>
        <p className="mb-4 text-xs text-slate-500">
          If the applicant owns property in NNM, enter their holding number — Tax Daroga will see their live property
          tax status directly when reviewing this application.
        </p>
        <input
          value={form.applicantPropertyHoldingNo ?? ""}
          onChange={(e) => update("applicantPropertyHoldingNo", sanitizeHoldingNoInput(e.target.value))}
          placeholder="e.g. MUNG-08257 (leave blank if not applicable)"
          className={inputClass}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Proposed Terms</h2>
        <div>
          <label className={labelClass}>Proposed monthly rent (₹)</label>
          <input
            required
            type="number"
            min="0"
            value={form.proposedMonthlyRent || ""}
            onChange={(e) => update("proposedMonthlyRent", Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-nnm-blue py-3 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {submitting ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}