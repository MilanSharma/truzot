-- Restore error column on trainings (required by webhook failure handlers)
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS error TEXT;

-- Restore updated_at if missing (used for auditing)
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
