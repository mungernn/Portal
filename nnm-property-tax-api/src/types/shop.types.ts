export interface ShopRow {
  shop_no: string;
  market_name: string | null;
  location: string;
  ward: string | null;
  area_sqft: string | null;
  total_area_sqft: string | null;
  built_up_area_sqft: string | null;
  status: "vacant" | "occupied" | "under_notice" | "terminated";
  created_by: string;
  created_date: Date;
  last_modified_by: string | null;
  last_modified_date: Date | null;
}

export type ShopAgreementDataStatus = "complete" | "partial";

export interface ShopAgreementRow {
  id: number;
  shop_no: string;
  agreement_number: string | null;
  agreement_holder_name: string | null;
  demand_register_holder_name: string | null;
  holder_name: string;
  holder_relation_type: string | null;
  holder_relation_name: string | null;
  holder_mobile: string | null;
  holder_address: string | null;
  id_proof_number: string | null;
  business_name: string | null;
  agreement_rent: string | null;
  demand_register_rent: string | null;
  base_monthly_rent: string;
  rent_pre_2019: string | null;
  rent_2019_20: string | null;
  rent_2020_21_onwards: string | null;
  agreement_start_date: Date | null;
  agreement_end_date: Date | null;
  security_deposit: string;
  misc_cost: string;
  misc_cost_reason: string | null;
  misc_rebate: string;
  misc_rebate_reason: string | null;
  joint_holder_name: string | null;
  joint_holder_relation: string | null;
  joint_holder_id_proof_number: string | null;
  notes: string | null;
  data_status: ShopAgreementDataStatus;
  rent_paid_till_month: string | null;
  status: "active" | "expired" | "terminated";
  created_by: string;
  created_date: Date;
  last_modified_by: string | null;
  last_modified_date: Date | null;
}

export interface ShopRentDemandRow {
  demand_no: string;
  shop_no: string;
  agreement_id: number;
  demand_date: Date;
  generated_by: string;
  period_start_month: string;
  period_end_month: string;
  base_rent_amount: string;
  penalty_amount: string;
  misc_cost_amount: string;
  misc_cost_reason: string | null;
  misc_rebate_amount: string;
  misc_rebate_reason: string | null;
  total_amount_demanded: string;
  settled: boolean;
  settled_receipt_no: string | null;
  settled_at: Date | null;
}

export interface ShopRentPaymentRow {
  receipt_no: string;
  shop_no: string;
  agreement_id: number;
  demand_no: string;
  payment_mode: string;
  amount_received: string;
  collected_by: string;
  counter: string | null;
  txn_date: Date;
}

export interface ShopViolationNoticeRow {
  id: number;
  shop_no: string;
  agreement_id: number | null;
  violation_category: string;
  description: string;
  issued_by: string;
  issued_date: Date;
  status: "issued" | "resolved" | "escalated";
  resolved_notes: string | null;
  resolved_at: Date | null;
}

/**
 * What an applicant submits when expressing interest in a rental shop
 * WITHOUT picking one specific shop - a set of acceptable markets, a
 * size range, and a bid. An admin later matches this against actual
 * vacant shops and allots one manually (see
 * shopRentalPreference.service.ts) - this record never becomes an
 * agreement directly, it feeds into ShopRentalApplicationInput once
 * allotted.
 */
export interface ShopRentalPreferenceInput {
  marketNames: string[];
  minAreaSqft: number;
  maxAreaSqft: number;
  bidAmount: number;
  applicantName: string;
  applicantRelationType?: string | null;
  applicantRelationName?: string | null;
  applicantMobile?: string | null;
  applicantAddress?: string | null;
  applicantIdProofNumber?: string | null;
  applicantBusinessName?: string | null;
  applicantPropertyHoldingNo?: string | null;
}

export interface ShopRentalPreferenceRow {
  id: number;
  applicant_name: string;
  applicant_relation_type: string | null;
  applicant_relation_name: string | null;
  applicant_mobile: string | null;
  applicant_address: string | null;
  applicant_id_proof_number: string | null;
  applicant_business_name: string | null;
  applicant_property_holding_no: string | null;
  min_area_sqft: string;
  max_area_sqft: string;
  bid_amount: string;
  status: "pending" | "allotted" | "rejected" | "withdrawn";
  allotted_shop_no: string | null;
  allotted_application_id: number | null;
  requested_by: string;
  requested_at: Date;
  decided_by: string | null;
  decided_at: Date | null;
  decision_notes: string | null;
}

/** What an operator submits to record a new shop rental application. */
export interface ShopRentalApplicationInput {
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

export interface ShopRentalApplicationRow {
  id: number;
  shop_no: string;
  applicant_name: string;
  applicant_relation_type: string | null;
  applicant_relation_name: string | null;
  applicant_mobile: string | null;
  applicant_address: string | null;
  applicant_id_proof_number: string | null;
  applicant_business_name: string | null;
  proposed_monthly_rent: string;
  applicant_property_holding_no: string | null;
  status: "pending" | "approved" | "rejected";
  current_stage: string;
  requested_by: string;
  requested_at: Date;
  final_decided_at: Date | null;
  reviewed_by: string | null;
  reviewed_role: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  created_agreement_id: number | null;
}

export interface ShopRentalApplicationApprovalRow {
  id: number;
  application_id: number;
  stage: string;
  decision: "approved" | "rejected";
  admin_username: string;
  admin_display_name: string;
  notes: string | null;
  decided_at: Date;
}

/**
 * What an operator submits to create/edit an agreement — goes into the
 * approval queue, never applied directly.
 *
 * agreementRent/demandRegisterRent and agreementHolderName/
 * demandRegisterHolderName are reference values only (commonly differ
 * on migrated records) — baseMonthlyRent/holderName are the operator's
 * CONFIRMED applicable choice between them (or a fresh value, for a
 * genuinely new agreement with no discrepancy to begin with).
 */
export interface ShopAgreementSaveInput {
  shopNo: string;
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
  rentPre2019?: number | null;
  rent201920?: number | null;
  rent202021Onwards?: number | null;
  agreementStartDate?: string | null;
  agreementEndDate?: string | null;
  securityDeposit?: number;
  miscCost?: number;
  miscCostReason?: string | null;
  miscRebate?: number;
  miscRebateReason?: string | null;
  jointHolderName?: string | null;
  jointHolderRelation?: string | null;
  jointHolderIdProofNumber?: string | null;
  notes?: string | null;
  dataStatus?: ShopAgreementDataStatus;
  changeReason: string;
}

export interface ShopAgreementChangeRequestRow {
  id: number;
  shop_no: string;
  agreement_id: number | null;
  requested_by: string;
  requested_at: Date;
  status: "pending" | "approved" | "rejected";
  change_reason: string;
  proposed_data: ShopAgreementSaveInput;
  current_stage: string;
  approval_tier: "full" | "data_completion";
  final_stage: string;
  final_decided_at: Date | null;
  reviewed_by: string | null;
  reviewed_role: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
}

export interface ShopAgreementChangeApprovalRow {
  id: number;
  change_request_id: number;
  stage: string;
  decision: "approved" | "rejected";
  admin_username: string;
  admin_display_name: string;
  notes: string | null;
  decided_at: Date;
}