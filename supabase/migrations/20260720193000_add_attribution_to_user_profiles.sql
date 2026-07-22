-- First-touch marketing attribution on the earliest per-user row.
--
-- The whole distribution strategy depends on answering "which channel produced
-- this user" — a reel vs a Reddit comment vs organic search. Vercel Analytics
-- knows the traffic source but lives in a separate silo from Supabase, which
-- knows what the user actually did (started, finished, converted). Neither can
-- answer the question alone. Stamping the source onto user_profiles joins them:
-- one query then gives source -> started -> finished -> converted.
--
-- Captured client-side into a first-touch cookie on landing (survives the Google
-- OAuth round-trip) and written when the profile is created at onboarding — the
-- earliest authed row. First-touch, not last: it credits the channel that first
-- brought the person into VLTG's world, which is the discovery question these
-- channels are being tested against.
--
-- These values originate on the client and are not a security boundary — a user
-- could spoof their own utm. That is fine; there is no incentive to, and
-- attribution is analytics, not authorization.

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_source   TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_medium   TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_content  TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS utm_term     TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referrer     TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS landing_path TEXT;

-- Speeds up the by-channel funnel rollups.
CREATE INDEX IF NOT EXISTS idx_user_profiles_utm_campaign ON user_profiles (utm_campaign);
