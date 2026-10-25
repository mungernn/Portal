import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/db";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { istDateString } from "../utils/istDate";
import { fieldStaffRepository } from "../repositories/fieldStaff.repository";
import { fieldDriverRepository } from "../repositories/fieldDriver.repository";
import { fieldAssistantRepository } from "../repositories/fieldAssistant.repository";
import { fieldStaffAttendanceRepository } from "../repositories/fieldStaffAttendance.repository";
import { fieldDriverAttendanceRepository } from "../repositories/fieldDriverAttendance.repository";
import { fieldAssistantAttendanceRepository } from "../repositories/fieldAssistantAttendance.repository";
import { markStaffIn, markStaffOut } from "./fieldStaffAttendance.service";
import { assertWardAccess as assertDriverAccess, markDriverIn, markDriverOut } from "./fieldDriverAttendance.service";
import { assertWardAccess as assertAssistantAccess, markAssistantIn, markAssistantOut } from "./fieldAssistantAttendance.service";
import { addExample, compareWithCard, deleteSubject, recognizeTop, verifyAgainst, type FaceResult } from "./compreface";
import type { AttendanceRole, AttendanceTokenPayload } from "../types/attendance.types";

/**
 * Face-verified attendance for Safai staff, drivers (Toto and other vehicles) and assistants.
 *
 * Marking: whoever already marks the worker (Jamadar for Safai staff and Toto drivers/assistants of their ward,
 * Driver Supervisor for other drivers/assistants of their ward, Sanitation Prabhari / APSWMO for Safai staff of any
 * ward, Attendance Admin) photographs the worker twice - once looking straight, once with the head turned the way the
 * server asked (random left/right, single-use, 2-minute challenge). Both photos must match the enrolled face 1:1 and
 * the head must actually have turned.
 *
 * Enrolment: by Sanitation Prabhari / APSWMO / Sanitation Officer / Attendance Admin only, with the same liveness
 * check, a recorded consent, a check that the face is not already enrolled as a different worker, and a photo of the
 * worker's Aadhaar card. The face on the card is compared with the live photo: a match activates the enrolment; a
 * mismatch (or no face found on the card) keeps it inactive and flags it for the APSWMO to approve or reject.
 * Every enrolment stays in face_enrolments as the enrolment log.
 *
 * An enrolled worker can still be marked by hand (face server down, injury, poor light), but only with a written
 * reason; those marks are flagged for officer review. Workers not yet enrolled are marked by hand as before.
 */

export type PersonType = "staff" | "driver" | "assistant";
export interface PersonRef {
  type: PersonType;
  id: number;
}
export const PERSON_TYPES: PersonType[] = ["staff", "driver", "assistant"];

/** Column holding the worker id for each type - fixed values only, safe to put into SQL text. */
const ID_COL: Record<PersonType, string> = { staff: "staff_id", driver: "driver_id", assistant: "assistant_id" };
const TYPE_LABEL: Record<PersonType, string> = { staff: "Safai staff", driver: "Driver", assistant: "Assistant" };

export const FACE_MARK_ROLES: AttendanceRole[] = ["jamadar", "driver_supervisor", "sanitation_prabhari", "apswmo", "attendance_admin"];
/** Who may mark Safai staff (same as the ordinary staff mark-in route). */
const STAFF_MARK_ROLES: AttendanceRole[] = ["jamadar", "sanitation_prabhari", "apswmo", "attendance_admin"];
export const FACE_ENROL_ROLES: AttendanceRole[] = ["sanitation_prabhari", "apswmo", "sanitation_officer", "attendance_admin"];
export const FACE_REVIEW_ROLES: AttendanceRole[] = ["sanitation_officer", "sanitation_prabhari", "apswmo", "attendance_admin"];
/** Approve / reject enrolments flagged by the Aadhaar check. */
export const FACE_ENROL_APPROVE_ROLES: AttendanceRole[] = ["apswmo", "attendance_admin"];
/** May see the saved Aadhaar card photos. */
export const FACE_AADHAAR_VIEW_ROLES: AttendanceRole[] = ["apswmo", "sanitation_officer", "attendance_admin"];

const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const MAX_CARD_BYTES = 2.5 * 1024 * 1024;

export function faceConfig() {
  return { enabled: env.FACE_ATTENDANCE_ENABLED };
}

function assertEnabled(): void {
  if (!env.FACE_ATTENDANCE_ENABLED) throw ApiError.badRequest("Face attendance is not switched on.");
}

// ---------------------------------------------------------------------------------------------- people

interface Person {
  ref: PersonRef;
  name: string;
  nameHi: string | null;
  wardId: number;
  active: boolean;
  suspended: boolean;
}

