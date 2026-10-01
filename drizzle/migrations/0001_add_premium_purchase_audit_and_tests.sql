ALTER TABLE public.premium_purchases
  ADD COLUMN IF NOT EXISTS release_source text NOT NULL DEFAULT 'automatic',
  ADD COLUMN IF NOT EXISTS test_mode text;

ALTER TABLE public.premium_purchases
  ADD CONSTRAINT premium_purchases_release_source_check
  CHECK (release_source IN ('automatic', 'manual', 'test'));

ALTER TABLE public.premium_purchases
  ADD CONSTRAINT premium_purchases_test_mode_check
  CHECK (test_mode IS NULL OR test_mode IN ('simulation', 'real'));

CREATE INDEX IF NOT EXISTS premium_purchases_admin_history_idx
  ON public.premium_purchases (created_at DESC, status, test_mode);

COMMENT ON COLUMN public.premium_purchases.release_source IS 'Origin of Premium release: automatic payment confirmation, manual admin approval, or test.';
COMMENT ON COLUMN public.premium_purchases.test_mode IS 'Null for real purchases, simulation for harmless tests, or real for tests that grant Premium.';