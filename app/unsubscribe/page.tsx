"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";

function EmailPreferencesContent() {
 const searchParams = useSearchParams();
 const router = useRouter();
 const email = searchParams.get("email");
 const token = searchParams.get("token");

 const [status, setStatus] = useState<
 "loading" | "success" | "error" | "manual"
 >(email && token ? "loading" : "manual");
 const [marketing, setMarketing] = useState(true);
 const [productUpdates, setProductUpdates] = useState(true);
 const [saving, setSaving] = useState(false);
 const [saved, setSaved] = useState(false);
 const [manualEmail, setManualEmail] = useState("");
 const [manualPassword, setManualPassword] = useState("");
 const [manualError, setManualError] = useState("");

 useEffect(() => {
 if (!email || !token) return;
 fetch("/api/unsubscribe", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email, token }),
 })
 .then((r) => {
 if (r.ok) {
 setStatus("success");
 setMarketing(false);
 } else setStatus("error");
 })
 .catch(() => setStatus("error"));
 }, [email, token]);

 const handleManualLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setManualError("");
 const { error } = await supabase.auth.signInWithPassword({
 email: manualEmail,
 password: manualPassword,
 });
 if (error) {
 setManualError(error.message);
 return;
 }
 setStatus("manual");
 // Fetch current preferences
 const { data: prefs } = await supabase
 .from("email_preferences")
 .select("unsubscribed")
 .eq("email", manualEmail)
 .single();
 if (prefs) {
 setMarketing(!prefs.unsubscribed);
 }
 };

 const savePreferences = async () => {
 setSaving(true);
 const {
 data: { session },
 } = await supabase.auth.getSession();
 const userEmail = session?.user?.email || email;
 if (!userEmail) {
 setSaving(false);
 return;
 }
 await fetch("/api/unsubscribe", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 email: userEmail,
 token: token || "",
 marketing,
 productUpdates,
 }),
 });
 setSaving(false);
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 };

 return (
 <div className="min-h-screen bg-[var(--bg)] ">
 <Nav />
 <div className="max-w-2xl mx-auto px-6 py-16">
 {status === "loading" && (
 <div className="text-center py-20">
 <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
 </div>
 )}

 {status === "success" && (
 <div className="text-center py-20">
 <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg
 className="w-8 h-8 text-emerald-600"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M5 13l4 4L19 7"
 />
 </svg>
 </div>
 <h1 className="text-3xl font-bold text-[var(--text)] mb-3">
 You&apos;re unsubscribed
 </h1>
 <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">
 You will no longer receive marketing emails from Truzot.
 Transactional emails (order confirmations, delivery notifications)
 will continue.
 </p>
 <button
 onClick={() => {
 setStatus("manual");
 setMarketing(false);
 }}
 className="text-[var(--lime)] underline text-sm"
 >
 Manage other preferences →
 </button>
 </div>
 )}

 {status === "error" && (
 <div className="text-center py-20">
 <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg
 className="w-8 h-8 text-amber-600"
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
 />
 </svg>
 </div>
 <h1 className="text-3xl font-bold text-[var(--text)] mb-3">
 Invalid link
 </h1>
 <p className="text-[var(--text-muted)] mb-8">
 This unsubscribe link is invalid or expired. Sign in below to
 manage your preferences.
 </p>
 </div>
 )}

 {status === "manual" && (
 <div>
 <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
 Email Preferences
 </h1>
 <p className="text-[var(--text-muted)] mb-10">
 Control which emails you receive from Truzot.
 </p>

 <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] divide-y divide-slate-100 ">
 <div className="p-6 flex items-center justify-between">
 <div>
 <h3 className="font-bold text-[var(--text)]">
 Marketing emails
 </h3>
 <p className="text-sm text-[var(--text-muted)] mt-1">
 Tips, inspiration, and product announcements
 </p>
 </div>
 <button
 onClick={() => setMarketing(!marketing)}
 className={`relative w-12 h-7 rounded-full transition ${marketing ? "bg-[var(--lime)] text-black" : "bg-slate-300"}`}
 role="switch"
 aria-checked={marketing}
 aria-label="Toggle marketing emails"
 >
 <span
 className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${marketing ? "translate-x-5" : ""}`}
 />
 </button>
 </div>
 <div className="p-6 flex items-center justify-between">
 <div>
 <h3 className="font-bold text-[var(--text)]">
 Product updates
 </h3>
 <p className="text-sm text-[var(--text-muted)] mt-1">
 New features and improvements
 </p>
 </div>
 <button
 onClick={() => setProductUpdates(!productUpdates)}
 className={`relative w-12 h-7 rounded-full transition ${productUpdates ? "bg-[var(--lime)] text-black" : "bg-slate-300"}`}
 role="switch"
 aria-checked={productUpdates}
 aria-label="Toggle product updates"
 >
 <span
 className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${productUpdates ? "translate-x-5" : ""}`}
 />
 </button>
 </div>
 <div className="p-6">
 <p className="text-xs text-[var(--text-muted)] mb-4">
 Transactional emails (order confirmations, delivery
 notifications, password resets) cannot be disabled.
 </p>
 <button
 onClick={savePreferences}
 disabled={saving}
 className="px-6 py-2.5 bg-[var(--lime)] text-black text-[var(--text)] rounded-2xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
 >
 {saving ? "Saving..." : saved ? "Saved!" : "Save preferences"}
 </button>
 </div>
 </div>

 <div className="mt-8 text-center">
 <Link
 href="/"
 className="text-sm text-[var(--text-muted)] hover:text-slate-700"
 >
 ← Back to home
 </Link>
 </div>
 </div>
 )}
 </div>
 <Footer />
 </div>
 );
}

export default function UnsubscribePage() {
 return (
 <Suspense>
 <EmailPreferencesContent />
 </Suspense>
 );
}
