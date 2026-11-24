-- Old Records (MIG): an old PID that is also on another record or holding is shown as a warning, and counted on every
-- screen load - this index makes the holdings side of that check a lookup instead of a scan.
CREATE INDEX IF NOT EXISTS idx_properties_old_pid_norm ON properties (upper(btrim(old_pid))) WHERE old_pid IS NOT NULL;
