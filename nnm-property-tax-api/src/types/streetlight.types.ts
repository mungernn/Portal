export interface InstallationAgencyRow {
  id: number;
  agency_name: string;
  active: boolean;
  created_at: string;
}

export interface LightRow {
  id: number;
  light_type: "streetlight" | "high_mast";
  ward_id: number;
  locality_name: string;
  serial_number: string;
  latitude: string;
  longitude: string;
  installation_agency_id: number | null;
  active: boolean;
  created_at: string;
}

export interface ContractorWardRow {
  ward_id: number;
  contractor_id: number;
}

export interface LightFaultRow {
  id: number;
  light_id: number | null;
  reported_gps_lat: string | null;
  reported_gps_lng: string | null;
  reported_at: string;
  deadline_at: string;
  reported_by_type: "staff" | "public";
  reported_by_user_id: number | null;
  reporter_phone: string | null;
  reporter_notes: string | null;
  status: "open" | "repaired";
  repaired_at: string | null;
  repaired_by_user_id: number | null;
  repair_notes: string | null;
  assigned_contractor_id: number | null;
}

export type PenaltyPartyType = "contractor" | "city_manager" | "dmc";

export interface LightFaultPenaltyRow {
  id: number;
  fault_id: number;
  penalty_date: string;
  party_type: PenaltyPartyType;
  party_user_id: number | null;
  amount: string;
  created_at: string;
}
