"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  fetchVacantShops,
  submitPublicRentalApplication,
  type VacantShop,
  type PublicRentalApplicationInput,
} from "@/lib/nagar-nigam-shops";

const inputClass =
  "w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export default function ApplyForShopPage() {
  const [vacantShops, setVacantShops] = useState<VacantShop[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<PublicRentalApplicationInput>({
    shopNo: "",
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

  useEffect(() => {
    fetchVacantShops()
      .then(setVacantShops)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load vacant shops."));
  }, []);

  function update<K extends keyof PublicRentalApplicationInput>(key: K, value: PublicRentalApplicationInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.shopNo) {
      setError("Select a vacant shop to apply for.");
      return;
    }
    if (!form.applicantName.trim()) {
      setError("Your name is required.");
      return;
    }
    if (!form.proposedMonthlyRent) {
      setError("Proposed monthly rent is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitPublicRentalApplication({
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="bg-gradient-to-br from-nnm-blue to-nnm-blue-dark py-16 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <span className="mb-2.5 block font-mono text-[12.5px] uppercase tracking-[0.14em] text-nnm-gold">
              Nagar Nigam Shops
            </span>
            <h1 className="mb-3 font-display text-3xl font-semibold sm:text-4xl">Apply for a New Rental Shop</h1>
            <p className="max-w-xl text-[17px] text-white/80">
              Browse currently vacant municipal shops and submit your application below.
            </p>
          </div>
        </section>

        <section className="bg-paper-dim py-14">
          <div className="mx-auto max-w-2xl px-6">
            {result !== null ? (
              <div role="status" className="flex items-start gap-3 rounded-[10px] border border-green-200 bg-green-50 p-6 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Application submitted — reference #{result}</p>
                  <p className="mt-1 text-green-700">
                    Your application will be reviewed by NNM (Stall Prabhari, Tax Daroga, City Manager, Deputy
                    Commissioner, and Municipal Commissioner). You can check on its status at your ward office using
                    this reference number.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {loadError && (
                  <div role="alert" className="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {loadError}
                  </div>
                )}
                {error && (
                  <div role="alert" className="mb-5 flex items-center gap-2 rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mb-6 rounded-[10px] border border-line bg-card p-6">
                  <h2 className="mb-1 text-base font-semibold text-ink">1. Select a vacant shop</h2>
                  {!vacantShops ? (
                    <div className="flex items-center gap-2 py-3 text-sm text-ink-soft">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading vacant shops…
                    </div>
                  ) : vacantShops.length === 0 ? (
                    <p className="py-2 text-sm text-ink-soft">No vacant shops available right now. Please check back later.</p>
                  ) : (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {vacantShops.map((s) => (
                        <label
                          key={s.shopNo}
                          className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${
                            form.shopNo === s.shopNo ? "border-nnm-blue bg-blue-50" : "border-line bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="shopNo"
                            value={s.shopNo}
                            checked={form.shopNo === s.shopNo}
                            onChange={(e) => update("shopNo", e.target.value)}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block font-mono font-semibold text-ink">{s.shopNo}</span>
                            <span className="flex items-center gap-1 text-xs text-ink-soft">
                              <MapPin className="h-3 w-3" />
                              {s.marketName ? `${s.marketName} — ` : ""}
                              {s.location}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="rounded-[10px] border border-line bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold text-ink">2. Your details</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Your name</label>
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
                          placeholder="What you intend to run in the shop"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-line bg-card p-6">
                    <h2 className="mb-1 text-base font-semibold text-ink">3. If you own property in NNM</h2>
                    <p className="mb-3 text-xs text-ink-soft">
                      Optional — if you have a property tax holding number, entering it here lets Tax Daroga verify
                      your own dues are clear as part of the review.
                    </p>
                    <input
                      value={form.applicantPropertyHoldingNo ?? ""}
                      onChange={(e) => update("applicantPropertyHoldingNo", e.target.value)}
                      placeholder="e.g. MUNG-08257 (leave blank if not applicable)"
                      className={inputClass}
                    />
                  </div>

                  <div className="rounded-[10px] border border-line bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold text-ink">4. Proposed rent</h2>
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

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-nnm-gold px-6 py-3 text-sm font-semibold text-[#20240a] shadow-[0_3px_0_#96791b] transition-transform hover:-translate-y-px disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Submitting…" : "Submit Application"}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}