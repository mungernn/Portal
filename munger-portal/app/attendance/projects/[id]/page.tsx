"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, FileText, Loader2, MapPin, Pencil, PlayCircle, Save, Trash2, Upload } from "lucide-react";
import { AttendanceHeader } from "@/components/attendance/attendance-header";
import { LiveCameraCapture, type CapturedPhoto } from "@/components/admin/live-camera-capture";
import { useAttendanceGuard } from "@/lib/use-attendance-guard";
import type { AttendanceRole } from "@/lib/attendance-auth";
import {
  AUDIT_LABELS,
  DISCIPLINE_LABELS,
  ENGINEER_LABELS,
  MAX_PHOTOS_PER_MILESTONE,
  MILESTONES,
  MILESTONE_LABELS,
  PROJECT_ROLES,
  STAGE_LABELS,
  addDocument,
  addPhoto,
  categoryLabel,
  currentPosition,
  deleteProject,
  fetchEngineerSetup,
  fetchProject,
  fileToBase64,
  formatDate,
  markGps,
  openDocument,
  removeDocument,
  removePhoto,
  rupees,
  setMonitors,
  updateSite,
  type EngineerRole,
  type EngineerSetup,
  type Milestone,
  type Project,
  type ProjectDetail,
  type ProjectDocument,
  type ProjectStage,
} from "@/lib/project-api";
import {
  BackLink,
  Card,
  ErrorLine,
  ProjectImage,
  Spinner,
  StagePill,
  inputClass,
  labelClass,
  outlineBtn,
  primaryBtn,
} from "@/components/projects/parts";

/** Runs an action, shows its error, reloads the project when it works. */
function useAction(reload: () => Promise<void> | void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

const monitorRoles = (d: Project["discipline"]): EngineerRole[] =>
  d === "civil"
    ? ["je_civil", "ae_civil"]
    : d === "mechanical"
      ? ["je_mechanical", "ae_mechanical"]
      : ["je_civil", "ae_civil", "je_mechanical", "ae_mechanical"];

export default function ProjectDetailPage() {
  const user = useAttendanceGuard(PROJECT_ROLES as AttendanceRole[]);
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setD(await fetchProject(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the project.");
    }
  }, [id]);
  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (!user) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading...</div>;
  return (
    <div className="min-h-screen bg-slate-50">
      <AttendanceHeader user={user} />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        <BackLink href="/attendance/projects" label="Projects" />
        <ErrorLine error={error} />
        {!d ? !error && <Spinner /> : <ProjectView d={d} reload={load} />}
      </main>
    </div>
  );
}

