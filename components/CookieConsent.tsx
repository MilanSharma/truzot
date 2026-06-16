"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("truzot-cookie-consent");
    }
    return false;
  });

  const accept = () => {
    localStorage.setItem("truzot-cookie-consent", "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem("truzot-cookie-consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-2xl p-5 shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 text-sm leading-relaxed">
          We use optional analytics cookies and marketing tools to improve your
          experience. See our{" "}
          <Link href="/privacy" className="text-blue-400 underline">
            Privacy Policy
          </Link>{" "}
          for details.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
