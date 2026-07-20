import type { NextConfig } from "next";

// The production Supabase project. Not a secret — it ships in the client bundle
// — it is here only so local development can notice it is talking to the live
// database instead of a development one.
const PRODUCTION_SUPABASE_REF = "ilijevkedhttsnznxnmm";

if (process.env.NODE_ENV === "development") {
  const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([a-z]+)\./)?.[1];
  if (ref === PRODUCTION_SUPABASE_REF && process.env.ALLOW_PROD_DB !== "1") {
    console.warn(
      "\n\x1b[33m⚠  Local dev is pointed at the PRODUCTION database.\x1b[0m\n" +
        "   Writes here hit real user sessions and there is no undo.\n" +
        "   Point NEXT_PUBLIC_SUPABASE_URL at a development project, or set\n" +
        "   ALLOW_PROD_DB=1 if you meant it.\n"
    );
  }
}

const nextConfig: NextConfig = {
  // Bundle the OG banner's font files with the serverless function on Vercel;
  // the route reads them from disk at render time.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/app/_og/*.ttf"],
  },
};

export default nextConfig;
