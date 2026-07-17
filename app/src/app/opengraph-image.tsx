import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { markSvgString, MARK_VIEWBOX_TIGHT } from "@/lib/logoMark";

// The link-preview banner (iMessage, Slack, Twitter, etc.). Built with next/og
// so the wordmark renders in real Work Sans and the mark is drawn from the same
// source of truth as the favicon and the on-page logo.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "VLTG — a free, full-length IBEW aptitude practice test with an instant 1–9 stanine score.";

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "src/app/_og/WorkSans-400.ttf")),
    readFile(join(process.cwd(), "src/app/_og/WorkSans-700.ttf")),
  ]);

  // Cream V arm so the mark reads on the navy panel.
  const mark = `data:image/svg+xml;base64,${Buffer.from(
    markSvgString({ viewBox: MARK_VIEWBOX_TIGHT, dark: true })
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ height: "100%", width: "100%", display: "flex", fontFamily: "Work Sans" }}>
        {/* Navy panel: the mark + tagline */}
        <div
          style={{
            width: "460px",
            background: "#1E3A5F",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "34px",
          }}
        >
          <img src={mark} width={230} height={230} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#cbd5e1",
            }}
          >
            WIRED FOR THE TEST
          </div>
        </div>

        {/* Cream panel: the wordmark + copy */}
        <div
          style={{
            flex: 1,
            background: "#F4F1EC",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "70px",
          }}
        >
          <div style={{ display: "flex", fontSize: 104, fontWeight: 700, letterSpacing: 4, color: "#111827" }}>
            VLTG
          </div>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: "#111827", marginTop: 18, lineHeight: 1.12 }}>
            Free IBEW aptitude practice test
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 400, color: "#4b5563", marginTop: 18 }}>
            Instant score and a clear study plan.
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 2.6, color: "#1E3A5F", marginTop: 30 }}>
            VLTG.NET
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Work Sans", data: regular, weight: 400, style: "normal" },
        { name: "Work Sans", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
