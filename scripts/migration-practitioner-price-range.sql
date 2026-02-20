-- Migration: Add price range (ILS) to practitioners table
-- Run this on the backend/Supabase to support practitioner price range in shekels.
-- 1 ILS = 100 agorot

ALTER TABLE public.practitioners
  ADD COLUMN IF NOT EXISTS price_min_agorot integer,
  ADD COLUMN IF NOT EXISTS price_max_agorot integer;

-- Optional: constraint for consistency (min <= max when both are set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'practitioners_price_range_check'
  ) THEN
    ALTER TABLE public.practitioners
      ADD CONSTRAINT practitioners_price_range_check
      CHECK (price_min_agorot IS NULL OR price_max_agorot IS NULL OR price_min_agorot <= price_max_agorot);
  END IF;
END $$;
