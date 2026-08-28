import type { Request, Response } from "express";
import { z } from "zod";
import { fieldStaffRepository } from "../repositories/fieldStaff.repository";
import { fieldDriverRepository } from "../repositories/fieldDriver.repository";
import { fieldAssistantRepository } from "../repositories/fieldAssistant.repository";
import { staffJobRoleRepository } from "../repositories/staffJobRole.repository";
import { syncStaffRosterFromCsv, createOneStaff } from "../services/fieldStaffRoster.service";
import { syncDriverRosterFromCsv, createOneDriver, assignDriver } from "../services/fieldDriverRoster.service";
import {
  propagateSupervisorToAssistants,
  createOneAssistant,
  reassignAssistantDriver,
  syncAssistantRosterFromCsv,
} from "../services/fieldAssistantRoster.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export const listAllStaffHandler = asyncHandler(async (_req: Request, res: Response) => {
  const staff = await fieldStaffRepository.listAll();
  const rolesByStaff = await staffJobRoleRepository.listForStaffMany(staff.map((s) => s.id));
  res.status(200).json({
    staff: staff.map((s) => ({
      id: s.id,
      name: s.name,
      externalId: s.external_id,
      wardId: s.ward_id,
      shiftId: s.shift_id,
      active: s.active,
      roleIds: rolesByStaff.get(s.id) ?? [],
    })),
  });
});

export const listStaffJobRolesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await staffJobRoleRepository.listAll();
  res.status(200).json({ roles: roles.map((r) => ({ id: r.id, roleName: r.role_name })) });
});

const createStaffSchema = z.object({
  name: z.string().trim().min(1),
  externalId: z.string().trim().max(32).nullish(),
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
  roleIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const createStaffHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const staff = await createOneStaff(parsed.data.name, parsed.data.externalId ?? null, parsed.data.wardId, parsed.data.shiftId ?? null);
  if (parsed.data.roleIds && parsed.data.roleIds.length > 0) {
    await staffJobRoleRepository.setForStaff(staff.id, parsed.data.roleIds);
  }
  res.status(200).json({
    staff: {
      id: staff.id,
      name: staff.name,
      externalId: staff.external_id,
      wardId: staff.ward_id,
      shiftId: staff.shift_id,
      active: staff.active,
      roleIds: parsed.data.roleIds ?? [],
    },
  });
});

const staffIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
const activeBodySchema = z.object({ active: z.boolean() });

const setStaffRolesSchema = z.object({ roleIds: z.array(z.coerce.number().int().positive()) });

export const setStaffRolesHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid staff id");
  const bodyParsed = setStaffRolesSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const existing = await fieldStaffRepository.findById(paramsParsed.data.id);
  if (!existing) throw ApiError.notFound("Staff member not found");

  await staffJobRoleRepository.setForStaff(paramsParsed.data.id, bodyParsed.data.roleIds);
  res.status(200).json({ id: existing.id, roleIds: bodyParsed.data.roleIds });
});

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

export const uploadStaffRosterHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = csvUploadSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const result = await syncStaffRosterFromCsv(parsed.data.csvContent);
  res.status(200).json(result);
});

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export const listAllDriversHandler = asyncHandler(async (_req: Request, res: Response) => {
  const drivers = await fieldDriverRepository.listAll();
  res.status(200).json({
    drivers: drivers.map((d) => ({
      id: d.id,
      name: d.name,
      externalId: d.external_id,
      dlNumber: d.dl_number,
      wardId: d.ward_id,
      shiftId: d.shift_id,
      active: d.active,
      assetId: d.asset_id,
      supervisorId: d.supervisor_id,
    })),
  });
});

const createDriverSchema = z.object({
  name: z.string().trim().min(1),
  externalId: z.string().trim().max(32).nullish(),
  dlNumber: z.string().trim().nullish(),
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
  assetId: z.coerce.number().int().positive().nullish(),
});

export const createDriverHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createDriverSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const driver = await createOneDriver({
    name: parsed.data.name,
    externalId: parsed.data.externalId ?? null,
    dlNumber: parsed.data.dlNumber ?? null,
    wardId: parsed.data.wardId,
    shiftId: parsed.data.shiftId ?? null,
    assetId: parsed.data.assetId ?? null,
  });
  res.status(200).json({
    driver: {
      id: driver.id,
      name: driver.name,
      externalId: driver.external_id,
      dlNumber: driver.dl_number,
      wardId: driver.ward_id,
      shiftId: driver.shift_id,
      active: driver.active,
      assetId: driver.asset_id,
      supervisorId: driver.supervisor_id,
    },
  });
});

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
      dlNumber: updated.dl_number,
      wardId: updated.ward_id,
      shiftId: updated.shift_id,
      active: updated.active,
      assetId: updated.asset_id,
      supervisorId: updated.supervisor_id,
    },
  });
});

const transferDriverSchema = z.object({
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
});

