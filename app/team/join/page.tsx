"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

function JoinContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setStatus("loading");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setStatus("error");
        setError("You must be signed in to accept this invite.");
        return;
      }
      const res = await fetch("/api/team/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join team");
      }
      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Join Team
        </h1>
        {status === "done" ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <p className="text-emerald-800 dark:text-emerald-300 font-bold text-lg">
              You&apos;ve joined the team!
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : status === "error" ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-800 dark:text-red-300 font-bold">{error}</p>
            <Link
              href="/"
              className="mt-6 inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition"
            >
              Go Home
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You&apos;ve been invited to join a Truzot team.
              {email && (
                <>
                  <br />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {email}
                  </span>
                </>
              )}
            </p>
            <button
              onClick={handleJoin}
              disabled={status === "loading" || !email}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Joining...
                </>
              ) : (
                "Accept Invite"
              )}
            </button>
            {!email && (
              <p className="text-sm text-slate-400 mt-4">
                Missing email parameter. Please use the link from your invite
                email.
              </p>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default function TeamJoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  );
}
