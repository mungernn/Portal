import { getAttendanceToken } from "./attendance-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_PROPERTY_TAX_API_URL || "http://localhost:4000/api/v1";

function headers(): HeadersInit {
  const token = getAttendanceToken();
  if (!token) throw new Error("Not logged in - please log in again.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers: headers(), body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || (res.status === 413 ? "Photo too large for the server - take it again a little further away." : "Request failed."));
  return data as T;
}

export type FacePurpose = "in" | "out" | "enrol";

/** Safai staff, a driver (Toto or other vehicle), or an assistant. */
export type FacePersonType = "staff" | "driver" | "assistant";
export interface FacePerson {
  type: FacePersonType;
  id: number;
}

export interface FaceChallenge {
  challengeId: string;
  direction: "left" | "right";
  expiresAt: string;
  staffName: string;
}

export type FacePunchResult =
  | { verified: true; action: "in" | "out"; inTime?: string; outTime?: string; status?: string; similarity: number | null }
  | { verified: false; reason: string | null; similarity: number | null };

export type AadhaarCheck = "matched" | "mismatch" | "no_face";

export interface FaceEnrolResult {
  enrolled: true;
  name: string;
  reEnrolled: boolean;
  aadhaarCheck: AadhaarCheck;
  aadhaarSimilarity: number | null;
  /** true = saved but not active until the APSWMO approves it */
  pendingApproval: boolean;
}

let configCache: Promise<{ enabled: boolean }> | null = null;
export function fetchFaceConfig(): Promise<{ enabled: boolean }> {
  configCache ??= call<{ enabled: boolean }>("GET", "/attendance/face/config").catch(() => ({ enabled: false }));
  return configCache;
}

export const createFaceChallenge = (person: FacePerson, purpose: FacePurpose) =>
  call<FaceChallenge>("POST", "/attendance/face/challenge", { personType: person.type, personId: person.id, purpose });

export const submitFacePunch = (challengeId: string, frontImage: string, turnImage: string) =>
  call<FacePunchResult>("POST", "/attendance/face/punch", { challengeId, frontImage, turnImage });

export const submitFaceEnrol = (challengeId: string, frontImage: string, turnImage: string, consent: boolean, aadhaarImage: string) =>
  call<FaceEnrolResult>("POST", "/attendance/face/enrol", { challengeId, frontImage, turnImage, consent, aadhaarImage });

export interface FaceEnrolmentStatus {
  personId: number;
  personType: FacePersonType;
  /** Same as personId - kept for older screens. */
  staffId: number;
  name: string;
  nameHi: string | null;
  enrolledAt: string | null;
  enrolledBy: string | null;
  aadhaarCheck: AadhaarCheck | null;
  /** Set when a re-/enrolment is waiting for APSWMO approval. */
  pendingSince: string | null;
}

export const fetchWardFaceEnrolments = (wardId: number, type: FacePersonType = "staff") =>
  call<{ staff: FaceEnrolmentStatus[] }>("GET", `/attendance/face/ward/${wardId}/enrolments?type=${type}`).then((r) => r.staff);

export const removeFaceEnrolment = (person: FacePerson) => call<{ removed: true }>("DELETE", `/attendance/face/enrolment/${person.type}/${person.id}`);

export const fetchEnrolmentPhoto = (person: FacePerson) => call<{ photo: string | null }>("GET", `/attendance/face/enrolment/${person.type}/${person.id}/photo`);

export interface FaceEnrolmentLogEntry {
  id: number;
  personType: FacePersonType;
  personId: number;
  name: string;
  nameHi: string | null;
  wardName: string | null;
  enrolledAt: string;
  enrolledBy: string;
  enrolledByRole: string;
  aadhaarCheck: AadhaarCheck | null;
  aadhaarSimilarity: number | null;
  reviewStatus: "none" | "pending" | "accepted" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewRemarks: string | null;
  active: boolean;
  removedAt: string | null;
  removedBy: string | null;
  hasPhoto: boolean;
  hasAadhaar: boolean;
}

export const fetchEnrolmentLog = (kind: "pending" | "flagged" | "all", opts: { type?: FacePersonType; from?: string; to?: string } = {}) => {
  const q = new URLSearchParams({ kind });
  if (opts.type) q.set("type", opts.type);
  if (opts.from) q.set("from", opts.from);
  if (opts.to) q.set("to", opts.to);
  return call<{ entries: FaceEnrolmentLogEntry[] }>("GET", `/attendance/face/enrolment-log?${q}`).then((r) => r.entries);
};

export const fetchEnrolmentLogPhotos = (id: number) =>
  call<{ photo: string | null; aadhaar: string | null; aadhaarHidden: boolean }>("GET", `/attendance/face/enrolment-log/${id}/photos`);

export const reviewEnrolment = (id: number, decision: "accepted" | "rejected", remarks?: string) =>
  call<{ ok: true; active: boolean }>("POST", `/attendance/face/enrolment-log/${id}/review`, { decision, remarks: remarks || null });

export interface FaceReviewEntry {
  id: number;
  personType: FacePersonType;
  personId: number;
  staffId: number;
  name: string;
  wardName: string | null;
  date: string;
  action: "in" | "out";
  outcome: "manual_override" | "rejected";
  similarity: number | null;
  rejectReason: string | null;
  overrideReason: string | null;
  markedBy: string;
  markedByRole: string;
  reviewStatus: "none" | "pending" | "accepted" | "rejected";
  reviewedBy: string | null;
  reviewRemarks: string | null;
  createdAt: string;
  hasPhoto: boolean;
}

export const fetchFaceReview = (kind: "pending" | "rejected" | "all", date?: string) =>
  call<{ entries: FaceReviewEntry[] }>("GET", `/attendance/face/review?kind=${kind}${date ? `&date=${date}` : ""}`).then((r) => r.entries);

export const fetchPunchPhotos = (id: number) => call<{ photo: string | null; enrolledPhoto: string | null }>("GET", `/attendance/face/review/${id}/photo`);

export const reviewFacePunch = (id: number, decision: "accepted" | "rejected", remarks?: string) =>
  call<{ ok: true }>("POST", `/attendance/face/review/${id}`, { decision, remarks: remarks || null });

export interface FaceSummaryWard {
  wardId: number;
  wardName: string;
  activeStaff: number;
  enrolled: number;
  pendingApproval: number;
  faceIn: number;
  manualIn: number;
  failedAttempts: number;
}

export const fetchFaceSummary = (date?: string) =>
  call<{ date: string; wards: FaceSummaryWard[] }>("GET", `/attendance/face/summary${date ? `?date=${date}` : ""}`);
