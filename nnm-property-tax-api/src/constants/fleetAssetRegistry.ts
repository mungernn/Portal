/**
 * Fleet Baseline Survey field-definition registry - the single source
 * of truth for the asset category/type hierarchy and every
 * asset-type-specific technical field. Drives both server-side
 * validation of technical_data and the frontend's dynamic survey form
 * (select Asset Category -> Asset Type -> only relevant fields
 * appear), per the frozen architecture from the design discussion:
 * one authoritative home per field, no field asked twice.
 *
 * This is a PHASED registry - not every technical module from the
 * design is implemented yet (17 total are planned). An asset type
 * with no entry in TECHNICAL_MODULES_BY_ASSET_TYPE simply gets no
 * technical fields shown yet (the common/master survey - condition,
 * defects, utilisation, AMC - still fully applies to it either way).
 * Expand FIELD_DEFINITIONS and TECHNICAL_MODULES_BY_ASSET_TYPE
 * together as later modules are built.
 */

export type FieldType = "text" | "number" | "boolean" | "select" | "multiselect" | "textarea";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
}

export interface TechnicalModuleDef {
  key: string;
  label: string;
  fields: FieldDef[];
  /** Named sub-groups within the module - e.g. Suction/Jetting's F1/F2, Small Collection's ICE/EV branch. Rendered as visually distinct sections; "exclusive" sub-sections (only one applies, chosen by the surveyor) vs "additive" ones (both can apply) are just a frontend UX distinction, not encoded here. */
  subsections?: { key: string; label: string; fields: FieldDef[] }[];
}

// ---------------------------------------------------------------------
// Asset Category -> Asset Type hierarchy
// ---------------------------------------------------------------------

export const ASSET_CATEGORIES = [
  "Road Vehicle",
  "Tractor",
  "Trailer",
  "Mobile Construction Equipment",
  "Waste Processing/Collection Equipment",
  "Water Management Equipment",
  "Sewer/Drain Cleaning Equipment",
  "Road Sweeping Equipment",
  "Robotic Equipment",
  "Material Handling Equipment",
  "Workshop/Support Equipment",
  "Other Municipal Equipment",
] as const;

/**
 * Every asset type, grouped by category. Consolidated per the design
 * discussion - e.g. every excavator variant (Mini/Crawler/Poclain/
 * Large) collapses into one "Hydraulic Excavator" type, with
 * excavator_class (Mini/Compact/Medium/Large) as the separate
 * dimension distinguishing them, not a separate type each.
 */
export const ASSET_TYPES_BY_CATEGORY: Record<string, string[]> = {
  "Road Vehicle": [
    "Mini Tipper", "LCV Tipper", "Hydraulic Tipper Truck", "Tipping Dumper", "Dumper Truck",
    "Hook Loader", "Skip Loader", "Utility Vehicle", "Pickup Truck", "Light Commercial Vehicle",
    "Multi-Utility Vehicle (MUV)",
  ],
  "Tractor": [
    "Tractor", "Tractor-Trailer Combination", "Tractor Mounted Water Tanker", "Tractor Mounted Sprinkler",
    "Tractor Mounted Loader", "Tractor Mounted Backhoe Loader",
  ],
  "Trailer": ["Trailer"],
  "Mobile Construction Equipment": ["Backhoe Loader", "Wheel Loader", "Skid Steer Loader", "Hydraulic Excavator"],
  "Waste Processing/Collection Equipment": [
    "Compactor Truck", "Rear-Loading Refuse Compactor", "Front-Loading Refuse Compactor", "Side-Loading Refuse Compactor",
    "Auto-Tipper / Three-Wheeler Tipper", "Electric Garbage Collection Vehicle", "Battery Operated Garbage Cart",
    "Garbage Lifting Vehicle", "Container Carrier", "Roll-on/Roll-off (RORO) Container Carrier",
  ],
  "Water Management Equipment": ["Water Tanker", "Water Sprinkler Tanker"],
  "Sewer/Drain Cleaning Equipment": [
    "Sewer Jetting Machine", "Sewer Jetting-cum-Suction Machine", "Septic Tank Suction Machine",
    "Suction-Cum-Jetting Machine", "Drain Cleaning Machine", "Road/Drain Desilting Machine",
  ],
  "Road Sweeping Equipment": ["Mechanical Sweeper", "Truck Mounted Mechanical Sweeper", "Vacuum Road Sweeper"],
  "Robotic Equipment": ["Robotic Drain Cleaning Machine", "Remote-Controlled Robotic Cleaning Machine"],
  "Material Handling Equipment": ["Vehicle Mounted Crane", "Truck Mounted Crane", "Forklift"],
  "Workshop/Support Equipment": ["Service/Workshop Vehicle", "Mobile Workshop Vehicle"],
  "Other Municipal Equipment": ["Other Special-Purpose Municipal Equipment"],
};

/** Only "Hydraulic Excavator" uses this - the class dimension replacing separate Mini/Compact/Medium/Large types. */
export const EXCAVATOR_CLASSES = ["Mini", "Compact", "Medium", "Large"] as const;

