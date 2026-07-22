import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import { getPost, getPostSlugs, clusterLabel } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;
  const images = post.image ? [post.image] : ["/opengraph-image"];

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      url,
      title: post.title,
      description: post.description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: url,
    datePublished: post.date || undefined,
    dateModified: post.date || undefined,
    ...(post.image ? { image: `${SITE_URL}${post.image}` } : {}),
    author: { "@type": "Person", "@id": `${SITE_URL}/#person`, name: "Bhavjot Khurana" },
    publisher: { "@id": `${SITE_URL}/#organization` },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-bold uppercase tracking-[0.15em] text-gray-600">
          <Link href="/" className="transition-colors hover:text-[#111827]">
            ← Back home
          </Link>
          <Link href="/blog" className="transition-colors hover:text-[#111827]">
            All guides
          </Link>
        </div>

        <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F]">
          {clusterLabel(post.cluster)}
        </p>
        <h1 className="text-3xl font-extrabold leading-[1.14] tracking-tight text-[#111827] sm:text-[2.75rem]">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-800">
          {post.description}
        </p>

        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt=""
            className="mt-8 w-full border-2 border-[#111827]"
          />
        )}

        <article
          className="blog-content mt-10"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        {/* CTA */}
        <div className="mt-14 border-2 border-[#111827] bg-white px-6 py-6">
          <p className="text-lg leading-relaxed text-gray-800">
            Stop guessing where you stand.{" "}
            <strong className="text-[#111827]">Take the free practice test</strong>{" "}
            and get a score plus a plan for exactly what to work on.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block bg-amber-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-[#111827] transition hover:bg-amber-400 active:scale-95"
          >
            Take the practice test
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-bold uppercase tracking-[0.15em] text-gray-600">
          <Link href="/" className="transition-colors hover:text-[#111827]">
            ← Back home
          </Link>
          <Link href="/blog" className="transition-colors hover:text-[#111827]">
            All guides
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
