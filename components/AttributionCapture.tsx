"use client";

import { useEffect } from "react";
import { captureAttributionFromUrl } from "@/lib/attribution";

// Mounted once in the root layout so gclid/UTM params get captured no matter
// which page a visitor's ad click or campaign link actually lands on - see
// lib/attribution.ts for why this exists.
export default function AttributionCapture() {
  useEffect(() => {
    captureAttributionFromUrl();
  }, []);
  return null;
}
