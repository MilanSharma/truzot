"use client";
import { useState, useEffect, Suspense } from "react";
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
  Sparkles,
  Zap,
  Shield,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) router.replace("/dashboard");
    };
    checkSession();
  }, [router]);

  const handleResendConfirmation = async () => {
    setResending(true);
    setResendError("");
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) setResendError(error.message);
      else {
        setSuccess("New confirmation email sent! Check your inbox.");
        setEmailNotConfirmed(false);
      }
    } catch (err: any) {
      setResendError(err.message ?? "Failed to resend confirmation");
    } finally {
      setResending(false);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Please enter your email address.");
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) setError(data.error || "Failed to send reset link.");
      else {
        setSuccess("Check your email for a password reset link.");
        setForgotPasswordMode(false);
      }
    } catch (err: any) {
      setError("Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Signup failed");
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInErr) throw signInErr;
          window.location.href = "/dashboard";
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
            throw error;
          }
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: "#07080A" }}
    >
      {/* Background grid – same as landing page */}
      <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 gap-1 opacity-20 pointer-events-none">
        {[
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop",
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop",
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop",
          "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80&fit=crop",
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop",
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop",
        ].map((src, i) => (
          <div key={i} className="relative overflow-hidden">
            <Image
              src={src}
              alt=""
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
        ))}
      </div>
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#07080A]/60 via-[#07080A]/80 to-[#07080A]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07080A]/80 via-transparent to-[#07080A]/80" />

      {/* Left side – Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full mx-auto"
        >
          <motion.div variants={itemVariants}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition mb-10 text-sm font-semibold"
            >
              <ArrowLeft size={16} /> Back to home
            </Link>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={
                forgotPasswordMode ? "forgot" : isSignUp ? "signup" : "signin"
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-black text-white tracking-tight mb-3">
                {forgotPasswordMode
                  ? "Reset password"
                  : isSignUp
                    ? "Create an account"
                    : "Welcome back."}
              </h1>
              <p className="text-white/40 text-lg">
                {forgotPasswordMode
                  ? "Enter your email to receive a reset link."
                  : isSignUp
                    ? "Get started with professional AI headshots."
                    : "Sign in to access your headshots and dashboard."}
              </p>
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-lime-400/10 border border-lime-400/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-lime-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-lime-300">{success}</p>
            </motion.div>
          )}

          {emailNotConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-300">
                  Email not confirmed yet.
                </p>
                <button
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="mt-2 text-sm text-lime-400 hover:text-lime-300 underline font-bold disabled:opacity-50"
                >
                  {resending ? "Resending..." : "Resend confirmation email"}
                </button>
                {resendError && (
                  <p className="text-xs text-red-400 mt-2">{resendError}</p>
                )}
              </div>
            </motion.div>
          )}

          <form
            onSubmit={forgotPasswordMode ? handleForgotPassword : handleSubmit}
            className="space-y-5"
          >
            {isSignUp && !forgotPasswordMode && (
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-bold text-white/60 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                    style={{
                      background: "#0E1016",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    placeholder="John Doe"
                  />
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <label className="block text-sm font-bold text-white/60 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                  style={{
                    background: "#0E1016",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </motion.div>

            {!forgotPasswordMode && (
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-white/60">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setForgotPasswordMode(true)}
                      className="text-xs font-bold text-lime-400 hover:text-lime-300 transition"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/25" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 rounded-2xl text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
                    style={{
                      background: "#0E1016",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-lime-400 text-black py-4 rounded-2xl font-bold text-base hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {forgotPasswordMode
                      ? "Send Reset Link"
                      : isSignUp
                        ? "Create account"
                        : "Sign in"}
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {!forgotPasswordMode && (
            <>
              <motion.div variants={itemVariants} className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-white/40 bg-[#07080A] font-bold uppercase tracking-wider text-[10px]">
                    or continue with
                  </span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border border-white/10 rounded-2xl font-bold text-white/70 hover:bg-white/5 transition"
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
              </motion.div>
            </>
          )}

          <motion.div
            variants={itemVariants}
            className="mt-8 text-center text-sm text-white/30 font-semibold"
          >
            {forgotPasswordMode ? (
              <button
                onClick={() => setForgotPasswordMode(false)}
                className="text-white/60 hover:text-white transition"
              >
                Back to sign in
              </button>
            ) : isSignUp ? (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-lime-400 hover:underline"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-lime-400 hover:underline"
                >
                  Sign up
                </button>
              </p>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Right side – Hero card */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-lg w-full"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-lime-400/10 to-indigo-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-[#0E1016] border border-white/10 rounded-3xl p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-lime-400/10 border border-lime-400/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-lime-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-lime-400 uppercase tracking-widest">
                  Truzot AI
                </p>
                <p className="text-white/40 text-sm">
                  Professional headshots in minutes
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  text: "As few as 2 selfies needed",
                  color: "#A3E635",
                },
                { icon: Shield, text: "AES-256 encrypted", color: "#6366F1" },
                {
                  icon: CheckCircle,
                  text: "30-day money-back guarantee",
                  color: "#A3E635",
                },
              ].map(({ icon: Icon, text, color }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                  <span className="text-white/70 text-sm font-medium">
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen" style={{ background: "#07080A" }} />
      }
    >
      <LoginContent />
    </Suspense>
  );
}
