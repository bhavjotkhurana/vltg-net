# VLTG

A free, full-length practice test and diagnostic for the IBEW electrical
apprenticeship aptitude exam. Live at **[vltg.net](https://vltg.net)**.

Most practice tests hand you a score. VLTG hands you a diagnosis: a 1–9 stanine,
a per-skill breakdown, and a study plan built around your specific weak spots —
because the useful thing to know isn't *that* you're behind, it's *on what*.

## What it does

- **A real, timed exam** — 33 algebra questions and 36 reading questions, on the
  same structure and clock as the real test.
- **Stanine scoring** — raw performance is mapped to the 1–9 norm-referenced
  scale the actual exam uses, with a "you are here" curve against the qualifying
  line.
- **A per-skill diagnostic** — every question is tagged to a skill, so the report
  shows which topics are actually holding the score back, ordered by what to fix
  first (including prerequisite chains).
- **A study plan** — gaps are turned into an estimated cadence ("about N weeks at
  ~25 min/day"), not a daunting lump of hours, with an AI-written coaching note.

## Stack

- **Next.js 16** (App Router, Server Components) + **TypeScript**
- **Supabase** — Postgres, SSR auth (Google OAuth), row-level security
- **Tailwind CSS v4**
- **Anthropic API** — the personalized coaching note
- **Vercel** — hosting and analytics

## Notable engineering

- **The answer key never reaches the browser.** Questions are served with the
  correct answers and explanations stripped out; grading happens server-side on
  submit. A practice test that leaks its own key is worthless.
- **Row-level security everywhere.** Each user can read and write only their own
  sessions, responses, and reports; the diagnostic report is written by a
  service role because no one — including its owner — should be able to forge it.
- **Honest scoring.** The stanine curve is a documented estimate (the official
  norming tables aren't public), and the app says so rather than implying a
  precision it doesn't have.
- **Resilient test-taking.** Every answer autosaves as you go, so a closed tab or
  refreshed page resumes exactly where you left off.

## Local development

```bash
cd app
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

Environment variables (`app/.env.local`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS-scoped) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; writes diagnostic reports |
| `ANTHROPIC_API_KEY` | Optional; the coaching note is skipped if unset |

The database schema is documented in [`schema/schema.sql`](schema/schema.sql);
changes are tracked as migrations in [`supabase/migrations/`](supabase/migrations).
In development, `/dev/login` signs in a test user without Google OAuth (it
returns 404 in production).

## Disclaimer

VLTG is an independent practice tool. It is not affiliated with, endorsed by, or
connected to the IBEW, NECA, or the electrical Training ALLIANCE. Those names are
used only to describe the exam this test helps you prepare for.