async function findPerson(ref: PersonRef): Promise<Person | null> {
  if (ref.type === "staff") {
    const s = await fieldStaffRepository.findById(ref.id);
    return s && { ref, name: s.name, nameHi: s.name_hi, wardId: Number(s.ward_id), active: s.active, suspended: s.suspended };
  }
  if (ref.type === "driver") {
    const d = await fieldDriverRepository.findById(ref.id);
    return d && { ref, name: d.name, nameHi: d.name_hi, wardId: Number(d.ward_id), active: d.active, suspended: false };
  }
  const a = await fieldAssistantRepository.findById(ref.id);
  return a && { ref, name: a.name, nameHi: a.name_hi, wardId: Number(a.ward_id), active: a.active, suspended: false };
}

/**
 * Loads a worker and checks the user may act on them. Enrolment roles work across all wards; for marking the same
 * rules apply as for the ordinary Mark In / Mark Out buttons of that worker type.
 */
async function loadPerson(user: AttendanceTokenPayload, ref: PersonRef, purpose: "mark" | "enrol"): Promise<Person> {
  const person = await findPerson(ref);
  if (!person || !person.active) throw ApiError.notFound("Worker not found.");
  if (purpose === "enrol") return person;
  if (ref.type === "staff") {
    if (!STAFF_MARK_ROLES.includes(user.role)) throw new ApiError(403, "Your login cannot mark Safai staff attendance.");
    if (user.role === "jamadar" && Number(user.wardId) !== person.wardId) throw ApiError.badRequest("This worker is not in your ward.");
  } else if (ref.type === "driver") {
    const d = await fieldDriverRepository.findById(ref.id);
    await assertDriverAccess(user, d!);
  } else {
    const a = await fieldAssistantRepository.findById(ref.id);
    await assertAssistantAccess(user, a!);
  }
  return person;
}

async function todaysRecord(ref: PersonRef): Promise<{ out_time: Date | null } | null> {
  const today = istDateString();
  if (ref.type === "staff") return fieldStaffAttendanceRepository.findForStaffOnDate(ref.id, today);
  if (ref.type === "driver") return fieldDriverAttendanceRepository.findForDriverOnDate(ref.id, today);
  return fieldAssistantAttendanceRepository.findForAssistantOnDate(ref.id, today);
}

async function markPerson(user: AttendanceTokenPayload, ref: PersonRef, action: "in" | "out") {
  if (ref.type === "staff") return action === "in" ? markStaffIn(user, ref.id) : markStaffOut(user, ref.id);
  if (ref.type === "driver") return action === "in" ? markDriverIn(user, ref.id) : markDriverOut(user, ref.id);
  return action === "in" ? markAssistantIn(user, ref.id) : markAssistantOut(user, ref.id);
}

/** Joins the three worker tables onto alias `x` (a face table) - gives name, nameHi and ward of any person type. */
const PERSON_JOIN = `LEFT JOIN field_staff fs ON fs.id = x.staff_id
  LEFT JOIN field_drivers fd ON fd.id = x.driver_id
  LEFT JOIN field_assistants fa ON fa.id = x.assistant_id`;
const PERSON_NAME = `COALESCE(fs.name, fd.name, fa.name)`;
const PERSON_NAME_HI = `COALESCE(fs.name_hi, fd.name_hi, fa.name_hi)`;
const PERSON_WARD = `COALESCE(fs.ward_id, fd.ward_id, fa.ward_id)`;

// ---------------------------------------------------------------------------------------------- enrolments

interface EnrolmentRow {
  id: string;
  person_type: PersonType;
  person_id: string;
  subject: string;
  image_ids: string[];
  photo_path: string | null;
  aadhaar_photo_path: string | null;
  enrolled_by_username: string;
  enrolled_at: Date;
  active: boolean;
  review_status: string;
}

async function activeEnrolment(ref: PersonRef): Promise<EnrolmentRow | null> {
  const { rows } = await pool.query<EnrolmentRow>(`SELECT * FROM face_enrolments WHERE person_type = $1 AND person_id = $2 AND active`, [ref.type, ref.id]);
  return rows[0] ?? null;
}

async function pendingEnrolment(ref: PersonRef): Promise<EnrolmentRow | null> {
  const { rows } = await pool.query<EnrolmentRow>(
    `SELECT * FROM face_enrolments WHERE person_type = $1 AND person_id = $2 AND review_status = 'pending'`,
    [ref.type, ref.id],
  );
  return rows[0] ?? null;
}

/** Ids of workers of a type (of a ward, or all) with an active face enrolment. */
export async function enrolledIds(type: PersonType, wardId?: number): Promise<Set<number>> {
  const table = type === "staff" ? "field_staff" : type === "driver" ? "field_drivers" : "field_assistants";
  const { rows } = await pool.query<{ id: string }>(
    `SELECT e.person_id AS id FROM face_enrolments e JOIN ${table} w ON w.id = e.person_id
      WHERE e.active AND e.person_type = $1 AND ($2::bigint IS NULL OR w.ward_id = $2)`,
    [type, wardId ?? null],
  );
  return new Set(rows.map((r) => Number(r.id)));
}

/** Ids of Safai staff (of a ward, or all) with an active face enrolment. */
export const enrolledStaffIds = (wardId?: number) => enrolledIds("staff", wardId);

