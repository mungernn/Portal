import type { FloorInput } from "./propertySave.types";

export interface TaxPreviewInput {
  areaSqft: number;
  roadType: "PMR" | "MR" | "OR";
  rainWaterHarvesting?: boolean;
  assessmentYear: string;
  solidWasteChargeType?: string | null;
  solidWasteMonths?: number;
  isBwg?: boolean;
  isSlum?: boolean;
  floors: FloorInput[];
}