"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import { StageBadge } from "@/components/admin/stage-badge";
import { useAdminGuard } from "@/lib/use-admin-guard";
import {
  fetchRentalApplicationDetail,
  approveRentalApplication,
  rejectRentalApplication,
  type ShopRentalApplicationDetail,
} from "@/lib/admin-shop-api";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-auth";

export default function ShopRentalApplicationDetailPage() {
  const admin = useAdminGuard();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [detail, setDetail] = useState<ShopRentalApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  function load() {
    fetchRentalApplicationDetail(id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load this application."));
  }

  useEffect(() => {
    if (!admin || !id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, id]);

  async function handleApprove() {
    setActing("approve");
    setError(null);
    try {
      await approveRentalApplication(id, notes || undefined);
      load();
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve.");
    } finally {
      setActing(null);
    }
  }

  async function handleReject() {
    if (!notes.trim()) {
      setError("A reason is required to reject.");
      return;
    }
    setActing("reject");
    setError(null);
    try {
      await rejectRentalApplication(id, notes);
      load();
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reject.");
    } finally {
      setActing(null);
    }
  }

  if (!admin) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading…</div>;
  }

  const isTaxDarogaStage = detail?.application.current_stage === "tax_daroga";

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader admin={admin} />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <button onClick={() => router.push("/admin/shop-rental-applications")} className="mb-4 text-sm font-medium text-nnm-blue hover:underline">
          ← Back to Shop Rental Applications
        </button>

        {error && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!detail ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <p className="font-mono text-lg font-semibold text-slate-900">
                  {detail.application.shop_no} — {detail.application.applicant_name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  requested by {detail.application.requested_by} on {new Date(detail.application.requested_at).toLocaleString("en-IN")}
                </p>
              </div>
              <StageBadge status={detail.application.status} currentStage={detail.application.current_stage} />
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Applicant Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Relation</span>
                  <span>{detail.application.applicant_relation_type ?? ""} {detail.application.applicant_relation_name ?? "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Mobile</span>
                  <span>{detail.application.applicant_mobile ?? "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">ID Proof</span>
                  <span>{detail.application.applicant_id_proof_number ?? "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Address</span>
                  <span>{detail.application.applicant_address ?? "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Proposed Business</span>
                  <span>{detail.application.applicant_business_name ?? "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Proposed Rent</span>
                  <span>₹{Number(detail.application.proposed_monthly_rent).toLocaleString("en-IN")}/mo</span>
                </div>
              </div>
            </section>

            <section
              className={`rounded-xl border p-6 ${
                isTaxDarogaStage ? "border-nnm-blue bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-nnm-blue" />
                <h2 className="text-base font-semibold text-slate-900">Applicant&apos;s Property Tax Status (NOC check)</h2>
              </div>
              {!detail.application.applicant_property_holding_no ? (
                <p className="text-sm text-slate-500">No property holding number given for this applicant — nothing to check.</p>
              ) : !detail.applicantTaxStatus || !detail.applicantTaxStatus.found ? (
                <p className="text-sm text-red-600">
                  Holding &ldquo;{detail.application.applicant_property_holding_no}&rdquo; not found —{" "}
                  {detail.applicantTaxStatus?.message ?? "please verify the number with the applicant."}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Holding No</span>
                    <span className="font-mono">{detail.applicantTaxStatus.property!.holding_no}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Owner Name</span>
                    <span>{detail.applicantTaxStatus.property!.owner_name}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total Payable</span>
                    <span className={Number(detail.applicantTaxStatus.property!.totalPayable) > 0 ? "font-semibold text-red-600" : "font-semibold text-green-700"}>
                      ₹{Number(detail.applicantTaxStatus.property!.totalPayable).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="sm:col-span-3">
                    {Number(detail.applicantTaxStatus.property!.totalPayable) > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700">
                        <AlertCircle className="h-4 w-4" /> Outstanding dues — not clear
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
                        <CheckCircle2 className="h-4 w-4" /> No outstanding dues — clear
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Approval history</h2>
              {detail.approvalHistory.length === 0 ? (
                <p className="text-sm text-slate-400">No action taken yet — currently with {ADMIN_ROLE_LABELS[detail.application.current_stage]}.</p>
              ) : (
                <ol className="space-y-3">
                  {detail.approvalHistory.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 text-sm">
                      {a.decision === "approved" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      )}
                      <div>
                        <p className="text-slate-700">
                          <span className="font-medium">{ADMIN_ROLE_LABELS[a.stage]}</span> ({a.admin_display_name}){" "}
                          {a.decision} — {new Date(a.decided_at).toLocaleString("en-IN")}
                        </p>
                        {a.notes && <p className="text-slate-500">&ldquo;{a.notes}&rdquo;</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {detail.application.status === "pending" && detail.application.current_stage === admin.role ? (
              <section className="rounded-xl border border-nnm-blue bg-blue-50 p-6">
                <h2 className="mb-1 text-base font-semibold text-slate-900">Your decision</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Approving sends this to the next desk — or, if you&apos;re the final approval, creates the
                  agreement automatically and marks the shop occupied.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (required to reject, optional to approve)"
                  rows={3}
                  className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-nnm-blue focus:ring-offset-1"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={acting !== null}
                    className="rounded-md bg-nnm-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-nnm-blue-dark disabled:opacity-60"
                  >
                    {acting === "approve" ? "Approving…" : "Approve"}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={acting !== null}
                    className="rounded-md border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {acting === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </section>
            ) : detail.application.status === "pending" ? (
              <p className="text-sm text-slate-500">
                This application is currently with <b>{ADMIN_ROLE_LABELS[detail.application.current_stage]}</b> — it isn&apos;t at your desk yet.
              </p>
            ) : detail.application.status === "approved" ? (
              <div role="status" className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Approved — agreement #{detail.application.created_agreement_id} was created automatically.
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}