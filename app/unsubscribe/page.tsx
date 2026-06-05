"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    email && token ? "loading" : "error",
  );

  useEffect(() => {
    if (!email || !token) return;
    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    })
      .then((r) => {
        if (r.ok) setStatus("success");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [email, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        {status === "loading" && (
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        )}
        {status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              You&apos;re unsubscribed
            </h1>
            <p className="text-slate-500 mb-6">
              You will no longer receive marketing emails from Truzot.
              Transactional emails (order confirmations, delivery notifications)
              will continue.
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-blue-600 underline"
            >
              Return home
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-500 mb-6">
              Invalid unsubscribe link. Please contact{" "}
              <a
                href="mailto:hello@truzot.com"
                className="text-blue-600 underline"
              >
                hello@truzot.com
              </a>{" "}
              to be manually removed.
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-blue-600 underline"
            >
              Return home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
