import type { Request, Response } from "express";
import { z } from "zod";
import { createAttendanceUser, listAttendanceUsersWithWards } from "../services/attendanceUserManagement.service";
import { attendanceUserRepository } from "../repositories/attendanceUser.repository";
import { ATTENDANCE_ROLES } from "../types/attendance.types";
import { asyncHandler } from "../middleware/asyncHandler";
import { ApiError } from "../utils/ApiError";

/** GET /api/v1/attendance/users - attendance_admin only. */
export const listAttendanceUsersHandler = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listAttendanceUsersWithWards();
  res.status(200).json({ users });
});

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8),
  displayName: z.string().trim().min(1),
  role: z.enum(ATTENDANCE_ROLES as [string, ...string[]]),
  wardId: z.coerce.number().int().positive().nullish(),
});

/** POST /api/v1/attendance/users - attendance_admin only. */
export const createAttendanceUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid input", parsed.error.flatten().fieldErrors);

  const user = await createAttendanceUser({
    username: parsed.data.username,
    password: parsed.data.password,
    displayName: parsed.data.displayName,
    role: parsed.data.role as (typeof ATTENDANCE_ROLES)[number],
    wardId: parsed.data.wardId ?? null,
  });

  res.status(200).json({
    user: { id: user.id, username: user.username, displayName: user.display_name, role: user.role, wardId: user.ward_id, active: user.active },
  });
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const activeBodySchema = z.object({ active: z.boolean() });

/** PATCH /api/v1/attendance/users/:id/active - attendance_admin only. */
export const setAttendanceUserActiveHandler = asyncHandler(async (req: Request, res: Response) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) throw ApiError.badRequest("Invalid user id");
  const bodyParsed = activeBodySchema.safeParse(req.body);
  if (!bodyParsed.success) throw ApiError.badRequest("Body must include { active: boolean }");

  const updated = await attendanceUserRepository.setActive(paramsParsed.data.id, bodyParsed.data.active);
  if (!updated) throw ApiError.notFound("User not found");

  res.status(200).json({
    user: { id: updated.id, username: updated.username, displayName: updated.display_name, role: updated.role, wardId: updated.ward_id, active: updated.active },
  });
});
