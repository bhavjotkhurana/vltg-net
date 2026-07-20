import Link from "next/link";
import { Logo } from "@/components/Logo";
import ReportIssue from "@/components/ReportIssue";

// Shared footer for the public pages (landing, about, faq) so the marketing
// surface has consistent chrome and one place to report a problem.
export default function SiteFooter() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t-2 border-[#111827] py-8">
      <Logo className="text-lg" />
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600">
        &ldquo;Voltage&rdquo; · Wired for the test
      </p>
      <nav className="flex flex-wrap items-center justify-center gap-5">
        <Link
          href="/faq"
          className="text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] hover:text-amber-600 transition-colors"
        >
          FAQ
        </Link>
        <Link
          href="/about"
          className="text-xs font-bold uppercase tracking-[0.15em] text-[#1E3A5F] hover:text-amber-600 transition-colors"
        >
          About VLTG
        </Link>
        <ReportIssue />
      </nav>
    </footer>
  );
}
