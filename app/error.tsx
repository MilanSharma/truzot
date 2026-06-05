"use client";
import Link from "next/link";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    try {
      const Sentry = require("@sentry/nextjs");
      Sentry.captureException(error);
    } catch {}
  }, [error]);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
      >
        Try Again
      </button>
      <Link href="/" className="mt-4 text-blue-600">
        Go Home
      </Link>
    </div>
  );
}
