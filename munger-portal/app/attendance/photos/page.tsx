"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Camera, Loader2 } from "lucide-react";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { useAttendanceGuard } from "@/lib/use-attendance-guard";
import { fetchAllWardPhotos, fetchWardPhotoBlobUrl, type WardPhotoInfo } from "@/lib/attendance-api";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePhotosPage() {
  const user = useAttendanceGuard(["sanitation_officer", "sanitation_prabhari", "attendance_admin"]);
  const [date, setDate] = useState(todayIsoDate());
  const [wards, setWards] = useState<WardPhotoInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openPhotoUrl, setOpenPhotoUrl] = useState<string | null>(null);
  const [openPhotoWard, setOpenPhotoWard] = useState<string | null>(null);
  const [loadingPhotoWardId, setLoadingPhotoWardId] = useState<number | null>(null);

  async function loadWards() {
    setError(null);
    try {
      const list = await fetchAllWardPhotos(date);
      setWards(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load ward photo statuses.");
    }
  }

  useEffect(() => {
    if (!user) return;
    loadWards();
    // date changes are handled by the explicit "Refresh" button below to avoid re-fetching on every keystroke of a date input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleViewPhoto(wardId: number, wardName: string) {
    setLoadingPhotoWardId(wardId);
    setError(null);
    try {
      const url = await fetchWardPhotoBlobUrl(wardId, date);
      setOpenPhotoUrl(url);
      setOpenPhotoWard(wardName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this photo.");
    } finally {
      setLoadingPhotoWardId(null);
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AttendanceHeader user={user} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Daily Group Photos</h1>
        <p className="mb-6 text-sm text-slate-500">One photo per ward per day, uploaded by that ward&apos;s Jamadar.</p>

        <div className="mb-6 flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
            />
          </div>
          <button
            onClick={loadWards}
            className="rounded-md bg-nnm-blue px-5 py-2 text-sm font-semibold text-white hover:bg-nnm-blue-dark"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {openPhotoUrl && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">{openPhotoWard}</h2>
              <button onClick={() => setOpenPhotoUrl(null)} className="text-xs font-medium text-nnm-blue hover:underline">
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- object URL from an authenticated fetch, not a static asset next/image can optimize */}
            <img src={openPhotoUrl} alt={`${openPhotoWard} group photo`} className="max-h-[500px] w-full rounded-md object-contain" />
          </div>
        )}

        {!wards ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {wards.map((w) => (
              <div key={w.wardId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Camera className={`h-4 w-4 ${w.path ? "text-green-600" : "text-slate-300"}`} />
                    <span className="font-semibold text-slate-900">{w.wardName}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {w.path ? `Uploaded by ${w.uploadedBy}` : "Not uploaded yet"}
                  </p>
                </div>
                {w.path && (
                  <button
                    onClick={() => handleViewPhoto(w.wardId, w.wardName)}
                    disabled={loadingPhotoWardId === w.wardId}
                    className="inline-flex items-center gap-1.5 rounded border border-nnm-blue px-2.5 py-1.5 text-xs font-semibold text-nnm-blue hover:bg-blue-50 disabled:opacity-60"
                  >
                    {loadingPhotoWardId === w.wardId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "View"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
