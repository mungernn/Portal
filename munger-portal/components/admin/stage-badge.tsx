import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin-auth";
import type { ChangeRequestStatus } from "@/lib/admin-api";

export function StageBadge({ status, currentStage }: { status: ChangeRequestStatus; currentStage: AdminRole }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        Rejected at {ADMIN_ROLE_LABELS[currentStage]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
      With {ADMIN_ROLE_LABELS[currentStage]}
    </span>
  );
}