import type { Request, Response } from "express";
import { z } from "zod";
import { fieldStaffRepository } from "../repositories/fieldStaff.repository";
import { fieldDriverRepository } from "../repositories/fieldDriver.repository";
import { syncStaffRosterFromCsv, createOneStaff } from "../services/fieldStaffRoster.service";
import { syncDriverRosterFromCsv, createOneDriver } from "../services/fieldDriverRoster.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/** GET /api/v1/attendance/staff/all - attendance_admin only. Full roster (all wards), for the management page. */
export const listAllStaffHandler = asyncHandler(async (_req: Request, res: Response) => {
  const staff = await fieldStaffRepository.listAll();
  res.status(200).json({
    staff: staff.map((s) => ({ id: s.id, name: s.name, externalId: s.external_id, wardId: s.ward_id, shiftId: s.shift_id, active: s.active })),
  });
});

const createStaffSchema = z.object({
  name: z.string().trim().min(1),
  externalId: z.string().trim().max(32).nullish(),
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
});

/** POST /api/v1/attendance/staff - attendance_admin only. One-by-one entry. */
export const createStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const staff = await createOneStaff(parsed.data.name, parsed.data.externalId ?? null, parsed.data.wardId, parsed.data.shiftId ?? null);
  res.status(200).json({
    staff: { id: staff.id, name: staff.name, externalId: staff.external_id, wardId: staff.ward_id, shiftId: staff.shift_id, active: staff.active },
  });
});

const staffIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
const activeBodySchema = z.object({ active: z.boolean() });

/** PATCH /api/v1/attendance/staff/:id/active - attendance_admin only. */
export const setStaffActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid staff id");
  const bodyParsed = activeBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Body must include { active: boolean }");

  const updated = await fieldStaffRepository.setActive(paramsParsed.data.id, bodyParsed.data.active);
  if (!updated) throw ApiError.notFound("Staff member not found");
  res.status(200).json({
    staff: { id: updated.id, name: updated.name, externalId: updated.external_id, wardId: updated.ward_id, shiftId: updated.shift_id, active: updated.active },
  });
});

const transferStaffSchema = z.object({
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
});

/**
 * PATCH /api/v1/attendance/staff/:id/transfer - attendance_admin OR
 * sanitation_officer. Deliberately a separate, narrower endpoint from
 * the general roster edit - a sanitation officer can move an existing
 * worker between wards (and optionally shift) but cannot create,
 * rename, or deactivate anyone; only attendance_admin has those.
 */
export const transferStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid staff id");
  const bodyParsed = transferStaffSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const existing = await fieldStaffRepository.findById(paramsParsed.data.id);
  if (!existing) throw ApiError.notFound("Staff member not found");

  const updated = await fieldStaffRepository.update(paramsParsed.data.id, {
    wardId: bodyParsed.data.wardId,
    shiftId: bodyParsed.data.shiftId ?? existing.shift_id,
    active: existing.active,
  });
  res.status(200).json({
    staff: {
      id: updated!.id,
      name: updated!.name,
      externalId: updated!.external_id,
      wardId: updated!.ward_id,
      shiftId: updated!.shift_id,
      active: updated!.active,
    },
  });
});

const csvUploadSchema = z.object({ csvContent: z.string().min(1, "File appears to be empty") });

/**
 * POST /api/v1/attendance/staff/bulk-upload - attendance_admin only.
 * Body: { csvContent: string } - the frontend reads the file client-side
 * (FileReader/.text()) and sends its raw text, rather than a multipart
 * upload - keeps this consistent with the rest of the API's plain-JSON
 * design instead of adding a file-upload middleware dependency.
 */
export const uploadStaffRosterHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = csvUploadSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const result = await syncStaffRosterFromCsv(parsed.data.csvContent);
  res.status(200).json(result);
});

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

