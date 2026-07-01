"use client";
import { ReactNode, useEffect } from "react";
import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
 process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export function PostHogProvider({ children }: { children: ReactNode }) {
 useEffect(() => {
 const consent = localStorage.getItem("truzot-cookie-consent");
 if (posthogKey && typeof window !== "undefined" && consent === "accepted") {
 try {
 posthog.init(posthogKey, {
 api_host: posthogHost,
 person_profiles: "identified_only",
 });
 } catch {
 /* posthog init failed */
 }
 }
 }, []);
 return <>{children}</>;
}
