"use client";

import { useEffect } from "react";
import { captureFirstTouch } from "@/lib/attribution";

/**
 * Records first-touch marketing attribution on the visitor's first page,
 * wherever that is (landing, a blog post, anywhere). Renders nothing and runs
 * once on mount. Mounted app-wide in the root layout; being a client component
 * here does not opt any page out of static rendering.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureFirstTouch();
  }, []);
  return null;
}
