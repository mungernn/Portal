import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";
import {
  createChallenge,
  enrolFace,
  enrolmentLogPhotos,
  enrolmentPhoto,
  faceConfig,
  facePunch,
  faceSummary,
  listEnrolments,
  listForReview,
  punchPhoto,
  removeEnrolment,
  reviewEnrolment,
  reviewPunch,
  wardEnrolmentStatus,
  type PersonRef,
} from "../services/faceAttendance.service";

const idParam = z.object({ id: z.coerce.number().int().positive() });
const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const personType = z.enum(["staff", "driver", "assistant"]);

/** Accepts { personType, personId } or the older { staffId } (= Safai staff). */
function personFromBody(body: unknown): PersonRef | null {
  const p = z
    .object({ personType: personType.optional(), personId: z.coerce.number().int().positive().optional(), staffId: z.coerce.number().int().positive().optional() })
    .safeParse(body ?? {});
  if (!p.success) return null;
  if (p.data.personId) return { type: p.data.personType ?? "staff", id: p.data.personId };
  if (p.data.staffId) return { type: "staff", id: p.data.staffId };
  return null;
}

/** Route forms: /:type/:id or the older /:staffId (= Safai staff). */
function personFromParams(params: Record<string, string | undefined>): PersonRef | null {
  if (params.type) {
    const t = personType.safeParse(params.type);
    const i = idParam.safeParse({ id: params.id });
    return t.success && i.success ? { type: t.data, id: i.data.id } : null;
  }
  const i = idParam.safeParse({ id: params.staffId });
  return i.success ? { type: "staff", id: i.data.id } : null;
}

export const getFaceConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json(faceConfig());
});

export const postFaceChallenge = asyncHandler(async (req: Request, res: Response) => {
  const ref = personFromBody(req.body);
  const b = z.object({ purpose: z.enum(["in", "out", "enrol"]) }).safeParse(req.body);
  if (!ref || !b.success) throw ApiError.badRequest("Invalid request");
  res.json(await createChallenge(req.attendanceUser!, ref, b.data.purpose));
});

const photosSchema = z.object({ challengeId: z.string().uuid(), frontImage: z.string().min(100), turnImage: z.string().min(100) });

export const postFacePunch = asyncHandler(async (req: Request, res: Response) => {
  const b = photosSchema.safeParse(req.body);
  if (!b.success) throw ApiError.badRequest("Both photos are required.");
  res.json(await facePunch(req.attendanceUser!, b.data.challengeId, b.data.frontImage, b.data.turnImage));
});

export const postFaceEnrol = asyncHandler(async (req: Request, res: Response) => {
  const b = photosSchema.extend({ consent: z.boolean(), aadhaarImage: z.string().min(100).optional() }).safeParse(req.body);
  if (!b.success) throw ApiError.badRequest("Both photos and the consent tick are required.");
  if (!b.data.aadhaarImage) throw ApiError.badRequest("A photo of the worker's Aadhaar card is required for enrolment.");
  res
    .status(201)
    .json(await enrolFace(req.attendanceUser!, b.data.challengeId, b.data.frontImage, b.data.turnImage, b.data.consent, b.data.aadhaarImage));
});

export const deleteFaceEnrolment = asyncHandler(async (req: Request, res: Response) => {
  const ref = personFromParams(req.params);
  if (!ref) throw ApiError.badRequest("Invalid worker");
  res.json(await removeEnrolment(req.attendanceUser!, ref));
});

export const getWardFaceEnrolments = asyncHandler(async (req: Request, res: Response) => {
  const p = idParam.safeParse({ id: req.params.wardId });
  const t = personType.default("staff").safeParse(req.query.type);
  if (!p.success || !t.success) throw ApiError.badRequest("Invalid ward id");
  res.json({ staff: await wardEnrolmentStatus(p.data.id, t.data) });
});

export const getFaceEnrolmentPhoto = asyncHandler(async (req: Request, res: Response) => {
  const ref = personFromParams(req.params);
  if (!ref) throw ApiError.badRequest("Invalid worker");
  res.json(await enrolmentPhoto(ref));
});

export const getFaceEnrolmentLog = asyncHandler(async (req: Request, res: Response) => {
  const q = z
    .object({
      kind: z.enum(["pending", "flagged", "all"]).default("all"),
      type: personType.optional(),
      wardId: z.coerce.number().int().positive().optional(),
      from: dateStr.optional(),
      to: dateStr.optional(),
    })
    .safeParse(req.query);
  if (!q.success) throw ApiError.badRequest("Invalid filter");
  res.json({ entries: await listEnrolments(q.data) });
});

export const getFaceEnrolmentLogPhotos = asyncHandler(async (req: Request, res: Response) => {
  const p = idParam.safeParse(req.params);
  if (!p.success) throw ApiError.badRequest("Invalid id");
  res.json(await enrolmentLogPhotos(req.attendanceUser!, p.data.id));
});

export const postFaceEnrolmentReview = asyncHandler(async (req: Request, res: Response) => {
  const p = idParam.safeParse(req.params);
  const b = z.object({ decision: z.enum(["accepted", "rejected"]), remarks: z.string().max(500).nullish() }).safeParse(req.body);
  if (!p.success || !b.success) throw ApiError.badRequest("Invalid request");
  res.json(await reviewEnrolment(req.attendanceUser!, p.data.id, b.data.decision, b.data.remarks ?? null));
});

export const getFaceReview = asyncHandler(async (req: Request, res: Response) => {
  const q = z
    .object({ kind: z.enum(["pending", "rejected", "all"]).default("pending"), date: dateStr.optional(), wardId: z.coerce.number().int().positive().optional() })
    .safeParse(req.query);
  if (!q.success) throw ApiError.badRequest("Invalid filter");
  res.json({ entries: await listForReview(q.data) });
});

export const getFacePunchPhoto = asyncHandler(async (req: Request, res: Response) => {
  const p = idParam.safeParse(req.params);
  if (!p.success) throw ApiError.badRequest("Invalid id");
  res.json(await punchPhoto(p.data.id));
});

export const postFaceReview = asyncHandler(async (req: Request, res: Response) => {
  const p = idParam.safeParse(req.params);
  const b = z.object({ decision: z.enum(["accepted", "rejected"]), remarks: z.string().max(500).nullish() }).safeParse(req.body);
  if (!p.success || !b.success) throw ApiError.badRequest("Invalid request");
  res.json(await reviewPunch(req.attendanceUser!, p.data.id, b.data.decision, b.data.remarks ?? null));
});

export const getFaceSummary = asyncHandler(async (req: Request, res: Response) => {
  const d = typeof req.query.date === "string" && dateStr.safeParse(req.query.date).success ? req.query.date : undefined;
  res.json(await faceSummary(d));
});
