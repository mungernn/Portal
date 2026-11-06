import type { FloorRow } from "../types/property.types";
import type { FloorInput } from "../types/propertySave.types";
import { parseYearStartOrNull } from "./assessmentYear";

/**
 * Floors as a timeline. A floor's use, construction or area changing from a given year is recorded as two rows with
 * the same floor label - the old one closed at the year before (closing year), the new one starting that year (year
 * built) - so every past year keeps the use it actually had. See applyFloorChangeFromYear.
 */

const fy = (y: number) => `${y}-${y + 1}`;
const yr = (v: unknown) => parseYearStartOrNull(v === null || v === undefined ? null : String(v));
const norm = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

/** What a floor row is, ignoring its years. */
function shape(label: unknown, sqft: unknown, constType: unknown, usage: unknown, occupancy: unknown): string {
  return [norm(label), Number(sqft) || 0, norm(constType), norm(usage), norm(occupancy) || "self"].join("|");
}
const rowShape = (f: FloorRow) => shape(f.floor_label, f.buildup_sqft, f.const_type, f.usage_type, f.occupancy);
const inputShape = (f: FloorInput) => shape(f.floorLabel, f.buildupSqft, f.constType, f.usageType, f.occupancy);
const rowKey = (f: FloorRow) => `${rowShape(f)}|${yr(f.year_built) ?? ""}|${yr(f.closing_year) ?? ""}`;
const inputKey = (f: FloorInput) => `${inputShape(f)}|${yr(f.yearBuilt) ?? ""}|${yr(f.closingYear) ?? ""}`;

/** Whether the proposed floors differ in any way from the stored ones (same multiset = no change). */
export function floorsDiffer(existing: FloorRow[], proposed: FloorInput[]): boolean {
  if (existing.length !== proposed.length) return true;
  const a = existing.map(rowKey).sort();
  const b = proposed.map(inputKey).sort();
  return a.some((k, i) => k !== b[i]);
}

/** A floor (by label) present before and after whose use type is different. */
export function floorUseChanged(existing: FloorRow[], proposed: FloorInput[]): boolean {
  const open = (f: FloorRow) => yr(f.closing_year) === null;
  const before = new Map<string, string[]>();
  for (const f of existing.filter(open)) before.set(norm(f.floor_label), [...(before.get(norm(f.floor_label)) ?? []), norm(f.usage_type)]);
  const after = new Map<string, string[]>();
  for (const f of proposed.filter((p) => yr(p.closingYear) === null))
    after.set(norm(f.floorLabel), [...(after.get(norm(f.floorLabel)) ?? []), norm(f.usageType)]);
  for (const [label, uses] of before) {
    const now = after.get(label);
    if (now && [...uses].sort().join(",") !== [...now].sort().join(",")) return true;
  }
  return false;
}

/**
 * "Changed from year Y": floors identical before and after stay exactly as they are (with their own years); every
 * stored floor that is no longer in the proposal is closed at Y-1 (or dropped if it only started in Y or later);
 * every proposed floor that is new or different starts in Y (or later, if its own year built is later). So years
 * before Y are priced on the old floors, Y onward on the new ones.
 */
export function applyFloorChangeFromYear(existing: FloorRow[], proposed: FloorInput[], fromYear: number): FloorInput[] {
  const unmatched = [...existing];
  const kept: FloorInput[] = [];
  const started: FloorInput[] = [];
  for (const p of proposed) {
    const i = unmatched.findIndex(
      (e) => rowShape(e) === inputShape(p) && (yr(e.closing_year) === null || yr(e.closing_year) === yr(p.closingYear)),
    );
    if (i >= 0) {
      const e = unmatched.splice(i, 1)[0]!;
      kept.push({ ...p, yearBuilt: e.year_built ?? null, closingYear: e.closing_year ?? null });
    } else {
      const own = yr(p.yearBuilt);
      started.push({ ...p, yearBuilt: fy(own !== null && own > fromYear ? own : fromYear) });
    }
  }
  const closed: FloorInput[] = [];
  for (const e of unmatched) {
    const built = yr(e.year_built);
    const closing = yr(e.closing_year);
    if (built !== null && built >= fromYear) continue; // did not exist before the change
    const end = closing !== null && closing < fromYear - 1 ? closing : fromYear - 1;
    closed.push({
      floorLabel: e.floor_label,
      buildupSqft: Number(e.buildup_sqft) || 0,
      constType: e.const_type as FloorInput["constType"],
      usageType: e.usage_type,
      occupancy: (norm(e.occupancy) || "self") as FloorInput["occupancy"],
      yearBuilt: e.year_built ?? null,
      closingYear: fy(end),
    });
  }
  return [...kept, ...closed, ...started];
}
