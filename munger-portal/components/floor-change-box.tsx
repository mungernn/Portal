"use client";

import type { FloorFormState } from "@/components/operator/floor-row";

/**
 * Shown when the floors of an existing holding are being changed (use, construction, area, floors added / removed):
 * asks whether it changed FROM a particular year (earlier years keep the old details - the past is not rewritten) or
 * is a CORRECTION of a mistake (every year is recalculated), with the reason. A change of use, or any back-dated
 * change, goes Tax Daroga -> City Manager -> Deputy Commissioner and needs a photo of the premises.
 * The same rules are enforced by the server.
 */

export interface FloorChangeState {
  kind: "" | "from_year" | "correction";
  effectiveYear: string;
  reason: string;
}

export const blankFloorChange = (): FloorChangeState => ({ kind: "", effectiveYear: "", reason: "" });

type F = Pick<FloorFormState, "floorLabel" | "buildupSqft" | "constType" | "usageType" | "occupancy" | "yearBuilt" | "closingYear">;

const n = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toLowerCase();
const yearStart = (v: string) => (/^(\d{4})/.exec(v.trim())?.[1] ? Number(/^(\d{4})/.exec(v.trim())![1]) : null);
const key = (f: F) =>
  [
    n(f.floorLabel),
    Number(f.buildupSqft) || 0,
    n(f.constType),
    n(f.usageType),
    n(f.occupancy) || "self",
    yearStart(f.yearBuilt ?? "") ?? "",
    yearStart(f.closingYear ?? "") ?? "",
  ].join("|");

export function currentFyStart(): number {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  return ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
}

export function floorsChanged(original: F[], current: F[]): boolean {
  if (original.length !== current.length) return true;
  const a = original.map(key).sort();
  const b = current.map(key).sort();
  return a.some((k, i) => k !== b[i]);
}

export function floorUseChanged(original: F[], current: F[]): boolean {
  const open = (f: F) => !yearStart(f.closingYear ?? "");
  const group = (list: F[]) => {
    const m = new Map<string, string[]>();
    for (const f of list.filter(open)) m.set(n(f.floorLabel), [...(m.get(n(f.floorLabel)) ?? []), n(f.usageType)]);
    return m;
  };
  const before = group(original);
  const after = group(current);
  for (const [label, uses] of before) {
    const now = after.get(label);
    if (now && [...uses].sort().join(",") !== [...now].sort().join(",")) return true;
  }
  return false;
}

/** Whether this change goes Tax Daroga -> City Manager -> DMC (and so needs a premises photo). */
export function isUseChange(original: F[], current: F[], fc: FloorChangeState): boolean {
  if (!floorsChanged(original, current)) return false;
  const y = yearStart(fc.effectiveYear);
  return fc.kind === "correction" || (fc.kind === "from_year" && y !== null && y < currentFyStart()) || floorUseChanged(original, current);
}

/** A problem with the statement, or null when it is complete. */
export function floorChangeProblem(original: F[], current: F[], fc: FloorChangeState): string | null {
  if (!floorsChanged(original, current)) return null;
  if (!fc.kind) return "The floors are being changed: choose whether it changed from a particular year or is a correction of a mistake.";
  if (fc.kind === "from_year" && !fc.effectiveYear) return "Select the year from which the floor change applies.";
  if (!fc.reason.trim()) return "Give the reason for the floor change.";
  return null;
}

export function floorChangePayload(original: F[], current: F[], fc: FloorChangeState) {
  if (!floorsChanged(original, current) || !fc.kind) return null;
  return { kind: fc.kind, effectiveYear: fc.kind === "from_year" ? fc.effectiveYear : null, reason: fc.reason.trim() };
}

export function FloorChangeBox({
  original,
  current,
  creationYear,
  value,
  onChange,
  photo,
  onPhoto,
  photoNote,
}: {
  original: F[];
  current: F[];
  creationYear: string | null | undefined;
  value: FloorChangeState;
  onChange: (v: FloorChangeState) => void;
  /** When given, a premises-photo picker is shown (operator). Otherwise `photoNote` explains which photo serves. */
  photo?: File | null;
  onPhoto?: (f: File | null) => void;
  photoNote?: string;
}) {
  if (!floorsChanged(original, current)) return null;
  const now = currentFyStart();
  const created = yearStart(creationYear ?? "") ?? now - 30;
  const years: string[] = [];
  for (let y = now; y > created; y--) years.push(`${y}-${y + 1}`);
  const useChange = isUseChange(original, current, value);
  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";

  return (
    <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-amber-900">The floors are changing - how should this apply?</h3>
      <p className="mt-0.5 text-xs text-amber-800">Years already paid are never changed. This decides how unpaid past years are billed.</p>
      <div className="mt-3 space-y-2 text-sm text-slate-800">
        <label className="flex items-start gap-2">
          <input
            type="radio"
            checked={value.kind === "from_year"}
            onChange={() => onChange({ ...value, kind: "from_year" })}
            className="mt-1"
          />
          <span>
            <b>It changed from a particular year</b> - e.g. a hotel that became a home. Years before it keep the old details.
          </span>
        </label>
        {value.kind === "from_year" && (
          <label className="ml-6 block max-w-xs">
            <span className="mb-1 block text-xs font-medium text-slate-600">Changed from (first year of the new details)</span>
            <select
              value={value.effectiveYear}
              onChange={(e) => onChange({ ...value, effectiveYear: e.target.value })}
              className={inputClass}
            >
              <option value="">Select year…</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                  {y === `${now}-${now + 1}` ? " (this year)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-start gap-2">
          <input
            type="radio"
            checked={value.kind === "correction"}
            onChange={() => onChange({ ...value, kind: "correction", effectiveYear: "" })}
            className="mt-1"
          />
          <span>
            <b>Correction - the record was wrong</b> (it has always been like this). Every unpaid year is recalculated.
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Reason</span>
          <input
            value={value.reason}
            onChange={(e) => onChange({ ...value, reason: e.target.value })}
            placeholder="e.g. Hotel closed, now used as residence"
            className={inputClass}
          />
        </label>
      </div>
      {useChange && (
        <div className="mt-3 rounded-md border border-amber-200 bg-white p-3 text-xs text-slate-700">
          <p className="font-semibold text-amber-900">
            Change of use / back-dated change: approved by the Tax Daroga, the City Manager and the Deputy Commissioner.
          </p>
          {onPhoto ? (
            <label className="mt-2 block">
              <span className="mb-1 block font-medium text-slate-600">Photo of the premises (required)</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
                className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-nnm-blue file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              {photo && <span className="mt-1 block text-green-700">Attached: {photo.name}</span>}
            </label>
          ) : (
            photoNote && <p className="mt-1">{photoNote}</p>
          )}
        </div>
      )}
    </section>
  );
}
