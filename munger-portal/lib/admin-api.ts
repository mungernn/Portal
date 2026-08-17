import { getAdminToken, type AdminRole } from "./admin-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  if (!token) throw new Error("Not logged in — please log in again.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export interface OperatorSummary {
  id: number;
  username: string;
  display_name: string;
  active: boolean;
}

export async function fetchOperators(): Promise<OperatorSummary[]> {
  const res = await fetch(`${API_BASE_URL}/admin/operators`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load operators.");
  const data: { operators: OperatorSummary[] } = await res.json();
  return data.operators;
}

export async function setOperatorActive(id: number, active: boolean): Promise<OperatorSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/operators/${id}/active`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!res.ok) throw new Error("Could not update operator status.");
  const data: { operator: OperatorSummary } = await res.json();
  return data.operator;
}

export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export type ApprovalTier = "minor" | "significant" | "mutation";

export const TIER_LABELS: Record<ApprovalTier, string> = {
  minor: "Minor Clerical Editing",
  significant: "Significant Change",
  mutation: "Mutation (Ownership Change)",
};

export interface ChangeRequestSummary {
  id: number;
  holding_no: string;
  requested_by: string;
  requested_at: string;
  status: ChangeRequestStatus;
  change_basis: string;
  change_reference: string;
  current_stage: AdminRole;
  approval_tier: ApprovalTier;
  final_stage: AdminRole;
  reviewed_by: string | null;
  reviewed_role: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

export async function fetchChangeRequests(opts: {
  status?: ChangeRequestStatus;
  myStage?: boolean;
}): Promise<{ requests: ChangeRequestSummary[]; myRole: AdminRole; stageOrder: AdminRole[] }> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.myStage) params.set("myStage", "true");

  const res = await fetch(`${API_BASE_URL}/admin/change-requests?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load change requests.");
  return res.json();
}

export interface ChangeRequestApproval {
  id: number;
  change_request_id: number;
  stage: AdminRole;
  decision: "approved" | "rejected";
  admin_username: string;
  admin_display_name: string;
  notes: string | null;
  decided_at: string;
}

export interface ChangeRequestDetail {
  request: ChangeRequestSummary & { proposed_data: Record<string, unknown> };
  currentProperty: Record<string, unknown> | null;
  currentFloors: Record<string, unknown>[];
  approvalHistory: ChangeRequestApproval[];
}

export async function fetchChangeRequestDetail(id: number): Promise<ChangeRequestDetail> {
  const res = await fetch(`${API_BASE_URL}/admin/change-requests/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this change request.");
  return res.json();
}

export async function approveChangeRequest(id: number, notes?: string): Promise<ChangeRequestSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/change-requests/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not approve this request.");
  }
  const data: { request: ChangeRequestSummary } = await res.json();
  return data.request;
}

export async function rejectChangeRequest(id: number, notes: string): Promise<ChangeRequestSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/change-requests/${id}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not reject this request.");
  }
  const data: { request: ChangeRequestSummary } = await res.json();
  return data.request;
}

export interface BulkGenerateResult {
  processed: number;
  errors: { holdingNo: string; message: string }[];
  generated: { holdingNo: string; formattedDemandNo: string; grandTotal: string }[];
}

/** POST /api/v1/admin/demand-notices/bulk-generate — every holding with Floors data but no demand notice yet. */
export async function bulkGenerateDemandNotices(): Promise<BulkGenerateResult> {
  const res = await fetch(`${API_BASE_URL}/admin/demand-notices/bulk-generate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Bulk generation failed.");
  }
  return res.json();
}

export interface BulkRegenerateTaxHistoryResult {
  processed: number;
  errors: { holdingNo: string; message: string }[];
}