// ---------------------------------------------------------------------
// Technical modules (PHASED - see file header). Each asset type maps
// to zero or more module keys; the frontend renders each module's
// fields as its own section, in order, and multiple modules can
// apply to the same asset type (e.g. "Mini Tipper" gets both
// road_vehicle and tipping_body).
// ---------------------------------------------------------------------

export const TECHNICAL_MODULES: Record<string, TechnicalModuleDef> = {
  road_vehicle: {
    key: "road_vehicle",
    label: "Road Vehicle - Common Questions",
    fields: [
      { key: "chassisManufacturer", label: "Chassis manufacturer", type: "text" },
      { key: "chassisModel", label: "Chassis model", type: "text" },
      { key: "engineDisplacement", label: "Engine displacement", type: "text" },
      { key: "gvw", label: "GVW", type: "number", unit: "kg" },
      { key: "kerbWeight", label: "Kerb weight", type: "number", unit: "kg" },
      { key: "payload", label: "Payload", type: "number", unit: "kg" },
      { key: "wheelbase", label: "Wheelbase", type: "number", unit: "mm" },
      { key: "axles", label: "Number of axles", type: "number" },
      { key: "driveConfiguration", label: "Drive configuration", type: "text" },
      { key: "transmission", label: "Transmission", type: "text" },
      { key: "tyreSpecification", label: "Tyre specification", type: "text" },
      { key: "fuelTankCapacity", label: "Fuel tank capacity", type: "number", unit: "L" },
      { key: "cabinType", label: "Cabin type", type: "text" },
      { key: "ac", label: "AC", type: "boolean" },
      { key: "powerSteering", label: "Power steering", type: "boolean" },
      { key: "abs", label: "ABS", type: "boolean" },
      { key: "reverseAlarm", label: "Reverse alarm", type: "boolean" },
      { key: "gps", label: "GPS", type: "boolean" },
      { key: "gpsDeviceId", label: "GPS device ID", type: "text" },
    ],
  },

  tipping_body: {
    key: "tipping_body",
    label: "Tipping Body",
    fields: [
      { key: "bodyType", label: "Body type", type: "text" },
      { key: "bodyManufacturer", label: "Body manufacturer", type: "text" },
      { key: "bodyMaterial", label: "Body material", type: "text" },
      { key: "bodyLength", label: "Body length", type: "number", unit: "mm" },
      { key: "bodyWidth", label: "Body width", type: "number", unit: "mm" },
      { key: "bodyHeight", label: "Body height", type: "number", unit: "mm" },
      { key: "volumetricCapacity", label: "Volumetric capacity", type: "number", unit: "m³" },
      { key: "actualUsableCapacity", label: "Actual usable capacity", type: "number", unit: "m³" },
      { key: "payloadCapacity", label: "Payload capacity", type: "number", unit: "kg" },
      { key: "hydraulicTipping", label: "Hydraulic tipping", type: "boolean" },
      { key: "tippingMechanism", label: "Tipping mechanism", type: "text" },
      { key: "tippingAngle", label: "Tipping angle", type: "number", unit: "°" },
      { key: "hydraulicCylinderType", label: "Hydraulic cylinder type", type: "text" },
      { key: "hydraulicPump", label: "Hydraulic pump", type: "text" },
      { key: "hydraulicOilCapacity", label: "Hydraulic oil capacity", type: "number", unit: "L" },
      { key: "tailgateType", label: "Tailgate type", type: "text" },
      { key: "bodyFloorThickness", label: "Body floor thickness", type: "text" },
      { key: "sideWallThickness", label: "Side-wall thickness", type: "text" },
    ],
  },

  refuse_compactor: {
    key: "refuse_compactor",
    label: "Garbage Compactor",
    fields: [
      { key: "compactorManufacturer", label: "Compactor manufacturer", type: "text" },
      { key: "compactorModel", label: "Compactor model", type: "text" },
      { key: "compactorType", label: "Compactor type", type: "text" },
      { key: "bodyCapacity", label: "Body capacity", type: "number", unit: "m³" },
      { key: "hopperCapacity", label: "Hopper capacity", type: "number", unit: "m³" },
      { key: "payload", label: "Payload", type: "number", unit: "kg" },
      { key: "compactionMechanism", label: "Compaction mechanism", type: "text" },
      { key: "compactionRatio", label: "Compaction ratio", type: "text" },
      { key: "compactionForce", label: "Compaction force", type: "text" },
      { key: "loadingMechanism", label: "Loading mechanism", type: "text" },
      { key: "loadingHeight", label: "Loading height", type: "number", unit: "mm" },
      { key: "ejectorMechanism", label: "Ejector mechanism", type: "text" },
      { key: "ejectorPlate", label: "Ejector plate", type: "text" },
      { key: "leachateTank", label: "Leachate tank", type: "boolean" },
      { key: "leachateTankCapacity", label: "Leachate tank capacity", type: "number", unit: "L" },
      { key: "washoutSystem", label: "Washout system", type: "text" },
      { key: "hydraulicPump", label: "Hydraulic pump", type: "text" },
      { key: "hydraulicPressure", label: "Hydraulic pressure", type: "text" },
      { key: "hydraulicOilCapacity", label: "Hydraulic oil capacity", type: "number", unit: "L" },
      { key: "controlSystem", label: "Control system", type: "text" },
      { key: "emergencyStop", label: "Emergency stop", type: "boolean" },
      { key: "cycleTime", label: "Cycle time", type: "text" },
      { key: "avgCompactionCyclesPerDay", label: "Average number of compaction cycles per day", type: "number" },
    ],
  },
};

