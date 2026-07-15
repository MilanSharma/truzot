"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  CheckCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  User,
  Loader2,
} from "lucide-react";
import Nav from "@/components/Nav";

function ClaimOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignIn, setIsSignIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const isValidUuid =
    orderId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderId,
    );

  const claimOrder = useCallback(async () => {
    if (!orderId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Please sign in first.");
      setIsCheckingSession(false);
      return;
    }

    const res = await fetch("/api/claim-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ orderId }),
    });

    const body = await res.json().catch(() => ({})) as { isOwner?: boolean; error?: string };
    if (!res.ok) {
      if (body.isOwner) {
        router.push(`/dashboard?order=${orderId}`);
        return;
      }
      setError(body.error || "Failed to claim order.");
      setIsCheckingSession(false);
    } else {
      router.push(`/dashboard?order=${orderId}`);
    }
  }, [orderId, router, setError, setIsCheckingSession]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && orderId) {
        claimOrder();
      } else {
        setIsCheckingSession(false);
      }
    });
  }, [orderId, claimOrder]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) throw signInError;
      if (!data.user) throw new Error("Failed to sign in");

      await claimOrder();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/claim-order?order=${orderId}`,
        },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message ?? "Google sign-in failed");
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const body = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Failed to create account");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      await claimOrder();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Nav />
      <div className="max-w-md mx-auto px-6 py-12 md:py-20">
        {isCheckingSession ? (
          <div
            className="rounded-2xl border p-10 shadow-2xl text-center flex flex-col items-center justify-center min-h-[400px] bg-[var(--surface)] border-[var(--border)]"
          >
            <div className="w-8 h-8 border-4 border-[var(--lime)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Verifying secure link...
            </p>
          </div>
        ) : !isValidUuid ? (
          <div
            className="rounded-2xl border p-10 shadow-2xl text-center bg-[var(--surface)] border-[var(--border)]"
          >
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Invalid Link</h2>
            <p className="text-[var(--text-muted)]">
              This order link is invalid or missing. Please check the URL and try again.
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl border p-8 shadow-2xl bg-[var(--surface)] border-[var(--border)]"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--lime-dim)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[var(--lime-text)]" />
              </div>
              <h1 className="text-2xl font-black text-[var(--text)] mb-2">Payment Successful!</h1>
              <p className="text-[var(--text-muted)] text-sm">
                {isSignIn
                  ? "Sign in to access your headshots and track your order."
                  : "Create an account to access your headshots and track your order."}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-2xl text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <form
              onSubmit={isSignIn ? handleSignIn : handleCreateAccount}
              className="space-y-4"
            >
              {!isSignIn && (
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-[var(--lime)]/50 focus:border-[var(--lime)]/50 outline-none transition bg-[var(--bg)] border-[var(--border)]"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-[var(--lime)]/50 focus:border-[var(--lime)]/50 outline-none transition bg-[var(--bg)] border-[var(--border)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-[var(--lime)]/50 focus:border-[var(--lime)]/50 outline-none transition bg-[var(--bg)] border-[var(--border)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {!isSignIn && (
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-faint)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-[var(--lime)]/50 focus:border-[var(--lime)]/50 outline-none transition bg-[var(--bg)] border-[var(--border)]"
                    />
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--lime)] text-[var(--lime-on)] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition disabled:opacity-50 shadow-lg shadow-[var(--shadow-lime)]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSignIn ? (
                  "Sign In & View Headshots"
                ) : (
                  "Create Account & View Headshots"
                )}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-[var(--text-muted)] bg-[var(--surface)]">
                  or
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 border border-[var(--border)] rounded-2xl font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface2)] transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  setIsSignIn(!isSignIn);
                  setError("");
                }}
                className="text-[var(--lime-text)] hover:brightness-110 text-sm font-medium transition"
              >
                {isSignIn
                  ? "Don't have an account? Create one"
                  : "Already have an account? Sign in"}
              </button>
              <button
                onClick={() => orderId && router.push(`/dashboard?order=${orderId}`)}
                className="text-[var(--text-muted)] text-sm hover:text-[var(--text)] underline transition"
              >
                Skip for now — view your order as a guest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClaimOrderPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center bg-[var(--bg)]"
        >
          <div className="w-8 h-8 border-4 border-[var(--lime)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ClaimOrderForm />
    </Suspense>
  );
}