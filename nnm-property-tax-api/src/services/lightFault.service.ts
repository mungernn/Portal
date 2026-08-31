import { lightFaultRepository } from "../repositories/lightFault.repository";
import { lightRepository } from "../repositories/light.repository";
import { contractorWardRepository } from "../repositories/contractorWard.repository";
import { accruePenaltiesForFault } from "./penaltyAccrual.service";
import { ApiError } from "../utils/ApiError";
import type { LightFaultRow } from "../types/streetlight.types";
import type { AttendanceTokenPayload } from "../types/attendance.types";

const REPAIR_DEADLINE_HOURS = 72;

/** Looks up the contractor responsible for the ward a light sits in, so a fault is assigned the moment it's reported - not a separate manual step. */
async function findResponsibleContractor(wardId: number): Promise<number | null> {
  const mapping = await contractorWardRepository.findByWard(wardId);
  return mapping?.contractor_id ?? null;
}

/** Staff-reported fault - any logged-in attendance role, per what was asked for ("all staff"). */
export async function reportFaultByStaff(
  user: AttendanceTokenPayload,
  input: { lightId: number; notes: string | null },
): Promise<LightFaultRow> {
  const light = await lightRepository.findById(input.lightId);
  if (!light) throw ApiError.notFound("Light not found.");

  const contractorId = await findResponsibleContractor(light.ward_id);
  const now = new Date();
  const deadlineAt = new Date(now.getTime() + REPAIR_DEADLINE_HOURS * 3600_000);

  return lightFaultRepository.create({
    lightId: light.id,
    reportedGpsLat: null,
    reportedGpsLng: null,
    deadlineAt,
    reportedByType: "staff",
    reportedByUserId: user.sub,
    reporterPhone: null,
    reporterNotes: input.notes,
    assignedContractorId: contractorId,
  });
}

/**
 * Public grievance - no login. The light may or may not be
 * identifiable by serial number; if not given or not found, the
 * report is still accepted with just the GPS coordinates, since
 * requiring an exact registry match would block genuine reports from
 * people who can't read a light's serial number in the dark.
 */
export async function reportFaultByPublic(input: {
  serialNumber: string | null;
  gpsLat: number;
  gpsLng: number;
  phone: string;
  notes: string | null;
}): Promise<LightFaultRow> {
  if (!/^[0-9]{10}$/.test(input.phone)) {
    throw ApiError.badRequest("Please provide a valid 10-digit phone number.");
  }

  const light = input.serialNumber ? await lightRepository.findBySerialNumber(input.serialNumber) : null;
  const contractorId = light ? await findResponsibleContractor(light.ward_id) : null;

  const now = new Date();
  const deadlineAt = new Date(now.getTime() + REPAIR_DEADLINE_HOURS * 3600_000);

  return lightFaultRepository.create({
    lightId: light?.id ?? null,
    reportedGpsLat: input.gpsLat,
    reportedGpsLng: input.gpsLng,
    deadlineAt,
    reportedByType: "public",
    reportedByUserId: null,
    reporterPhone: input.phone,
    reporterNotes: input.notes,
    assignedContractorId: contractorId,
  });
}

/**
 * Marks a fault repaired and runs one final penalty accrual pass
 * immediately - so the day of repair itself is captured even if
 * nobody views the penalty list again afterward (the lazy,
 * view-triggered accrual only scans still-OPEN faults).
 */
export async function markFaultRepaired(user: AttendanceTokenPayload, faultId: number, repairNotes: string | null): Promise<LightFaultRow> {
  const updated = await lightFaultRepository.markRepaired(faultId, user.sub, repairNotes);
  if (!updated) {
    const existing = await lightFaultRepository.findById(faultId);
    if (!existing) throw ApiError.notFound("Fault not found.");
    throw ApiError.badRequest("This fault has already been marked repaired.");
  }
  await accruePenaltiesForFault(updated);
  return updated;
}

/**
 * Links a fault that came in without a matched light (public report,
 * unreadable/unknown serial number) to a registry entry once staff
 * identify it in the field - also assigns the responsible contractor
 * at that point, since it couldn't be determined at report time.
 */
export async function linkFaultToLight(faultId: number, lightId: number): Promise<LightFaultRow> {
  const fault = await lightFaultRepository.findById(faultId);
  if (!fault) throw ApiError.notFound("Fault not found.");
  if (fault.light_id) throw ApiError.badRequest("This fault is already linked to a light.");

  const light = await lightRepository.findById(lightId);
  if (!light) throw ApiError.notFound("Light not found.");

  const contractorId = await findResponsibleContractor(light.ward_id);
  const updated = await lightFaultRepository.linkToLight(faultId, lightId, contractorId);
  if (!updated) throw ApiError.notFound("Fault not found.");
  return updated;
}