/** GET /api/v1/attendance/drivers/all - attendance_admin only. */
export const listAllDriversHandler = asyncHandler(async (_req: Request, res: Response) => {
  const drivers = await fieldDriverRepository.listAll();
  res.status(200).json({
    drivers: drivers.map((d) => ({
      id: d.id,
      name: d.name,
      externalId: d.external_id,
      vehicleNumber: d.vehicle_number,
      chassisNumber: d.chassis_number,
      dlNumber: d.dl_number,
      wardNo: d.ward_no,
      wardId: d.ward_id,
      shiftId: d.shift_id,
      active: d.active,
    })),
  });
});

const createDriverSchema = z.object({
  name: z.string().trim().min(1),
  externalId: z.string().trim().max(32).nullish(),
  vehicleNumber: z.string().trim().nullish(),
  chassisNumber: z.string().trim().nullish(),
  dlNumber: z.string().trim().nullish(),
  wardNo: z.string().trim().nullish(),
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
});

/** POST /api/v1/attendance/drivers - attendance_admin only. One-by-one entry. */
export const createDriverHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createDriverSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const driver = await createOneDriver({
    name: parsed.data.name,
    externalId: parsed.data.externalId ?? null,
    vehicleNumber: parsed.data.vehicleNumber ?? null,
    chassisNumber: parsed.data.chassisNumber ?? null,
    dlNumber: parsed.data.dlNumber ?? null,
    wardNo: parsed.data.wardNo ?? null,
    wardId: parsed.data.wardId,
    shiftId: parsed.data.shiftId ?? null,
  });
  res.status(200).json({
    driver: {
      id: driver.id,
      name: driver.name,
      externalId: driver.external_id,
      vehicleNumber: driver.vehicle_number,
      chassisNumber: driver.chassis_number,
      dlNumber: driver.dl_number,
      wardNo: driver.ward_no,
      wardId: driver.ward_id,
      shiftId: driver.shift_id,
      active: driver.active,
    },
  });
});

/** PATCH /api/v1/attendance/drivers/:id/active - attendance_admin only. */
export const setDriverActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid driver id");
  const bodyParsed = activeBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Body must include { active: boolean }");

  const updated = await fieldDriverRepository.setActive(paramsParsed.data.id, bodyParsed.data.active);
  if (!updated) throw ApiError.notFound("Driver not found");
  res.status(200).json({
    driver: {
      id: updated.id,
      name: updated.name,
      externalId: updated.external_id,
      vehicleNumber: updated.vehicle_number,
      chassisNumber: updated.chassis_number,
      dlNumber: updated.dl_number,
      wardNo: updated.ward_no,
      wardId: updated.ward_id,
      shiftId: updated.shift_id,
      active: updated.active,
    },
  });
});

const transferDriverSchema = z.object({
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
});

/**
 * PATCH /api/v1/attendance/drivers/:id/transfer - attendance_admin OR
 * sanitation_officer. Same narrower scope as transferStaffHandler -
 * moves an existing driver between wards (and optionally shift) only;
 * creating, renaming, or deactivating stays attendance_admin-only.
 */
export const transferDriverHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid driver id");
  const bodyParsed = transferDriverSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const existing = await fieldDriverRepository.findById(paramsParsed.data.id);
  if (!existing) throw ApiError.notFound("Driver not found");

  const updated = await fieldDriverRepository.update(paramsParsed.data.id, {
    vehicleNumber: existing.vehicle_number,
    chassisNumber: existing.chassis_number,
    dlNumber: existing.dl_number,
    wardNo: existing.ward_no,
    wardId: bodyParsed.data.wardId,
    shiftId: bodyParsed.data.shiftId ?? existing.shift_id,
    active: existing.active,
  });
  res.status(200).json({
    driver: {
      id: updated!.id,
      name: updated!.name,
      externalId: updated!.external_id,
      vehicleNumber: updated!.vehicle_number,
      chassisNumber: updated!.chassis_number,
      dlNumber: updated!.dl_number,
      wardNo: updated!.ward_no,
      wardId: updated!.ward_id,
      shiftId: updated!.shift_id,
      active: updated!.active,
    },
  });
});
export const uploadDriverRosterHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = csvUploadSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const result = await syncDriverRosterFromCsv(parsed.data.csvContent);
  res.status(200).json(result);
});