export const transferDriverHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid driver id");
  const bodyParsed = transferDriverSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const existing = await fieldDriverRepository.findById(paramsParsed.data.id);
  if (!existing) throw ApiError.notFound("Driver not found");

  const updated = await fieldDriverRepository.transferWard(paramsParsed.data.id, bodyParsed.data.wardId, bodyParsed.data.shiftId ?? existing.shift_id);
  res.status(200).json({
    driver: {
      id: updated!.id,
      name: updated!.name,
      externalId: updated!.external_id,
      dlNumber: updated!.dl_number,
      wardId: updated!.ward_id,
      shiftId: updated!.shift_id,
      active: updated!.active,
      assetId: updated!.asset_id,
      supervisorId: updated!.supervisor_id,
    },
  });
});

const assignDriverSchema = z.object({
  assetId: z.coerce.number().int().positive().nullish(),
  supervisorId: z.coerce.number().int().positive().nullish(),
});

export const assignDriverHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid driver id");
  const bodyParsed = assignDriverSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const updated = await assignDriver(paramsParsed.data.id, bodyParsed.data.assetId ?? null, bodyParsed.data.supervisorId ?? null);
  await propagateSupervisorToAssistants(paramsParsed.data.id, bodyParsed.data.supervisorId ?? null);

  res.status(200).json({
    driver: {
      id: updated.id,
      name: updated.name,
      externalId: updated.external_id,
      dlNumber: updated.dl_number,
      wardId: updated.ward_id,
      shiftId: updated.shift_id,
      active: updated.active,
      assetId: updated.asset_id,
      supervisorId: updated.supervisor_id,
    },
  });
});

export const uploadDriverRosterHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = csvUploadSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const result = await syncDriverRosterFromCsv(parsed.data.csvContent);
  res.status(200).json(result);
});

// ---------------------------------------------------------------------------
// Assistants
// ---------------------------------------------------------------------------

export const listAllAssistantsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const assistants = await fieldAssistantRepository.listAll();
  res.status(200).json({
    assistants: assistants.map((a) => ({
      id: a.id,
      name: a.name,
      externalId: a.external_id,
      driverId: a.driver_id,
      wardId: a.ward_id,
      shiftId: a.shift_id,
      active: a.active,
      supervisorId: a.supervisor_id,
    })),
  });
});

const createAssistantSchema = z.object({
  name: z.string().trim().min(1),
  externalId: z.string().trim().max(32).nullish(),
  driverId: z.coerce.number().int().positive(),
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
});

export const createAssistantHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createAssistantSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const assistant = await createOneAssistant({
    name: parsed.data.name,
    externalId: parsed.data.externalId ?? null,
    driverId: parsed.data.driverId,
    wardId: parsed.data.wardId,
    shiftId: parsed.data.shiftId ?? null,
  });
  res.status(200).json({
    assistant: {
      id: assistant.id,
      name: assistant.name,
      externalId: assistant.external_id,
      driverId: assistant.driver_id,
      wardId: assistant.ward_id,
      shiftId: assistant.shift_id,
      active: assistant.active,
      supervisorId: assistant.supervisor_id,
    },
  });
});

export const setAssistantActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid assistant id");
  const bodyParsed = activeBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Body must include { active: boolean }");

  const updated = await fieldAssistantRepository.setActive(paramsParsed.data.id, bodyParsed.data.active);
  if (!updated) throw ApiError.notFound("Assistant not found");
  res.status(200).json({
    assistant: {
      id: updated.id,
      name: updated.name,
      externalId: updated.external_id,
      driverId: updated.driver_id,
      wardId: updated.ward_id,
      shiftId: updated.shift_id,
      active: updated.active,
      supervisorId: updated.supervisor_id,
    },
  });
});

const transferAssistantSchema = z.object({
  wardId: z.coerce.number().int().positive(),
  shiftId: z.coerce.number().int().positive().nullish(),
});

export const transferAssistantHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid assistant id");
  const bodyParsed = transferAssistantSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const existing = await fieldAssistantRepository.findById(paramsParsed.data.id);
  if (!existing) throw ApiError.notFound("Assistant not found");

  const updated = await fieldAssistantRepository.transferWard(paramsParsed.data.id, bodyParsed.data.wardId, bodyParsed.data.shiftId ?? existing.shift_id);
  res.status(200).json({
    assistant: {
      id: updated!.id,
      name: updated!.name,
      externalId: updated!.external_id,
      driverId: updated!.driver_id,
      wardId: updated!.ward_id,
      shiftId: updated!.shift_id,
      active: updated!.active,
      supervisorId: updated!.supervisor_id,
    },
  });
});

const reassignAssistantSchema = z.object({ driverId: z.coerce.number().int().positive() });

export const reassignAssistantDriverHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = staffIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid assistant id");
  const bodyParsed = reassignAssistantSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const updated = await reassignAssistantDriver(paramsParsed.data.id, bodyParsed.data.driverId);
  res.status(200).json({
    assistant: {
      id: updated.id,
      name: updated.name,
      externalId: updated.external_id,
      driverId: updated.driver_id,
      wardId: updated.ward_id,
      shiftId: updated.shift_id,
      active: updated.active,
      supervisorId: updated.supervisor_id,
    },
  });
});

export const uploadAssistantRosterHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = csvUploadSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const result = await syncAssistantRosterFromCsv(parsed.data.csvContent);
  res.status(200).json(result);
});
