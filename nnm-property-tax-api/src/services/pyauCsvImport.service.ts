import { parse } from "csv-parse/sync";
import { attendanceWardRepository } from "../repositories/attendanceWard.repository";
import { pyauRepository } from "../repositories/pyau.repository";

export interface PyauImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

/**
 * Imports the specific field-inventory CSV format the ward-level pyau
 * survey was delivered in - column headers are fixed (matched by
 * position, not name, since the real file's headers are long mixed
 * Hindi/English text that's fragile to match exactly). Columns:
 *   0 Ward No
 *   1 (installed count summary - ward-level only, ignored per-row)
 *   2 Address/Location of Water Kiosk
 *   3 (has water tank) - a COUNT (0/1/2/3), with a couple of
 *     free-text outliers ("0(Ground)", "Only Submersible") that get
 *     preserved as remarks rather than forced into a number
 *   4 Working status ("Working" / "Not working")
 *   5 Not-working reason/remarks (free text)
 *   6 Type of stand ("PCC Structure" / "Iron stand" / "Nothing")
 *   7 Tank Stand type ("Yes" / "Through Direct pipe")
 *   8 (without-stand count - sparse, low-value, not imported)
 *   9 Houses served (via pipeline)
 *
 * Auto-creates a ward if the CSV's ward number doesn't exist yet
 * (this import IS the initial ward setup for many municipalities
 * using this module for the first time), and auto-generates each
 * pyau's serial number as "W{ward}-{seq}", per what was asked for.
 */
export async function importPyauCsv(csvContent: string): Promise<PyauImportResult> {
  const records: string[][] = parse(csvContent, { columns: false, skip_empty_lines: true, from_line: 2, relax_column_count: true });

  const wards = await attendanceWardRepository.listAll();
  const wardByName = new Map(wards.map((w) => [w.ward_name.trim(), w]));
  // Tracks the next serial sequence per ward in-memory during the
  // import, seeded from what's already in the database - avoids a
  // database round-trip per row to recompute the max sequence.
  const nextSeqByWard = new Map<number, number>();

  const result: PyauImportResult = { created: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const row = records[i]!;
    const rowNum = i + 2; // +1 for header, +1 for 1-indexing
    try {
      const wardLabel = (row[0] ?? "").trim();
      if (!wardLabel) {
        result.errors.push({ row: rowNum, message: "Missing Ward No" });
        continue;
      }

      let ward = wardByName.get(wardLabel);
      if (!ward) {
        ward = await attendanceWardRepository.create(wardLabel);
        wardByName.set(wardLabel, ward);
      }

      if (!nextSeqByWard.has(ward.id)) {
        const maxSeq = await pyauRepository.maxSerialSequenceForWard(ward.id);
        nextSeqByWard.set(ward.id, maxSeq + 1);
      }
      const seq = nextSeqByWard.get(ward.id)!;
      const serialNumber = `W${wardLabel}-${String(seq).padStart(2, "0")}`;
      nextSeqByWard.set(ward.id, seq + 1);

      const locationAddress = (row[2] ?? "").trim() || null;

      const tankRaw = (row[3] ?? "").trim();
      let overheadTankCount = 0;
      let tankRemark: string | null = null;
      if (tankRaw && /^\d+$/.test(tankRaw)) {
        overheadTankCount = parseInt(tankRaw, 10);
      } else if (tankRaw) {
        tankRemark = `Tank field (unparsed): "${tankRaw}"`;
      }

      const workingRaw = (row[4] ?? "").trim().toLowerCase();
      const notWorkingRaw = (row[5] ?? "").trim();
      const functionalStatus: "functional" | "non_functional" = workingRaw === "not working" || notWorkingRaw ? "non_functional" : "functional";

      const remarksParts = [tankRemark, notWorkingRaw && !/^\d+$/.test(notWorkingRaw) ? notWorkingRaw : null].filter(Boolean);
      const remarks = remarksParts.length > 0 ? remarksParts.join(" | ") : null;

      const structureRaw = (row[6] ?? "").trim().toLowerCase();
      const structureType: "pcc_structure" | "iron_stand" | "nothing" | null =
        structureRaw === "pcc structure" ? "pcc_structure" : structureRaw === "iron stand" ? "iron_stand" : structureRaw === "nothing" ? "nothing" : null;

      const tankStandType = (row[7] ?? "").trim() || null;

      const housesServedRaw = (row[9] ?? "").trim();
      const housesServed = /^\d+$/.test(housesServedRaw) ? parseInt(housesServedRaw, 10) : null;

      await pyauRepository.create({
        wardId: ward.id,
        serialNumber,
        locationAddress,
        schemeName: null,
        overheadTankCount,
        housesServed,
        structureType,
        tankStandType,
        pumpDetails: null,
        boringDepthFeet: null,
        casingDetails: null,
        installedDate: null,
        builderName: null,
        builderContact: null,
        remarks,
        initialFunctionalStatus: functionalStatus,
      });
      result.created++;
    } catch (err) {
      result.errors.push({ row: rowNum, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return result;
}