function ProjectView({ d, reload }: { d: ProjectDetail; reload: () => Promise<void> }) {
  const router = useRouter();
  const p = d.project;
  const del = useAction(() => router.push("/attendance/projects"));
  const row = (label: string, value: React.ReactNode) => (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value || "-"}</dd>
    </div>
  );

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{p.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{p.project_code}</span>·<span>{p.ward_name}</span>·<span>{categoryLabel(p.category)}</span>·
            <span>{DISCIPLINE_LABELS[p.discipline]}</span>
            <StagePill stage={p.stage} />
          </p>
        </div>
        <div className="flex gap-2">
          {d.canEdit && (
            <Link href={`/attendance/projects/${p.id}/edit`} className={outlineBtn}>
              <Pencil className="h-4 w-4" /> Edit details / stage
            </Link>
          )}
          {d.canAssign && (
            <button
              className={`${outlineBtn} text-red-700`}
              disabled={del.busy}
              onClick={() => {
                if (confirm(`Delete "${p.name}" with all its photos and documents? This cannot be undone.`))
                  del.run(() => deleteProject(p.id));
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>
      <ErrorLine error={del.error} />

      <Card title="Details">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
          {row("Location", p.location_text)}
          {row("Scheme", p.scheme_name)}
          {row("Financial year", p.financial_year)}
          {row("Estimated cost", rupees(p.estimated_cost))}
          {row("Approval", [p.approval_no, p.approval_date && formatDate(p.approval_date)].filter(Boolean).join(" · "))}
          {row("Tender", [p.tender_no, p.tender_date && formatDate(p.tender_date)].filter(Boolean).join(" · "))}
          {row("Tender finalised", p.tender_finalised_date && formatDate(p.tender_finalised_date))}
          {row("Agency", p.agency_name)}
          {row("Work order", [p.work_order_no, p.work_order_date && formatDate(p.work_order_date)].filter(Boolean).join(" · "))}
          {row("Work order amount", p.work_order_amount && rupees(p.work_order_amount))}
          {row("Target completion", p.target_completion_date && formatDate(p.target_completion_date))}
          {row("Work started", p.actual_start_date && formatDate(p.actual_start_date))}
          {row("Completed", p.actual_completion_date && formatDate(p.actual_completion_date))}
          {row(
            "Payment",
            [p.payment_amount && rupees(p.payment_amount), p.payment_date && formatDate(p.payment_date)].filter(Boolean).join(" · "),
          )}
          {row("Entered by", `${p.created_by}, ${new Date(p.created_at).toLocaleDateString("en-IN")}`)}
        </dl>
        {p.remarks && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{p.remarks}</p>}
      </Card>

      <Monitors d={d} reload={reload} />
      <SiteWork d={d} reload={reload} />
      <Gps d={d} reload={reload} />
      <Documents d={d} reload={reload} />
      <Photos d={d} reload={reload} />

      <Card title="History">
        {d.audit.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {d.audit.map((a) => (
              <li key={a.id} className="border-b border-slate-100 pb-2">
                <span className="font-medium">{AUDIT_LABELS[a.action] ?? a.action}</span>
                <span className="text-slate-500">
                  {" "}
                  - {a.by_name}, {new Date(a.at).toLocaleString("en-IN")}
                </span>
                {a.details && <AuditDetails action={a.action} details={a.details} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function AuditDetails({ action, details }: { action: string; details: Record<string, unknown> }) {
  if (action === "stage_changed" || action === "project_edited" || action === "site_updated") {
    const parts = Object.entries(details)
      .filter(([k, v]) => k !== "viaExcel" && v && typeof v === "object" && "to" in (v as object))
      .map(([k, v]) => {
        const c = v as { from: unknown; to: unknown };
        const show = (x: unknown) => (k === "stage" && x ? STAGE_LABELS[x as ProjectStage] : x === null || x === "" ? "blank" : String(x));
        return `${k}: ${show(c.from)} → ${show(c.to)}`;
      });
    return (
      <p className="text-xs text-slate-500">
        {parts.join("; ")}
        {details.viaExcel ? " (Excel upload)" : ""}
      </p>
    );
  }
  if (action === "photo_uploaded" || action === "photo_removed")
    return <p className="text-xs text-slate-500">{MILESTONE_LABELS[details.milestone as Milestone] ?? String(details.milestone)}</p>;
  if (action === "document_uploaded" || action === "document_removed")
    return (
      <p className="text-xs text-slate-500">
        {String(details.kind).toUpperCase()} - {String(details.fileName)}
      </p>
    );
  if (action.endsWith("gps_marked"))
    return (
      <p className="text-xs text-slate-500">
        {String(details.lat)}, {String(details.lng)}
      </p>
    );
  return null;
}

function Monitors({ d, reload }: { d: ProjectDetail; reload: () => Promise<void> }) {
  const p = d.project;
  const [setup, setSetup] = useState<EngineerSetup | null>(null);
  const act = useAction(reload);
  useEffect(() => {
    if (d.canAssign)
      fetchEngineerSetup()
        .then(setSetup)
        .catch(() => {});
  }, [d.canAssign]);
  const roles = monitorRoles(p.discipline);
  return (
    <Card title="Monitoring engineers">
      <p className="mb-3 text-sm text-slate-500">
        By default the JE / AE assigned to {p.ward_name} for this type of work.
        {d.canAssign && " You can name a different engineer for this project."}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map((r) => {
          const override = p[`${r}_id` as keyof Project] as string | null;
          const name = p[`${r}_name` as keyof Project] as string | null;
          return (
            <div key={r} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500">{ENGINEER_LABELS[r]}</p>
              <p className="text-sm font-medium text-slate-900">{name ?? <span className="text-amber-700">Not assigned</span>}</p>
              <p className="text-xs text-slate-400">{override ? "Named for this project" : "Ward's engineer"}</p>
              {d.canAssign && setup && (
                <select
                  className={`${inputClass} mt-2`}
                  disabled={act.busy}
                  value={override ?? ""}
                  onChange={(e) => act.run(() => setMonitors(p.id, { [r]: e.target.value ? Number(e.target.value) : null }))}
                >
                  <option value="">Ward&apos;s engineer</option>
                  {setup.engineers
                    .filter((e) => e.role === r)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.display_name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
      <ErrorLine error={act.error} />
    </Card>
  );
}

function SiteWork({ d, reload }: { d: ProjectDetail; reload: () => Promise<void> }) {
  const p = d.project;
  const [notes, setNotes] = useState(p.site_notes ?? "");
  const [start, setStart] = useState(p.actual_start_date ?? "");
  const [end, setEnd] = useState(p.actual_completion_date ?? "");
  const act = useAction(reload);
  useEffect(() => {
    setNotes(p.site_notes ?? "");
    setStart(p.actual_start_date ?? "");
    setEnd(p.actual_completion_date ?? "");
  }, [p.site_notes, p.actual_start_date, p.actual_completion_date]);

  if (!d.canWork)
    return p.site_notes ? (
      <Card title="Site notes">
        <p className="whitespace-pre-wrap text-sm text-slate-700">{p.site_notes}</p>
      </Card>
    ) : null;

  const canStart = ["work_order_issued", "tender_finalised"].includes(p.stage) || (d.canEdit && ["approved", "tendered"].includes(p.stage));
  return (
    <Card title="Site work">
      <div className="mb-4 flex flex-wrap gap-2">
        {canStart && (
          <button className={primaryBtn} disabled={act.busy} onClick={() => act.run(() => updateSite(p.id, { stage: "in_progress" }))}>
            <PlayCircle className="h-4 w-4" /> Work has started
          </button>
        )}
        {p.stage === "in_progress" && (
          <button
            className={primaryBtn}
            disabled={act.busy}
            onClick={() => {
              if (confirm("Mark the work completed?")) act.run(() => updateSite(p.id, { stage: "completed" }));
            }}
          >
            <CheckCircle2 className="h-4 w-4" /> Mark work completed
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Work started on</label>
          <input type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Completed on</label>
          <input type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <label className={labelClass}>Site notes - measurements, issues, progress</label>
          <textarea className={inputClass} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <button
        className={`${primaryBtn} mt-3`}
        disabled={act.busy}
        onClick={() =>
          act.run(() => updateSite(p.id, { siteNotes: notes, actualStartDate: start || null, actualCompletionDate: end || null }))
        }
      >
        {act.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
      </button>
      <ErrorLine error={act.error} />
    </Card>
  );
}

function Gps({ d, reload }: { d: ProjectDetail; reload: () => Promise<void> }) {
  const p = d.project;
  const act = useAction(reload);
  const point = (which: "start" | "end") => {
    const lat = which === "start" ? p.start_lat : p.end_lat;
    const lng = which === "start" ? p.start_lng : p.end_lng;
    const by = which === "start" ? p.start_gps_by : p.end_gps_by;
    const at = which === "start" ? p.start_gps_at : p.end_gps_at;
    return (
      <div className="rounded-lg border border-slate-200 p-3">
        <p className="text-xs font-medium text-slate-500">{which === "start" ? "Starting point" : "Ending point"}</p>
        {lat && lng ? (
          <>
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-nnm-blue hover:underline"
            >
              {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)} <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="text-xs text-slate-400">
              {by}, {at && new Date(at).toLocaleString("en-IN")}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Not marked yet</p>
        )}
        {d.canWork && (
          <button
            className={`${outlineBtn} mt-2`}
            disabled={act.busy}
            onClick={() =>
              act.run(async () => {
                const pos = await currentPosition();
                if (lat && !confirm("Replace the point already marked with where you are now?")) return;
                await markGps(p.id, which, pos.lat, pos.lng);
              })
            }
          >
            <MapPin className="h-4 w-4" /> {lat ? "Mark again here" : "Mark here (where I am standing)"}
          </button>
        )}
      </div>
    );
  };
  return (
    <Card title="GPS - start and end of the work">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {point("start")}
        {point("end")}
      </div>
      {d.canWork && (
        <p className="mt-2 text-xs text-slate-500">
          Stand at the point on the site and press the button - the phone&apos;s location is recorded.
        </p>
      )}
      <ErrorLine error={act.error} />
    </Card>
  );
}

const DOC_KINDS: { kind: ProjectDocument["kind"]; label: string }[] = [
  { kind: "estimate", label: "Estimate" },
  { kind: "boq", label: "BOQ (Excel)" },
  { kind: "other", label: "Other document" },
];

function Documents({ d, reload }: { d: ProjectDetail; reload: () => Promise<void> }) {
  const act = useAction(reload);
  const [kind, setKind] = useState<ProjectDocument["kind"]>("estimate");
  const fileRef = useRef<HTMLInputElement>(null);
  const label = (k: string) => DOC_KINDS.find((x) => x.kind === k)?.label ?? k;
  return (
    <Card title="Estimate and BOQ">
      {d.documents.length === 0 ? (
        <p className="text-sm text-slate-500">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {d.documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <button
                onClick={() => openDocument(doc.id).catch(() => {})}
                className="inline-flex items-center gap-2 text-left text-nnm-blue hover:underline"
              >
                <FileText className="h-4 w-4" />
                <span>
                  <b>{label(doc.kind)}</b> - {doc.file_name}
                </span>
              </button>
              <span className="flex items-center gap-3 text-xs text-slate-400">
                {doc.uploaded_by}, {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
                {d.canWork && (
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => {
                      if (confirm("Remove this document?")) act.run(() => removeDocument(doc.id));
                    }}
                  >
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {d.canWork && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
          <div>
            <label className={labelClass}>Document</label>
            <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as ProjectDocument["kind"])}>
              {DOC_KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv,image/jpeg,image/png" className="text-sm" />
          <button
            className={primaryBtn}
            disabled={act.busy}
            onClick={() =>
              act.run(async () => {
                const file = fileRef.current?.files?.[0];
                if (!file) throw new Error("Choose the file first.");
                if (file.size > 7 * 1024 * 1024) throw new Error("The file is too large - at most 7 MB.");
                const ext = file.name.split(".").pop()?.toLowerCase();
                const mimeType =
                  file.type ||
                  (ext === "xlsx"
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : ext === "xls"
                      ? "application/vnd.ms-excel"
                      : ext === "csv"
                        ? "text/csv"
                        : ext === "pdf"
                          ? "application/pdf"
                          : "");
                await addDocument(d.project.id, kind, { base64: await fileToBase64(file), mimeType, fileName: file.name });
                if (fileRef.current) fileRef.current.value = "";
              })
            }
          >
            {act.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          </button>
          <p className="w-full text-xs text-slate-500">PDF, Excel (xlsx / xls / csv) or a photo, up to 7 MB.</p>
        </div>
      )}
      <ErrorLine error={act.error} />
    </Card>
  );
}

function Photos({ d, reload }: { d: ProjectDetail; reload: () => Promise<void> }) {
  return (
    <Card title="Progress photos">
      <p className="mb-3 text-sm text-slate-500">
        Up to {MAX_PHOTOS_PER_MILESTONE} photos at each stage, taken with the camera at the site (the location is saved with each).
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MILESTONES.map((m) => (
          <MilestonePhotos key={m} milestone={m} d={d} reload={reload} />
        ))}
      </div>
    </Card>
  );
}

function MilestonePhotos({ milestone, d, reload }: { milestone: Milestone; d: ProjectDetail; reload: () => Promise<void> }) {
  const photos = d.photos.filter((p) => p.milestone === milestone);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [adding, setAdding] = useState(false);
  const act = useAction(reload);
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">{MILESTONE_LABELS[milestone]}</p>
        <span className="text-xs text-slate-400">
          {photos.length} / {MAX_PHOTOS_PER_MILESTONE}
        </span>
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((ph) => (
            <div key={ph.id} className="relative">
              <ProjectImage photoId={ph.id} className="h-20 w-full rounded-md" />
              <p
                className="mt-0.5 truncate text-[10px] text-slate-400"
                title={`${ph.uploaded_by}, ${new Date(ph.uploaded_at).toLocaleString("en-IN")}`}
              >
                {new Date(ph.uploaded_at).toLocaleDateString("en-IN")}
              </p>
              {d.canWork && (
                <button
                  className="absolute right-1 top-1 rounded bg-white/90 p-0.5 text-red-600"
                  title="Remove"
                  onClick={() => {
                    if (confirm("Remove this photo?")) act.run(() => removePhoto(ph.id));
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {d.canWork && photos.length < MAX_PHOTOS_PER_MILESTONE && (
        <div className="mt-2">
          {!adding ? (
            <button className={outlineBtn} onClick={() => setAdding(true)}>
              Add photo
            </button>
          ) : (
            <div className="space-y-2">
              <LiveCameraCapture label="Site photo" photo={photo} onChange={setPhoto} />
              <div className="flex gap-2">
                <button
                  className={primaryBtn}
                  disabled={!photo || act.busy}
                  onClick={() =>
                    act.run(async () => {
                      if (!photo) return;
                      const pos = await currentPosition().catch(() => null);
                      await addPhoto(
                        d.project.id,
                        milestone,
                        { base64: photo.base64, mimeType: photo.mimeType },
                        pos?.lat ?? null,
                        pos?.lng ?? null,
                      );
                      setPhoto(null);
                      setAdding(false);
                    })
                  }
                >
                  {act.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save photo
                </button>
                <button
                  className={outlineBtn}
                  onClick={() => {
                    setPhoto(null);
                    setAdding(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <ErrorLine error={act.error} />
    </div>
  );
}
