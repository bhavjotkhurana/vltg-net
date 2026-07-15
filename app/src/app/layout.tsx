import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";

// Single typeface across the whole app — Work Sans (per VLTG brand kit v1).
// Labels stay distinct via uppercase + letter-spacing + color, not a second font.
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VLTG · Free IBEW Aptitude Practice Test",
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
      <body className={`${workSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
