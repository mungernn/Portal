"use client";

import { Trash2 } from "lucide-react";

export interface PhaseArvEntry {
  key: string;
  periodOfAssessment: string;
  arvInPeriod: string;
}

export function makeBlankPhaseArv(periodsOfAssessment: string[], taken: string[]): PhaseArvEntry {
  const available = periodsOfAssessment.find((p) => !taken.includes(p)) ?? periodsOfAssessment[0] ?? "";
  return { key: `phase-${Date.now()}-${Math.random()}`, periodOfAssessment: available, arvInPeriod: "" };
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1 block text-xs font-medium text-slate-600";

export function PhaseArvRow({
  entry,
  periodsOfAssessment,
  onChange,
  onRemove,
  removable,
}: {
  entry: PhaseArvEntry;
  periodsOfAssessment: string[];
  onChange: (next: PhaseArvEntry) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[2fr_1fr_auto]">
      <div>
        <label className={labelClass}>Period of assessment</label>
        <select
          value={entry.periodOfAssessment}
          onChange={(e) => onChange({ ...entry, periodOfAssessment: e.target.value })}
          className={inputClass}
        >
          {periodsOfAssessment.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Known ARV (₹)</label>
        <input
          type="number"
          min="0"
          value={entry.arvInPeriod}
          onChange={(e) => onChange({ ...entry, arvInPeriod: e.target.value })}
          className={inputClass}
        />
      </div>
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove period"
          className="justify-self-start rounded-md p-2 text-red-500 hover:bg-red-50 sm:justify-self-center"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}