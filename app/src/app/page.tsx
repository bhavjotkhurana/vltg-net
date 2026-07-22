import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F1EC]">

      {/* ── Nav ── */}
      <header className="flex items-center justify-between border-b-2 border-[#111827] bg-white px-6 py-4 sm:px-12">
        <Logo responsive className="text-[1.6rem]" />
        <nav className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/blog"
            className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 hover:text-[#111827] transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/faq"
            className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 hover:text-[#111827] transition-colors"
          >
            FAQ
          </Link>
          <Link
            href="/about"
            className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 hover:text-[#111827] transition-colors"
          >
            About
          </Link>
          <Link
            href="/auth/login"
            className="text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] hover:text-amber-600 transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="border-b-2 border-[#111827] px-6 py-16 sm:px-12 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-6">
            Free diagnostic test · No credit card
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.18] tracking-tight text-[#111827] sm:text-7xl sm:leading-[1.12]">
            You&apos;ve got this.<br />
            Let&apos;s find your{" "}
            <span className="box-decoration-clone bg-amber-400 px-2 py-0.5 text-[#111827]">starting line</span>.
          </h1>
          <p className="mt-8 max-w-xl text-xl leading-relaxed text-gray-700">
            A full-length IBEW practice test that shows you exactly where you stand,
            then a study plan to close the gap.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/auth/login"
              className="inline-block bg-amber-500 px-10 py-4 text-base font-bold uppercase tracking-wider text-[#111827] transition hover:bg-amber-400 active:scale-95"
            >
              Take the practice test
            </Link>
            <Link
              href="/auth/login"
              className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600 hover:text-[#111827] transition-colors"
            >
              Already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="on-dark bg-[#1E3A5F] border-b-2 border-[#111827]">
        <div className="mx-auto grid max-w-4xl grid-cols-1 divide-y-2 divide-white/10 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
          {[
            { stat: "69", label: "Questions", sub: "33 math · 36 reading" },
            { stat: "4+", label: "Score to qualify", sub: "1–9 stanine scale" },
            { stat: "97m", label: "Real test clock", sub: "Untimed here, I benchmark you" },
          ].map(({ stat, label, sub }) => (
            <div key={label} className="px-8 py-10 text-center">
              <p className="text-5xl font-extrabold text-amber-400 sm:text-6xl">{stat}</p>
              <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-white">{label}</p>
              <p className="mt-1.5 text-sm text-slate-300">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b-2 border-[#111827] px-6 py-16 sm:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-10">
            What happens when you take the test
          </p>
          <div className="grid gap-px bg-[#111827] border-2 border-[#111827] sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Take the test",
                body: "33 algebra and functions questions, then 36 reading comprehension questions. No calculator, just you and the questions.",
              },
              {
                num: "02",
                title: "See your score",
                body: "Your score appears instantly on the 1–9 stanine scale. You'll know exactly how far you are from a qualifying score of 4.",
              },
              {
                num: "03",
                title: "Get your study plan",
                body: "A skill-by-skill breakdown of what you got right and wrong, with a prioritized study plan built around your specific gaps.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="bg-[#F4F1EC] px-8 py-10">
                <p className="text-4xl font-bold text-[#1E3A5F]">{num}</p>
                <p className="mt-5 text-lg font-bold text-[#111827]">{title}</p>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Score scale ── */}
      <section className="border-b-2 border-[#111827] bg-white px-6 py-16 sm:px-12">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1E3A5F] mb-10">
            The 1–9 stanine scoring scale
          </p>
          <div className="grid grid-cols-9 gap-2">
            {[1,2,3,4,5,6,7,8,9].map((s) => (
              <div
                key={s}
                className={`border-2 py-5 text-center text-xl font-bold ${
                  s === 4
                    ? "border-amber-500 bg-amber-400 text-[#111827]"
                    : s < 4
                    ? "border-slate-300 bg-slate-100 text-gray-600"
                    : "border-[#111827] bg-[#F4F1EC] text-[#111827]"
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border-l-4 border-amber-500 pl-4">
              <p className="text-base font-bold text-[#111827]">Score 4 qualifies you for an interview.</p>
              <p className="mt-1 text-sm text-gray-700">Most IBEW locals require a minimum score of 4 to move forward in the application process.</p>
            </div>
            <div className="border-l-4 border-[#1E3A5F] pl-4">
              <p className="text-base font-bold text-[#111827]">Higher scores make you more competitive.</p>
              <p className="mt-1 text-sm text-gray-700">Locals rank applicants by score. The higher you score, the earlier you get called for an apprenticeship slot.</p>
            </div>
          </div>
          <Link
            href="/faq#scoring"
            className="mt-8 inline-block text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] hover:text-amber-600 transition-colors"
          >
            How the scoring works, and what it&apos;s estimating
          </Link>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="on-dark bg-[#1E3A5F] px-6 py-20 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400 mb-5">
          Start here
        </p>
        <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
          Know your number.<br />Make a plan.
        </h2>
        <p className="mt-5 mx-auto max-w-md text-lg text-slate-300">
          Untimed. Most people finish in about 90 minutes.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-block bg-amber-500 px-12 py-4 text-base font-bold uppercase tracking-wider text-[#111827] transition hover:bg-amber-400 active:scale-95"
        >
          Take the practice test
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
