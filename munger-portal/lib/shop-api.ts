import { getOperatorToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

function authHeaders(): HeadersInit {
  const token = getOperatorToken();
  if (!token) throw new Error("Not logged in — please log in again.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export interface PendingRentMonth {
  month: string;
  baseRent: string;
  penalty: string;
  total: string;
}

export interface ShopSearchResult {
  found: boolean;
  message?: string;
  shop?: Record<string, unknown>;
  agreement?: Record<string, unknown>;
  pendingRent?: {
    pendingMonths: PendingRentMonth[];
    totalBase: string;
    totalPenalty: string;
    totalPending: string;
    note: string;
  };
}

export async function fetchShopByShopNo(shopNo: string): Promise<ShopSearchResult> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}`, { headers: authHeaders() });
  if (res.status === 404) return { found: false };
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
}

export interface CreateShopInput {
  shopNo: string;
  marketName?: string | null;
  location: string;
  ward?: string | null;
  areaSqft?: number | null;
}

export async function createShop(input: CreateShopInput): Promise<{ shopNo: string }> {
  const res = await fetch(`${API_BASE_URL}/shops`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not create shop.");
  }
  return res.json();
}

export async function fetchMarketList(): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/shops/markets`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load market list.");
  const data: { markets: string[] } = await res.json();
  return data.markets;
}

/** Preview for a NEW shop's auto-generated number in a market — an existing/old shop is entered manually instead. */
export async function fetchNextShopNumber(marketName: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/shops/next-number?marketName=${encodeURIComponent(marketName)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not generate next shop number.");
  const data: { shopNo: string } = await res.json();
  return data.shopNo;
}

export type ShopAgreementDataStatus = "complete" | "partial";

/**
 * agreementRent/demandRegisterRent and agreementHolderName/
 * demandRegisterHolderName are reference values only (commonly differ
 * on migrated records) — baseMonthlyRent/holderName are the operator's
 * CONFIRMED applicable choice between them, picked via a dropdown of
 * those two sources.
 */
export interface AgreementInput {
  agreementNumber?: string | null;
  agreementHolderName?: string | null;
  demandRegisterHolderName?: string | null;
  holderName: string;
  holderRelationType?: string | null;
  holderRelationName?: string | null;
  holderMobile?: string | null;
  holderAddress?: string | null;
  idProofNumber?: string | null;
  businessName?: string | null;
  agreementRent?: number | null;
  demandRegisterRent?: number | null;
  baseMonthlyRent: number;
  escalationPct?: number;
  escalationIntervalYears?: number;
  agreementStartDate?: string | null;
  agreementEndDate?: string | null;
  securityDeposit?: number;
  lateFeePctPerMonth?: number | null;
  jointHolderName?: string | null;
  jointHolderRelation?: string | null;
  jointHolderIdProofNumber?: string | null;
  notes?: string | null;
  dataStatus?: ShopAgreementDataStatus;
  changeReason: string;
}

export async function submitAgreementChange(
  shopNo: string,
  input: AgreementInput,
): Promise<{ changeRequestId: number; status: "pending"; approvalTier: "full" | "data_completion" }> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/agreement`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not submit agreement.");
  }
  return res.json();
}

export interface UnsettledShopDemand {
  demandNo: string;
  formattedDemandNo: string;
  demandDate: string;
  periodStartMonth: string;
  periodEndMonth: string;
  totalAmountDemanded: string;
}

export async function fetchUnsettledShopDemands(shopNo: string): Promise<UnsettledShopDemand[]> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-demands/unsettled`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load rent demands.");
  const data: { demands: UnsettledShopDemand[] } = await res.json();
  return data.demands;
}

