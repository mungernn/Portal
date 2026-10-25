-- Face attendance extended from Safai staff to drivers (Toto and other vehicles) and assistants, plus an Aadhaar
-- card check at enrolment.
--
-- Each face table now names its worker by person_type + one of staff_id / driver_id / assistant_id (each a real
-- foreign key, so deleting a worker still cascades). person_id is a convenience copy of whichever id is set.
--
-- Aadhaar check: at enrolment a photo of the worker's Aadhaar card is taken and saved; the face printed on it is
-- compared with the live photo. A match activates the enrolment at once. A mismatch (or no face found on the card)
-- keeps the enrolment inactive and flags it for the APSWMO, who approves (enrolment becomes active) or rejects it.
-- face_enrolments rows are never deleted, so the table is the full enrolment log.

-- ---------------------------------------------------------------------------------------------- enrolments
ALTER TABLE face_enrolments ADD COLUMN person_type VARCHAR(10) NOT NULL DEFAULT 'staff'
  CHECK (person_type IN ('staff', 'driver', 'assistant'));
ALTER TABLE face_enrolments ALTER COLUMN staff_id DROP NOT NULL;
ALTER TABLE face_enrolments ADD COLUMN driver_id BIGINT REFERENCES field_drivers(id) ON DELETE CASCADE;
ALTER TABLE face_enrolments ADD COLUMN assistant_id BIGINT REFERENCES field_assistants(id) ON DELETE CASCADE;
ALTER TABLE face_enrolments ADD COLUMN person_id BIGINT GENERATED ALWAYS AS (COALESCE(staff_id, driver_id, assistant_id)) STORED;
ALTER TABLE face_enrolments ADD CONSTRAINT face_enrolment_one_person CHECK (
  (person_type = 'staff' AND staff_id IS NOT NULL AND driver_id IS NULL AND assistant_id IS NULL) OR
  (person_type = 'driver' AND driver_id IS NOT NULL AND staff_id IS NULL AND assistant_id IS NULL) OR
  (person_type = 'assistant' AND assistant_id IS NOT NULL AND staff_id IS NULL AND driver_id IS NULL)
);

ALTER TABLE face_enrolments ADD COLUMN aadhaar_photo_path TEXT;
ALTER TABLE face_enrolments ADD COLUMN aadhaar_similarity NUMERIC(6, 4);
-- NULL = enrolled before the Aadhaar check existed
ALTER TABLE face_enrolments ADD COLUMN aadhaar_check VARCHAR(12) CHECK (aadhaar_check IN ('matched', 'mismatch', 'no_face'));
ALTER TABLE face_enrolments ADD COLUMN review_status VARCHAR(12) NOT NULL DEFAULT 'none'
  CHECK (review_status IN ('none', 'pending', 'accepted', 'rejected'));
ALTER TABLE face_enrolments ADD COLUMN reviewed_by VARCHAR(64);
ALTER TABLE face_enrolments ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE face_enrolments ADD COLUMN review_remarks TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_face_enrolment_active_person ON face_enrolments (person_type, person_id) WHERE active;
CREATE UNIQUE INDEX IF NOT EXISTS uq_face_enrolment_pending_person ON face_enrolments (person_type, person_id) WHERE review_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_face_enrolments_enrolled_at ON face_enrolments (enrolled_at DESC);

-- ---------------------------------------------------------------------------------------------- challenges
ALTER TABLE face_challenges ADD COLUMN person_type VARCHAR(10) NOT NULL DEFAULT 'staff'
  CHECK (person_type IN ('staff', 'driver', 'assistant'));
ALTER TABLE face_challenges ALTER COLUMN staff_id DROP NOT NULL;
ALTER TABLE face_challenges ADD COLUMN driver_id BIGINT REFERENCES field_drivers(id) ON DELETE CASCADE;
ALTER TABLE face_challenges ADD COLUMN assistant_id BIGINT REFERENCES field_assistants(id) ON DELETE CASCADE;
ALTER TABLE face_challenges ADD COLUMN person_id BIGINT GENERATED ALWAYS AS (COALESCE(staff_id, driver_id, assistant_id)) STORED;

-- ---------------------------------------------------------------------------------------------- punches
ALTER TABLE face_punches ADD COLUMN person_type VARCHAR(10) NOT NULL DEFAULT 'staff'
  CHECK (person_type IN ('staff', 'driver', 'assistant'));
ALTER TABLE face_punches ALTER COLUMN staff_id DROP NOT NULL;
ALTER TABLE face_punches ADD COLUMN driver_id BIGINT REFERENCES field_drivers(id) ON DELETE CASCADE;
ALTER TABLE face_punches ADD COLUMN assistant_id BIGINT REFERENCES field_assistants(id) ON DELETE CASCADE;
ALTER TABLE face_punches ADD COLUMN person_id BIGINT GENERATED ALWAYS AS (COALESCE(staff_id, driver_id, assistant_id)) STORED;
CREATE INDEX IF NOT EXISTS idx_face_punches_person ON face_punches (person_type, person_id, attendance_date);
