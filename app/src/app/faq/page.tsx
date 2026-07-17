import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { StanineCurve } from "@/components/StanineCurve";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const FAQ_DESCRIPTION =
  "Straight answers about the IBEW electrical apprenticeship aptitude test: how many questions, how long, what score you need, what a stanine is, and how long you wait to retake it.";

// Next merges metadata shallowly, so `openGraph` here replaces the layout's
// wholesale and has to repeat every field it needs.
export const metadata: Metadata = {
  title: "FAQ",
  description: FAQ_DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: `${SITE_URL}/faq`,
    title: `FAQ · ${SITE_NAME}`,
    description: FAQ_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: `FAQ · ${SITE_NAME}`,
    description: FAQ_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

// ─── Visual explainers ────────────────────────────────────────────────────────
// These carry the answer at a glance; the prose under them carries the precise,
// quotable version for search and answer engines. Both, not either.

function TestStructure() {
  const parts = [
    { name: "Algebra & Functions", questions: 33, minutes: 46, fill: "#1E3A5F" },
    { name: "Reading Comprehension", questions: 36, minutes: 51, fill: "#3D6899" },
  ];
  const total = parts.reduce((sum, p) => sum + p.minutes, 0);

  return (
    <figure className="border-2 border-[#111827] bg-white">
      <div className="p-5">
        {/* Segment widths encode the real time limits, so the picture is the fact. */}
        <div className="flex border-2 border-[#111827]">
          {parts.map((p, i) => (
            <div
              key={p.name}
              className={`py-4 text-center text-sm font-bold text-white ${
                i > 0 ? "border-l-2 border-[#111827]" : ""
              }`}
              style={{ width: `${(p.minutes / total) * 100}%`, backgroundColor: p.fill }}
            >
              {p.minutes} min
            </div>
          ))}
        </div>
        <div className="mt-3 flex">
          {parts.map((p) => (
            <div key={p.name} className="pr-4" style={{ width: `${(p.minutes / total) * 100}%` }}>
              <p className="text-sm font-bold leading-tight text-[#111827]">{p.name}</p>
              <p className="mt-0.5 text-sm text-gray-700">{p.questions} questions</p>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="border-t-2 border-[#111827] bg-[#F4F1EC] px-5 py-3 text-sm leading-relaxed text-gray-700">
        {total} minutes and 69 questions in total. Both sections give you{" "}
        <strong className="text-[#111827]">about 85 seconds per question</strong>, and
        there&apos;s no calculator.
      </figcaption>
    </figure>
  );
}

function RetakeTimeline() {
  const waits = [
    { months: 3, who: "the standard minimum" },
    { months: 6, who: "plenty of locals" },
    { months: 12, who: "some locals" },
  ];
  const scale = 12;

  return (
    <figure className="border-2 border-[#111827] bg-white">
      {/* A fixed label column would eat ~40% of a phone screen and leave the bars
          too short to compare, so the labels sit above full-width bars until sm.
          The bars are aria-hidden: the text beside them already says it, and the
          bar is only a visual encoding of the same fact. */}
      <div className="space-y-4 p-5">
        {waits.map((w) => (
          <div
            key={w.months}
            className="sm:grid sm:grid-cols-[7rem_1fr] sm:items-center sm:gap-4"
          >
            <p className="text-sm">
              <span className="font-bold text-[#111827]">{w.months} months</span>
              <span className="text-gray-600 sm:hidden">, {w.who}</span>
              <span className="hidden text-xs leading-tight text-gray-600 sm:block">
                {w.who}
              </span>
            </p>
            <div
              aria-hidden="true"
              className="mt-1.5 h-7 border-2 border-[#111827] bg-[#F4F1EC] sm:mt-0"
            >
              <div
                className="h-full bg-[#1E3A5F]"
                style={{ width: `${(w.months / scale) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <div className="sm:grid sm:grid-cols-[7rem_1fr] sm:gap-4">
          <div className="hidden sm:block" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{scale} months</span>
          </div>
        </div>
      </div>
      <figcaption className="border-t-2 border-[#111827] bg-[#F4F1EC] px-5 py-3 text-sm leading-relaxed text-gray-700">
        How long you wait depends on the local you applied to. It&apos;s the reason
        it&apos;s worth knowing where you stand{" "}
        <strong className="text-[#111827]">before test day rather than after</strong>.
      </figcaption>
    </figure>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────
// `a` is the single source for both the rendered answer and the FAQPage schema,
// so the two can't drift. `extra` is display-only additions on top of it.

type FaqItem = { q: string; a: string; extra?: React.ReactNode };
type FaqSection = {
  id: string;
  title: string;
  Visual?: () => React.ReactElement;
  items: FaqItem[];
};

const SECTIONS: FaqSection[] = [
  {
    id: "the-real-test",
    title: "The real test",
    Visual: TestStructure,
    items: [
      {
        q: "What is the IBEW aptitude test?",
        a: "It's the entrance exam for electrical apprenticeships offered through the IBEW and NECA. It's built by the electrical Training ALLIANCE, formerly the NJATC, and validated by the American Institutes for Research. There are two sections: algebra and functions, and reading comprehension. It's checking whether you can learn the trade, not whether you already know it.",
      },
      {
        q: "How many questions are on the IBEW aptitude test, and how long is it?",
        a: "69 questions in about 97 minutes. The math section is 33 questions in 46 minutes and the reading section is 36 questions in 51 minutes. That works out to roughly 85 seconds per question in either section.",
      },
      {
        q: "Do I need to know anything about electrical work?",
        a: "No. Nothing on the test assumes you have ever touched a wire. The math is ordinary high school algebra and the reading passages are about everyday subjects. It's an aptitude test rather than a knowledge test, so what it's measuring is whether the trade can be taught to you.",
      },
      {
        q: "Is the IBEW aptitude test hard?",
        a: "It's meant to be, but not because it's obscure. Nothing on it goes past high school algebra. The pressure comes from the clock, about 85 seconds a question with no calculator. Most people who struggle aren't missing the concepts. They're slow on the arithmetic underneath the concepts, which is a different problem and an easier one to fix.",
      },
    ],
  },
  {
    id: "scoring",
    title: "Scoring",
    Visual: StanineCurve,
    items: [
      {
        q: "What score do I need to pass the IBEW aptitude test?",
        a: "A 4 or better on the 1 to 9 scale qualifies you for an interview at most locals. 5 is average. There isn't really a pass or fail: locals rank applicants by score, so a higher number usually means an earlier call for an apprenticeship slot.",
      },
      {
        q: "What is a stanine score?",
        a: "A stanine is a 1 to 9 score based on where you land relative to everyone else who took the test, not on the percentage you got right. 5 is average by definition. Getting 70% of the questions right does not mean you scored a 7. About 20% of people land on a 5, and only about 4% land on a 9.",
      },
      {
        q: "How accurate is the score VLTG gives me?",
        a: "It's an estimate, and I'd rather say so than imply otherwise. The official conversion tables are proprietary to the American Institutes for Research and aren't public, so nobody outside the test maker can put a raw score onto the real curve. What I do is apply the actual stanine method against a documented estimate of how applicants perform, and show you the percentile next to the number so you can see the reasoning. It sharpens as more people take it.",
      },
    ],
  },
  {
    id: "retaking-it",
    title: "Retaking it",
    Visual: RetakeTimeline,
    items: [
      {
        q: "How long do I have to wait to retake the IBEW aptitude test?",
        a: "It depends on your local. Three months is the standard minimum, plenty of locals ask for six, and some make you wait a full year. Your local sets the window, so check with the one you applied to.",
      },
      {
        q: "What happens if I don't score a 4?",
        a: "You wait out your local's retake window and sit it again. It isn't a verdict on you, it's a measurement taken on one day. The useful thing is finding out which part actually cost you the points, because that list is almost always shorter and more fixable than it feels like from the outside.",
      },
    ],
  },
  {
    id: "this-practice-test",
    title: "This practice test",
    items: [
      {
        q: "Are these the real IBEW test questions?",
        a: "No, and nobody's are. The real exam's questions are secured, so anyone selling you “real” IBEW questions is guessing. I wrote every question here myself, matched to the published structure of the real test: same topics, same style, same difficulty spread.",
      },
      {
        q: "Is this practice test timed?",
        a: "Not here. I want you to answer all 69 questions so the diagnostic has something complete to work with. I do time you in the background, and afterward I'll tell you whether you'd have finished inside the real 46 and 51 minute limits. Better to find out you're slow now than on test day.",
      },
      {
        q: "Is it really free?",
        a: "Yes. The test is free and it's staying free. I'll probably build deeper study material later and charge for that. I'd rather tell you now than have you wondering what the catch is.",
      },
      {
        q: "What do you do with my answers?",
        a: "The data you generate gets handed back to you. That's what the results page is. I use aggregate performance across everyone to calibrate the scoring curve, which is what makes the estimate better over time. I'm not selling you ads.",
      },
      {
        q: "Is VLTG affiliated with the IBEW?",
        a: "No. VLTG isn't affiliated with, endorsed by, or connected to the IBEW, NECA, or the electrical Training ALLIANCE. It's an independent practice tool. Those names only describe the exam this test prepares you for.",
      },
      {
        q: "Who made this?",
        a: "I'm Bhav. I'm not an electrician. What I do is measure learning: a math and statistics background, somewhere north of 700 tutoring sessions, and a stretch as a data analyst at an education company. I built this because a friend went into the test blind and came out of it still not knowing what he should have studied.",
        extra: (
          <Link
            href="/about"
            className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] transition-colors hover:text-amber-600"
          >
            The longer story
          </Link>
        ),
      },
    ],
  },
];

// ─── Accordion ────────────────────────────────────────────────────────────────
// Native <details>, which means no client JS and no "use client". It also keeps
// every answer in the DOM whether open or closed, so crawlers and answer engines
// read the whole page. A JS tab/panel widget that mounts only the active panel
// would hide most of this page from exactly the things it's written for.

function FaqEntry({ item }: { item: FaqItem }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-bold text-[#111827] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1E3A5F] [&::-webkit-details-marker]:hidden">
        <span>{item.q}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-5 w-5 flex-none text-[#1E3A5F] transition-transform duration-200 group-open:rotate-180"
        >
          <path
            d="M5 7.5 L10 12.5 L15 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="px-5 pb-5">
        <p className="text-base leading-relaxed text-gray-700">{item.a}</p>
        {item.extra}
      </div>
    </details>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/faq#faqpage`,
    url: `${SITE_URL}/faq`,
    name: "IBEW aptitude test FAQ",
    description: FAQ_DESCRIPTION,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntity: SECTIONS.flatMap((s) => s.items).map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F4F1EC]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <header className="flex items-center justify-between border-b-2 border-[#111827] px-6 py-4 sm:px-12">
        <Link href="/">
          <Logo responsive className="text-[1.4rem]" />
        </Link>
        <Link
          href="/auth/login"
          className="text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] transition-colors hover:text-amber-600"
        >
          Take the test
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14 sm:px-8 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F]">
          FAQ
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-[#111827] sm:text-5xl">
          Questions about the test.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-gray-800">
          Short answers about the real IBEW aptitude test and about this practice
          version of it. If you want the long version of why this exists, that&apos;s
          on the <Link href="/about" className="font-bold text-[#1E3A5F] underline decoration-amber-500 decoration-2 underline-offset-4 hover:text-amber-600">About page</Link>.
        </p>

        <nav aria-label="Jump to a section" className="mt-8 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="border-2 border-[#111827] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#1E3A5F] transition-colors hover:bg-amber-50"
            >
              {s.title}
            </a>
          ))}
        </nav>

        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="mt-14 scroll-mt-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#111827]">
              {s.title}
            </h2>
            {s.Visual && (
              <div className="mt-5">
                <s.Visual />
              </div>
            )}
            <div className="mt-5 divide-y-2 divide-[#111827] border-2 border-[#111827] bg-white">
              {s.items.map((item) => (
                <FaqEntry key={item.q} item={item} />
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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
