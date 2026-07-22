-- Email-updates consent, captured from a default-checked checkbox at onboarding.
--
-- Nullable on purpose. New signups write an explicit true/false from the box.
-- Existing users never saw the checkbox, so their consent is genuinely unknown
-- (NULL) rather than a fabricated true — backfilling opted-in would invent
-- consent nobody gave. The row's created_at doubles as the consent timestamp.
--
-- This is separate from the waitlist table (explicit "notify me when study
-- materials launch"). This flag is the broad "email me updates" opt-in; the
-- waitlist is a narrower, higher-intent signal. Both are kept.

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN;
