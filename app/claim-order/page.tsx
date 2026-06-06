"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

import { Suspense } from "react";

function ClaimOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignIn, setIsSignIn] = useState(false);

  const claimOrder = useCallback(
    async (userId: string) => {
      if (!orderId) return;

      const { error } = await supabase
        .from("orders")
        .update({ user_id: userId })
        .eq("id", orderId)
        .is("user_id", null);

      if (!error) {
        router.push(`/dashboard?order=${orderId}`);
      }
    },
    [orderId, router],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && orderId) {
        claimOrder(session.user.id);
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

      await claimOrder(data.user.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      await claimOrder(authData.user.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-slate-600">
              {isSignIn
                ? "Sign in to access your headshots and track your order."
                : "Create an account to access your headshots and track your order."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={isSignIn ? handleSignIn : handleCreateAccount}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignIn
                  ? "Sign In & View Headshots"
                  : "Create Account & View Headshots"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => setIsSignIn(!isSignIn)}
              className="text-blue-600 text-sm hover:text-blue-700 font-medium"
            >
              {isSignIn
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
            <div>
              <button
                onClick={() =>
                  orderId && router.push(`/dashboard?order=${orderId}`)
                }
                className="text-slate-500 text-sm hover:text-slate-700 underline"
              >
                Skip for now - View order as guest
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function ClaimOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ClaimOrderForm />
    </Suspense>
  );
}
