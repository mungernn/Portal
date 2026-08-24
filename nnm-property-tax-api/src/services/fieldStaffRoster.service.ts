import { parse } from "csv-parse/sync";
import { fieldStaffRepository } from "../repositories/fieldStaff.repository";
import { attendanceWardRepository, attendanceShiftRepository } from "../repositories/attendanceWard.repository";
import { ApiError } from "../utils/ApiError";
import type { FieldStaffRow } from "../types/attendance.types";

export interface RosterSyncResult {
  created: number;
  updated: number;
  deactivated: number;
  errors: { row: number; message: string }[];
}

interface ParsedStaffRow {
  name: string;
  wardId: number;
  shiftId: number | null;
}

/**
 * Expected CSV columns: Name, Ward, Shift (Ward/Shift by their display
 * name, not internal id - an admin filling this out shouldn't need to
 * know database ids). Shift is optional; Name and Ward are required.
 */
async function parseStaffCsv(csvContent: string): Promise<{ rows: ParsedStaffRow[]; errors: { row: number; message: string }[] }> {
  const records: Record<string, string>[] = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

  const wards = await attendanceWardRepository.listAll();
  const wardByName = new Map(wards.map((w) => [w.ward_name.toLowerCase(), w.id]));
  const shifts = await attendanceShiftRepository.listAll();
  const shiftByName = new Map(shifts.map((s) => [s.shift_name.toLowerCase(), s.id]));

  const rows: ParsedStaffRow[] = [];
  const errors: { row: number; message: string }[] = [];

  records.forEach((r, i) => {
    const rowNum = i + 2; // +1 for 0-index, +1 for header row
    const name = (r.Name || r.name || "").trim();
    const wardName = (r.Ward || r.ward || "").trim();
    const shiftName = (r.Shift || r.shift || "").trim();

    if (!name) {
      errors.push({ row: rowNum, message: "Missing Name" });
      return;
    }
    if (!wardName) {
      errors.push({ row: rowNum, message: "Missing Ward" });
      return;
    }
    const wardId = wardByName.get(wardName.toLowerCase());
    if (!wardId) {
      errors.push({ row: rowNum, message: `Ward "${wardName}" not found - check spelling against the Wards list` });
      return;
    }
    let shiftId: number | null = null;
    if (shiftName) {
      shiftId = shiftByName.get(shiftName.toLowerCase()) ?? null;
      if (shiftId === null) {
        errors.push({ row: rowNum, message: `Shift "${shiftName}" not found - check spelling` });
        return;
      }
    }

    rows.push({ name, wardId, shiftId });
  });

  return { rows, errors };
}

/**
 * Full-list sync: the uploaded CSV becomes the new active roster.
 * Matches existing staff by (name, ward) - anyone matched gets
 * updated (shift, reactivated if they'd been deactivated); anyone
 * created is new; anyone currently active but NOT present in this
 * upload gets deactivated (not deleted - their attendance/feedback/
 * photo history references this row and must be preserved).
 */
export async function syncStaffRosterFromCsv(csvContent: string): Promise<RosterSyncResult> {
  const { rows, errors: parseErrors } = await parseStaffCsv(csvContent);
  const result: RosterSyncResult = { created: 0, updated: 0, deactivated: 0, errors: parseErrors };

  const touchedIds = new Set<number>();

  for (const row of rows) {
    try {
      const existing = await fieldStaffRepository.findByNameAndWard(row.name, row.wardId);
      if (existing) {
        await fieldStaffRepository.update(existing.id, { shiftId: row.shiftId, active: true });
        touchedIds.add(existing.id);
        result.updated++;
      } else {
        const created: FieldStaffRow = await fieldStaffRepository.create({ name: row.name, wardId: row.wardId, shiftId: row.shiftId });
        touchedIds.add(created.id);
        result.created++;
      }
    } catch (err) {
      result.errors.push({ row: 0, message: `${row.name} (ward ${row.wardId}): ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  const activeIds = await fieldStaffRepository.listActiveIds();
  const toDeactivate = activeIds.filter((id) => !touchedIds.has(id));
  await fieldStaffRepository.setActiveMany(toDeactivate, false);
  result.deactivated = toDeactivate.length;

  return result;
}

export async function createOneStaff(name: string, wardId: number, shiftId: number | null): Promise<FieldStaffRow> {
  const ward = await attendanceWardRepository.findById(wardId);
  if (!ward) throw ApiError.badRequest("Ward not found.");
  return fieldStaffRepository.create({ name, wardId, shiftId });
}
