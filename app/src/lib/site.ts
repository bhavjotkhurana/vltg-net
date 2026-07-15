// Central source of truth for site-wide SEO / metadata values.
//
// SITE_URL is the canonical origin. It MUST be the domain that serves pages
// directly (no redirect). Right now bare vltg.net 308-redirects to www, so to
// use bare vltg.net as canonical, set vltg.net as the *primary* domain in
// Vercel (Settings → Domains). If you'd rather keep www as primary, change
// SITE_URL to "https://www.vltg.net".
export const SITE_URL = "https://vltg.net";

export const SITE_NAME = "VLTG";
export const SITE_TITLE = "VLTG · Free IBEW Aptitude Practice Test";
export const SITE_DESCRIPTION =
  "A free, full-length IBEW electrical apprenticeship aptitude practice test. Get an instant 1-9 stanine diagnostic and a personalized study plan built around your weakest skills.";
