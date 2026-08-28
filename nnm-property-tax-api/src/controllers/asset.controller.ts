import type { Request, Response } from "express";
import { z } from "zod";
import { assetRepository } from "../repositories/asset.repository";
import { assetMaintenanceLogRepository } from "../repositories/assetMaintenanceLog.repository";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

const ASSET_TYPES = ["vehicle", "tricycle", "hand_cart"] as const;
const ASSET_STATUSES = ["working", "under_repair", "not_working"] as const;
const LOG_TYPES = ["service", "repair", "status_update", "note"] as const;

export const listAllAssetsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const assets = await assetRepository.listAll();
  const assetIds = assets.map((a) => a.id);
  const [wardsByAsset, lastServiced, lastRepaired] = await Promise.all([
    assetRepository.listWardIdsForAssetMany(assetIds),
    assetMaintenanceLogRepository.lastDateByTypeMany(assetIds, "service"),
    assetMaintenanceLogRepository.lastDateByTypeMany(assetIds, "repair"),
  ]);
  res.status(200).json({
    assets: assets.map((a) => ({
      id: a.id,
      assetType: a.asset_type,
      label: a.label,
      vehicleNumber: a.vehicle_number,
      chassisNumber: a.chassis_number,
      currentStatus: a.current_status,
      notWorkingSince: a.not_working_since,
      soundSystemStatus: a.sound_system_status,
      batteryStatus: a.battery_status,
      active: a.active,
      wardIds: wardsByAsset.get(a.id) ?? [],
      lastServicedOn: lastServiced.get(a.id) ?? null,
      lastRepairedOn: lastRepaired.get(a.id) ?? null,
    })),
  });
});

const createAssetSchema = z.object({
  assetType: z.enum(ASSET_TYPES),
  label: z.string().trim().min(1),
  vehicleNumber: z.string().trim().nullish(),
  chassisNumber: z.string().trim().nullish(),
  wardIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const createAssetHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createAssetSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const asset = await assetRepository.create({
    assetType: parsed.data.assetType,
    label: parsed.data.label,
    vehicleNumber: parsed.data.vehicleNumber ?? null,
    chassisNumber: parsed.data.chassisNumber ?? null,
  });
  if (parsed.data.wardIds && parsed.data.wardIds.length > 0) {
    await assetRepository.setWards(asset.id, parsed.data.wardIds);
  }
  res.status(200).json({
    asset: {
      id: asset.id,
      assetType: asset.asset_type,
      label: asset.label,
      vehicleNumber: asset.vehicle_number,
      chassisNumber: asset.chassis_number,
      currentStatus: asset.current_status,
      active: asset.active,
      wardIds: parsed.data.wardIds ?? [],
    },
  });
});

const assetIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

const setWardsSchema = z.object({ wardIds: z.array(z.coerce.number().int().positive()) });

export const setAssetWardsHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = assetIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid asset id");
  const bodyParsed = setWardsSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const asset = await assetRepository.findById(paramsParsed.data.id);
  if (!asset) throw ApiError.notFound("Asset not found");

  await assetRepository.setWards(paramsParsed.data.id, bodyParsed.data.wardIds);
  res.status(200).json({ id: paramsParsed.data.id, wardIds: bodyParsed.data.wardIds });
});

const activeBodySchema = z.object({ active: z.boolean() });

export const setAssetActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = assetIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid asset id");
  const bodyParsed = activeBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Body must include { active: boolean }");

  const updated = await assetRepository.setActive(paramsParsed.data.id, bodyParsed.data.active);
  if (!updated) throw ApiError.notFound("Asset not found");
  res.status(200).json({ asset: { id: updated.id, active: updated.active } });
});

export const listAssetMaintenanceLogHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = assetIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid asset id");

  const asset = await assetRepository.findById(paramsParsed.data.id);
  if (!asset) throw ApiError.notFound("Asset not found");

  const log = await assetMaintenanceLogRepository.listForAsset(paramsParsed.data.id);
  res.status(200).json({
    log: log.map((l) => ({ id: l.id, logType: l.log_type, logDate: l.log_date, notes: l.notes, loggedBy: l.logged_by, createdAt: l.created_at })),
  });
});

const logMaintenanceSchema = z.object({
  logType: z.enum(LOG_TYPES),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "logDate must be YYYY-MM-DD"),
  notes: z.string().trim().nullish(),
  updateStatus: z
    .object({
      currentStatus: z.enum(ASSET_STATUSES),
      notWorkingSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
      soundSystemStatus: z.string().trim().nullish(),
      batteryStatus: z.string().trim().nullish(),
    })
    .nullish(),
});

export const logAssetMaintenanceHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = assetIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid asset id");
  const bodyParsed = logMaintenanceSchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Invalid input", bodyParsed.error.flatten().fieldErrors);

  const asset = await assetRepository.findById(paramsParsed.data.id);
  if (!asset) throw ApiError.notFound("Asset not found");

  const user = req.attendanceUser!;
  const entry = await assetMaintenanceLogRepository.create({
    assetId: paramsParsed.data.id,
    logType: bodyParsed.data.logType,
    logDate: bodyParsed.data.logDate,
    notes: bodyParsed.data.notes ?? null,
    loggedBy: user.username,
  });

  let updatedAsset = asset;
  if (bodyParsed.data.updateStatus) {
    const s = bodyParsed.data.updateStatus;
    updatedAsset =
      (await assetRepository.updateStatus(paramsParsed.data.id, {
        currentStatus: s.currentStatus,
        notWorkingSince: s.notWorkingSince ?? null,
        soundSystemStatus: s.soundSystemStatus ?? asset.sound_system_status,
        batteryStatus: s.batteryStatus ?? asset.battery_status,
      })) ?? asset;
  }

  res.status(200).json({
    logEntry: { id: entry.id, logType: entry.log_type, logDate: entry.log_date, notes: entry.notes, loggedBy: entry.logged_by },
    asset: { id: updatedAsset.id, currentStatus: updatedAsset.current_status, notWorkingSince: updatedAsset.not_working_since },
  });
});
