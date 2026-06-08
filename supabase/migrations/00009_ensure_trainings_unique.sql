-- Ensure UNIQUE constraint exists on trainings(order_id) for upsert support
-- Migration 00001 created it as UNIQUE NOT NULL, but verify/re-add if removed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'trainings'::regclass
      AND conname = 'trainings_order_id_key'
  ) THEN
    ALTER TABLE trainings ADD CONSTRAINT trainings_order_id_key UNIQUE (order_id);
  END IF;
END
$$;
