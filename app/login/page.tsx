"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

// Wrapper component with Suspense boundary (Required by Next.js for useSearchParams)
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

// Actual form logic
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (searchParams.get("confirmed") === "true" || session) {
        setSuccess("Email confirmed successfully! You can now sign in.");

        if (session) {
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
      }
    };

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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
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
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
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
          if (error.message.includes("Email not confirmed")) {
            setError(
              "Please confirm your email address. Check your inbox for the confirmation link.",
            );
            setEmailNotConfirmed(true);
          } else {
            setError(error.message);
          }
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (forgotPasswordMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <nav className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </nav>
        <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <Link href="/" className="inline-block mb-6">
                <div className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  TRUZOT
                </div>
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Reset your password
              </h1>
              <p className="text-slate-600">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
                <button
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </nav>

      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TRUZOT
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-slate-600">
              {isSignUp
                ? "Get started with professional AI headshots"
                : "Sign in to access your headshots"}
            </p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {emailNotConfirmed && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium">
                    Email not confirmed yet.
                  </p>
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline font-medium disabled:opacity-50"
                  >
                    {resending ? "Resending..." : "Resend confirmation email"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {!isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordMode(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Must be at least 6 characters
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Google OAuth */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full mt-4 flex items-center justify-center gap-3 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition"
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">or</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
                setEmailNotConfirmed(false);
              }}
              className="w-full py-3 text-sm text-slate-600 hover:text-slate-900 font-medium transition"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">🔒</div>
              <div className="text-xs text-slate-600">Secure</div>
            </div>
            <div>
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-xs text-slate-600">Fast</div>
            </div>
            <div>
              <div className="text-2xl mb-1">✓</div>
              <div className="text-xs text-slate-600">Private</div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-600">
            <p>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
