"use client";
import { Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
 CheckCircle,
 AlertCircle,
 Lock,
 Eye,
 EyeOff,
 ArrowLeft,
} from "lucide-react";

export default function ResetPasswordPage() {
 const router = useRouter();
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");
 const [loading, setLoading] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const [isDark, setIsDark] = useState(
 typeof document !== "undefined" &&
 document.documentElement.classList.contains("dark"),
 );

 const handleReset = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");
 setSuccess("");

 if (password.length < 6) {
 setError("Password must be at least 6 characters.");
 return;
 }
 if (password !== confirmPassword) {
 setError("Passwords do not match.");
 return;
 }

 setLoading(true);
 try {
 const { error } = await supabase.auth.updateUser({ password });
 if (error) {
 setError(error.message);
 } else {
 setSuccess("Password updated successfully! Redirecting...");
 setTimeout(() => router.push("/dashboard"), 2000);
 }
 } catch (err: any) {
 setError(err.message ?? "Failed to reset password.");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
 <nav className="bg-[var(--surface)] border-b border-[var(--border)]">
 <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
 <Link
 href="/"
 className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 -[var(--text-muted)] dark:text-white transition"
 >
 <ArrowLeft size={20} />
 <span className="font-medium">Back to Home</span>
 </Link>
 <div className="flex items-center gap-3">
 <button
 onClick={() => {
 const next = !isDark;
 document.documentElement.classList.toggle("dark", next);
 localStorage.setItem("theme", next ? "dark" : "light");
 setIsDark(next);
 }}
 className="text-slate-600 hover:text-slate-900 -[var(--text-muted)] dark:text-slate-200 transition"
 aria-label="Toggle dark mode"
 >
 {isDark ? <Moon size={18} /> : <Sun size={18} />}
 </button>
 </div>
 </div>
 </nav>

 <div className="flex-1 flex items-center justify-center px-6 py-12">
 <div className="max-w-md w-full">
 <div className="text-center mb-8">
 <Link href="/" className="inline-block mb-6">
 <div className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
 TRUZOT
 </div>
 </Link>
 <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
 Set new password
 </h1>
 <p className="text-[var(--text-muted)]">
 Choose a strong password for your account.
 </p>
 </div>

 {success && (
 <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
 <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
 <p className="text-sm text-green-800">{success}</p>
 </div>
 )}

 {error && (
 <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
 <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
 <p className="text-sm text-red-800">{error}</p>
 </div>
 )}

 <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-8">
 <form onSubmit={handleReset} className="space-y-5">
 <div>
 <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
 New password
 </label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
 <input
 type={showPassword ? "text" : "password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 minLength={6}
 className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-[var(--lime)]/30 focus:border-blue-500 outline-none transition"
 placeholder="New password"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-slate-600 dark:text-slate-300 transition"
 >
 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
 </button>
 </div>
 </div>
 <div>
 <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
 Confirm new password
 </label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 minLength={6}
 className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-[var(--lime)]/30 focus:border-blue-500 outline-none transition"
 placeholder="Confirm new password"
 />
 </div>
 </div>
 <button
 type="submit"
 disabled={loading}
 className="w-full bg-[var(--lime)] text-black text-white py-3 rounded-2xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
 >
 {loading ? "Updating..." : "Update password"}
 </button>
 </form>
 </div>

 <div className="mt-8 text-center text-sm text-[var(--text-muted)]">
 <Link href="/login" className="text-[var(--lime)] hover:underline">
 Back to sign in
 </Link>
 </div>
 </div>
 </div>
 </div>
 );
}
