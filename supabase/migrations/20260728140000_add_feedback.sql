-- Feedback from the results-page window (name, email, subject, body). Separate
-- from issue_reports (bug reports with auto-captured technical context) and from
-- waitlist (email-only signups): this is open-ended "what worked / what didn't"
-- with a way to reply.
--
-- Service-role only, like the other write-only inbound tables: RLS enabled with
-- no policies, so nothing in the app can read it back. Triage happens in the
-- Supabase dashboard. user_id is derived server-side and set NULL on account
-- deletion so the feedback survives.

CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT,
  email       TEXT,
  subject     TEXT,
  body        TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  path        TEXT,
  user_agent  TEXT,
  app_version TEXT
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user    ON feedback (user_id);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
