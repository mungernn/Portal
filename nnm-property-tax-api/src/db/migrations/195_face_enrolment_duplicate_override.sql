-- Face enrolment: when the face looks like a worker already enrolled, the enrolling officer can confirm that they are
-- different people (e.g. brothers) with a reason. The enrolment is then recorded with the look-alike and flagged.
ALTER TABLE face_enrolments
  ADD COLUMN IF NOT EXISTS duplicate_of_staff_id BIGINT REFERENCES field_staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duplicate_similarity  NUMERIC(5, 4),
  ADD COLUMN IF NOT EXISTS duplicate_reason      TEXT;
