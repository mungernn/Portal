"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { OperatorHeader } from "@/components/operator-header";
import { ShopAgreementForm } from "@/components/operator/shop-agreement-form";
import { useOperatorGuard } from "@/lib/use-operator-guard";
import {
  fetchShopByShopNo,
  createShop,
  fetchMarketList,
  fetchNextShopNumber,
} from "@/lib/shop-api";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function ShopNewEntryPage() {
  const operator = useOperatorGuard();

  const [markets, setMarkets] = useState<string[] | null>(null);
  const [selectedMarket, setSelectedMarket] = useState("");
  const [customMarket, setCustomMarket] = useState("");
  const [numberMode, setNumberMode] = useState<"auto" | "existing">("auto");
  const [previewShopNo, setPreviewShopNo] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [existingShopNo, setExistingShopNo] = useState("");

  const [location, setLocation] = useState("");
  const [ward, setWard] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [totalAreaSqft, setTotalAreaSqft] = useState("");
  const [builtUpAreaSqft, setBuiltUpAreaSqft] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdShopNo, setCreatedShopNo] = useState<string | null>(null);
  const [agreementDone, setAgreementDone] = useState(false);

  useEffect(() => {
    fetchMarketList()
      .then(setMarkets)
      .catch(() => setMarkets([]));
  }, []);

  const effectiveMarket = selectedMarket === "__other__" ? customMarket.trim() : selectedMarket;

  useEffect(() => {
    if (numberMode !== "auto" || !effectiveMarket) {
      setPreviewShopNo(null);
      return;
    }
    setPreviewLoading(true);
    fetchNextShopNumber(effectiveMarket)
      .then(setPreviewShopNo)
      .catch(() => setPreviewShopNo(null))
      .finally(() => setPreviewLoading(false));
  }, [numberMode, effectiveMarket]);

  function resetAll() {
    setSelectedMarket("");
    setCustomMarket("");
    setNumberMode("auto");
    setPreviewShopNo(null);
    setExistingShopNo("");
    setLocation("");
    setWard("");
    setAreaSqft("");
    setTotalAreaSqft("");
    setBuiltUpAreaSqft("");
    setCreateError(null);
    setCreatedShopNo(null);
    setAgreementDone(false);
  }

  async function handleCreateShop(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    if (!effectiveMarket) {
      setCreateError("Select or enter a market first.");
      return;
    }
    if (!location.trim()) {
      setCreateError("Location is required.");
      return;
    }

    let shopNo: string;
    if (numberMode === "auto") {
      if (!previewShopNo) {
        setCreateError("Waiting on the auto-generated shop number — try again in a moment.");
        return;
      }
      shopNo = previewShopNo;
    } else {
      if (!existingShopNo.trim()) {
        setCreateError("Enter the existing shop number from the register.");
        return;
      }
      shopNo = existingShopNo.trim();
    }

    setCreating(true);
    try {
      // Guard against accidentally re-creating a shop that already
      // exists — this page is for entering shops NOT yet in the
      // system; an existing one should be edited via the search page
      // instead, where its current agreement is visible first.
      const existing = await fetchShopByShopNo(shopNo);
      if (existing.found) {
        setCreateError(
          `Shop ${shopNo} already exists in the system. To edit it, use "Municipal Shop Rent" search instead of this entry page.`,
        );
        setCreating(false);
        return;
      }

      await createShop({
        shopNo,
        marketName: effectiveMarket,
        location,
        ward: ward || null,
        areaSqft: areaSqft ? Number(areaSqft) : null,
        totalAreaSqft: totalAreaSqft ? Number(totalAreaSqft) : null,
        builtUpAreaSqft: builtUpAreaSqft ? Number(builtUpAreaSqft) : null,
      });
      setCreatedShopNo(shopNo);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create shop.");
    } finally {
      setCreating(false);
    }
  }

  if (!operator) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <OperatorHeader operator={operator} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">New Shop Entry</h1>
        <p className="mb-6 text-sm text-slate-500">
          One continuous entry for a shop not yet in the system — shop details, then tenant/agreement details.
          Enter the shop&apos;s existing register number, or let a genuinely new shop be auto-numbered.
        </p>

        {!createdShopNo && (
          <form onSubmit={handleCreateShop} className="space-y-6">
            {createError && (
              <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {createError}
              </div>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">1. Shop Number</h2>
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setNumberMode("auto")}
                  className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-semibold ${
                    numberMode === "auto" ? "border-nnm-blue bg-blue-50 text-nnm-blue" : "border-slate-200 text-slate-600"
                  }`}
                >
                  <Sparkles className="mr-1.5 inline h-4 w-4" />
                  New shop (auto-number)
                </button>
                <button
                  type="button"
                  onClick={() => setNumberMode("existing")}
                  className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-semibold ${
                    numberMode === "existing" ? "border-nnm-blue bg-blue-50 text-nnm-blue" : "border-slate-200 text-slate-600"
                  }`}
                >
                  Existing / old shop number
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Market</label>
                  {markets === null ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading markets…
                    </div>
                  ) : (
                    <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className={inputClass}>
                      <option value="">Select a market…</option>
                      {markets.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="__other__">Other (new market)…</option>
                    </select>
                  )}
                </div>
                {selectedMarket === "__other__" && (
                  <div>
                    <label className={labelClass}>New market name</label>
                    <input value={customMarket} onChange={(e) => setCustomMarket(e.target.value)} className={inputClass} />
                  </div>
                )}

                {numberMode === "auto" ? (
                  <div>
                    <label className={labelClass}>Auto-generated shop number</label>
                    <div className="flex h-[42px] items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-mono">
                      {previewLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : previewShopNo ? (
                        <span className="font-semibold text-nnm-blue">{previewShopNo}</span>
                      ) : (
                        <span className="text-slate-400">Select a market first</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Existing shop number</label>
                    <input
                      value={existingShopNo}
                      onChange={(e) => setExistingShopNo(e.target.value)}
                      placeholder="e.g. NNC-3 (as per the register)"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">2. Shop Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Location / address</label>
                  <input required value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ward</label>
                  <input value={ward} onChange={(e) => setWard(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Area (sqft)</label>
                  <input type="number" min="0" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Total area (sqft)</label>
                  <input type="number" min="0" value={totalAreaSqft} onChange={(e) => setTotalAreaSqft(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Built-up area (sqft)</label>
                  <input type="number" min="0" value={builtUpAreaSqft} onChange={(e) => setBuiltUpAreaSqft(e.target.value)} className={inputClass} />
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-md bg-nnm-blue px-6 py-3 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {creating ? "Creating…" : "Continue to Tenant / Agreement Details"}
            </button>
          </form>
        )}

        {createdShopNo && !agreementDone && (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Shop <b className="font-mono">{createdShopNo}</b> created. Now enter the tenant/agreement details below —
              this will be submitted for the full 5-stage approval chain.
            </div>
            <ShopAgreementForm
              shopNo={createdShopNo}
              isEditing={false}
              onSubmitted={() => setAgreementDone(true)}
            />
          </div>
        )}

        {agreementDone && (
          <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">
              Shop <b className="font-mono">{createdShopNo}</b> and its agreement request are recorded.
            </p>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-md bg-nnm-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark"
            >
              <RotateCcw className="h-4 w-4" />
              Enter Another Shop
            </button>
          </div>
        )}
      </main>
    </div>
  );
}