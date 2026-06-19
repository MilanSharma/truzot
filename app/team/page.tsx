"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function TeamPage() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRequestDemo = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/team-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: company || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">
          Team Headshots, Unified Brand
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10">
          Create consistent, professional headshots for your entire company.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              Admin Dashboard
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Invite employees, set branding guidelines, track progress.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              Bulk Pricing
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Volume discounts starting at 10+ employees.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              API & SSO
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enterprise-grade security and automation.
            </p>
          </div>
        </div>
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-6 py-4 text-sm text-emerald-800 dark:text-emerald-300">
          Team features are available to all users — no Pro plan required.
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
            Start your team trial
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
            <input
              type="email"
              placeholder="Work email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
            />
            <input
              type="text"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
            />
            <button
              onClick={handleRequestDemo}
              disabled={!email || status === "loading" || status === "success"}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Request Demo"}
            </button>
          </div>
          {status === "success" && (
            <p className="text-green-600 font-semibold mt-4">
              Thanks! We&apos;ll contact you shortly.
            </p>
          )}
          {status === "error" && (
            <p className="text-red-600 text-sm mt-2">{errorMsg}</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
