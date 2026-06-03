-- 0036_bench_consent.sql — opt-in consent for the first-party benchmark pool.
-- Additive. Default FALSE: an org contributes NOTHING to the aggregate until it
-- explicitly opts in (the privacy-policy/DPA amendment + 30-day notice gate
-- this UI). Revocable; revocation excludes the org from the next refresh.
--
-- This is the ONE switch the whole first-party pool hangs on. It pairs with the
-- antitrust-counsel sign-off (plan pin #2): even with this column TRUE across
-- orgs, the aggregate stays internal until counsel clears public use.

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS bench_contribution_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Coarse region bucket for k-anonymity (never a precise location). Set once at
-- onboarding; a handful of broad buckets (e.g. 'us-northeast', 'us-south').
ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS region_bucket TEXT;

COMMENT ON COLUMN org_settings.bench_contribution_opt_in IS
  'Opt-in (default false) to contribute anonymized prices to the Cost Index / Bench peer pool. Revocable. Counsel-gated for any public use.';
