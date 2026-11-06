import ExcelJS from "exceljs";
import { pool } from "../config/db";
import type { AttendanceTokenPayload } from "../types/attendance.types";
import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_KEYS,
  PROJECT_STAGES,
  PROJECT_STAGE_LABELS,
  type Discipline,
  type ProjectCategory,
  type ProjectStage,
} from "../types/project.types";
import { cellText } from "./propertyBulkImport.service";
import { projectDb, type ProjectInput } from "./project.service";

/**
 * Bulk entry of projects from an Excel sheet (Commissioner / Yojana Prabhari). Columns are found by their header
 * (order does not matter; unknown columns are ignored). A row whose Project Code - or, without a code, whose ward and
 * name - matches a project already entered updates that project with the cells that are filled in, so the same sheet
 * can be uploaded again as projects move forward. Each row stands alone: a bad row is reported and the rest go in.
 */

type Field = Exclude<keyof ProjectInput, never>;
const HEADERS: { field: Field; header: string; aliases: string[]; kind: "text" | "number" | "date" | "special" }[] = [
  { field: "projectCode", header: "Project Code", aliases: ["code", "project id", "project no"], kind: "text" },
  { field: "name", header: "Project Name", aliases: ["name", "name of work", "work name", "project"], kind: "text" },
  { field: "wardId", header: "Ward", aliases: ["ward no", "ward number"], kind: "special" },
  { field: "locationText", header: "Location", aliases: ["site", "address", "location / address"], kind: "text" },
  { field: "schemeName", header: "Scheme", aliases: ["yojana", "scheme name", "head"], kind: "text" },
  { field: "category", header: "Category", aliases: ["type of work", "work type", "type"], kind: "special" },
  { field: "discipline", header: "Discipline", aliases: ["civil / mechanical", "civil/mechanical"], kind: "special" },
  { field: "financialYear", header: "Financial Year", aliases: ["fy", "year"], kind: "text" },
  { field: "estimatedCost", header: "Estimated Cost", aliases: ["estimate", "estimated amount", "estimate amount"], kind: "number" },
  { field: "approvalNo", header: "Approval No", aliases: ["approval number", "sanction no"], kind: "text" },
  { field: "approvalDate", header: "Approval Date", aliases: ["sanction date"], kind: "date" },
  { field: "tenderNo", header: "Tender No", aliases: ["tender number", "nit no"], kind: "text" },
  { field: "tenderDate", header: "Tender Date", aliases: ["nit date"], kind: "date" },
  { field: "tenderFinalisedDate", header: "Tender Finalised Date", aliases: ["tender finalized date"], kind: "date" },
  { field: "agencyName", header: "Agency", aliases: ["agency name", "contractor", "contractor name"], kind: "text" },
  { field: "workOrderNo", header: "Work Order No", aliases: ["work order number", "wo no"], kind: "text" },
  { field: "workOrderDate", header: "Work Order Date", aliases: ["wo date"], kind: "date" },
  { field: "workOrderAmount", header: "Work Order Amount", aliases: ["wo amount", "agreement amount"], kind: "number" },
  { field: "targetCompletionDate", header: "Target Completion Date", aliases: ["target date", "completion target"], kind: "date" },
  { field: "actualStartDate", header: "Actual Start Date", aliases: ["start date", "work start date"], kind: "date" },
  { field: "actualCompletionDate", header: "Actual Completion Date", aliases: ["completion date", "date of completion"], kind: "date" },
  { field: "paymentAmount", header: "Payment Amount", aliases: ["amount paid", "paid amount"], kind: "number" },
  { field: "paymentDate", header: "Payment Date", aliases: ["date of payment"], kind: "date" },
  { field: "stage", header: "Stage", aliases: ["status", "project status"], kind: "special" },
  { field: "remarks", header: "Remarks", aliases: ["remark", "notes"], kind: "text" },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();

export const PROJECT_STAGE_IMPORT_HELP = PROJECT_STAGES.map((s) => PROJECT_STAGE_LABELS[s]);

function matchCategory(v: string): ProjectCategory | null {
  const n = norm(v);
  for (const k of PROJECT_CATEGORY_KEYS) if (norm(k.replace(/_/g, " ")) === n || norm(PROJECT_CATEGORIES[k].label) === n) return k;
  // Loose matches for common ways of writing it.
  if (/high ?mast|street ?light/.test(n)) return "streetlight_highmast";
  if (/submersible|pyau|piyau/.test(n)) return "submersible_pyau";
  if (/pcc/.test(n)) return "road_pcc";
  if (/bitum|blacktop|road/.test(n)) return "road_bituminous";
  if (/drain|nala|nali/.test(n)) return "drain";
  if (/park|pond|talab/.test(n)) return "park_pond";
  if (/boundary/.test(n)) return "boundary_wall";
  if (/building|bhawan/.test(n)) return "building";
  if (/pump|water supply/.test(n)) return "water_supply_pump";
  if (/electric/.test(n)) return "electrical";
  if (/vehicle|machine/.test(n)) return "vehicle_machinery";
  return null;
}

function matchStage(v: string): ProjectStage | null {
  const n = norm(v);
  for (const s of PROJECT_STAGES) if (norm(s.replace(/_/g, " ")) === n || norm(PROJECT_STAGE_LABELS[s]) === n) return s;
  if (/^past/.test(n)) return "past_completed";
  if (/payment/.test(n)) return "payment_done";
  if (/^complete/.test(n)) return "completed";
  if (/progress|ongoing|started/.test(n)) return "in_progress";
  if (/work ?order/.test(n)) return "work_order_issued";
  if (/final/.test(n)) return "tender_finalised";
  if (/tender/.test(n)) return "tendered";
  if (/approv|sanction/.test(n)) return "approved";
  return null;
}

function matchDiscipline(v: string): Discipline | null {
  const n = norm(v);
  if (!n) return null;
  if (/both|civil.*mech|mech.*civil/.test(n)) return "both";
  if (/mech/.test(n)) return "mechanical";
  if (/civil/.test(n)) return "civil";
  return null;
}

/** A date cell: an Excel date, or text like 2025-04-01, 01-04-2025, 01/04/2025, 01.04.2025. */
function parseDate(v: ExcelJS.CellValue): string | null | "bad" {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const t = cellText(v);
  if (!t) return null;
  const ymd = (y: string, mo: string, d: string) => {
    const dt = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
    return dt.getUTCMonth() === Number(mo) - 1 && dt.getUTCDate() === Number(d) ? dt.toISOString().slice(0, 10) : "bad";
  };
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return ymd(m[1]!, m[2]!, m[3]!);
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return ymd(m[3]!, m[2]!, m[1]!);
  return "bad";
}

export interface ProjectImportResult {
  created: number;
  updated: number;
  unchanged: number;
  errors: { row: number; message: string }[];
}

export async function importProjects(user: AttendanceTokenPayload, buffer: Buffer): Promise<ProjectImportResult> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    throw new Error("Could not read the file - upload the Excel (.xlsx) sheet.");
  }
  const ws = wb.worksheets.find((w) => w.name.toLowerCase() === "projects") ?? wb.worksheets[0];
  if (!ws) throw new Error("The Excel file has no sheet.");

  // Header row: the first row in the top 5 that has a "name" column.
  let headerRow = 0;
  const col = new Map<Field, number>();
  for (let r = 1; r <= Math.min(5, ws.rowCount) && !headerRow; r++) {
    const found = new Map<Field, number>();
    ws.getRow(r).eachCell({ includeEmpty: false }, (cell, c) => {
      const h = norm(cellText(cell.value));
      const def = HEADERS.find((d) => norm(d.header) === h || d.aliases.some((a) => norm(a) === h));
      if (def && !found.has(def.field)) found.set(def.field, c);
    });
    if (found.has("name")) {
      headerRow = r;
      for (const [k, v] of found) col.set(k, v);
    }
  }
  if (!headerRow) throw new Error('No "Project Name" column found - download the template and use its column headings.');

  const { rows: wards } = await pool.query<{ id: string; ward_name: string }>(`SELECT id, ward_name FROM attendance_wards`);
  const wardNum = (label: string) => label.match(/\d+/)?.[0]?.replace(/^0+(?=\d)/, "") ?? null;
  const wardByExact = new Map(wards.map((w) => [w.ward_name.trim().toLowerCase(), Number(w.id)]));
  const wardByNum = new Map<string, number>();
  for (const w of wards) {
    const n = /^(ward\s*(no\.?)?\s*)?\d+$/i.test(w.ward_name.trim()) ? wardNum(w.ward_name) : null;
    if (n && !wardByNum.has(n)) wardByNum.set(n, Number(w.id));
  }

  const { rows: existingRows } = await pool.query<{ id: string; project_code: string; ward_id: string; name: string }>(
    `SELECT id, project_code, ward_id, name FROM projects`,
  );
  const byCode = new Map(existingRows.map((p) => [p.project_code.trim().toLowerCase(), Number(p.id)]));
  const byWardName = new Map(existingRows.map((p) => [`${p.ward_id}|${norm(p.name)}`, Number(p.id)]));

  const result: ProjectImportResult = { created: 0, updated: 0, unchanged: 0, errors: [] };
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const raw = (f: Field) => (col.has(f) ? row.getCell(col.get(f)!).value : null);
    const txt = (f: Field) => cellText(raw(f)).trim();
    if (HEADERS.every((d) => !txt(d.field))) continue;
    const name = txt("name");
    const wardText = txt("wardId");
    if (!wardText && (!name || /^(grand\s+)?total/i.test(name))) continue; // e.g. a totals row
    try {
      const out: Partial<ProjectInput> = {};
      const problems: string[] = [];
      for (const d of HEADERS) {
        if (d.kind === "special") continue;
        const t = txt(d.field);
        if (!t) continue;
        if (d.kind === "text") (out as Record<string, unknown>)[d.field] = t;
        else if (d.kind === "number") {
          const n = Number(t.replace(/[,₹\s]|rs\.?/gi, ""));
          if (Number.isFinite(n) && n >= 0) (out as Record<string, unknown>)[d.field] = n;
          else problems.push(`${d.header} "${t}" is not an amount`);
        } else {
          const dt = parseDate(raw(d.field));
          if (dt === "bad") problems.push(`${d.header} "${t}" is not a date (use DD-MM-YYYY)`);
          else if (dt) (out as Record<string, unknown>)[d.field] = dt;
        }
      }
      if (wardText) {
        const w = wardByExact.get(wardText.toLowerCase()) ?? wardByNum.get(wardNum(wardText) ?? "");
        if (w) out.wardId = w;
        else problems.push(`ward "${wardText}" not found`);
      }
      const catText = txt("category");
      if (catText) {
        const c = matchCategory(catText);
        if (c) out.category = c;
        else problems.push(`category "${catText}" not recognised`);
      }
      const discText = txt("discipline");
      if (discText) {
        const d = matchDiscipline(discText);
        if (d) out.discipline = d;
        else problems.push(`discipline "${discText}" should be Civil, Mechanical or Both`);
      }
      const stageText = txt("stage");
      if (stageText) {
        const s = matchStage(stageText);
        if (s) out.stage = s;
        else problems.push(`stage "${stageText}" not recognised`);
      }
      if (problems.length) throw new Error(problems.join("; "));

      const code = out.projectCode?.toLowerCase();
      const existingId =
        (code ? byCode.get(code) : undefined) ?? (out.wardId && name ? byWardName.get(`${out.wardId}|${norm(name)}`) : undefined);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        if (existingId) {
          if (out.category && !out.discipline) out.discipline = PROJECT_CATEGORIES[out.category].discipline;
          const changes = await projectDb.patchProject(client, existingId, out);
          if (Object.keys(changes).length) {
            await projectDb.audit(client, user, changes.stage ? "stage_changed" : "project_edited", existingId, {
              ...changes,
              viaExcel: true,
            });
            result.updated++;
          } else result.unchanged++;
        } else {
          const missing = [!name && "Project Name", !out.wardId && "Ward", !out.category && "Category"].filter(Boolean);
          if (missing.length) throw new Error(`${missing.join(", ")} missing`);
          const input = { ...out, name, stage: out.stage ?? "approved" } as ProjectInput;
          const id = await projectDb.insertProject(client, user, input);
          await projectDb.audit(client, user, "project_added", id, { name, stage: input.stage, viaExcel: true });
          const newCode = (await client.query<{ project_code: string }>(`SELECT project_code FROM projects WHERE id = $1`, [id])).rows[0]!;
          byCode.set(newCode.project_code.toLowerCase(), id);
          byWardName.set(`${input.wardId}|${norm(name)}`, id);
          result.created++;
        }
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (e) {
      result.errors.push({ row: r, message: e instanceof Error ? e.message : String(e) });
    }
  }
  if (result.created + result.updated + result.unchanged + result.errors.length > 0) {
    await projectDb.audit(pool, user, "bulk_import", null, { ...result, errors: result.errors.length });
  }
  return result;
}

