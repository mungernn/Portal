"use client";

import { useState } from "react";
import { FileText, Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import { sanitizeHoldingNoInput } from "@/lib/holding-no";

export type NewEntryChoice = "known-number" | "new" | "partiallyKnown";

const cardClass = "flex flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left";

export function EntryModeLauncher({
  onChooseAuto,
  onChooseKnownNumber,
  initialKnownNumber,
}: {
  /** MMC- ("new") or MUNGMC- ("partiallyKnown") — auto-numbered, no input needed. */
  onChooseAuto: (choice: "new" | "partiallyKnown") => void;
  onChooseKnownNumber: (holdingNo: string) => void;
  /** Pre-fills the MUNG- input, e.g. after a search came back "not found". */
  initialKnownNumber?: string;
}) {
  const [knownNumber, setKnownNumber] = useState(initialKnownNumber ?? "");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className={cardClass}>
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
          <FileText className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <h3 className="mb-1 text-sm font-semibold text-slate-900">MUNG- series</h3>
        <p className="mb-3 text-xs text-slate-500">Already exists online, with a fixed digitized number. Type its exact number.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (knownNumber.trim()) onChooseKnownNumber(knownNumber.trim());
          }}
          className="mt-auto w-full"
        >
          <div className="flex gap-1.5">
            <input
              value={knownNumber}
              onChange={(e) => setKnownNumber(sanitizeHoldingNoInput(e.target.value))}
              placeholder="e.g. MUNG-08257"
              className="w-full min-w-0 rounded-md border border-slate-300 px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
            />
            <button
              type="submit"
              disabled={!knownNumber.trim()}
              aria-label="Continue"
              className="flex shrink-0 items-center justify-center rounded-md bg-nnm-blue px-2.5 text-white hover:bg-nnm-blue-dark disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      <button type="button" onClick={() => onChooseAuto("new")} className={`${cardClass} transition-shadow hover:shadow-md`}>
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
          <Sparkles className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <h3 className="mb-1 text-sm font-semibold text-slate-900">MMC- series — create new</h3>
        <p className="text-xs text-slate-500">
          No offline history. A genuinely new property with a full floor survey. Number is auto-assigned — nothing
          to type here.
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChooseAuto("partiallyKnown")}
        className={`${cardClass} transition-shadow hover:shadow-md`}
      >
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-nnm-blue">
          <HelpCircle className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <h3 className="mb-1 text-sm font-semibold text-slate-900">MUNGMC- series — partially known</h3>
        <p className="text-xs text-slate-500">
          Existed in the offline demand register but never digitized — only ARV for past phases survives. Number is
          auto-assigned — nothing to type here.
        </p>
      </button>
    </div>
  );
}