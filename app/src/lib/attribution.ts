/**
 * First-touch marketing attribution.
 *
 * The problem this solves: UTM params arrive on the first page a visitor lands
 * on, but they then bounce through Google OAuth before any database row exists
 * to attach them to. So we stash them in a cookie at landing and read them back
 * when the user_profiles row is created at onboarding.
 *
 * First-touch: we never overwrite an existing cookie, so the channel that first
 * introduced someone gets the credit even if they leave and return via another
 * link. All client-side; these values are analytics, not a security boundary.
 */

const COOKIE = "vltg_attribution";
const MAX_AGE_DAYS = 90;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string | null;
};

const EMPTY: Attribution = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  referrer: null,
  landing_path: null,
};

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  return match ? decodeURIComponent(match.slice(COOKIE.length + 1)) : null;
}

/**
 * Run once on first client render (mounted app-wide). If there is no attribution
 * cookie yet AND this visit carries any signal (a utm_* param or an external
 * referrer), record it. Same-origin referrers are ignored so internal clicks
 * don't overwrite the real first touch.
 */
export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;
  if (readCookie()) return; // first-touch already recorded

  const params = new URLSearchParams(window.location.search);
  const utm = Object.fromEntries(
    UTM_KEYS.map((k) => [k, params.get(k)])
  ) as Record<(typeof UTM_KEYS)[number], string | null>;

  let referrer: string | null = null;
  if (document.referrer) {
    try {
      const refHost = new URL(document.referrer).host;
      if (refHost && refHost !== window.location.host) referrer = document.referrer;
    } catch {
      // malformed referrer — ignore
    }
  }

  const hasSignal = UTM_KEYS.some((k) => utm[k]) || referrer;
  if (!hasSignal) return; // direct/internal visit with nothing to attribute

  const data: Attribution = {
    ...utm,
    referrer,
    landing_path: window.location.pathname,
  };

  const value = encodeURIComponent(JSON.stringify(data));
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  // Lax so it survives the top-level GET redirect back from Google OAuth.
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Read the stored first-touch attribution, or all-null if none. */
export function readAttribution(): Attribution {
  const raw = readCookie();
  if (!raw) return { ...EMPTY };
  try {
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Attribution>) };
  } catch {
    return { ...EMPTY };
  }
}