/**
 * Maps each asset type to the technical module(s) that apply to it.
 * An asset type absent from this map (or mapped to an empty array)
 * simply gets no technical-module fields yet - phased rollout, see
 * file header.
 */
export const TECHNICAL_MODULES_BY_ASSET_TYPE: Record<string, string[]> = {
  "Mini Tipper": ["road_vehicle", "tipping_body"],
  "LCV Tipper": ["road_vehicle", "tipping_body"],
  "Hydraulic Tipper Truck": ["road_vehicle", "tipping_body"],
  "Tipping Dumper": ["road_vehicle", "tipping_body"],
  "Dumper Truck": ["road_vehicle", "tipping_body"],
  "Utility Vehicle": ["road_vehicle"],
  "Pickup Truck": ["road_vehicle"],
  "Light Commercial Vehicle": ["road_vehicle"],
  "Multi-Utility Vehicle (MUV)": ["road_vehicle"],
  "Compactor Truck": ["road_vehicle", "refuse_compactor"],
  "Rear-Loading Refuse Compactor": ["road_vehicle", "refuse_compactor"],
  "Front-Loading Refuse Compactor": ["road_vehicle", "refuse_compactor"],
  "Side-Loading Refuse Compactor": ["road_vehicle", "refuse_compactor"],
};

export function getTechnicalModulesForAssetType(assetType: string): TechnicalModuleDef[] {
  const keys = TECHNICAL_MODULES_BY_ASSET_TYPE[assetType] ?? [];
  return keys.map((k) => TECHNICAL_MODULES[k]).filter((m): m is TechnicalModuleDef => Boolean(m));
}

// ---------------------------------------------------------------------
// Common Condition Module (Module 06) - identical for every asset,
// grouped exactly as specified. The frontend renders a 1-5 dropdown
// per component listed here.
// ---------------------------------------------------------------------

export const CONDITION_COMPONENT_GROUPS: { group: string; components: string[] }[] = [
  { group: "Mechanical", components: ["Engine/motor", "Transmission", "Clutch", "Differential", "Steering", "Suspension", "Brakes", "Hydraulic system", "PTO"] },
  { group: "Electrical", components: ["Battery", "Alternator", "Starter", "Wiring", "Lights", "Indicators", "Horn", "Instrument cluster"] },
  { group: "Structural", components: ["Chassis/frame", "Body", "Cabin", "Corrosion", "Welds", "Doors", "Safety equipment"] },
  { group: "Tyres/Tracks", components: ["Front tyres", "Rear tyres", "Spare tyre", "Track condition"] },
];

export const CONDITION_SCALE = [
  { value: 1, label: "Excellent" },
  { value: 2, label: "Good" },
  { value: 3, label: "Fair" },
  { value: 4, label: "Poor" },
  { value: 5, label: "Non-functional" },
];

export const OVERALL_STATUS_OPTIONS = [
  "Operational - Good condition",
  "Operational - Minor defects",
  "Operational - Major repair required",
  "Non-operational - Repairable",
  "Beyond Economical Repair / Proposed for Disposal",
];

export const SAFETY_STATUS_OPTIONS = ["Safe for operation", "Operation restricted", "Unsafe - do not operate"];

export const AMC_DISPOSITION_OPTIONS = [
  { value: "A", label: "Comprehensive AMC/CMC suitable" },
  { value: "B", label: "AMC suitable with specified exclusions" },
  { value: "C", label: "Major rehabilitation required before AMC" },
  { value: "D", label: "Not economically suitable for AMC" },
  { value: "E", label: "Proposed for disposal" },
];

export const DEPLOYMENT_STATUS_OPTIONS = [
  "Operationally deployed", "Standby", "Under repair", "Awaiting repair", "Awaiting disposal", "Not deployed", "Other",
];

export const UTILISATION_DATA_SOURCE_OPTIONS = [
  "GPS/telematics", "Logbook", "Weighbridge", "Operator statement", "Supervisor estimate", "Other", "No data available",
];

export const MAINTENANCE_DATA_CONFIDENCE_OPTIONS = [
  "Verified documentary record", "Workshop record", "Operator/logbook record", "Verbal information", "Estimated", "No record",
];

export const DEFECT_SEVERITY_OPTIONS = ["Critical", "Major", "Moderate", "Minor"];
export const DEFECT_PRIORITY_OPTIONS = ["Immediate", "Within 7 days", "Within 30 days", "Routine", "Monitor"];
export const OWNERSHIP_STATUS_OPTIONS = ["Owned", "Leased", "Hired", "On-loan", "Other"];
export const METER_TYPE_OPTIONS = ["Mechanical", "Digital", "Not available"];