function decodeImage(b64: string, label: string, maxBytes = MAX_IMAGE_BYTES): Buffer {
  const clean = b64.replace(/^data:image\/[a-z]+;base64,/, "");
  const buf = Buffer.from(clean, "base64");
  if (buf.length < 2000) throw ApiError.badRequest(`The ${label} photo is empty or too small. Take it again.`);
  if (buf.length > maxBytes) throw ApiError.badRequest(`The ${label} photo is too large.`);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw ApiError.badRequest(`The ${label} photo must be a JPEG image.`);
  return buf;
}

async function savePhoto(kind: "punch" | "enrol" | "aadhaar", ref: PersonRef, buf: Buffer): Promise<string> {
  const day = istDateString();
  const rel = path.join("face", kind, day, `${ref.type}-${ref.id}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}.jpg`);
  const full = path.join(env.PHOTO_UPLOAD_DIR, rel);
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, buf);
  return rel;
}

async function removePhoto(rel: string | null): Promise<void> {
  if (!rel) return;
  await fs.promises.rm(path.join(env.PHOTO_UPLOAD_DIR, rel), { force: true }).catch(() => undefined);
}

export async function readPhotoDataUrl(rel: string | null): Promise<string | null> {
  if (!rel) return null;
  const root = path.resolve(env.PHOTO_UPLOAD_DIR);
  const full = path.resolve(root, rel);
  if (!full.startsWith(root + path.sep)) return null;
  try {
    return `data:image/jpeg;base64,${(await fs.promises.readFile(full)).toString("base64")}`;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------- challenge

export async function createChallenge(user: AttendanceTokenPayload, ref: PersonRef, purpose: "in" | "out" | "enrol") {
  assertEnabled();
  if (purpose === "enrol" ? !FACE_ENROL_ROLES.includes(user.role) : !FACE_MARK_ROLES.includes(user.role)) {
    throw new ApiError(403, purpose === "enrol" ? "Your login cannot enrol faces." : "Your login cannot mark face attendance.");
  }
  const person = await loadPerson(user, ref, purpose === "enrol" ? "enrol" : "mark");
  if (purpose === "enrol") {
    if (await pendingEnrolment(ref)) {
      throw ApiError.badRequest("An enrolment for this worker is already waiting for APSWMO approval. It must be approved or rejected first.");
    }
  } else {
    if (!(await activeEnrolment(ref))) throw ApiError.badRequest("This worker's face is not enrolled yet. Mark manually, and ask the Prabhari/APSWMO to enrol the face.");
    // Fail early (before taking photos) when the mark itself would be refused.
    const rec = await todaysRecord(ref);
    if (purpose === "in" && rec) throw ApiError.badRequest("Attendance already marked for today.");
    if (purpose === "out" && !rec) throw ApiError.badRequest("Mark in-time first.");
    if (purpose === "out" && rec?.out_time) throw ApiError.badRequest("Out-time already marked.");
    if (person.suspended && purpose === "in") throw ApiError.badRequest("This worker is suspended - attendance cannot be marked.");
  }
  const id = crypto.randomUUID();
  const direction = crypto.randomInt(0, 2) === 0 ? "left" : "right";
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await pool.query(
    `INSERT INTO face_challenges (id, username, person_type, ${ID_COL[ref.type]}, purpose, direction, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, user.username, ref.type, ref.id, purpose, direction, expiresAt],
  );
  return { challengeId: id, direction, expiresAt: expiresAt.toISOString(), staffName: person.name };
}

async function claimChallenge(user: AttendanceTokenPayload, challengeId: string, purpose: "punch" | "enrol") {
  const { rows } = await pool.query<{ person_type: PersonType; person_id: string; purpose: "in" | "out" | "enrol"; direction: "left" | "right" }>(
    `UPDATE face_challenges SET used_at = now()
      WHERE id = $1 AND username = $2 AND used_at IS NULL AND expires_at > now()
        AND (CASE WHEN $3 = 'enrol' THEN purpose = 'enrol' ELSE purpose IN ('in', 'out') END)
      RETURNING person_type, person_id, purpose, direction`,
    [challengeId, user.username, purpose],
  );
  if (!rows[0]) throw ApiError.badRequest("This photo session has expired or was already used. Start again.");
  return { ref: { type: rows[0].person_type, id: Number(rows[0].person_id) } as PersonRef, action: rows[0].purpose, direction: rows[0].direction };
}

// ---------------------------------------------------------------------------------------------- liveness

interface LivenessOutcome {
  ok: boolean;
  reason: string | null;
  similarityFront: number | null;
  similarityTurn: number | null;
  yawFront: number | null;
  yawTurn: number | null;
}

function single(faces: FaceResult[], label: string): FaceResult | string {
  if (faces.length === 0) return `No face found in the ${label} photo.`;
  if (faces.length > 1) return `More than one face in the ${label} photo - only the worker should be in the frame.`;
  const f = faces[0]!;
  if (f.yaw == null) {
    console.error("[face] CompreFace reply has no pose - enable the 'pose' face plugin (see FACE_ATTENDANCE_SETUP.md)");
    return "Face server is missing the head-pose plugin - inform the Attendance Admin.";
  }
  return f;
}

/** Judges a straight + turned photo pair already matched against an example. */
function judge(front: FaceResult, turn: FaceResult, direction: "left" | "right", requireMatch: boolean): LivenessOutcome {
  const out: LivenessOutcome = {
    ok: false,
    reason: null,
    similarityFront: front.similarity,
    similarityTurn: turn.similarity,
    yawFront: front.yaw,
    yawTurn: turn.yaw,
  };
  const yf = front.yaw ?? 0;
  const yt = turn.yaw ?? 0;
  if (requireMatch && (front.similarity ?? 0) < env.FACE_MATCH_THRESHOLD) out.reason = "Face does not match the enrolled worker.";
  else if (requireMatch && (turn.similarity ?? 0) < env.FACE_MATCH_THRESHOLD_TURNED) out.reason = "Head-turned photo does not match the enrolled worker.";
  else if (Math.abs(yf) > env.FACE_FRONT_MAX_YAW) out.reason = "In the first photo the worker must look straight at the camera.";
  else if (Math.abs(yt - yf) < env.FACE_TURN_MIN_YAW) out.reason = `Head was not turned ${direction} enough in the second photo (liveness check).`;
  else if (env.FACE_YAW_SIGN !== 0 && Math.sign(yt - yf) * env.FACE_YAW_SIGN !== (direction === "left" ? 1 : -1)) {
    out.reason = `Head was turned the wrong way - the worker had to turn ${direction} (liveness check).`;
  } else out.ok = true;
  return out;
}

// ---------------------------------------------------------------------------------------------- punch

export async function facePunch(user: AttendanceTokenPayload, challengeId: string, frontB64: string, turnB64: string) {
  assertEnabled();
  const front = decodeImage(frontB64, "first");
  const turn = decodeImage(turnB64, "second");
  const ch = await claimChallenge(user, challengeId, "punch");
  const action = ch.action as "in" | "out";
  const person = await loadPerson(user, ch.ref, "mark");
  const enrol = await activeEnrolment(ch.ref);
  if (!enrol) throw ApiError.badRequest("This worker's face is not enrolled.");

  let verdict: LivenessOutcome;
  if (crypto.createHash("sha256").update(front).digest("hex") === crypto.createHash("sha256").update(turn).digest("hex")) {
    verdict = { ok: false, reason: "The two photos are identical - take a fresh second photo with the head turned.", similarityFront: null, similarityTurn: null, yawFront: null, yawTurn: null };
  } else {
    // Straight photo against every stored example; the turned one against the best match.
    let best: { id: string; r: FaceResult } | null = null;
    let problem: string | null = null;
    for (const id of enrol.image_ids) {
      const f = single(await verifyAgainst(id, front), "first");
      if (typeof f === "string") {
        problem = f;
        break;
      }
      if (!best || (f.similarity ?? 0) > (best.r.similarity ?? 0)) best = { id, r: f };
    }
    if (problem || !best) {
      verdict = { ok: false, reason: problem ?? "No enrolled photo to compare with.", similarityFront: null, similarityTurn: null, yawFront: null, yawTurn: null };
    } else {
      const t = single(await verifyAgainst(best.id, turn), "second");
      verdict = typeof t === "string"
        ? { ok: false, reason: t, similarityFront: best.r.similarity, similarityTurn: null, yawFront: best.r.yaw, yawTurn: null }
        : judge(best.r, t, ch.direction, true);
    }
  }

  const photoPath = await savePhoto("punch", ch.ref, front);
  let marked: { inTime?: string; outTime?: string; status?: string } | null = null;
  if (verdict.ok) {
    try {
      marked = await markPerson(user, ch.ref, action);
    } catch (err) {
      verdict = { ...verdict, ok: false, reason: (err as Error).message };
    }
  }
  await pool.query(
    `INSERT INTO face_punches (person_type, ${ID_COL[ch.ref.type]}, ward_id, attendance_date, action, outcome, similarity_front, similarity_turn, yaw_front, yaw_turn,
                               challenge_direction, reject_reason, photo_path, marked_by_username, marked_by_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      ch.ref.type, ch.ref.id, person.wardId, istDateString(), action, verdict.ok ? "verified" : "rejected",
      verdict.similarityFront, verdict.similarityTurn, verdict.yawFront, verdict.yawTurn,
      ch.direction, verdict.reason, photoPath, user.username, user.role,
    ],
  );
  console.log(`[face] ${action} ${ch.ref.type} ${ch.ref.id} by ${user.username}: ${verdict.ok ? "verified" : "rejected"} sim=${verdict.similarityFront}/${verdict.similarityTurn} yaw=${verdict.yawFront}/${verdict.yawTurn} asked=${ch.direction}`);
  if (!verdict.ok) {
    return { verified: false as const, reason: verdict.reason, similarity: verdict.similarityFront };
  }
  return { verified: true as const, action, ...marked, similarity: verdict.similarityFront };
}

/**
 * Called by the ordinary (non-face) mark-in / mark-out endpoints of every worker type. With face attendance on, an
 * enrolled worker can only be marked by hand with a written reason, and the mark is flagged for review. Returns a
 * recorder to call once the mark has gone through.
 */
export async function guardManualMark(
  user: AttendanceTokenPayload,
  ref: PersonRef,
  action: "in" | "out",
  overrideReason: string | null | undefined,
): Promise<() => Promise<void>> {
  if (!env.FACE_ATTENDANCE_ENABLED) return async () => undefined;
  const enrolled = await activeEnrolment(ref);
  const reason = (overrideReason ?? "").trim();
  if (enrolled && reason.length < 5) {
    throw ApiError.badRequest("This worker's face is enrolled - use face verification, or give a reason (at least 5 characters) for marking manually.");
  }
  return async () => {
    const person = await findPerson(ref);
    await pool.query(
      `INSERT INTO face_punches (person_type, ${ID_COL[ref.type]}, ward_id, attendance_date, action, outcome, override_reason, marked_by_username, marked_by_role, review_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [ref.type, ref.id, person?.wardId ?? null, istDateString(), action, enrolled ? "manual_override" : "manual_not_enrolled", enrolled ? reason : null, user.username, user.role, enrolled ? "pending" : "none"],
    );
  };
}

// ---------------------------------------------------------------------------------------------- enrolment

export async function enrolFace(
  user: AttendanceTokenPayload,
  challengeId: string,
  frontB64: string,
  turnB64: string,
  consent: boolean,
  aadhaarB64: string,
) {
  assertEnabled();
  if (!FACE_ENROL_ROLES.includes(user.role)) throw new ApiError(403, "Your login cannot enrol faces.");
  if (!consent) throw ApiError.badRequest("Record the worker's consent before enrolling the face.");
  const front = decodeImage(frontB64, "first");
  const turn = decodeImage(turnB64, "second");
  const card = decodeImage(aadhaarB64, "Aadhaar card", MAX_CARD_BYTES);
  const ch = await claimChallenge(user, challengeId, "enrol");
  const ref = ch.ref;
  const person = await loadPerson(user, ref, "enrol");
  if (await pendingEnrolment(ref)) throw ApiError.badRequest("An enrolment for this worker is already waiting for APSWMO approval.");

  // Same person already enrolled (or awaiting approval) as somebody else? (ghost / duplicate worker)
  const top = await recognizeTop(front);
  if (top && top.similarity >= env.FACE_MATCH_THRESHOLD) {
    const { rows } = await pool.query<{ person_type: PersonType; person_id: string; name: string; ward_name: string | null }>(
      `SELECT x.person_type, x.person_id, ${PERSON_NAME} AS name, w.ward_name
         FROM face_enrolments x ${PERSON_JOIN} LEFT JOIN attendance_wards w ON w.id = ${PERSON_WARD}
        WHERE (x.active OR x.review_status = 'pending') AND x.subject = $1`,
      [top.subject],
    );
    const other = rows[0];
    if (other && !(other.person_type === ref.type && Number(other.person_id) === ref.id)) {
      throw ApiError.badRequest(
        `This face is already enrolled as ${other.name} (${TYPE_LABEL[other.person_type]}${other.ward_name ? `, ${other.ward_name}` : ""}). One person cannot be enrolled as two workers - check the roster.`,
      );
    }
  }

  const subject = `${ref.type}-${ref.id}-${Date.now()}`;
  const added: string[] = [];
  let aadhaar: { similarity: number | null; noFace: boolean };
  try {
    const firstId = await addExample(subject, front);
    added.push(firstId);
    const f = single(await verifyAgainst(firstId, front), "first");
    if (typeof f === "string") throw ApiError.badRequest(f);
    const t = single(await verifyAgainst(firstId, turn), "second");
    if (typeof t === "string") throw ApiError.badRequest(t);
    const v = judge(f, t, ch.direction, false);
    if (!v.ok) throw ApiError.badRequest(v.reason ?? "Liveness check failed.");
    if ((t.similarity ?? 0) < env.FACE_MATCH_THRESHOLD_TURNED) throw ApiError.badRequest("The two photos do not look like the same person. Take them again.");
    aadhaar = await compareWithCard(card, front);
    added.push(await addExample(subject, turn));
  } catch (err) {
    await deleteSubject(subject);
    throw err;
  }

  const aadhaarCheck: "matched" | "mismatch" | "no_face" = aadhaar.noFace
    ? "no_face"
    : (aadhaar.similarity ?? 0) >= env.FACE_AADHAAR_MATCH_THRESHOLD
      ? "matched"
      : "mismatch";
  const flagged = aadhaarCheck !== "matched";

  const photoPath = await savePhoto("enrol", ref, front);
  const cardPath = await savePhoto("aadhaar", ref, card);
  const previous = await activeEnrolment(ref);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // A flagged enrolment does not replace the current one until the APSWMO approves it.
    if (previous && !flagged) {
      await client.query(`UPDATE face_enrolments SET active = FALSE, removed_at = now(), removed_by_username = $2 WHERE id = $1`, [previous.id, user.username]);
    }
    await client.query(
      `INSERT INTO face_enrolments (person_type, ${ID_COL[ref.type]}, subject, image_ids, photo_path, consent_recorded, enrolled_by_username, enrolled_by_role,
                                    active, aadhaar_photo_path, aadhaar_similarity, aadhaar_check, review_status)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $9, $10, $11, $12)`,
      [ref.type, ref.id, subject, added, photoPath, user.username, user.role, !flagged, cardPath, aadhaar.similarity, aadhaarCheck, flagged ? "pending" : "none"],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    await deleteSubject(subject);
    await removePhoto(photoPath);
    await removePhoto(cardPath);
    throw err;
  } finally {
    client.release();
  }
  if (previous && !flagged) await deleteSubject(previous.subject);
  console.log(`[face] enrol ${ref.type} ${ref.id} by ${user.username}: aadhaar=${aadhaarCheck} sim=${aadhaar.similarity}`);
  return {
    enrolled: true,
    personType: ref.type,
    personId: ref.id,
    name: person.name,
    reEnrolled: Boolean(previous),
    aadhaarCheck,
    aadhaarSimilarity: aadhaar.similarity,
    /** true = not active yet, waiting for the APSWMO */
    pendingApproval: flagged,
  };
}

export async function removeEnrolment(user: AttendanceTokenPayload, ref: PersonRef) {
  if (!FACE_ENROL_ROLES.includes(user.role)) throw new ApiError(403, "Your login cannot remove face enrolments.");
  const e = (await activeEnrolment(ref)) ?? (await pendingEnrolment(ref));
  if (!e) throw ApiError.notFound("No face enrolled for this worker.");
  // The row stays as part of the enrolment log; face data and photos are deleted (worker left / consent withdrawn).
  await pool.query(
    `UPDATE face_enrolments SET active = FALSE, removed_at = now(), removed_by_username = $2,
            review_status = CASE WHEN review_status = 'pending' THEN 'rejected' ELSE review_status END,
            review_remarks = CASE WHEN review_status = 'pending' THEN 'Removed before approval' ELSE review_remarks END,
            photo_path = NULL, aadhaar_photo_path = NULL
      WHERE id = $1`,
    [e.id, user.username],
  );
  await deleteSubject(e.subject);
  await removePhoto(e.photo_path);
  await removePhoto(e.aadhaar_photo_path);
  return { removed: true };
}

/** Workers of one type in a ward, with their enrolment state - for the Enrol tab. */
export async function wardEnrolmentStatus(wardId: number, type: PersonType = "staff") {
  const table = type === "staff" ? "field_staff" : type === "driver" ? "field_drivers" : "field_assistants";
  const { rows } = await pool.query(
    `SELECT w.id::int AS "personId", w.id::int AS "staffId", $2::text AS "personType", w.name, w.name_hi AS "nameHi",
            e.enrolled_at AS "enrolledAt", e.enrolled_by_username AS "enrolledBy", e.aadhaar_check AS "aadhaarCheck",
            p.enrolled_at AS "pendingSince"
       FROM ${table} w
       LEFT JOIN face_enrolments e ON e.person_type = $2 AND e.person_id = w.id AND e.active
       LEFT JOIN face_enrolments p ON p.person_type = $2 AND p.person_id = w.id AND p.review_status = 'pending'
      WHERE w.ward_id = $1 AND w.active ORDER BY w.name`,
    [wardId, type],
  );
  return rows;
}

export async function enrolmentPhoto(ref: PersonRef) {
  const e = await activeEnrolment(ref);
  return { photo: await readPhotoDataUrl(e?.photo_path ?? null) };
}

// ---------------------------------------------------------------------------------------------- enrolment log

export async function listEnrolments(filter: { kind: "pending" | "flagged" | "all"; type?: PersonType; wardId?: number; from?: string; to?: string }) {
  const where: string[] = ["TRUE"];
  const args: unknown[] = [];
  if (filter.kind === "pending") where.push(`x.review_status = 'pending'`);
  else if (filter.kind === "flagged") where.push(`x.aadhaar_check IN ('mismatch', 'no_face')`);
  if (filter.type) {
    args.push(filter.type);
    where.push(`x.person_type = $${args.length}`);
  }
  if (filter.wardId) {
    args.push(filter.wardId);
    where.push(`${PERSON_WARD} = $${args.length}`);
  }
  if (filter.from) {
    args.push(filter.from);
    where.push(`(x.enrolled_at AT TIME ZONE 'Asia/Kolkata')::date >= $${args.length}`);
  }
  if (filter.to) {
    args.push(filter.to);
    where.push(`(x.enrolled_at AT TIME ZONE 'Asia/Kolkata')::date <= $${args.length}`);
  }
  const { rows } = await pool.query(
    `SELECT x.id::int AS id, x.person_type AS "personType", x.person_id::int AS "personId", ${PERSON_NAME} AS name, ${PERSON_NAME_HI} AS "nameHi",
            w.ward_name AS "wardName", x.enrolled_at AS "enrolledAt", x.enrolled_by_username AS "enrolledBy", x.enrolled_by_role AS "enrolledByRole",
            x.aadhaar_check AS "aadhaarCheck", x.aadhaar_similarity::float AS "aadhaarSimilarity", x.review_status AS "reviewStatus",
            x.reviewed_by AS "reviewedBy", x.reviewed_at AS "reviewedAt", x.review_remarks AS "reviewRemarks",
            x.active, x.removed_at AS "removedAt", x.removed_by_username AS "removedBy",
            (x.photo_path IS NOT NULL) AS "hasPhoto", (x.aadhaar_photo_path IS NOT NULL) AS "hasAadhaar"
       FROM face_enrolments x ${PERSON_JOIN} LEFT JOIN attendance_wards w ON w.id = ${PERSON_WARD}
      WHERE ${where.join(" AND ")}
      ORDER BY x.enrolled_at DESC LIMIT 500`,
    args,
  );
  return rows;
}

export async function enrolmentLogPhotos(user: AttendanceTokenPayload, id: number) {
  const { rows } = await pool.query<{ photo_path: string | null; aadhaar_photo_path: string | null }>(
    `SELECT photo_path, aadhaar_photo_path FROM face_enrolments WHERE id = $1`,
    [id],
  );
  if (!rows[0]) throw ApiError.notFound("Not found.");
  return {
    photo: await readPhotoDataUrl(rows[0].photo_path),
    aadhaar: FACE_AADHAAR_VIEW_ROLES.includes(user.role) ? await readPhotoDataUrl(rows[0].aadhaar_photo_path) : null,
    aadhaarHidden: !FACE_AADHAAR_VIEW_ROLES.includes(user.role),
  };
}

/** APSWMO decision on an enrolment flagged by the Aadhaar check. */
export async function reviewEnrolment(user: AttendanceTokenPayload, id: number, decision: "accepted" | "rejected", remarks: string | null) {
  if (!FACE_ENROL_APPROVE_ROLES.includes(user.role)) throw new ApiError(403, "Only the APSWMO can approve or reject flagged enrolments.");
  const { rows } = await pool.query<EnrolmentRow>(`SELECT * FROM face_enrolments WHERE id = $1`, [id]);
  const e = rows[0];
  if (!e) throw ApiError.notFound("Not found.");
  if (e.review_status !== "pending") throw ApiError.badRequest("This enrolment is not awaiting approval.");
  if (e.enrolled_by_username === user.username) throw ApiError.badRequest("You cannot approve an enrolment you made yourself.");
  const note = remarks?.trim() || null;
  if (decision === "rejected" && !note) throw ApiError.badRequest("Give remarks when rejecting.");
  const ref: PersonRef = { type: e.person_type, id: Number(e.person_id) };

  if (decision === "rejected") {
    // Kept in the log with its photos (evidence); the face is removed from the face server so it can never match.
    await pool.query(
      `UPDATE face_enrolments SET review_status = 'rejected', reviewed_by = $2, reviewed_at = now(), review_remarks = $3 WHERE id = $1 AND review_status = 'pending'`,
      [id, user.username, note],
    );
    await deleteSubject(e.subject);
    return { ok: true, active: false };
  }

  const previous = await activeEnrolment(ref);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (previous) {
      await client.query(`UPDATE face_enrolments SET active = FALSE, removed_at = now(), removed_by_username = $2 WHERE id = $1`, [previous.id, user.username]);
    }
    await client.query(
      `UPDATE face_enrolments SET review_status = 'accepted', active = TRUE, reviewed_by = $2, reviewed_at = now(), review_remarks = $3
        WHERE id = $1 AND review_status = 'pending'`,
      [id, user.username, note],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  if (previous) await deleteSubject(previous.subject);
  return { ok: true, active: true };
}

// ---------------------------------------------------------------------------------------------- review

export async function listForReview(filter: { kind: "pending" | "rejected" | "all"; date?: string; wardId?: number }) {
  const where: string[] = [];
  const args: unknown[] = [];
  if (filter.kind === "pending") where.push(`x.review_status = 'pending'`);
  else if (filter.kind === "rejected") where.push(`x.outcome = 'rejected'`);
  else where.push(`x.outcome IN ('manual_override', 'rejected')`);
  if (filter.date) {
    args.push(filter.date);
    where.push(`x.attendance_date = $${args.length}`);
  }
  if (filter.wardId) {
    args.push(filter.wardId);
    where.push(`x.ward_id = $${args.length}`);
  }
  const { rows } = await pool.query(
    `SELECT x.id::int AS id, x.person_type AS "personType", x.person_id::int AS "personId", x.person_id::int AS "staffId", ${PERSON_NAME} AS name,
            w.ward_name AS "wardName", x.attendance_date::text AS date, x.action,
            x.outcome, x.similarity_front::float AS "similarity", x.reject_reason AS "rejectReason", x.override_reason AS "overrideReason",
            x.marked_by_username AS "markedBy", x.marked_by_role AS "markedByRole", x.review_status AS "reviewStatus",
            x.reviewed_by AS "reviewedBy", x.review_remarks AS "reviewRemarks", x.created_at AS "createdAt", (x.photo_path IS NOT NULL) AS "hasPhoto"
       FROM face_punches x ${PERSON_JOIN} LEFT JOIN attendance_wards w ON w.id = x.ward_id
      WHERE ${where.join(" AND ")}
      ORDER BY x.created_at DESC LIMIT 300`,
    args,
  );
  return rows;
}

export async function punchPhoto(id: number) {
  const { rows } = await pool.query<{ photo_path: string | null; person_type: PersonType; person_id: string }>(
    `SELECT photo_path, person_type, person_id FROM face_punches WHERE id = $1`,
    [id],
  );
  if (!rows[0]) throw ApiError.notFound("Not found.");
  const e = await activeEnrolment({ type: rows[0].person_type, id: Number(rows[0].person_id) });
  return { photo: await readPhotoDataUrl(rows[0].photo_path), enrolledPhoto: await readPhotoDataUrl(e?.photo_path ?? null) };
}

export async function reviewPunch(user: AttendanceTokenPayload, id: number, decision: "accepted" | "rejected", remarks: string | null) {
  if (!FACE_REVIEW_ROLES.includes(user.role)) throw new ApiError(403, "Your login cannot review face attendance.");
  const { rows } = await pool.query<{ marked_by_username: string; review_status: string }>(`SELECT marked_by_username, review_status FROM face_punches WHERE id = $1`, [id]);
  const p = rows[0];
  if (!p) throw ApiError.notFound("Not found.");
  if (p.review_status !== "pending") throw ApiError.badRequest("This entry is not awaiting review.");
  if (p.marked_by_username === user.username) throw ApiError.badRequest("You cannot review a manual mark you made yourself.");
  if (decision === "rejected" && !(remarks ?? "").trim()) throw ApiError.badRequest("Give remarks when rejecting.");
  await pool.query(
    `UPDATE face_punches SET review_status = $2, reviewed_by = $3, reviewed_at = now(), review_remarks = $4 WHERE id = $1 AND review_status = 'pending'`,
    [id, decision, user.username, remarks?.trim() || null],
  );
  return { ok: true };
}

/** Per-ward share of today's (or a date's) in-marks that were face verified - all worker types together. */
export async function faceSummary(date?: string) {
  const d = date || istDateString();
  const { rows } = await pool.query(
    `SELECT w.id::int AS "wardId", w.ward_name AS "wardName",
            ((SELECT count(*) FROM field_staff s WHERE s.ward_id = w.id AND s.active)
             + (SELECT count(*) FROM field_drivers s WHERE s.ward_id = w.id AND s.active)
             + (SELECT count(*) FROM field_assistants s WHERE s.ward_id = w.id AND s.active))::int AS "activeStaff",
            (SELECT count(*)::int FROM face_enrolments x ${PERSON_JOIN}
              WHERE x.active AND ${PERSON_WARD} = w.id AND COALESCE(fs.active, fd.active, fa.active)) AS enrolled,
            (SELECT count(*)::int FROM face_enrolments x ${PERSON_JOIN}
              WHERE x.review_status = 'pending' AND ${PERSON_WARD} = w.id) AS "pendingApproval",
            count(*) FILTER (WHERE p.action = 'in' AND p.outcome = 'verified')::int AS "faceIn",
            count(*) FILTER (WHERE p.action = 'in' AND p.outcome = 'manual_override')::int AS "manualIn",
            count(*) FILTER (WHERE p.outcome = 'rejected')::int AS "failedAttempts"
       FROM attendance_wards w LEFT JOIN face_punches p ON p.ward_id = w.id AND p.attendance_date = $1
      GROUP BY w.id, w.ward_name ORDER BY w.ward_name`,
    [d],
  );
  return { date: d, wards: rows };
}

/** Housekeeping: punch photos past the retention period, and spent challenges. */
export async function purgeOldFaceData(): Promise<void> {
  const { rows } = await pool.query<{ id: string; photo_path: string }>(
    `SELECT id, photo_path FROM face_punches WHERE photo_path IS NOT NULL AND created_at < now() - make_interval(days => $1) LIMIT 2000`,
    [env.FACE_PHOTO_RETENTION_DAYS],
  );
  for (const r of rows) {
    await removePhoto(r.photo_path);
    await pool.query(`UPDATE face_punches SET photo_path = NULL WHERE id = $1`, [r.id]);
  }
  await pool.query(`DELETE FROM face_challenges WHERE created_at < now() - interval '1 day'`);
  if (rows.length) console.log(`[face] removed ${rows.length} punch photos older than ${env.FACE_PHOTO_RETENTION_DAYS} days`);
}
