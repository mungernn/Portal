"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { fetchAttendanceWards, type AttendanceWard } from "@/lib/attendance-api";
import {
  CATEGORIES,
  PROJECT_STAGES,
  STAGE_LABELS,
  createProject,
  emptyForm,
  updateProject,
  type ProjectForm,
  type ProjectStage,
} from "@/lib/project-api";
import { Card, ErrorLine, inputClass, labelClass, primaryBtn } from "./parts";

/** Which stage first needs which details - shown as a hint, not enforced (old records are often incomplete). */
const STAGE_INDEX = (s: ProjectStage) => (s === "past_completed" ? PROJECT_STAGES.indexOf("completed") : PROJECT_STAGES.indexOf(s));

/** Add / edit a project (Yojana Prabhari, Commissioner). */
export function ProjectFormView({ id, initial }: { id?: string; initial?: ProjectForm }) {
  const router = useRouter();
  const [f, setF] = useState<ProjectForm>(initial ?? emptyForm());
  const [wards, setWards] = useState<AttendanceWard[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceWards()
      .then(setWards)
      .catch(() => {});
  }, []);

  const set = <K extends keyof ProjectForm>(k: K, v: ProjectForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const text = (k: keyof ProjectForm, label: string, type: "text" | "date" | "number" = "text", placeholder?: string) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        className={inputClass}
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        placeholder={placeholder}
        value={f[k] as string}
        onChange={(e) => set(k, e.target.value as never)}
      />
    </div>
  );
  const reached = (s: ProjectStage) => STAGE_INDEX(f.stage) >= STAGE_INDEX(s);
  const category = CATEGORIES.find((c) => c.key === f.category);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const p = id ? await updateProject(id, f) : await createProject(f);
      router.push(`/attendance/projects/${p.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Card title="The work">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelClass}>Name of the work *</label>
            <input className={inputClass} value={f.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          {text("projectCode", "Project code", "text", id ? undefined : "Blank = given automatically")}
          <div>
            <label className={labelClass}>Ward *</label>
            <select className={inputClass} value={f.wardId} onChange={(e) => set("wardId", e.target.value)} required>
              <option value="">Select ward</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wardName}
                </option>
              ))}
            </select>
          </div>
          {text("locationText", "Location / site")}
          {text("schemeName", "Scheme / Yojana")}
          <div>
            <label className={labelClass}>Type of work *</label>
            <select className={inputClass} value={f.category} onChange={(e) => set("category", e.target.value)} required>
              <option value="">Select</option>
              <optgroup label="Civil">
                {CATEGORIES.filter((c) => c.discipline === "civil").map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Mechanical">
                {CATEGORIES.filter((c) => c.discipline === "mechanical").map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div>
            <label className={labelClass}>Supervised by</label>
            <select
              className={inputClass}
              value={f.discipline}
              onChange={(e) => set("discipline", e.target.value as ProjectForm["discipline"])}
            >
              <option value="">
                {category
                  ? `${category.discipline === "civil" ? "Civil" : "Mechanical"} team (from the type of work)`
                  : "From the type of work"}
              </option>
              <option value="civil">Civil team</option>
              <option value="mechanical">Mechanical team</option>
              <option value="both">Both civil and mechanical teams</option>
            </select>
          </div>
          {text("financialYear", "Financial year", "text", "2025-26")}
          {text("estimatedCost", "Estimated cost (₹)", "number")}
          <div>
            <label className={labelClass}>Stage *</label>
            <select className={inputClass} value={f.stage} onChange={(e) => set("stage", e.target.value as ProjectStage)}>
              {PROJECT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card title="Approval and tender">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {text("approvalNo", "Approval no.")}
          {text("approvalDate", "Approval date", "date")}
          <div />
          {(reached("tendered") || f.tenderNo) && (
            <>
              {text("tenderNo", "Tender no.")}
              {text("tenderDate", "Tender date", "date")}
              {text("tenderFinalisedDate", "Tender finalised on", "date")}
            </>
          )}
          {(reached("tender_finalised") || f.agencyName) && text("agencyName", "Agency / contractor")}
        </div>
      </Card>

      {(reached("work_order_issued") || f.workOrderNo) && (
        <Card title="Work order and progress">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {text("workOrderNo", "Work order no.")}
            {text("workOrderDate", "Work order date", "date")}
            {text("workOrderAmount", "Work order amount (₹)", "number")}
            {text("targetCompletionDate", "Target completion date", "date")}
            {text("actualStartDate", "Work started on", "date")}
            {(reached("completed") || f.actualCompletionDate) && text("actualCompletionDate", "Completed on", "date")}
          </div>
        </Card>
      )}

      {(reached("payment_done") || f.paymentAmount) && f.stage !== "past_completed" && (
        <Card title="Payment">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {text("paymentAmount", "Amount paid (₹)", "number")}
            {text("paymentDate", "Payment date", "date")}
          </div>
        </Card>
      )}

      <Card title="Remarks">
        <textarea className={inputClass} rows={3} value={f.remarks} onChange={(e) => set("remarks", e.target.value)} />
      </Card>

      <ErrorLine error={error} />
      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {id ? "Save changes" : "Add project"}
      </button>
    </form>
  );
}
