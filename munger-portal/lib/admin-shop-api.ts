import { getAdminToken, type AdminRole } from "./admin-auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

function authHeaders(): HeadersInit {
  const token = getAdminToken();
  if (!token) throw new Error("Not logged in — please log in again.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export type ShopChangeRequestStatus = "pending" | "approved" | "rejected";

export type ShopApprovalTier = "full" | "data_completion";

export interface ShopAgreementChangeRequestSummary {
  id: number;
  shop_no: string;
  agreement_id: number | null;
  requested_by: string;
  requested_at: string;
  status: ShopChangeRequestStatus;
  change_reason: string;
  current_stage: AdminRole;
  approval_tier: ShopApprovalTier;
  final_stage: AdminRole;
  reviewed_by: string | null;
  reviewed_role: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
}

export async function fetchShopAgreementRequests(opts: {
  status?: ShopChangeRequestStatus;
  myStage?: boolean;
}): Promise<{ requests: ShopAgreementChangeRequestSummary[]; myRole: AdminRole; stageOrder: AdminRole[] }> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.myStage) params.set("myStage", "true");

  const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load shop agreement requests.");
  return res.json();
}

export interface ShopAgreementChangeRequestDetail {
  request: ShopAgreementChangeRequestSummary & { proposed_data: Record<string, unknown> };
  shop: Record<string, unknown> | null;
  currentAgreement: Record<string, unknown> | null;
  approvalHistory: {
    id: number;
    change_request_id: number;
    stage: AdminRole;
    decision: "approved" | "rejected";
    admin_username: string;
    admin_display_name: string;
    notes: string | null;
    decided_at: string;
  }[];
  proposedRentPeriodsInconsistent: boolean;
  proposedRentPeriodsNote: string | null;
}

export async function fetchShopAgreementRequestDetail(id: number): Promise<ShopAgreementChangeRequestDetail> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this request.");
  return res.json();
}

export async function approveShopAgreementRequest(id: number, notes?: string): Promise<ShopAgreementChangeRequestSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not approve this request.");
  }
  const data: { request: ShopAgreementChangeRequestSummary } = await res.json();
  return data.request;
}

export async function rejectShopAgreementRequest(id: number, notes: string): Promise<ShopAgreementChangeRequestSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-agreement-requests/${id}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not reject this request.");
  }
  const data: { request: ShopAgreementChangeRequestSummary } = await res.json();
  return data.request;
}

export type ShopApplicationStatus = "pending" | "approved" | "rejected";

export interface ShopRentalApplicationSummary {
  id: number;
  shop_no: string;
  applicant_name: string;
  applicant_relation_name: string | null;
  applicant_mobile: string | null;
  applicant_business_name: string | null;
  proposed_monthly_rent: string;
  applicant_property_holding_no: string | null;
  status: ShopApplicationStatus;
  current_stage: AdminRole;
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_role: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_agreement_id: number | null;
}

export async function fetchRentalApplications(opts: {
  status?: ShopApplicationStatus;
  myStage?: boolean;
}): Promise<{ applications: ShopRentalApplicationSummary[]; myRole: AdminRole; stageOrder: AdminRole[] }> {
  const params = new URLSearchParams();
  if (opts.status) params.set("status", opts.status);
  if (opts.myStage) params.set("myStage", "true");

  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load rental applications.");
  return res.json();
}

export interface ApplicantTaxStatus {
  found: boolean;
  message?: string;
  property?: {
    holding_no: string;
    owner_name: string;
    totalPayable: string;
    currentCyclePaid: boolean;
    paidThroughYear: string | null;
  };
}

export interface ShopRentalApplicationDetail {
  application: ShopRentalApplicationSummary & {
    applicant_relation_type: string | null;
    applicant_address: string | null;
    applicant_id_proof_number: string | null;
  };
  shop: Record<string, unknown> | null;
  approvalHistory: {
    id: number;
    application_id: number;
    stage: AdminRole;
    decision: "approved" | "rejected";
    admin_username: string;
    admin_display_name: string;
    notes: string | null;
    decided_at: string;
  }[];
  applicantTaxStatus: ApplicantTaxStatus | null;
}

