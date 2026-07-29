-- Outbound clicks on the per-gap free study resources shown on the results page.
--
-- This is the instrument behind the content strategy: it records which skill
-- gaps actually drive someone to go study. Demand-by-gap tells us where people
-- most need help; later, joined against retest movement, it tells us whether
-- the linked resource actually worked, which is the signal for where to author
-- original material (reading comprehension being the current suspected gap).
--
-- session_id is ON DELETE SET NULL, not CASCADE: a retake deletes the session,
-- but the record that "this person went to study fractions" is still useful
-- signal and shouldn't vanish with it.

CREATE TABLE IF NOT EXISTS resource_clicks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id      UUID REFERENCES auth.users(id)    ON DELETE SET NULL,
  session_id   UUID REFERENCES test_sessions(id) ON DELETE SET NULL,
  skill_id     TEXT NOT NULL,
  resource_url TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resource_clicks_skill   ON resource_clicks (skill_id);
CREATE INDEX IF NOT EXISTS idx_resource_clicks_created ON resource_clicks (created_at DESC);

-- Service-role only, like the other write-only analytics tables. Nothing in the
-- app reads these back; analysis happens in the Supabase SQL editor.
ALTER TABLE resource_clicks ENABLE ROW LEVEL SECURITY;
