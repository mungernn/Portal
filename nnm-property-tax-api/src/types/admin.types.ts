export type AdminRole =
  | "tax_daroga"
  | "mutation_nodal_clerk"
  | "deputy_commissioner"
  | "commissioner"
  | "stall_prabhari"
  | "city_manager"
  | "trade_license_nodal";

export const ADMIN_ROLES: AdminRole[] = [
  "tax_daroga",
  "mutation_nodal_clerk",
  "deputy_commissioner",
  "commissioner",
  "stall_prabhari",
  "city_manager",
  "trade_license_nodal",
];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  tax_daroga: "Tax Daroga",
  mutation_nodal_clerk: "Mutation Nodal Clerk",
  deputy_commissioner: "Deputy Municipal Commissioner",
  commissioner: "Municipal Commissioner",
  stall_prabhari: "Stall Prabhari",
  city_manager: "City Manager",
  trade_license_nodal: "Trade License Nodal",
};

/**
 * Fixed order a PROPERTY mutation request moves through — mirrors
 * physical file movement. Only the admin whose role matches a request's
 * current_stage may approve/reject it at that point. The request's own
 * final_stage (set by classifyPropertyChange — see
 * changeClassification.service.ts) determines which approval actually
 * applies the change; not every request needs to reach the end of this
 * list.
 */
export const APPROVAL_STAGE_ORDER: AdminRole[] = ["tax_daroga", "mutation_nodal_clerk", "deputy_commissioner", "commissioner"];

export function nextApprovalStage(stage: AdminRole): AdminRole | null {
  const idx = APPROVAL_STAGE_ORDER.indexOf(stage);
  return idx >= 0 && idx < APPROVAL_STAGE_ORDER.length - 1 ? APPROVAL_STAGE_ORDER[idx + 1]! : null;
}

/**
 * Fixed order a SHOP agreement request moves through — a separate chain
 * from property mutations, sharing three of the same officers
 * (Tax Daroga, Deputy Commissioner, Commissioner) alongside two roles
 * specific to shop/estate management. Tax Daroga's step here is
 * specifically an NOC (No Objection Certificate) check — see
 * shopAgreement.service.ts for what that means in practice.
 */
export const SHOP_APPROVAL_STAGE_ORDER: AdminRole[] = [
  "stall_prabhari",
  "tax_daroga",
  "city_manager",
  "deputy_commissioner",
  "commissioner",
];

export function nextShopApprovalStage(stage: AdminRole): AdminRole | null {
  const idx = SHOP_APPROVAL_STAGE_ORDER.indexOf(stage);
  return idx >= 0 && idx < SHOP_APPROVAL_STAGE_ORDER.length - 1 ? SHOP_APPROVAL_STAGE_ORDER[idx + 1]! : null;
}

/**
 * Fixed order a TRADE LICENSE application (new or renewal) moves
 * through — a third, separate chain. Only 3 stages, and unlike the
 * other two chains, this one's final approval sits at Deputy
 * Commissioner, not Commissioner. City Manager is shared with the shop
 * chain (same officer, different duty); Trade License Nodal is
 * specific to this chain alone.
 */
export const TRADE_LICENSE_APPROVAL_STAGE_ORDER: AdminRole[] = ["trade_license_nodal", "city_manager", "deputy_commissioner"];

export function nextTradeLicenseApprovalStage(stage: AdminRole): AdminRole | null {
  const idx = TRADE_LICENSE_APPROVAL_STAGE_ORDER.indexOf(stage);
  return idx >= 0 && idx < TRADE_LICENSE_APPROVAL_STAGE_ORDER.length - 1 ? TRADE_LICENSE_APPROVAL_STAGE_ORDER[idx + 1]! : null;
}

export interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: AdminRole;
  active: boolean;
  email: string | null;
}

export interface AdminLoginResult {
  token: string;
  admin: {
    id: number;
    username: string;
    displayName: string;
    role: AdminRole;
  };
}

/** Payload embedded in the JWT. `type: "admin"` prevents an operator token from being accepted on an admin-only route, and vice versa. */
export interface AdminTokenPayload {
  type: "admin";
  sub: number;
  username: string;
  displayName: string;
  role: AdminRole;
}