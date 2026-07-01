"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      const u = data.user;
      setUser({
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata as User["user_metadata"],
      });
      setEmail(u.email || "");
      setLoading(false);
    });
  }, [router]);

  const [emailUpdated, setEmailUpdated] = useState(false);

  const updateEmail = async () => {
    setSaving(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser((prev) => (prev ? { ...prev, email: data.user!.email } : prev));
      }
      setEmailUpdated(true);
      setMessage(
        "Confirmation email sent to new address. Verify to complete update.",
      );
    }
    setSaving(false);
  };

  const deleteAccount = async () => {
    if (
      !confirm(
        "Are you sure? This will permanently delete your account and all associated data.",
      )
    )
      return;
    if (
      !confirm(
        "This action cannot be undone. All orders, headshots, and personal data will be deleted.",
      )
    )
      return;
    setMessage("Cleaning up data...");
    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (token) {
        await fetch("/api/account/cleanup", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error("Fal cleanup failed:", e);
    }
    const { error } = await supabase.rpc("delete_user_account");
    if (error) setMessage(`Error: ${error.message}`);
    else {
      sessionStorage.removeItem("truzot-upload");
      localStorage.removeItem("truzot-upload");
      localStorage.removeItem("truzot-upload-backup");
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="min-h-screen">
      <Nav user={user} />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight mb-10 text-[var(--text)]">
          Account Settings
        </h1>

        <div
          className="rounded-2xl border p-8 space-y-8"
          
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
              Email Address
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 outline-none transition"
                
              />
              <button
                onClick={updateEmail}
                disabled={saving || email === user?.email || emailUpdated}
                className="px-5 py-2.5 bg-lime-400 text-black rounded-2xl text-sm font-bold hover:bg-lime-300 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
            {message && <p className="mt-2 text-sm text-lime-400">{message}</p>}
          </div>

          {/* Password */}
          <div className="border-t border-[var(--border)] pt-8">
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
              Password
            </label>
            <p className="text-xs text-[var(--text-faint)] mb-4">
              Reset your password via email link.
            </p>
            <button
              onClick={async () => {
                if (!user?.email) return;
                try {
                  const res = await fetch("/api/auth/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user.email }),
                  });
                  const data = await res.json();
                  if (!res.ok)
                    setMessage(`Error: ${data.error || "Failed to send reset link"}`);
                  else
                    setMessage("Password reset email sent. Check your inbox.");
                } catch (err: any) {
                  setMessage(`Error: ${err.message}`);
                }
              }}
              className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] rounded-2xl text-sm font-bold hover:bg-[var(--surface2)] transition"
            >
              Send Reset Email
            </button>
          </div>

          {/* Notifications */}
          <div className="border-t border-[var(--border)] pt-8">
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
              Notification Preferences
            </label>
            <p className="text-xs text-[var(--text-faint)] mb-4">
              Control which emails you receive from Truzot.
            </p>
            <a href="/unsubscribe" className="text-lime-400 text-sm font-semibold hover:underline">
              Manage email preferences →
            </a>
          </div>

          {/* Data Export */}
          <div className="border-t border-[var(--border)] pt-8">
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
              Data Export
            </label>
            <p className="text-xs text-[var(--text-faint)] mb-4">
              Download all your data in JSON format (GDPR right to portability).
            </p>
            <button
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) {
                  setMessage("Please sign in again to export data.");
                  return;
                }
                try {
                  const res = await fetch("/api/export", {
                    headers: {
                      Authorization: `Bearer ${session.access_token}`,
                    },
                  });
                  if (!res.ok) {
                    setMessage("Failed to export data. Please try again.");
                    return;
                  }
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `truzot-export-${Date.now()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                } catch {
                  setMessage("Failed to export data. Please try again.");
                }
              }}
              className="text-lime-400 text-sm font-semibold hover:underline"
            >
              Download my data →
            </button>
          </div>

          {/* Billing */}
          <div className="border-t border-[var(--border)] pt-8">
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2">
              Billing & Invoices
            </label>
            <p className="text-xs text-[var(--text-faint)] mb-4">
              View payment history, download receipts, and manage refunds.
            </p>
            <a href="/billing" className="text-lime-400 text-sm font-semibold hover:underline">
              Stripe Customer Portal →
            </a>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-[var(--border)] pt-8">
            <label className="block text-sm font-bold text-red-400 mb-2">
              Danger Zone
            </label>
            <p className="text-xs text-[var(--text-faint)] mb-4">
              Permanently delete your account and all associated data. This
              cannot be undone.
            </p>
            <button
              onClick={deleteAccount}
              className="px-5 py-2.5 bg-red-500 text-[var(--text)] rounded-2xl text-sm font-bold hover:bg-red-600 transition shadow-md"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}