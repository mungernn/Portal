"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { useAttendanceGuard } from "@/lib/use-attendance-guard";
import {
  fetchAttendanceWards,
  fetchWardWorkersToday,
  submitStaffFeedback,
  fetchStaffFeedback,
  type AttendanceWard,
  type WardWorkerToday,
  type FeedbackEntry,
} from "@/lib/attendance-api";

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1";

export default function AttendanceFeedbackPage() {
  const user = useAttendanceGuard(["sanitation_officer", "sanitation_prabhari", "attendance_admin"]);
  const [wards, setWards] = useState<AttendanceWard[]>([]);
  const [wardId, setWardId] = useState<string>("");
  const [workers, setWorkers] = useState<WardWorkerToday[]>([]);
  const [staffId, setStaffId] = useState<string>("");

  const [feedback, setFeedback] = useState<FeedbackEntry[] | null>(null);
  const [type, setType] = useState<"positive" | "negative">("positive");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAttendanceWards()
      .then(setWards)
      .catch(() => setWards([]));
  }, [user]);

  useEffect(() => {
    if (!wardId) {
      setWorkers([]);
      setStaffId("");
      return;
    }
    fetchWardWorkersToday(Number(wardId))
      .then(setWorkers)
      .catch(() => setWorkers([]));
  }, [wardId]);

  useEffect(() => {
    if (!staffId) {
      setFeedback(null);
      return;
    }
    setSubmitted(false);
    fetchStaffFeedback(Number(staffId))
      .then(setFeedback)
      .catch(() => setFeedback(null));
  }, [staffId]);

  async function handleSubmit() {
    if (!staffId) return;
    setSubmitting(true);
    setError(null);
    setSubmitted(false);
    try {
      await submitStaffFeedback(Number(staffId), type, comment);
      setComment("");
      setSubmitted(true);
      const updated = await fetchStaffFeedback(Number(staffId));
      setFeedback(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AttendanceHeader user={user} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Staff Feedback</h1>
        <p className="mb-6 text-sm text-slate-500">Select a ward and staff member to give or review feedback.</p>

        <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Ward</label>
            <select value={wardId} onChange={(e) => setWardId(e.target.value)} className={inputClass}>
              <option value="">Select a ward...</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wardName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Staff</label>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)} disabled={!wardId} className={inputClass}>
              <option value="">Select staff...</option>
              {workers.map((w) => (
                <option key={w.staffId} value={w.staffId}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {staffId && (
          <>
            <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Give Feedback</h2>
              <div className="mb-3 flex gap-2">
                <button
                  onClick={() => setType("positive")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                    type === "positive" ? "bg-green-100 text-green-700" : "border border-slate-200 text-slate-500"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Positive
                </button>
                <button
                  onClick={() => setType("negative")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
                    type === "negative" ? "bg-red-100 text-red-700" : "border border-slate-200 text-slate-500"
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  Negative
                </button>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment"
                rows={3}
                className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
              />
              {submitted && (
                <div role="status" className="mb-3 flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Feedback submitted.
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-nnm-blue px-5 py-2 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </button>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Feedback History</h2>
              {!feedback ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : feedback.length === 0 ? (
                <p className="text-sm text-slate-400">No feedback recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {feedback.map((f, i) => (
                    <li key={i} className="rounded-md border border-slate-100 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        {f.type === "positive" ? (
                          <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                        )}
                        <span className="font-semibold text-slate-800">{f.givenBy}</span>
                        <span className="text-xs text-slate-400">({f.role})</span>
                        <span className="ml-auto text-xs text-slate-400">{new Date(f.timestamp).toLocaleDateString("en-IN")}</span>
                      </div>
                      {f.comment && <p className="mt-1 text-slate-600">{f.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
