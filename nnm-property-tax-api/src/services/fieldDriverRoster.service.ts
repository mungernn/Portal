import { parse } from "csv-parse/sync";
import { fieldDriverRepository } from "../repositories/fieldDriver.repository";
import { attendanceWardRepository, attendanceShiftRepository } from "../repositories/attendanceWard.repository";
import { ApiError } from "../utils/ApiError";
import type { FieldDriverRow } from "../types/attendance.types";
import type { RosterSyncResult } from "./fieldStaffRoster.service";

interface ParsedDriverRow {
  name: string;
  vehicleNumber: string | null;
  chassisNumber: string | null;
  dlNumber: string | null;
  wardNo: string | null;
  wardId: number;
  shiftId: number | null;
}

/** Expected CSV columns: Name, VehicleNumber, ChassisNumber, DLNumber, WardNo, Ward, Shift. Only Name and Ward are required. */
async function parseDriverCsv(csvContent: string): Promise<{ rows: ParsedDriverRow[]; errors: { row: number; message: string }[] }> {
  const records: Record<string, string>[] = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });

  const wards = await attendanceWardRepository.listAll();
  const wardByName = new Map(wards.map((w) => [w.ward_name.toLowerCase(), w.id]));
  const shifts = await attendanceShiftRepository.listAll();
  const shiftByName = new Map(shifts.map((s) => [s.shift_name.toLowerCase(), s.id]));

  const rows: ParsedDriverRow[] = [];
  const errors: { row: number; message: string }[] = [];

  records.forEach((r, i) => {
    const rowNum = i + 2;
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

    rows.push({
      name,
      vehicleNumber: (r.VehicleNumber || r.vehicleNumber || "").trim() || null,
      chassisNumber: (r.ChassisNumber || r.chassisNumber || "").trim() || null,
      dlNumber: (r.DLNumber || r.dlNumber || "").trim() || null,
      wardNo: (r.WardNo || r.wardNo || "").trim() || null,
      wardId,
      shiftId,
    });
  });

  return { rows, errors };
}

/** Same full-list sync semantics as syncStaffRosterFromCsv - see that function's comment. */
export async function syncDriverRosterFromCsv(csvContent: string): Promise<RosterSyncResult> {
  const { rows, errors: parseErrors } = await parseDriverCsv(csvContent);
  const result: RosterSyncResult = { created: 0, updated: 0, deactivated: 0, errors: parseErrors };

  const touchedIds = new Set<number>();

  for (const row of rows) {
    try {
      const existing = await fieldDriverRepository.findByNameAndWard(row.name, row.wardId);
      if (existing) {
        await fieldDriverRepository.update(existing.id, {
          vehicleNumber: row.vehicleNumber,
          chassisNumber: row.chassisNumber,
          dlNumber: row.dlNumber,
          wardNo: row.wardNo,
          shiftId: row.shiftId,
          active: true,
        });
        touchedIds.add(existing.id);
        result.updated++;
      } else {
        const created: FieldDriverRow = await fieldDriverRepository.create({
          name: row.name,
          vehicleNumber: row.vehicleNumber,
          chassisNumber: row.chassisNumber,
          dlNumber: row.dlNumber,
          wardNo: row.wardNo,
          wardId: row.wardId,
          shiftId: row.shiftId,
        });
        touchedIds.add(created.id);
        result.created++;
      }
    } catch (err) {
      result.errors.push({ row: 0, message: `${row.name} (ward ${row.wardId}): ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  const activeIds = await fieldDriverRepository.listActiveIds();
  const toDeactivate = activeIds.filter((id) => !touchedIds.has(id));
  await fieldDriverRepository.setActiveMany(toDeactivate, false);
  result.deactivated = toDeactivate.length;

  return result;
}

export async function createOneDriver(input: {
  name: string;
  vehicleNumber: string | null;
  chassisNumber: string | null;
  dlNumber: string | null;
  wardNo: string | null;
  wardId: number;
  shiftId: number | null;
}): Promise<FieldDriverRow> {
  const ward = await attendanceWardRepository.findById(input.wardId);
  if (!ward) throw ApiError.badRequest("Ward not found.");
  return fieldDriverRepository.create(input);
}