export async function generateRentDemand(
  shopNo: string,
  monthsToCover: number,
): Promise<{ demand: Record<string, unknown>; formattedDemandNo: string }> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-demand`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ monthsToCover }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not generate rent demand.");
  }
  return res.json();
}

export interface ShopRentPaymentResult {
  receiptNo: string;
  formattedReceiptNo: string;
  amountReceived: string;
  paymentMode: string;
  counter: string | null;
  date: string;
  periodStartMonth: string;
  periodEndMonth: string;
  shopNo: string;
  marketName: string | null;
  location: string;
  holderName: string;
  baseRentAmount: string;
  penaltyAmount: string;
  collectedBy: string;
  verificationUrl: string;
}

export interface PrintableShopDemand {
  demandNo: string;
  formattedDemandNo: string;
  demandDate: string;
  periodStartMonth: string;
  periodEndMonth: string;
  baseRentAmount: string;
  penaltyAmount: string;
  totalAmountDemanded: string;
  settled: boolean;
  shopNo: string;
  marketName: string | null;
  location: string;
  holderName: string;
  holderMobile: string | null;
  holderAddress: string | null;
  generatedBy: string;
  verificationUrl: string;
}

export async function fetchPrintableDemandNotice(demandNo: string): Promise<PrintableShopDemand> {
  const res = await fetch(`${API_BASE_URL}/shops/rent-demands/${encodeURIComponent(demandNo)}/print`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load the demand notice.");
  return res.json();
}

export interface PrintableShopAgreement {
  shopNo: string;
  marketName: string | null;
  location: string;
  agreementNumber: string | null;
  holderName: string;
  holderRelationType: string | null;
  holderRelationName: string | null;
  holderMobile: string | null;
  holderAddress: string | null;
  idProofNumber: string | null;
  businessName: string | null;
  baseMonthlyRent: string;
  escalationPct: string;
  escalationIntervalYears: number;
  agreementStartDate: string | null;
  agreementEndDate: string | null;
  securityDeposit: string;
  lateFeePctPerMonth: string | null;
  jointHolderName: string | null;
  jointHolderRelation: string | null;
  status: string;
  verificationUrl: string;
}

export async function fetchPrintableAgreement(agreementId: number): Promise<PrintableShopAgreement> {
  const res = await fetch(`${API_BASE_URL}/shops/agreements/${agreementId}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load the agreement.");
  return res.json();
}

export async function submitShopRentPayment(
  shopNo: string,
  input: { demandNo: string; paymentMode: string; counter?: string | null },
): Promise<ShopRentPaymentResult> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-payments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Payment failed.");
  }
  return res.json();
}

export interface RentalApplicationInput {
  shopNo: string;
  applicantName: string;
  applicantRelationType?: string | null;
  applicantRelationName?: string | null;
  applicantMobile?: string | null;
  applicantAddress?: string | null;
  applicantIdProofNumber?: string | null;
  applicantBusinessName?: string | null;
  proposedMonthlyRent: number;
  applicantPropertyHoldingNo?: string | null;
}

export async function submitRentalApplication(
  input: RentalApplicationInput,
): Promise<{ applicationId: number; status: "pending" }> {
  const res = await fetch(`${API_BASE_URL}/shop-rental-applications`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not submit rental application.");
  }
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

export async function fetchViolationNotices(shopNo: string): Promise<{ notices: ViolationNotice[]; suggestedCategories: string[] }> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/violation-notices`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Could not load violation notices.");
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

export async function fetchPrintableViolationNotice(id: number): Promise<PrintableViolationNotice> {
  const res = await fetch(`${API_BASE_URL}/shops/violation-notices/${id}/print`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load this violation notice.");
  return res.json();
}

export async function issueViolationNotice(
  shopNo: string,
  input: { violationCategory: string; description: string },
): Promise<{ notice: ViolationNotice }> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/violation-notices`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not issue notice.");
  }
  return res.json();
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

export async function fetchShopDemandHistory(shopNo: string): Promise<ShopDemandHistoryEntry[]> {
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

export async function fetchShopReceiptReprint(receiptNo: string): Promise<PrintableShopReceiptHistory> {
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

export async function fetchShopPaymentHistory(shopNo: string): Promise<ShopPaymentHistoryEntry[]> {
  const res = await fetch(`${API_BASE_URL}/shops/${encodeURIComponent(shopNo)}/rent-payments/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Could not load payment history.");
  const data: { history: ShopPaymentHistoryEntry[] } = await res.json();
  return data.history;
}