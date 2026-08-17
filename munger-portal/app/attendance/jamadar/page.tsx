"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Loader2, LogIn, LogOut, UserX } from "lucide-react";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { useAttendanceGuard } from "@/lib/use-attendance-guard";
import {
  fetchWardWorkersToday,
  markStaffIn,
  markStaffAbsent,
  markStaffOut,
  uploadWardPhoto,
  fetchWardPhotoToday,
  type WardWorkerToday,
} from "@/lib/attendance-api";

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

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, base64] = result.split(",");
      resolve({ base64: base64 ?? "", mimeType: file.type });
    };
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export default function JamadarAttendancePage() {
  const user = useAttendanceGuard(["jamadar"]);
  const [workers, setWorkers] = useState<WardWorkerToday[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const [photoUploaded, setPhotoUploaded] = useState<boolean | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadWorkers() {
    if (!user?.wardId) return;
    try {
      const list = await fetchWardWorkersToday(user.wardId);
      setWorkers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the worker list.");
    }
  }

  async function loadPhotoStatus() {
    if (!user?.wardId) return;
    try {
      const photo = await fetchWardPhotoToday(user.wardId);
      setPhotoUploaded(Boolean(photo));
    } catch {
      setPhotoUploaded(null);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadWorkers();
    loadPhotoStatus();
    // user is stable after the guard resolves - intentionally not re-running on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleMarkIn(staffId: number) {
    setActingId(staffId);
    setError(null);
    try {
      await markStaffIn(staffId);
      await loadWorkers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark in-time.");
    } finally {
      setActingId(null);
    }
  }

  async function handleMarkAbsent(staffId: number, informed: boolean) {
    setActingId(staffId);
    setError(null);
    try {
      await markStaffAbsent(staffId, informed);
      await loadWorkers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark absence.");
    } finally {
      setActingId(null);
    }
  }

  async function handleMarkOut(staffId: number) {
    setActingId(staffId);
    setError(null);
    try {
      await markStaffOut(staffId);
      await loadWorkers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark out-time.");
    } finally {
      setActingId(null);
    }
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      await uploadWardPhoto(base64, mimeType);
      setPhotoUploaded(true);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AttendanceHeader user={user} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Today&apos;s Attendance - {user.wardName}</h1>
        <p className="mb-6 text-sm text-slate-500">Mark each worker in as they arrive, or mark them absent.</p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Camera className="h-4 w-4" />
            Daily Group Photo
          </h2>
          {photoUploaded === true ? (
            <p className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Uploaded for today.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">One group photo per day for your ward.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={handlePhotoSelected}
                disabled={photoUploading}
                className="text-sm"
              />
              {photoUploading && (
                <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </span>
              )}
              {photoError && <p className="mt-2 text-xs text-red-600">{photoError}</p>}
            </>
          )}
        </section>

        {!workers ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading workers...
          </div>
        ) : workers.length === 0 ? (
          <p className="text-sm text-slate-400">No workers on file for your ward yet.</p>
        ) : (
          <div className="space-y-3">
            {workers.map((w) => (
              <div key={w.staffId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{w.name}</span>
                    {statusBadge(w.status)}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {w.shiftName ?? "No shift assigned"}
                    {w.inTime && ` - In: ${w.inTime}`}
                    {w.outTime && ` - Out: ${w.outTime}`}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!w.status && (
                    <>
                      <button
                        onClick={() => handleMarkIn(w.staffId)}
                        disabled={actingId === w.staffId}
                        className="inline-flex items-center gap-1.5 rounded-md bg-nnm-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
                      >
                        {actingId === w.staffId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                        Mark In
                      </button>
                      <button
                        onClick={() => handleMarkAbsent(w.staffId, true)}
                        disabled={actingId === w.staffId}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Absent (Informed)
                      </button>
                      <button
                        onClick={() => handleMarkAbsent(w.staffId, false)}
                        disabled={actingId === w.staffId}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        Absent (Not Informed)
                      </button>
                    </>
                  )}
                  {w.status && (w.status === "present" || w.status === "half_day") && !w.outTime && (
                    <button
                      onClick={() => handleMarkOut(w.staffId)}
                      disabled={actingId === w.staffId}
                      className="inline-flex items-center gap-1.5 rounded-md border border-nnm-blue px-3 py-1.5 text-xs font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                    >
                      {actingId === w.staffId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
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
