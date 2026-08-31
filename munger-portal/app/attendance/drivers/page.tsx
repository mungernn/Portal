"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, LogIn, LogOut, UserX, Users, BookOpen } from "lucide-react";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { useAttendanceGuard } from "@/lib/use-attendance-guard";
import { fetchWardDriversToday, markDriverIn, markDriverAbsent, markDriverOut, type WardDriverToday } from "@/lib/attendance-api";

function statusBadge(status: string | null) {
  if (!status) return null;
  const map: Record<string, { label: string; className: string }> = {
    present: { label: "Present", className: "bg-green-100 text-green-700" },
    half_day: { label: "Half Day", className: "bg-amber-100 text-amber-700" },
    absent_informed: { label: "Absent (Informed)", className: "bg-slate-200 text-slate-700" },
    absent_not_informed: { label: "Absent (Not Informed)", className: "bg-red-100 text-red-700" },
    absent: { label: "Absent", className: "bg-red-100 text-red-700" },
  };
  const entry = map[status];
  if (!entry) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${entry.className}`}>
      {entry.label}
    </span>
  );
}

export default function DriverSupervisorAttendancePage() {
  const user = useAttendanceGuard(["driver_supervisor"]);
  const [drivers, setDrivers] = useState<WardDriverToday[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  async function loadDrivers() {
    if (!user?.wardId) return;
    try {
      const list = await fetchWardDriversToday(user.wardId);
      setDrivers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the driver list.");
    }
  }

  useEffect(() => {
    if (!user) return;
    loadDrivers();
    // user is stable after the guard resolves - intentionally not re-running on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleMarkIn(driverId: number) {
    setActingId(driverId);
    setError(null);
    try {
      await markDriverIn(driverId);
      await loadDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark in-time.");
    } finally {
      setActingId(null);
    }
  }

  async function handleMarkAbsent(driverId: number, informed: boolean) {
    setActingId(driverId);
    setError(null);
    try {
      await markDriverAbsent(driverId, informed);
      await loadDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark absence.");
    } finally {
      setActingId(null);
    }
  }

  async function handleMarkOut(driverId: number) {
    setActingId(driverId);
    setError(null);
    try {
      await markDriverOut(driverId);
      await loadDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark out-time.");
    } finally {
      setActingId(null);
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AttendanceHeader user={user} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Today&apos;s Driver Attendance - {user.wardName}</h1>
          <div className="flex items-center gap-4">
            <Link href="/attendance/assistants" className="inline-flex items-center gap-1.5 text-sm font-medium text-nnm-blue hover:underline">
              <Users className="h-4 w-4" />
              Assistant Attendance
            </Link>
            <Link href="/attendance/manage-assets" className="inline-flex items-center gap-1.5 text-sm font-medium text-nnm-blue hover:underline">
              <BookOpen className="h-4 w-4" />
              Vehicle Logbook
            </Link>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-500">Mark each driver in as they arrive, or mark them absent.</p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!drivers ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading drivers...
          </div>
        ) : drivers.length === 0 ? (
          <p className="text-sm text-slate-400">No drivers on file for your ward yet.</p>
        ) : (
          <div className="space-y-3">
            {drivers.map((d) => (
              <div key={d.driverId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{d.name}</span>
                    {statusBadge(d.status)}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {d.vehicleNumber ?? "No vehicle on file"}
                    {" - "}
                    {d.shiftName ?? "No shift assigned"}
                    {d.inTime && ` - In: ${d.inTime}`}
                    {d.outTime && ` - Out: ${d.outTime}`}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!d.status && (
                    <>
                      <button
                        onClick={() => handleMarkIn(d.driverId)}
                        disabled={actingId === d.driverId}
                        className="inline-flex items-center gap-1.5 rounded-md bg-nnm-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
                      >
                        {actingId === d.driverId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                        Mark In
                      </button>
                      <button
                        onClick={() => handleMarkAbsent(d.driverId, true)}
                        disabled={actingId === d.driverId}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Absent (Informed)
                      </button>
                      <button
                        onClick={() => handleMarkAbsent(d.driverId, false)}
                        disabled={actingId === d.driverId}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Absent (Not Informed)
                      </button>
                    </>
                  )}
                  {d.status && (d.status === "present" || d.status === "half_day") && !d.outTime && (
                    <button
                      onClick={() => handleMarkOut(d.driverId)}
                      disabled={actingId === d.driverId}
                      className="inline-flex items-center gap-1.5 rounded-md border border-nnm-blue px-3 py-1.5 text-xs font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                    >
                      {actingId === d.driverId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                      Mark Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
