"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Download, FileText, ExternalLink } from "lucide-react";

interface Order {
  id: string;
  plan: string;
  status: string;
  amount_cents: number;
  created_at: string;
  stripe_payment_intent?: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptUrls, setReceiptUrls] = useState<Record<string, string | null>>(
    {},
  );
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchReceiptUrl = useCallback(async (pi: string, orderId: string) => {
    if (fetchedRef.current.has(orderId)) return;
    fetchedRef.current.add(orderId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/receipt-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ paymentIntent: pi }),
      });
      if (res.ok) {
        const data = await res.json();
        setReceiptUrls((prev) => ({ ...prev, [orderId]: data.url }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      const { data: ordersData } = await supabase
        .from("orders")
        .select(
          "id, plan, status, amount_cents, created_at, stripe_payment_intent",
        )
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      if (ordersData) {
        setOrders(ordersData as Order[]);
        for (const o of ordersData) {
          if (o.stripe_payment_intent) {
            fetchReceiptUrl(o.stripe_payment_intent, o.id);
          }
        }
      }
      setLoading(false);
    });
  }, [router, fetchReceiptUrl]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
          Invoices & Receipts
        </h1>
        <p className="text-slate-500 mb-8">
          View your order history and download receipts.
        </p>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              No receipts yet
            </h3>
            <p className="text-sm text-slate-500">
              Once you place an order, your invoice will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white capitalize">
                    {o.plan} Plan
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Order #{o.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(o.created_at).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">
                    ${(o.amount_cents / 100).toFixed(2)}
                  </p>
                  {receiptUrls[o.id] ? (
                    <a
                      href={receiptUrls[o.id]!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> View Receipt
                    </a>
                  ) : o.stripe_payment_intent ? (
                    <span className="text-xs text-slate-400 mt-2 block">
                      Loading receipt...
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 mt-2 block">
                      Receipt pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
