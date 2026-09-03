"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock, Loader2 } from "lucide-react";
import { submitShopEditRequest, fetchMarketList, type ShopEditProposedData } from "@/lib/shop-api";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

/**
 * Lets an operator propose an edit to an EXISTING shop's own details
 * (location, market, ward, area) - not the tenancy/agreement, which
 * has its own separate form (ShopAgreementForm). Only fields the
 * operator actually changes are sent, matching the "somewhat like how
 * holding is edited" pattern: nothing is applied to the shop record
 * until Stall Prabhari, City Manager, and Deputy Commissioner have
 * all approved it - see the pending-notice below the form.
 */
export function ShopEditForm({
  shopNo,
  current,
  onSubmitted,
  onCancel,
}: {
  shopNo: string;
  current: { marketName: string | null; location: string; ward: string | null; areaSqft: string | null; totalAreaSqft: string | null; builtUpAreaSqft: string | null };
  onSubmitted: (requestId: number) => void;
  onCancel: () => void;
}) {
  const [markets, setMarkets] = useState<string[] | null>(null);
  // Starts empty and resolves once the market list loads (see the
  // effect below) - the current value might be a known market, or a
  // legacy/one-off name not in the list, so which branch applies
  // isn't known until the fetch completes.
  const [selectedMarket, setSelectedMarket] = useState("");
  const [customMarket, setCustomMarket] = useState("");
  const [location, setLocation] = useState(current.location);
  const [ward, setWard] = useState(current.ward ?? "");
  const [areaSqft, setAreaSqft] = useState(current.areaSqft ?? "");
  const [totalAreaSqft, setTotalAreaSqft] = useState(current.totalAreaSqft ?? "");
  const [builtUpAreaSqft, setBuiltUpAreaSqft] = useState(current.builtUpAreaSqft ?? "");
  const [changeReason, setChangeReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  useEffect(() => {
    fetchMarketList()
      .then((list) => {
        setMarkets(list);
        const currentValue = current.marketName ?? "";
        if (currentValue && !list.includes(currentValue)) {
          // The shop's existing market isn't in the known list (a
          // legacy/one-off name) - preselect "Other" and pre-fill it,
          // rather than silently losing the current value.
          setSelectedMarket("__other__");
          setCustomMarket(currentValue);
        } else {
          setSelectedMarket(currentValue);
        }
      })
      .catch(() => setMarkets([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveMarket = selectedMarket === "__other__" ? customMarket.trim() : selectedMarket;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!changeReason.trim()) {
      setError("A reason for this change is required - recorded in the approval audit trail.");
      return;
    }
    if (!location.trim()) {
      setError("Location cannot be blank.");
      return;
    }

    // Only send fields that actually changed from the current value -
    // an unchanged field being sent anyway is harmless (the merge
    // logic server-side would just re-apply the same value), but
    // keeping the proposal itself minimal makes the diff clearer for
    // whoever reviews it.
    const proposedData: ShopEditProposedData = {};
    if (effectiveMarket !== (current.marketName ?? "")) proposedData.marketName = effectiveMarket || null;
    if (location !== current.location) proposedData.location = location;
    if (ward !== (current.ward ?? "")) proposedData.ward = ward || null;
    if (areaSqft !== (current.areaSqft ?? "")) proposedData.areaSqft = areaSqft ? Number(areaSqft) : null;
    if (totalAreaSqft !== (current.totalAreaSqft ?? "")) proposedData.totalAreaSqft = totalAreaSqft ? Number(totalAreaSqft) : null;
    if (builtUpAreaSqft !== (current.builtUpAreaSqft ?? "")) proposedData.builtUpAreaSqft = builtUpAreaSqft ? Number(builtUpAreaSqft) : null;

    if (Object.keys(proposedData).length === 0) {
      setError("Nothing was changed - edit at least one field before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitShopEditRequest(shopNo, changeReason, proposedData);
      setSubmittedId(res.request.id);
      onSubmitted(res.request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this edit.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId !== null) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-2.5">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Edit request #{submittedId} submitted.</p>
            <p className="mt-1 text-amber-700">
              Nothing has changed on the shop yet - this now goes to Stall Prabhari, then City Manager, then Deputy Municipal
              Commissioner. The shop&apos;s details will update only once all three approve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-800">Propose an Edit to This Shop</h3>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Market Name</label>
          {markets === null ? (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading markets…
            </div>
          ) : (
            <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className={inputClass}>
              <option value="">- None -</option>
              {markets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="__other__">Other (new market)…</option>
            </select>
          )}
          {selectedMarket === "__other__" && (
            <input
              value={customMarket}
              onChange={(e) => setCustomMarket(e.target.value)}
              placeholder="New market name"
              className={`${inputClass} mt-2`}
            />
          )}
        </div>
        <div>
          <label className={labelClass}>Ward</label>
          <input value={ward} onChange={(e) => setWard(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Location</label>
          <input required value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Area (sqft)</label>
          <input type="number" min="0" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Total Area (sqft)</label>
          <input type="number" min="0" value={totalAreaSqft} onChange={(e) => setTotalAreaSqft(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Built-up Area (sqft)</label>
          <input type="number" min="0" value={builtUpAreaSqft} onChange={(e) => setBuiltUpAreaSqft(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Reason for this change</label>
        <textarea required value={changeReason} onChange={(e) => setChangeReason(e.target.value)} rows={2} className={inputClass} />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-nnm-blue px-4 py-2 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit for Approval"}
        </button>
      </div>
    </form>
  );
}