/** The blank template: the Projects sheet with every column, and a Lists sheet with the categories and stages. */
export async function projectTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Projects");
  ws.columns = HEADERS.map((h) => ({ header: h.header, key: h.field, width: Math.max(14, h.header.length + 4) }));
  ws.getRow(1).font = { bold: true };
  ws.addRow({
    name: "PCC road from main road to school",
    wardId: "Ward 1",
    locationText: "Near primary school",
    schemeName: "Mukhyamantri Shahri Vikas Yojana",
    category: PROJECT_CATEGORIES.road_pcc.label,
    discipline: "Civil",
    financialYear: "2025-26",
    estimatedCost: 1250000,
    approvalNo: "123/2025",
    approvalDate: "01-06-2025",
    stage: PROJECT_STAGE_LABELS.approved,
  });
  ws.getRow(2).font = { italic: true, color: { argb: "FF888888" } };
  const lists = wb.addWorksheet("Lists");
  lists.columns = [
    { header: "Category", key: "c", width: 28 },
    { header: "Discipline", key: "d", width: 14 },
    { header: "", key: "x", width: 4 },
    { header: "Stage", key: "s", width: 44 },
  ];
  lists.getRow(1).font = { bold: true };
  const cats = PROJECT_CATEGORY_KEYS.map((k) => PROJECT_CATEGORIES[k]);
  for (let i = 0; i < Math.max(cats.length, PROJECT_STAGES.length); i++) {
    const c = cats[i];
    const s = PROJECT_STAGES[i];
    lists.addRow({
      c: c?.label ?? "",
      d: c ? (c.discipline === "civil" ? "Civil" : "Mechanical") : "",
      s: s ? PROJECT_STAGE_LABELS[s] : "",
    });
  }
  lists.addRow({});
  lists.addRow({ c: "Discipline may be Civil, Mechanical or Both (blank = from the category)." });
  lists.addRow({ c: "Dates as DD-MM-YYYY. Leave Project Code blank for new projects - it is given automatically." });
  lists.addRow({ c: "The grey example row (row 2) is read like any other row - delete it before uploading." });
  return Buffer.from(await wb.xlsx.writeBuffer());
}
