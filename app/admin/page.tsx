"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface AdminOrder {
  id: string;
  email?: string;
  plan: string;
  status: string;
  amount_cents: number;
  created_at: string;
  user_id?: string;
  stripe_payment_intent?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmStyle: string;
    action: () => void;
  } | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const getToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const fetchOrders = useCallback(
    async (cursor?: string | null) => {
      const token = await getToken();
      if (!token) return;
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (cursor) {
          setOrders((prev) => [...prev, ...(data.orders || [])]);
        } else {
          setOrders(data.orders || []);
        }
        setNextCursor(data.nextCursor || null);
        setHasMore(data.hasMore || false);
        setIsAdmin(true);
      } else {
        router.push("/dashboard");
      }
      setLoading(false);
      setLoadingMore(false);
    },
    [getToken, router],
  );

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchOrders(nextCursor);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const retryOrder = async (orderId: string) => {
    if (!confirmModal) {
      setConfirmModal({
        isOpen: true,
        title: "Retry Order",
        message: `Retry order ${orderId.slice(0, 8)}...?`,
        confirmText: "Retry",
        confirmStyle: "bg-indigo-600 hover:bg-indigo-700",
        action: async () => {
          const token = await getToken();
          const res = await fetch("/api/retry", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId }),
          });
          if (res.ok) {
            fetchOrders();
            toast("Retry initiated", "success");
          } else toast("Retry failed", "error");
          setConfirmModal(null);
        },
      });
      return;
    }
    const token = await getToken();
    const res = await fetch("/api/retry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });
    if (res.ok) {
      fetchOrders();
      toast("Retry initiated", "success");
    } else toast("Retry failed", "error");
  };

  const refundOrder = async (orderId: string) => {
    if (!confirmModal) {
      setConfirmModal({
        isOpen: true,
        title: "Refund Order",
        message: `Refund order ${orderId.slice(0, 8)}...?`,
        confirmText: "Refund",
        confirmStyle: "bg-amber-600 hover:bg-amber-700",
        action: async () => {
          const token = await getToken();
          const res = await fetch("/api/admin/refund", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId }),
          });
          const data = await res.json();
          if (res.ok) {
            fetchOrders();
            toast(data.message || "Refund processed", "success");
          } else toast(data.error || "Refund failed", "error");
          setConfirmModal(null);
        },
      });
      return;
    }
    const token = await getToken();
    const res = await fetch("/api/admin/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (res.ok) {
      fetchOrders();
      toast(data.message || "Refund processed", "success");
    } else toast(data.error || "Refund failed", "error");
  };

  if (!isAdmin)
    return loading ? (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    ) : null;

  const statusColor = (s: string) => {
    switch (s) {
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "training":
      case "generating":
        return "bg-indigo-100 text-indigo-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
      case "paid":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-600">
                    Order ID
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">
                    Plan
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {o.id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {o.email || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">
                      {o.plan}
                    </td>
                    <td className="px-4 py-3">
                      ${(o.amount_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold ${statusColor(o.status)}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {o.status === "failed" && (
                          <button
                            onClick={() => retryOrder(o.id)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                          >
                            Retry
                          </button>
                        )}
                        {(o.status === "completed" ||
                          o.status === "failed") && (
                          <button
                            onClick={() => refundOrder(o.id)}
                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition"
                          >
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-slate-400"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {hasMore && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}
      </div>
      <Footer />

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmStyle={confirmModal.confirmStyle}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmStyle={confirmModal.confirmStyle}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          confirmStyle={confirmModal.confirmStyle}
          onConfirm={confirmModal.action}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