export async function fetchRentalApplicationDetail(id: number): Promise<ShopRentalApplicationDetail> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this application.");
  return res.json();
}

export async function approveRentalApplication(id: number, notes?: string): Promise<ShopRentalApplicationSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications/${id}/approve`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not approve this application.");
  }
  const data: { application: ShopRentalApplicationSummary } = await res.json();
  return data.application;
}

export async function rejectRentalApplication(id: number, notes: string): Promise<ShopRentalApplicationSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-applications/${id}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not reject this application.");
  }
  const data: { application: ShopRentalApplicationSummary } = await res.json();
  return data.application;
}

export interface PerSqftRateEntry {
  shopNo: string;
  marketName: string | null;
  location: string;
  holderName: string;
  totalAreaSqft: number | null;
  builtUpAreaSqft: number | null;
  currentMonthlyRent: number;
  ratePerSqft: number | null;
  areaBasisUsed: "built_up" | "total" | null;
}

export async function fetchPerSqftReport(): Promise<PerSqftRateEntry[]> {
  const res = await fetch(`${API_BASE_URL}/admin/shops/per-sqft-report`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the per-sqft rate report.");
  const data: { entries: PerSqftRateEntry[] } = await res.json();
  return data.entries;
}

export interface ShopDemandHistoryEntry {
  demandNo: string;
  formattedDemandNo: string;
  demandDate: string;
  periodStartMonth: string;
  periodEndMonth: string;
  totalAmountDemanded: string;
  settled: boolean;
}

export async function fetchShopDemandHistoryAdmin(shopNo: string): Promise<ShopDemandHistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-demands/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load rent demand history.");
  const data: { history: ShopDemandHistoryEntry[] } = await res.json();
  return data.history;
}

export interface PrintableShopReceiptHistory {
  receiptNo: string;
  formattedReceiptNo: string;
  date: string;
  paymentMode: string;
  counter: string | null;
  amountReceived: string;
  shopNo: string;
  marketName: string | null;
  location: string;
  holderName: string;
  demandNo: string | null;
  periodStartMonth: string | null;
  periodEndMonth: string | null;
  baseRentAmount: string | null;
  penaltyAmount: string | null;
  miscCostAmount: string | null;
  miscCostReason: string | null;
  miscRebateAmount: string | null;
  miscRebateReason: string | null;
  collectedBy: string;
  verificationUrl: string;
}

export async function fetchShopReceiptReprintAdmin(receiptNo: string): Promise<PrintableShopReceiptHistory> {
  const res = await fetch(`${API_BASE_URL}/shops/rent-payments/${encodeURIComponent(receiptNo)}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this receipt.");
  return res.json();
}

export interface ShopPaymentHistoryEntry {
  receiptNo: string;
  formattedReceiptNo: string;
  date: string;
  amountReceived: string;
  paymentMode: string;
}

export async function fetchShopPaymentHistoryAdmin(shopNo: string): Promise<ShopPaymentHistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-payments/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load payment history.");
  const data: { history: ShopPaymentHistoryEntry[] } = await res.json();
  return data.history;
}

