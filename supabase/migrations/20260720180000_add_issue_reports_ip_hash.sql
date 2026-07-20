-- Add ip_hash to issue_reports so anonymous submissions can be rate limited.
--
-- POST /api/issues accepts unauthenticated reports on purpose (a confused
-- visitor on a marketing page is exactly whose feedback is worth having), but
-- the existing throttle only ran for signed-in users. That left an
-- unauthenticated write path with no ceiling on a database shared with
-- everything else in the product.
--
-- We store a salted HMAC of the address, never the address itself. It is enough
-- to count repeat submissions from one source, and not enough to recover the IP
-- if this table is ever exposed. Nullable because the header can be absent and a
-- missing IP must not block a legitimate report.
--
-- This is the first migration in the project. The baseline that reconstructs the
-- existing schema is still to be written and will carry an earlier timestamp, so
-- ordering resolves correctly once it lands.

ALTER TABLE issue_reports ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Supports the rate-limit lookup: recent rows for one hash.
CREATE INDEX IF NOT EXISTS idx_issue_reports_ip_hash_created
  ON issue_reports (ip_hash, created_at DESC);
