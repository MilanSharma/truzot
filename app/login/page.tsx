"use client";
import { useState, useEffect, Suspense } from "react";
import { Sun, Moon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Star,
} from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash && window.location.pathname === "/") {
        window.location.reload();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleOAuthError = () => {
      const oauthError = searchParams.get("error");
      const oauthErrorDesc = searchParams.get("error_description");
      if (oauthError) {
        setError(oauthErrorDesc ?? oauthError);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("error");
        cleanUrl.searchParams.delete("error_description");
        cleanUrl.searchParams.delete("error_code");
        window.history.replaceState({}, "", cleanUrl.toString());
      }
    };

    const checkEmailConfirmation = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsRedirecting(true);
        const nextParam = searchParams.get("next") || "/dashboard";
        router.replace(nextParam);
        return;
      }

      if (searchParams.get("confirmed") === "true") {
        setSuccess("Email confirmed successfully! You can now sign in.");
      }
      setIsCheckingSession(false);
    };

    handleOAuthError();
    checkEmailConfirmation();
  }, [router, searchParams]);

  const handleResendConfirmation = async () => {
    setResending(true);
    setError("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("New confirmation email sent! Check your inbox.");
        setEmailNotConfirmed(false);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to resend confirmation");
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset link.");
      } else {
        setSuccess("Check your email for a password reset link.");
        setForgotPasswordMode(false);
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const nextParam = searchParams.get("next") || "";
      const redirectTo =
        `${window.location.origin}/login` +
        (nextParam ? `?next=${encodeURIComponent(nextParam)}` : "");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message ?? "Google sign-in failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setEmailNotConfirmed(false);
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Signup failed");
        } else {
          setSuccess(
            "Check your email to confirm your account! We've sent you a confirmation link from hello@truzot.com.",
          );
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (
            error.message.includes("Email not confirmed") ||
            error.message.includes("Invalid API key")
          ) {
            setError(
              "Please confirm your email address. Check your inbox for the confirmation link.",
            );
            setEmailNotConfirmed(true);
          } else {
            setError(error.message);
          }
        } else {
          setIsRedirecting(true);
          const nextParam = searchParams.get("next") || "/dashboard";
          router.replace(nextParam);
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDark = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      {/* Left Pane (Form) */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 relative bg-white dark:bg-[#0b0d10] z-10 transition-colors duration-300">
        {/* Navbar overlaying the left side */}
        <nav className="absolute top-0 left-0 w-full px-6 lg:px-20 py-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition font-semibold text-sm tracking-wide"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <button
            onClick={toggleDark}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </nav>

        <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Link href="/" className="inline-block mb-10">
            <div className="text-3xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TRUZOT
            </div>
          </Link>

          {isRedirecting || isCheckingSession ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-slate-500 font-medium">
                Verifying session...
              </p>
            </div>
          ) : forgotPasswordMode ? (
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Reset password
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                Enter your email and we&apos;ll send you a secure reset link.
              </p>

              {success && (
                <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    {success}
                  </p>
                </div>
              )}
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13161c] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-lg disabled:opacity-50 active:scale-[0.98]"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full py-3 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                  {isSignUp
                    ? "Get started with professional AI headshots."
                    : "Sign in to securely access your studio dashboard."}
                </p>

                {success && (
                  <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      {success}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}

                {emailNotConfirmed && (
                  <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Email not confirmed yet.
                      </p>
                      <button
                        onClick={handleResendConfirmation}
                        disabled={resending}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-bold disabled:opacity-50"
                      >
                        {resending
                          ? "Resending..."
                          : "Resend confirmation email"}
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {isSignUp && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13161c] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13161c] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {!isSignUp && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotPasswordMode(true)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-12 pr-12 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13161c] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {isSignUp && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full pl-12 pr-12 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13161c] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Must be at least 6 characters
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full pl-12 pr-12 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#13161c] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-medium"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-lg disabled:opacity-50 active:scale-[0.98] mt-2"
                  >
                    {loading
                      ? isSignUp
                        ? "Creating account..."
                        : "Signing in..."
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-[#0b0d10] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      or continue with
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition active:scale-[0.98]"
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
                  Google
                </button>

                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setSuccess("");
                    setEmailNotConfirmed(false);
                  }}
                  className="w-full mt-6 py-3 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </button>
              </div>

              <p className="mt-8 text-center text-xs text-slate-400 font-medium">
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Privacy Policy
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right Pane (Image + Testimonial overlay) */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1500&auto=format&fit=crop"
          alt="Studio photography"
          fill
          className="object-cover opacity-50 mix-blend-overlay pointer-events-none"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex gap-1 text-amber-400 mb-6">
            <Star size={20} className="fill-current" />
            <Star size={20} className="fill-current" />
            <Star size={20} className="fill-current" />
            <Star size={20} className="fill-current" />
            <Star size={20} className="fill-current" />
          </div>
          <p className="text-2xl font-medium text-white leading-relaxed mb-8">
            &ldquo;The fastest way to achieve a premium professional brand.
            Truzot saved us thousands on corporate photography while delivering
            objectively better results.&rdquo;
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 relative">
              <Image
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=100&q=80"
                alt="CEO"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                James Sterling <CheckCircle className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-sm text-slate-300 font-medium">
                CEO @ Horizon Ventures
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
