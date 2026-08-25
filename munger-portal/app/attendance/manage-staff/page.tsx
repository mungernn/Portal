"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserPlus, Upload, ArrowRightLeft } from "lucide-react";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { useAttendanceGuard } from "@/lib/use-attendance-guard";
import {
  fetchAttendanceWards,
  fetchAttendanceShifts,
  fetchAllFieldStaff,
  createFieldStaff,
  setFieldStaffActive,
  transferFieldStaff,
  uploadFieldStaffRosterCsv,
  type AttendanceWard,
  type AttendanceShift,
  type FieldStaffSummary,
  type RosterSyncResult,
} from "@/lib/attendance-api";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function ManageStaffPage() {
  // Sanitation officers can view the roster and transfer workers
  // between wards; only attendance_admin can create, rename, or
  // deactivate - the page below hides those sections for officers.
  const user = useAttendanceGuard(["attendance_admin", "sanitation_officer"]);
  const isAdmin = user?.role === "attendance_admin";
  const [wards, setWards] = useState<AttendanceWard[]>([]);
  const [shifts, setShifts] = useState<AttendanceShift[]>([]);
  const [staff, setStaff] = useState<FieldStaffSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [wardId, setWardId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<RosterSyncResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transferringId, setTransferringId] = useState<number | null>(null);
  const [transferWardId, setTransferWardId] = useState("");
  const [transferShiftId, setTransferShiftId] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const wardName = (id: number) => wards.find((w) => w.id === id)?.wardName ?? "-";
  const shiftName = (id: number | null) => (id ? shifts.find((s) => s.id === id)?.shiftName : null) ?? "-";

  async function loadStaff() {
    try {
      setStaff(await fetchAllFieldStaff());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load staff list.");
    }
  }

  useEffect(() => {
    if (!user) return;
    fetchAttendanceWards()
      .then(setWards)
      .catch(() => setWards([]));
    fetchAttendanceShifts()
      .then(setShifts)
      .catch(() => setShifts([]));
    loadStaff();
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreated(false);
    if (!wardId) {
      setCreateError("Select a ward.");
      return;
    }
    setCreating(true);
    try {
      await createFieldStaff({ name, wardId: Number(wardId), shiftId: shiftId ? Number(shiftId) : null });
      setCreated(true);
      setName("");
      setWardId("");
      setShiftId("");
      await loadStaff();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not add staff member.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(id: number, active: boolean) {
    setError(null);
    try {
      await setFieldStaffActive(id, active);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  function openTransfer(s: FieldStaffSummary) {
    setTransferringId(s.id);
    setTransferWardId(String(s.wardId));
    setTransferShiftId(s.shiftId ? String(s.shiftId) : "");
    setTransferError(null);
  }

  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (transferringId === null) return;
    setTransferError(null);
    if (!transferWardId) {
      setTransferError("Select a ward.");
      return;
    }
    setTransferSubmitting(true);
    try {
      await transferFieldStaff(transferringId, Number(transferWardId), transferShiftId ? Number(transferShiftId) : null);
      setTransferringId(null);
      await loadStaff();
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Could not transfer staff member.");
    } finally {
      setTransferSubmitting(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const text = await file.text();
      const result = await uploadFieldStaffRosterCsv(text);
      setUploadResult(result);
      await loadStaff();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AttendanceHeader user={user} />

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Manage Field Staff</h1>
        <p className="mb-6 text-sm text-slate-500">Add sanitation workers one at a time, or upload a full list.</p>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* One-by-one entry - attendance_admin only */}
        {isAdmin && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserPlus className="h-4 w-4" />
            Add One Staff Member
          </h2>

          {createError && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {createError}
            </div>
          )}
          {created && (
            <div role="status" className="mb-4 flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Staff member added.
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Name</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ward</label>
              <select required value={wardId} onChange={(e) => setWardId(e.target.value)} className={inputClass}>
                <option value="">Select...</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.wardName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Shift (optional)</label>
              <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftName}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-md bg-nnm-blue py-3 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60 sm:w-auto sm:px-8"
              >
                {creating ? "Adding..." : "Add Staff Member"}
              </button>
            </div>
          </form>
        </section>
        )}

        {/* Bulk upload - attendance_admin only */}
        {isAdmin && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Upload className="h-4 w-4" />
            Upload Full List (CSV)
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Columns: <code className="rounded bg-slate-100 px-1 py-0.5">Name, Ward, Shift</code>. Ward and Shift must match the
            names shown above exactly. This replaces the entire active roster - anyone not in the uploaded file will be marked
            inactive, not deleted.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelected}
            disabled={uploading}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-nnm-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-nnm-blue-dark disabled:opacity-60"
          />

          {uploading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing upload...
            </div>
          )}

          {uploadError && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {uploadError}
            </div>
          )}

          {uploadResult && (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="mb-2 font-semibold text-slate-700">
                Created {uploadResult.created}, updated {uploadResult.updated}, deactivated {uploadResult.deactivated}.
              </p>
              {uploadResult.errors.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-amber-700">{uploadResult.errors.length} row(s) skipped:</p>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700">
                    {uploadResult.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
        )}

        {/* Roster table */}
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">All Staff ({staff?.length ?? "..."})</h2>
          {!staff ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Ward</th>
                    <th className="px-3 py-2 font-medium">Shift</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2">{wardName(s.wardId)}</td>
                      <td className="px-3 py-2">{shiftName(s.shiftId)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${s.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}
                        >
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => openTransfer(s)} className="text-xs font-medium text-nnm-blue hover:underline">
                            Transfer
                          </button>
                          {isAdmin && (
                            <button onClick={() => handleToggleActive(s.id, !s.active)} className="text-xs font-medium text-slate-500 hover:underline">
                              {s.active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {transferringId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ArrowRightLeft className="h-4 w-4" />
              Transfer {staff?.find((s) => s.id === transferringId)?.name}
            </h2>

            {transferError && (
              <div role="alert" className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>New Ward</label>
                <select required value={transferWardId} onChange={(e) => setTransferWardId(e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wardName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>New Shift (optional)</label>
                <select value={transferShiftId} onChange={(e) => setTransferShiftId(e.target.value)} className={inputClass}>
                  <option value="">Keep current</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shiftName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferringId(null)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="rounded-md bg-nnm-blue px-4 py-2 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
                >
                  {transferSubmitting ? "Transferring..." : "Confirm Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
