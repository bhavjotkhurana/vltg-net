import type { Metadata } from "next";
import { Work_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

// Primary display + body typeface (per VLTG brand kit v1).
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Labels / data typeface — monospaced, used uppercase for eyebrows, stats, tags.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "VLTG — Free IBEW Aptitude Practice Test",
  description:
    "Free full-length IBEW aptitude practice test with an instant stanine diagnostic and a personalized study plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${workSans.variable} ${spaceMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
