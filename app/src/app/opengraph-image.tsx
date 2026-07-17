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

  const mark = `data:image/svg+xml;base64,${Buffer.from(
    markSvgString({ viewBox: MARK_VIEWBOX_TIGHT })
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F4F1EC",
          border: "14px solid #111827",
          padding: "70px",
          fontFamily: "Work Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          <img src={mark} width={128} height={128} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#111827",
            }}
          >
            VLTG
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.1,
            }}
          >
            Free IBEW aptitude practice test
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "20px",
              fontSize: 32,
              fontWeight: 400,
              color: "#4b5563",
              maxWidth: "900px",
              lineHeight: 1.35,
            }}
          >
            The full test, an instant 1–9 stanine score, and a study plan built around
            your weakest skills.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "40px",
            }}
          >
            <div style={{ display: "flex", width: "40px", height: "8px", background: "#F59E0B" }} />
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#1E3A5F",
              }}
            >
              VLTG.NET
            </div>
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