/** POST /api/v1/admin/tax-history/bulk-regenerate — recomputes system-derived tax history stages for every holding from current Floors. */
export async function bulkRegenerateTaxHistory(): Promise<BulkRegenerateTaxHistoryResult> {
  const res = await fetch(`${API_BASE_URL}/admin/tax-history/bulk-regenerate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Bulk regeneration failed.");
  }
  return res.json();
}

export type ExportDataset =
  | "properties"
  | "payments"
  | "notices"
  | "changes"
  | "shops"
  | "shop_agreements"
  | "shop_rent_payments"
  | "shop_violation_notices"
  | "shop_rental_applications"
  | "trade_license_applications"
  | "all";

/**
 * GET /api/v1/admin/export?dataset=... — fetches a live-generated Excel
 * workbook and triggers a browser download. Auth header only (no
 * `authHeaders()`'s Content-Type, since there's no JSON body here).
 */
export async function downloadExport(dataset: ExportDataset): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error("Not logged in — please log in again.");

  const res = await fetch(`${API_BASE_URL}/admin/export?dataset=${dataset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Export failed.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nnm-export-${dataset}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface DemandNoticeHistoryEntry {
  demandNo: string;
  formattedDemandNo: string;
  date: string;
  totalAmountDemanded: string;
  settled: boolean;
  assessmentYear: string | null;
  reminderNumber: number;
  reminderLabel: string | null;
  superseded: boolean;
}

export async function fetchDemandNoticeHistoryAdmin(holdingNo: string): Promise<DemandNoticeHistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(holdingNo)}/demand-notices/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load demand notice history.");
  const data: { history: DemandNoticeHistoryEntry[] } = await res.json();
  return data.history;
}

export interface PrintableDemandNoticeHistory {
  demandNo: string;
  formattedDemandNo: string;
  date: string;
  holdingNo: string;
  ownerName: string;
  address: string;
  assessmentYear: string | null;
  arv: string;
  currentYearTaxNet: string;
  previousYearsTaxBase: string;
  totalFineAmount: string;
  otherCharges: string;
  totalAmountDemanded: string;
  settled: boolean;
  settledReceiptNo: string | null;
  generatedBy: string;
  verificationUrl: string;
  reminderNumber: number;
  reminderLabel: string | null;
  previousUnsettledDemandNos: string | null;
  superseded: boolean;
}

export async function fetchDemandNoticeReprintAdmin(demandNo: string): Promise<PrintableDemandNoticeHistory> {
  const res = await fetch(`${API_BASE_URL}/properties/demand-notices/${encodeURIComponent(demandNo)}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this demand notice.");
  return res.json();
}

export interface PaymentHistoryEntry {
  receiptNo: string;
  formattedReceiptNo: string;
  date: string;
  amountReceived: string;
  paymentMode: string;
}

export async function fetchPaymentHistoryAdmin(holdingNo: string): Promise<PaymentHistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(holdingNo)}/payments/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load payment history.");
  const data: { history: PaymentHistoryEntry[] } = await res.json();
  return data.history;
}

export interface PrintableReceiptHistory {
  receiptNo: string;
  formattedReceiptNo: string;
  date: string;
  holdingNo: string;
  ownerName: string;
  address: string;
  paymentMode: string;
  counter: string | null;
  amountReceived: string;
  amountInWords: string;
  collectedBy: string;
  demandNo: string | null;
  verificationUrl: string;
  breakdown: {
    arv: string;
    currentYearTaxNet: string;
    previousYearsTaxBase: string;
    totalFineAmount: string;
    otherCharges: string;
  } | null;
}

export async function fetchReceiptReprintAdmin(receiptNo: string): Promise<PrintableReceiptHistory> {
  const res = await fetch(`${API_BASE_URL}/properties/payments/${encodeURIComponent(receiptNo)}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this receipt.");
  return res.json();
}

export interface DashboardSummary {
  holdings: { total: number };
  propertyChanges: {
    pending: number;
    byStage: { stage: string; label: string; count: number }[];
  };
  shops: { total: number };
  shopApplications: { received: number; pending: number };
  tradeLicense: { received: number; pending: number; issued: number };
}

export async function fetchDashboardSummaryAdmin(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE_URL}/dashboard-summary`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the dashboard summary.");
  return res.json();
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HoldingListItem {
  holdingNo: string;
  ownerName: string;
  address: string;
  assessmentYear: string | null;
}

export interface PropertyChangeListItem {
  id: number;
  holdingNo: string;
  requestedBy: string;
  requestedAt: string;
  currentStage: string;
  currentStageLabel: string;
}

export interface ShopListItem {
  shopNo: string;
  marketName: string | null;
  location: string;
  status: string;
}

export interface ShopApplicationListItem {
  id: number;
  shopNo: string;
  applicantName: string;
  requestedAt: string;
  status: string;
}

export interface TradeLicenseApplicationListItem {
  id: number;
  applicationNumber: string;
  applicantName: string;
  entityName: string;
  requestedAt: string;
  status: string;
}

export interface TradeLicenseIssuedListItem {
  id: number;
  applicationNumber: string;
  applicantName: string;
  entityName: string;
  requestedAt: string;
}

async function fetchDashboardListAdmin<T>(path: string, page: number, pageSize: number): Promise<PaginatedResult<T>> {
  const res = await fetch(`${API_BASE_URL}/dashboard-summary/${path}?page=${page}&pageSize=${pageSize}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load this list.");
  return res.json();
}

export const fetchDashboardHoldingsAdmin = (page: number, pageSize: number) =>
  fetchDashboardListAdmin<HoldingListItem>("holdings", page, pageSize);
export const fetchDashboardPropertyChangesAdmin = (page: number, pageSize: number) =>
  fetchDashboardListAdmin<PropertyChangeListItem>("property-changes", page, pageSize);
export const fetchDashboardShopsAdmin = (page: number, pageSize: number) =>
  fetchDashboardListAdmin<ShopListItem>("shops", page, pageSize);
export const fetchDashboardShopApplicationsAdmin = (page: number, pageSize: number) =>
  fetchDashboardListAdmin<ShopApplicationListItem>("shop-applications", page, pageSize);
export const fetchDashboardTradeLicenseApplicationsAdmin = (page: number, pageSize: number) =>
  fetchDashboardListAdmin<TradeLicenseApplicationListItem>("trade-license-applications", page, pageSize);
export const fetchDashboardTradeLicensesIssuedAdmin = (page: number, pageSize: number) =>
  fetchDashboardListAdmin<TradeLicenseIssuedListItem>("trade-licenses-issued", page, pageSize);
// ---------------------------------------------------------------------------
// Monthly attendance report download - Commissioner only. A deliberate,
// narrow cross-system link: the attendance module is otherwise fully
// separate, but the Commissioner's existing admin login can also pull
// this report directly (see requireAttendanceReportAccess on the backend).
// ---------------------------------------------------------------------------

async function downloadAttendanceReportAdmin(path: string, filenameFallback: string): Promise<void> {
  const token = getAdminToken();
  if (!token) throw new Error("Not logged in - please log in again.");
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Download failed.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="(.+)"/);
  a.download = match ? match[1]! : filenameFallback;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadMonthlyStaffAttendanceReportAdmin(year: number, month: number): Promise<void> {
  await downloadAttendanceReportAdmin(
    `/attendance/reports/monthly/staff.csv?year=${year}&month=${month}`,
    `staff-attendance-${year}-${String(month).padStart(2, "0")}.csv`,
  );
}

export async function downloadMonthlyDriverAttendanceReportAdmin(year: number, month: number): Promise<void> {
  await downloadAttendanceReportAdmin(
    `/attendance/reports/monthly/drivers.csv?year=${year}&month=${month}`,
    `driver-attendance-${year}-${String(month).padStart(2, "0")}.csv`,
  );
}
