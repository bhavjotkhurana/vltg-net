import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const ABOUT_DESCRIPTION =
  "I'm not an electrician. I measure learning. Why VLTG exists, how the questions were built, and how the 1-9 stanine scoring actually works, including what I don't know.";

// Next merges metadata shallowly, so `openGraph` here replaces the layout's
// wholesale. Every field it needs has to be repeated, otherwise the page
// inherits the homepage's og:title and og:url and shares under the wrong name.
export const metadata: Metadata = {
  title: "About",
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: `${SITE_URL}/about`,
    title: `About · ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `About · ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${SITE_URL}/about#aboutpage`,
    url: `${SITE_URL}/about`,
    name: "About VLTG",
    description:
      "Why VLTG exists, how the questions were built, and how the 1-9 stanine scoring works.",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Bhavjot Khurana",
      alternateName: "Bhav",
      url: "https://bhavjotkhurana.com",
      jobTitle: "Founder",
      description:
        "Math and statistics background, 700+ tutoring sessions, and a former data analyst at an education company. Builds learning diagnostics.",
      knowsAbout: [
        "learning analytics",
        "educational measurement",
        "psychometrics",
        "test preparation",
      ],
    },
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <header className="flex items-center justify-between border-b-2 border-[#111827] px-6 py-4 sm:px-12">
        <Link href="/"><Logo responsive className="text-[1.4rem]" /></Link>
        <Link
          href="/auth/login"
          className="text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] transition-colors hover:text-amber-600"
        >
          Take the test
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-8 sm:py-20">
        {/* ── Story ── */}
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F]">
          About
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-[#111827] sm:text-5xl">
          I&apos;m not an electrician.
        </h1>

        <div className="mt-7 space-y-5 text-lg leading-relaxed text-gray-800">
          <p>
            I&apos;ve never wired anything and in fact I am afraid of even trying to do it.
          </p>
          <p>
            A friend of mine was taking the IBEW aptitude test. He studied, took it,
            and came out the other side still not really sure how he&apos;d done or what
            he should have spent his time on. That&apos;s the part that stuck with me. Not
            that the test is hard, it&apos;s supposed to be hard. It&apos;s that he went in
            blind and came out blind. And if it doesn&apos;t go well you&apos;re waiting three
            months minimum before you can sit it again, six or twelve at some locals.
            That&apos;s a long time to sit around wondering which part you should have
            studied.
          </p>
          <p>
            My name&apos;s Bhav. What I&apos;m actually good at is measuring learning. I
            studied math and statistics, I&apos;ve done somewhere north of 700 tutoring
            sessions, and I spent a while as a data analyst at an education company
            where the job was basically working out whether people were learning or
            just felt like they were.
          </p>
          <p>
            The thing you learn doing that is people are bad at diagnosing themselves.
            Give someone two algebra questions, one with fractions in it and one
            without. They get the clean one right, miss the fraction one, and walk away
            saying they&apos;re bad at algebra. They&apos;re probably not bad at algebra.
            They&apos;re bad at fractions. Those are different problems and they take
            different amounts of time to fix.
          </p>
        </div>

        <p className="mt-8 border-l-4 border-amber-500 bg-amber-50 py-4 pl-5 pr-4 text-lg font-bold leading-relaxed text-[#111827]">
          That&apos;s the reason this exists. Not to hand you a number, but to tell you
          which thing is actually the problem.
        </p>

        {/* ── Who ── */}
        <h2 className="mt-16 text-2xl font-extrabold tracking-tight text-[#111827]">
          Who I built it for
        </h2>
        <div className="mt-5 space-y-5 text-lg leading-relaxed text-gray-800">
          <p>
            Mostly people who aren&apos;t coming at this straight out of a math class. If
            you haven&apos;t touched algebra in eight years, or you&apos;re changing careers,
            or you just don&apos;t know where you stand, that&apos;s who I had in mind.
          </p>
          <p>
            I tutored a lot of non-traditional students. The thing that worked was
            never handing everyone the same course. It was working out where a specific
            person actually was and starting there. I wanted this to have the same
            patience a decent tutor has.
          </p>
        </div>

        {/* ── Score ── */}
        <h2 className="mt-16 text-2xl font-extrabold tracking-tight text-[#111827]">
          What happens when you get your score
        </h2>
        <div className="mt-5 space-y-5 text-lg leading-relaxed text-gray-800">
          <p>
            If you score low, I don&apos;t want the takeaway to be &ldquo;I&apos;m bad at
            this.&rdquo; Chances are it wasn&apos;t everything. You&apos;ll see what you got
            right, not just what you missed. And where there&apos;s a gap you&apos;ll see
            roughly how long it takes to close, because the useful thing to know is that
            it&apos;s a finite amount of work and not an infinite amount.
          </p>
          <p>
            The data you generate here also gets handed back to you. That&apos;s the point
            of collecting it. I&apos;ve worked in analytics long enough to know that
            usually your data gets used to sell you something. Here it&apos;s just the
            thing that tells you where you are.
          </p>
        </div>

        {/* ── How I built it ── */}
        <h2 className="mt-16 text-2xl font-extrabold tracking-tight text-[#111827]">
          How I built it
        </h2>
        <div className="mt-5 space-y-5 text-lg leading-relaxed text-gray-800">
          <p>
            <strong className="text-[#111827]">I wrote every question on it.</strong>{" "}
            The real exam&apos;s questions are secured, so nobody outside the test-maker
            has them and anyone selling you &ldquo;real&rdquo; ones is guessing. Mine are
            original, matched to the published structure of the real test, and every math
            answer is checked by code before it ever reaches you. A wrong answer key is
            the most damaging thing a practice test can do to a person, because they go
            away believing the wrong thing about themselves.
          </p>
          <p>
            Your score comes back as a stanine, a 1 to 9 scale based on where you land
            relative to everyone else rather than the percentage you got right. And
            here&apos;s the part most prep sites leave out:{" "}
            <strong className="text-[#111827]">it&apos;s an estimate.</strong> The
            official conversion tables aren&apos;t public, so I can&apos;t copy the real
            curve and neither can anyone else selling you prep. I&apos;d rather tell you
            that than imply I have something I don&apos;t.
          </p>
        </div>
        <Link
          href="/faq"
          className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] transition-colors hover:text-amber-600"
        >
          The details, and the rest of the questions people ask
        </Link>

        {/* ── The catch ── */}
        <div className="mt-16 border-2 border-[#111827] bg-white px-6 py-6">
          <p className="text-lg leading-relaxed text-gray-800">
            The test is free and it&apos;s staying free. I&apos;ll probably build deeper
            study material later and charge for that.{" "}
            <strong className="text-[#111827]">
              I&apos;d rather tell you that now than have you wondering what the catch is.
            </strong>
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href="/auth/login"
            className="inline-block bg-amber-500 px-8 py-4 text-base font-bold uppercase tracking-wider text-[#111827] transition hover:bg-amber-400 active:scale-95"
          >
            Take the practice test
          </Link>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 transition-colors hover:text-[#111827]"
          >
            Back home
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="mt-14 border-t-2 border-[#111827] pt-6 text-sm leading-relaxed text-gray-600">
          VLTG isn&apos;t affiliated with, endorsed by, or connected to the IBEW, NECA,
          or the electrical Training ALLIANCE. It&apos;s an independent practice tool.
          Those names are only used to describe the exam this test prepares you for.
        </p>
      </main>
    </div>
  );
}
