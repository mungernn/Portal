export interface PropertyRow {
  holding_no: string;
  old_holding_no: string | null;
  old_pid: string | null;
  khesra_no: string | null;
  survey_sheet_no: string | null;
  khata_no: string | null;
  aadhaar_number: string | null;
  owner_name: string;
  relation_type: string | null;
  relation_name: string | null;
  mobile_no: string | null;
  area_sqft: string; // numeric columns come back as strings from `pg` — parse with Number()/num_()
  address: string;
  ward: string | null;
  zone: string | null;
  pincode: string | null;
  assessment_year: string;
  road_type: "PMR" | "MR" | "OR";
  vacant_area_sqft: string;
  rain_water_harvesting: boolean;
  solar_rooftop: boolean;
  arrear_tax: string;
  solid_waste_charge_type: string | null;
  solid_waste_months: number;
  solid_waste_charge: string;
  penal_charge: string;
  water_charge: string;
  boring_charge: string;
  form_fee: string;
  misc_cost: string;
  misc_cost_reason: string | null;
  misc_rebate: string;
  misc_rebate_reason: string | null;
  penalty: string;
  outstanding_demand: string;
  arv: string;
  tax_payable: string;
  holding_creation_year: string;
  tax_paid_till_year: string | null;
  present_holding_name: string | null;
  present_category: string | null;
  created_by: string;
  created_date: Date;
  last_modified_by: string | null;
  last_modified_date: Date | null;
}

export interface FloorRow {
  id: number;
  holding_no: string;
  floor_label: string;
  buildup_sqft: string;
  const_type: "RCC" | "Asbestos" | "Other";
  usage_type: string;
  occupancy: "self" | "rented";
  year_built: string | null;
  closing_year: string | null;
  floor_arv: string;
  floor_tax: string;
}

export interface TaxHistoryStageRow {
  id: number;
  holding_no: string;
  period_of_assessment: string;
  start_year_used: number;
  closing_year: number;
  arv_in_period: string;
  tax_rate_in_period: string;
  annual_tax_amount: string;
  years_count: number;
  total_amount: string;
  override_reason: string | null;
  override_remarks: string | null;
  added_by: string;
  added_date: Date;
  auto_generated: boolean;
}

export interface FloorBreakdownEntry {
  floor: string;
  demolished?: boolean;
  area?: number;
  constType?: string;
  usage?: string;
  occupancy?: string;
  category?: string;
  rate?: number;
  useFactor?: number;
  occFactor?: number;
  floorArv?: string;
  floorTax?: string;
  error?: string | null;
}

export interface TaxCalculationResult {
  arv: string;
  arvBuilt: string;
  baseTax: string;
  rebate: string;
  rebateReason: string;
  currentTax: string;
  netTax: string;
  breakdown: FloorBreakdownEntry[];
  vacant: {
    declaredArea: string;
    taxableArea: string;
    groundFloorBuiltArea: string;
    totalPlotArea: string;
    rate: number;
    tax: string;
  };
}

export interface RebateOrLateFeeResult {
  rebate: number;
  lateFee: number;
  net: number;
}

export interface ArrearsSummary {
  totalPending: number;
  penalty: number;
  stagesConsidered: number;
  note: string;
}

export interface PropertySearchResult {
  found: boolean;
  message?: string;
  property?: PropertyRow & {
    currentTax: string;
    rebate: string;
    arv: string;
    builtArv: string;
    vacantTax: string;
    vacantRate: number;
    declaredVacantArea: string;
    taxableVacantArea: string;
    groundFloorBuiltArea: string;
    solidWasteCharge: string;
    currentYearTiming: RebateOrLateFeeResult;
	currentCyclePaid: boolean;
    paidThroughYear: string | null;
    pendingArrearsTotal: string;
	autoPenalty: string;
    totalPayable: string;
  };
  floors?: FloorRow[];
  taxCalc?: TaxCalculationResult;
  taxHistory?: TaxHistoryStageRow[];
  arrears?: ArrearsSummary;
}