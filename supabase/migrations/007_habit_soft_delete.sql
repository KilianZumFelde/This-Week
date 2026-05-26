-- Add soft-delete column to habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Index for purge job (find stale soft-deleted habits efficiently)
CREATE INDEX IF NOT EXISTS habits_deleted_at_idx ON habits (deleted_at)
  WHERE deleted_at IS NOT NULL;
