-- ============================================================
-- MIGRATION: Pricing Model V2
-- Individual (329 NIS) / Clinic (349 base + seats) / Enterprise (1990+)
-- 60-day free trial, per-organization subscriptions, multi-site support
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. New table: subscription_plans (reference / catalog)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  base_price_agorot integer NOT NULL,
  practitioner_seat_price_agorot integer NOT NULL DEFAULT 0,
  secretary_seat_price_agorot integer NOT NULL DEFAULT 0,
  max_sites integer NOT NULL DEFAULT 1,          -- -1 = unlimited
  trial_duration_days integer NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans (id, name, base_price_agorot, practitioner_seat_price_agorot, secretary_seat_price_agorot, max_sites)
VALUES
  ('individual',  'Individual',  32900,  0,     0,     1),
  ('clinic',      'Clinic',      34900,  31900, 14900, 1),
  ('enterprise',  'Enterprise', 199000,  0,     0,    -1)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. Extend organization_type enum with 'enterprise'
-- ─────────────────────────────────────────────────────────────

ALTER TYPE organization_type ADD VALUE IF NOT EXISTS 'enterprise';

-- ─────────────────────────────────────────────────────────────
-- 3. New table: organization_sites (multi-site for enterprise)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organization_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address_line text,
  zip_code text,
  city text,
  latitude double precision,
  longitude double precision,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_sites_org
  ON public.organization_sites(organization_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Alter subscriptions: per-organization + seat tracking
-- ─────────────────────────────────────────────────────────────

-- 4a. Add new columns
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS practitioner_seats integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS secretary_seats integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price_agorot integer NOT NULL DEFAULT 32900,
  ADD COLUMN IF NOT EXISTS trial_start timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end timestamptz;

-- 4b. Backfill organization_id from practitioners table
UPDATE public.subscriptions s
SET
  organization_id = p.organization_id,
  total_price_agorot = s.price_agorot,
  trial_start = p.trial_start,
  trial_end = p.trial_end
FROM public.practitioners p
WHERE p.id = s.user_id
  AND s.organization_id IS NULL;

-- 4c. Make organization_id NOT NULL + UNIQUE (one sub per org)
ALTER TABLE public.subscriptions
  ALTER COLUMN organization_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_organization_id_key'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_organization_id_key UNIQUE (organization_id);
  END IF;
END$$;

-- 4d. payment_method_id nullable (trial has no card)
ALTER TABLE public.subscriptions
  ALTER COLUMN payment_method_id DROP NOT NULL;

-- 4e. Drop old user_id unique constraint (user can own multiple orgs)
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;

-- 4f. Update plan CHECK to include 'enterprise'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('individual', 'clinic', 'enterprise'));

-- 4g. Update status CHECK to include 'trialing'
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'trialing', 'cancelled', 'paused', 'past_due', 'expired'));

-- ─────────────────────────────────────────────────────────────
-- 5. Add site_id to organization_members
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.organization_sites(id);

-- ─────────────────────────────────────────────────────────────
-- 6. Add site_id to practitioners
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.practitioners
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.organization_sites(id);

-- ─────────────────────────────────────────────────────────────
-- 7. Add site_id to appointments
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS site_id uuid REFERENCES public.organization_sites(id);

COMMIT;
