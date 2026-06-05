"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portalUrl, setPortalUrl] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      try {
        const res = await fetch("/api/billing/portal", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const json = await res.json();
        if (json.url) setPortalUrl(json.url);
      } catch {}
      setLoading(false);
    });
  }, [router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
          Billing & Invoices
        </h1>
        <p className="text-slate-500 mb-8">
          Manage your payment methods, view receipts, and request refunds.
        </p>
        {portalUrl ? (
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-700 transition shadow-sm"
          >
            Open Stripe Customer Portal →
          </a>
        ) : (
          <p className="text-slate-400">
            Billing portal is not available. Contact hello@truzot.com for
            assistance.
          </p>
        )}
      </div>
      <Footer />
    </div>
  );
}