export async function fetchPrintableAgreementAdmin(agreementId: number) {
  const res = await fetch(`${API_BASE_URL}/shops/agreements/${agreementId}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the agreement.");
  return res.json();
}

export interface ViolationNotice {
  id: number;
  shop_no: string;
  agreement_id: number | null;
  violation_category: string;
  description: string;
  issued_by: string;
  issued_date: string;
  status: "issued" | "resolved" | "escalated";
  resolved_notes: string | null;
  resolved_at: string | null;
}

export async function fetchViolationNoticesAdmin(shopNo: string): Promise<{ notices: ViolationNotice[] }> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/violation-notices`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load violation notices.");
  return res.json();
}

export async function fetchPrintableDemandNoticeAdmin(demandNo: string) {
  const res = await fetch(`${API_BASE_URL}/shops/rent-demands/${encodeURIComponent(demandNo)}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the demand notice.");
  return res.json();
}

export interface PrintableViolationNotice {
  id: number;
  shopNo: string;
  marketName: string | null;
  location: string;
  violationCategory: string;
  description: string;
  issuedBy: string;
  issuedDate: string;
  status: "issued" | "resolved" | "escalated";
  resolvedNotes: string | null;
  resolvedAt: string | null;
  verificationUrl: string;
}

export async function fetchPrintableViolationNoticeAdmin(id: number): Promise<PrintableViolationNotice> {
  const res = await fetch(`${API_BASE_URL}/shops/violation-notices/${id}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this violation notice.");
  return res.json();
}
// ---------------------------------------------------------------------------
// Shop rental preferences (market/size/bid intake, before a specific
// shop is picked - see the "Apply for a New Rental Shop" page). An
// admin views which pending preferences match a given vacant shop and
// manually allots one, which creates a normal rental application that
// still goes through the existing 5-stage approval chain above.
// ---------------------------------------------------------------------------

export type ShopRentalPreferenceStatus = "pending" | "allotted" | "rejected" | "withdrawn";

export interface ShopRentalPreferenceSummary {
  id: number;
  applicant_name: string;
  applicant_relation_name: string | null;
  applicant_mobile: string | null;
  applicant_business_name: string | null;
  applicant_property_holding_no: string | null;
  min_area_sqft: string;
  max_area_sqft: string;
  bid_amount: string;
  status: ShopRentalPreferenceStatus;
  allotted_shop_no: string | null;
  allotted_application_id: number | null;
  requested_by: string;
  requested_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_notes: string | null;
  markets: string[];
}

export async function fetchRentalPreferences(status?: ShopRentalPreferenceStatus): Promise<ShopRentalPreferenceSummary[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-preferences?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load rental preferences.");
  const data: { preferences: ShopRentalPreferenceSummary[] } = await res.json();
  return data.preferences;
}

export interface ShopSummaryForAllotment {
  shop_no: string;
  market_name: string | null;
  location: string;
  area_sqft: string | null;
  status: string;
}

/** Every shop, for the admin to pick a vacant one from - filter client-side, since there's no dedicated admin vacant-shops endpoint. */
export async function fetchAllShopsForAdmin(): Promise<ShopSummaryForAllotment[]> {
  const res = await fetch(`${API_BASE_URL}/admin/shops`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load shops.");
  const data: { shops: ShopSummaryForAllotment[] } = await res.json();
  return data.shops;
}

/** Every pending preference that matches a specific vacant shop's market and size, ranked by bid as a starting guide - the admin still picks manually. */
export async function fetchPreferencesMatchingShop(
  shopNo: string,
): Promise<{ shop: ShopSummaryForAllotment; matches: ShopRentalPreferenceSummary[] }> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-preferences/matching?shopNo=${encodeURIComponent(shopNo)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not load matching preferences.");
  }
  return res.json();
}

/** The manual allotment decision - creates a normal shop_rental_applications row that still goes through the full existing approval chain. */
export async function allotRentalPreference(preferenceId: number, shopNo: string): Promise<ShopRentalPreferenceSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-preferences/${preferenceId}/allot`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ shopNo }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not allot this preference.");
  }
  const data: { preference: ShopRentalPreferenceSummary } = await res.json();
  return data.preference;
}

export async function rejectRentalPreference(id: number, notes: string): Promise<ShopRentalPreferenceSummary> {
  const res = await fetch(`${API_BASE_URL}/admin/shop-rental-preferences/${id}/reject`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not reject this preference.");
  }
  const data: { preference: ShopRentalPreferenceSummary } = await res.json();
  return data.preference;
}

// ---------------------------------------------------------------------------
// Shop bulk upload (commissioner only)
// ---------------------------------------------------------------------------

export interface ShopCsvImportResult {
  shopsCreated: number;
  agreementsCreated: number;
  errors: { row: number; message: string }[];
}

export async function uploadShopsCsv(csvContent: string): Promise<ShopCsvImportResult> {
  const res = await fetch(`${API_BASE_URL}/admin/shops/bulk-upload`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ csvContent }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Upload failed.");
  }
  return res.json();
}
