import type { Request, Response } from "express";
import fs from "node:fs";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {
  addAgency,
  addItem,
  applicationPath,
  auditTrail,
  createPyau,
  dashboard,
  getIssue,
  listAgencies,
  listContractors,
  markRepaired,
  photoPath,
  pyauHistory,
  removeItem,
  reportFault,
  setParshadApplication,
  updatePyau,
  type Officer,
} from "../services/pyauOfficer.service";

function officer(req: Request): Officer {
  if (!req.admin) throw new ApiError(401, "Not signed in.");
  return { username: req.admin.username, displayName: req.admin.displayName, role: req.admin.role };
}

const idParam = z.object({ id: z.coerce.number().int().positive() });
const parseId = (req: Request) => {
  const p = idParam.safeParse(req.params);
  if (!p.success) throw ApiError.badRequest("Invalid id.");
  return p.data.id;
};
const fileSchema = z.object({ base64: z.string().min(1), mimeType: z.string().min(1) });
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date (YYYY-MM-DD).");
const text = z
  .string()
  .trim()
  .nullish()
  .transform((v) => v || null);
const intN = z.coerce
  .number()
  .int()
  .nonnegative()
  .nullish()
  .transform((v) => (v === undefined ? null : v));
const numN = z.coerce
  .number()
  .nullish()
  .transform((v) => (v === undefined ? null : v));

const detailsSchema = z.object({
  locationAddress: text,
  latitude: numN.refine((v) => v === null || (v >= -90 && v <= 90), "Latitude must be between -90 and 90."),
  longitude: numN.refine((v) => v === null || (v >= -180 && v <= 180), "Longitude must be between -180 and 180."),
  schemeName: text,
  overheadTankCount: z.coerce.number().int().nonnegative().default(0),
  housesServed: intN,
  waterTapCount: intN,
  standpostCount: intN,
  structureType: z
    .enum(["pcc_structure", "iron_stand", "nothing"])
    .nullish()
    .transform((v) => v ?? null),
  tankStandType: text,
  pumpDetails: text,
  boringDepthFeet: numN,
  casingDetails: text,
  installedDate: date
    .nullish()
    .or(z.literal(""))
    .transform((v) => v || null),
  builderName: text,
  builderContact: text,
  remarks: text,
  agencyId: z.coerce
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? null),
  maintenanceContractorId: z.coerce
    .number()
    .int()
    .positive()
    .nullish()
    .transform((v) => v ?? null),
  underBuilderMaintenance: z.boolean().default(false),
});

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const r = schema.safeParse(body);
  if (!r.success) {
    const first = Object.values(r.error.flatten().fieldErrors).flat()[0];
    throw ApiError.badRequest(typeof first === "string" ? first : "Invalid input", r.error.flatten().fieldErrors);
  }
  return r.data;
}

/** GET /admin/pyau/dashboard?wardId= */
export const getPyauDashboard = asyncHandler(async (req: Request, res: Response) => {
  const w = z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .safeParse(req.query.wardId || undefined);
  const [data, agencies, contractors] = await Promise.all([
    dashboard(w.success ? (w.data ?? null) : null),
    listAgencies(),
    listContractors(),
  ]);
  res.json({ ...data, agencies, contractors });
});

export const postPyauAgency = asyncHandler(async (req: Request, res: Response) => {
  const b = parse(z.object({ name: z.string().trim().min(1, "Enter the agency name.").max(255) }), req.body);
  res.json({ agency: await addAgency(b.name, officer(req)) });
});

export const postPyau = asyncHandler(async (req: Request, res: Response) => {
  const b = parse(detailsSchema.extend({ wardId: z.coerce.number().int().positive() }), req.body);
  const { wardId, ...d } = b;
  res.json({ pyau: await createPyau(wardId, d, officer(req)) });
});

export const putPyau = asyncHandler(async (req: Request, res: Response) => {
  res.json({ pyau: await updatePyau(parseId(req), parse(detailsSchema, req.body), officer(req)) });
});

export const postPyauFault = asyncHandler(async (req: Request, res: Response) => {
  const b = parse(
    z.object({
      dateOfIssue: date,
      notes: z.string().trim().min(1, "Describe the fault.").max(2000),
      photos: z.array(fileSchema).length(4, "Take all 4 photos of the fault."),
      application: fileSchema.nullish(),
      applicationDate: date.nullish(),
    }),
    req.body,
  );
  res.json({ issue: await reportFault(parseId(req), b, officer(req)) });
});

export const getPyauIssue = asyncHandler(async (req: Request, res: Response) => {
  res.json({ issue: await getIssue(parseId(req)) });
});

export const postPyauApplication = asyncHandler(async (req: Request, res: Response) => {
  const b = parse(z.object({ file: fileSchema, applicationDate: date }), req.body);
  res.json({ issue: await setParshadApplication(parseId(req), b.file, b.applicationDate, officer(req)) });
});

export const postPyauItem = asyncHandler(async (req: Request, res: Response) => {
  const b = parse(
    z.object({
      itemName: z.string().trim().min(1, "Enter the item.").max(500),
      quantity: z.coerce
        .number()
        .positive()
        .nullish()
        .transform((v) => v ?? null),
      cost: z.coerce.number().nonnegative("Cost cannot be negative.").max(10_000_000),
    }),
    req.body,
  );
  res.json({ issue: await addItem(parseId(req), b, officer(req)) });
});

export const deletePyauItem = asyncHandler(async (req: Request, res: Response) => {
  res.json({ issue: await removeItem(parseId(req), officer(req)) });
});

export const postPyauRepaired = asyncHandler(async (req: Request, res: Response) => {
  const b = parse(
    z.object({ dateOfRepair: date, notes: text, photos: z.array(fileSchema).length(4, "Take all 4 photos after the repair.") }),
    req.body,
  );
  res.json({ issue: await markRepaired(parseId(req), b, officer(req)) });
});

export const getPyauHistory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await pyauHistory(parseId(req)));
});

export const getPyauAuditTrail = asyncHandler(async (req: Request, res: Response) => {
  const q = z
    .object({
      wardId: z.coerce.number().int().positive().optional(),
      from: date.optional(),
      to: date.optional(),
      limit: z.coerce.number().int().min(1).max(5000).default(1000),
    })
    .safeParse(Object.fromEntries(Object.entries(req.query).filter(([, v]) => v !== "")));
  if (!q.success) throw ApiError.badRequest("Invalid filter.");
  res.json({
    events: await auditTrail({ wardId: q.data.wardId ?? null, from: q.data.from ?? null, to: q.data.to ?? null, limit: q.data.limit }),
  });
});

export const getPyauPhoto = asyncHandler(async (req: Request, res: Response) => {
  const p = await photoPath(parseId(req));
  if (!fs.existsSync(p)) throw ApiError.notFound("Photo file is missing from storage.");
  res.sendFile(p);
});

export const getPyauApplication = asyncHandler(async (req: Request, res: Response) => {
  const a = await applicationPath(parseId(req));
  if (!fs.existsSync(a.path)) throw ApiError.notFound("File is missing from storage.");
  res.type(a.mime).sendFile(a.path);
});
