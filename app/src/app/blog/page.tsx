import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import { getAllPostMeta, clusterLabel } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const BLOG_DESCRIPTION =
  "Straight, accurate guides to the IBEW electrical apprenticeship aptitude test: scoring, retakes, what to study, test-day logistics, and how the whole system fits together.";

export const metadata: Metadata = {
  title: "Blog",
  description: BLOG_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: `${SITE_URL}/blog`,
    title: `Blog · ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog · ${SITE_NAME}`,
    description: BLOG_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function BlogIndexPage() {
  const posts = getAllPostMeta();

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      {/* Nav */}
      <header className="flex items-center justify-between border-b-2 border-[#111827] bg-white px-6 py-4 sm:px-12">
        <Link href="/"><Logo responsive className="text-[1.4rem]" /></Link>
        <Link
          href="/auth/login"
          className="text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] transition-colors hover:text-amber-600"
        >
          Take the test
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-8 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F]">
          Blog
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-[#111827] sm:text-5xl">
          Guides for the IBEW aptitude test.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-800">
          {BLOG_DESCRIPTION}
        </p>

        <ul className="mt-12 space-y-5">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block border-2 border-[#111827] bg-white px-6 py-6 transition hover:bg-amber-50"
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#1E3A5F]">
                  {clusterLabel(post.cluster)}
                </p>
                <h2 className="text-xl font-extrabold tracking-tight text-[#111827] sm:text-2xl">
                  {post.title}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  {post.description}
                </p>
                <span className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] transition-colors group-hover:text-amber-600">
                  Read →
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 border-2 border-[#111827] bg-white px-6 py-6">
          <p className="text-lg leading-relaxed text-gray-800">
            Reading up is a good start. The fastest way to know where you actually
            stand is to take the test.{" "}
            <strong className="text-[#111827]">It&apos;s free.</strong>
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block bg-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-[#111827] transition hover:bg-amber-400 active:scale-95"
          >
            Take the practice test
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
