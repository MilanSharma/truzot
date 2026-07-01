"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

interface PopupSmartProps {
 campaignId: string;
}

export default function PopupSmart({ campaignId }: PopupSmartProps) {
 const [shouldLoad, setShouldLoad] = useState(false);

 useEffect(() => {
 const checkShouldShow = async () => {
 // Don't show on mobile
 if (window.innerWidth < 768) {
 return;
 }

 // Check if waitlist signed up or exit intent was previously dismissed
 const signedUp =
 localStorage.getItem("truzot-waitlist-signed-up") === "true";
 const dismissed =
 localStorage.getItem("truzot-exit-popup-dismissed") === "true";
 if (signedUp || dismissed) {
 return;
 }

 // Check if user is logged in (check for auth token in localStorage/cookies)
 const hasAuthToken =
 document.cookie.includes("auth-token") ||
 localStorage.getItem("sb-*-*-auth-token");
 if (hasAuthToken) {
 return;
 }

 // Check cookie consent
 const cookieConsent = localStorage.getItem("truzot-cookie-consent");
 if (cookieConsent !== "accepted") {
 return;
 }

 // Frequency capping: check if shown in last 7 days
 const lastShown = localStorage.getItem("popupsmart-last-shown");
 if (lastShown) {
 const daysSinceShown =
 (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
 if (daysSinceShown < 7) {
 return;
 }
 }

 // Don't show on checkout/payment pages
 if (
 window.location.pathname.includes("/checkout") ||
 window.location.pathname.includes("/billing") ||
 window.location.pathname.includes("/payment")
 ) {
 return;
 }

 // All checks passed, load the popup
 setShouldLoad(true);

 // Track when shown for frequency capping
 localStorage.setItem("popupsmart-last-shown", Date.now().toString());
 };

 // Run check after page load
 checkShouldShow();
 }, [campaignId]);

 if (!shouldLoad) {
 return null;
 }

 return (
 <Script
 src="https://cdn.popupsmart.com/bundle.js"
 id="popupsmart-script"
 data-id={campaignId}
 strategy="afterInteractive"
 />
 );
}
