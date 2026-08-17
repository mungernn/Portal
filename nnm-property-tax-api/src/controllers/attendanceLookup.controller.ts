import type { Request, Response } from "express";
import { attendanceWardRepository, attendanceShiftRepository } from "../repositories/attendanceWard.repository";
import { asyncHandler } from "../middleware/asyncHandler";

/** GET /api/v1/attendance/wards - any authenticated attendance user. */
export const getAttendanceWards = asyncHandler(async (_req: Request, res: Response) => {
  const wards = await attendanceWardRepository.listAll();
  res.status(200).json({ wards: wards.map((w) => ({ id: w.id, wardName: w.ward_name })) });
});

/** GET /api/v1/attendance/shifts - any authenticated attendance user. */
export const getAttendanceShifts = asyncHandler(async (_req: Request, res: Response) => {
  const shifts = await attendanceShiftRepository.listAll();
  res.status(200).json({
    shifts: shifts.map((s) => ({
      id: s.id,
      shiftName: s.shift_name,
      startTime: s.start_time,
      endTime: s.end_time,
      graceMinutes: s.grace_minutes,
    })),
  });
});
