"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

// Native exit-intent offer. A third-party PopupSmart integration already
// exists in components/PopupSmart.tsx but was never actually wired up
// anywhere (no campaignId, never mounted) - it needs a PopupSmart.com
// account this repo has no credentials for. This is a self-contained
// replacement: same real WELCOME20 discount already used elsewhere on the
// site, no fake countdown/urgency, desktop-only (exit-intent has no mobile
// equivalent; StickyMobileCTA already covers mobile persuasion).
export default function ExitIntentOffer() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) return;

    const excludedPaths = ["/upload", "/checkout", "/billing", "/account", "/dashboard", "/team", "/login", "/signup"];
    if (excludedPaths.some((p) => window.location.pathname.startsWith(p))) return;

    const dismissed = localStorage.getItem("truzot-exit-offer-dismissed");
    if (dismissed) return;

    const lastShown = localStorage.getItem("truzot-exit-offer-shown-at");
    if (lastShown) {
      const daysSince = (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    const hasAuthToken = document.cookie.includes("auth-token");
    if (hasAuthToken) return;

    // Ignore the first couple seconds so an accidental cursor dip toward
    // the tab/URL bar on page load doesn't trigger it immediately.
    let armed = false;
    const armTimer = setTimeout(() => { armed = true; }, 2500);

    const onMouseLeave = (e: MouseEvent) => {
      if (!armed || e.clientY > 0) return;
      setShow(true);
      localStorage.setItem("truzot-exit-offer-shown-at", Date.now().toString());
      document.removeEventListener("mouseleave", onMouseLeave);
    };

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      clearTimeout(armTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("truzot-exit-offer-dismissed", "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-[2rem] p-8 text-center shadow-2xl"
            style={{ background: "var(--surface, #0E1016)", border: "1px solid var(--border, rgba(255,255,255,0.1))" }}
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-4 right-4 text-[var(--text-secondary,#9CA3AF)] hover:text-[var(--text,#fff)]"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs font-bold tracking-wide text-[var(--lime,#A3E635)] mb-3">
              BEFORE YOU GO
            </p>
            <h2 className="text-2xl font-black text-[var(--text,#fff)] mb-3">
              Take 20% off your headshots
            </h2>
            <p className="text-[var(--text-secondary,#9CA3AF)] text-sm mb-6">
              Code applies automatically at checkout. No expiry games — it's yours whenever you're ready.
            </p>
            <div className="rounded-2xl border-2 border-dashed border-[var(--lime,#A3E635)] bg-[rgba(163,230,53,0.1)] py-4 mb-6">
              <span className="font-mono font-bold text-2xl tracking-widest text-[var(--lime,#A3E635)]">
                WELCOME20
              </span>
            </div>
            <Link
              href="/upload?coupon=WELCOME20"
              onClick={dismiss}
              className="w-full bg-[var(--lime,#A3E635)] text-black px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
            >
              Create My Headshots <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
