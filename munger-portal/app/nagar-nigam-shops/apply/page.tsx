"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { fetchVacantShops, submitPublicRentalPreference, type VacantShop, type PublicRentalPreferenceInput } from "@/lib/nagar-nigam-shops";

const inputClass =
  "w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-ink";

/** Checkbox-based multi-select styled as a dropdown - lets an applicant pick several acceptable markets in one application instead of needing a separate application per market/shop, without native <select multiple>'s awkward UX. */
function MarketMultiSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(market: string) {
    onChange(selected.includes(market) ? selected.filter((m) => m !== market) : [...selected, market]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className={selected.length === 0 ? "text-ink-soft/60" : ""}>
          {selected.length === 0 ? "Select one or more markets" : selected.join(", ")}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-soft" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-white p-2 shadow-lg">
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-ink-soft">No markets currently have vacant shops.</p>
          ) : (
            options.map((market) => (
              <label key={market} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-paper-dim">
                <input type="checkbox" checked={selected.includes(market)} onChange={() => toggle(market)} />
                {market}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplyForShopPage() {
  const [vacantShops, setVacantShops] = useState<VacantShop[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [minAreaSqft, setMinAreaSqft] = useState("");
  const [maxAreaSqft, setMaxAreaSqft] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  const [applicantName, setApplicantName] = useState("");
  const [applicantRelationType, setApplicantRelationType] = useState("");
  const [applicantRelationName, setApplicantRelationName] = useState("");
  const [applicantMobile, setApplicantMobile] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [applicantIdProofNumber, setApplicantIdProofNumber] = useState("");
  const [applicantBusinessName, setApplicantBusinessName] = useState("");
  const [applicantPropertyHoldingNo, setApplicantPropertyHoldingNo] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    fetchVacantShops()
      .then(setVacantShops)
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Could not load vacant shops."));
  }, []);

  const availableMarkets = useMemo(() => {
    if (!vacantShops) return [];
    const names = vacantShops.map((s) => s.marketName).filter((m): m is string => !!m);
    return Array.from(new Set(names)).sort();
  }, [vacantShops]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selectedMarkets.length === 0) {
      setError("Select at least one market.");
      return;
    }
    if (!minAreaSqft || !maxAreaSqft) {
      setError("Enter your acceptable size range.");
      return;
    }
    if (Number(maxAreaSqft) < Number(minAreaSqft)) {
      setError("Maximum size cannot be less than minimum size.");
      return;
    }
    if (!bidAmount) {
      setError("Enter your bid amount.");
      return;
    }
    if (!applicantName.trim()) {
      setError("Your name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const input: PublicRentalPreferenceInput = {
        marketNames: selectedMarkets,
        minAreaSqft: Number(minAreaSqft),
        maxAreaSqft: Number(maxAreaSqft),
        bidAmount: Number(bidAmount),
        applicantName,
        applicantRelationType: applicantRelationType || null,
        applicantRelationName: applicantRelationName || null,
        applicantMobile: applicantMobile || null,
        applicantAddress: applicantAddress || null,
        applicantIdProofNumber: applicantIdProofNumber || null,
        applicantBusinessName: applicantBusinessName || null,
        applicantPropertyHoldingNo: applicantPropertyHoldingNo || null,
      };
      const res = await submitPublicRentalPreference(input);
      setResult(res.preferenceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your preference.");
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
              Tell us which markets and shop sizes would work for you, along with your bid. NNM will match you to an available
              shop once one that fits becomes free.
            </p>
          </div>
        </section>

        <section className="bg-paper-dim py-14">
          <div className="mx-auto max-w-2xl px-6">
            {result !== null ? (
              <div role="status" className="flex items-start gap-3 rounded-[10px] border border-green-200 bg-green-50 p-6 text-sm text-green-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Preference submitted - reference #{result}</p>
                  <p className="mt-1 text-green-700">
                    NNM will match you against available shops in your chosen markets and size range. If selected, your
                    application then goes through review by Stall Prabhari, Tax Daroga, City Manager, Deputy Commissioner, and
                    Municipal Commissioner. You can check on its status at your ward office using this reference number.
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

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="rounded-[10px] border border-line bg-card p-6">
                    <h2 className="mb-1 text-base font-semibold text-ink">1. Where and what size</h2>
                    {!vacantShops ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-ink-soft">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading markets…
                      </div>
                    ) : (
                      <div className="mt-3 space-y-4">
                        <div>
                          <label className={labelClass}>Markets (select any that would work for you)</label>
                          <MarketMultiSelect options={availableMarkets} selected={selectedMarkets} onChange={setSelectedMarkets} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Minimum size (sq ft)</label>
                            <input required type="number" min="0" value={minAreaSqft} onChange={(e) => setMinAreaSqft(e.target.value)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Maximum size (sq ft)</label>
                            <input required type="number" min="0" value={maxAreaSqft} onChange={(e) => setMaxAreaSqft(e.target.value)} className={inputClass} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[10px] border border-line bg-card p-6">
                    <h2 className="mb-4 text-base font-semibold text-ink">2. Your details</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Your name</label>
                        <input required value={applicantName} onChange={(e) => setApplicantName(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Mobile number</label>
                        <input value={applicantMobile} onChange={(e) => setApplicantMobile(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Relation type</label>
                        <select value={applicantRelationType} onChange={(e) => setApplicantRelationType(e.target.value)} className={inputClass}>
                          <option value="">—</option>
                          <option value="S/O">S/O</option>
                          <option value="D/O">D/O</option>
                          <option value="W/O">W/O</option>
                          <option value="C/O">C/O</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Relation name (father/husband)</label>
                        <input value={applicantRelationName} onChange={(e) => setApplicantRelationName(e.target.value)} className={inputClass} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Address</label>
                        <input value={applicantAddress} onChange={(e) => setApplicantAddress(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>ID proof number</label>
                        <input value={applicantIdProofNumber} onChange={(e) => setApplicantIdProofNumber(e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Proposed business name</label>
                        <input
                          value={applicantBusinessName}
                          onChange={(e) => setApplicantBusinessName(e.target.value)}
                          placeholder="What you intend to run in the shop"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[10px] border border-line bg-card p-6">
                    <h2 className="mb-1 text-base font-semibold text-ink">3. If you own property in NNM</h2>
                    <p className="mb-3 text-xs text-ink-soft">
                      Optional - if you have a property tax holding number, entering it here lets Tax Daroga verify your own
                      dues are clear as part of the review.
                    </p>
                    <input
                      value={applicantPropertyHoldingNo}
                      onChange={(e) => setApplicantPropertyHoldingNo(e.target.value)}
                      placeholder="e.g. MUNG-08257 (leave blank if not applicable)"
                      className={inputClass}
                    />
                  </div>

                  <div className="rounded-[10px] border border-line bg-card p-6">
                    <h2 className="mb-1 text-base font-semibold text-ink">4. Your bid</h2>
                    <p className="mb-3 text-xs text-ink-soft">
                      If more than one applicant qualifies for the same shop, the higher bid is given priority when NNM decides
                      the allotment.
                    </p>
                    <label className={labelClass}>Monthly rent you&apos;re offering (₹)</label>
                    <input required type="number" min="0" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className={inputClass} />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-nnm-gold px-6 py-3 text-sm font-semibold text-[#20240a] shadow-[0_3px_0_#96791b] transition-transform hover:-translate-y-px disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? "Submitting…" : "Submit Preference"}
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
