import type { PropertyRow, FloorRow } from "../types/property.types";
import type { PropertySaveInput } from "../types/propertySave.types";
import { ApiError } from "../utils/ApiError";
import { floorsDiffer } from "../utils/floorTimeline";
import { getCurrentAssessmentYearStartNum, parseYearStartOrNull } from "../utils/assessmentYear";

/**
 * A change to a holding's floors must say how it applies: "changed from year ___" (earlier years keep the old floors)
 * or "correction" (it was always so), with a reason. Called when an operator's change request or a Tax Collector's
 * discrepancy report is submitted. Returns whether the floors change at all.
 */
export function assertFloorChangeStated(property: PropertyRow, existingFloors: FloorRow[], input: PropertySaveInput): boolean {
  if (!floorsDiffer(existingFloors, input.floors)) return false;
  const fc = input.floorChange;
  if (!fc) {
    throw ApiError.badRequest(
      "The floors are being changed: say whether this is a change from a particular year (earlier years keep the old details) or a correction of a mistake, with the reason.",
    );
  }
  if (!fc.reason?.trim()) throw ApiError.badRequest("Give the reason for the floor change.");
  if (fc.kind === "from_year") {
    const y = parseYearStartOrNull(fc.effectiveYear ?? null);
    if (y === null) throw ApiError.badRequest("Select the year from which the change applies.");
    if (y > getCurrentAssessmentYearStartNum()) throw ApiError.badRequest("The year of the change cannot be in the future.");
    const created = parseYearStartOrNull(property.holding_creation_year);
    if (created !== null && y <= created) {
      throw ApiError.badRequest(
        "The year of the change must be after the holding's creation year - for something true since creation, choose correction.",
      );
    }
  }
  return true;
}
