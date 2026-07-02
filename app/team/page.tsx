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
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Request failed");
      }
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: "#07080A" }}>
      <Nav />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-white">
          Team Headshots, Unified Brand
        </h1>
        <p className="text-lg text-white/40 mb-10">
          Create consistent, professional headshots for your entire company.
        </p>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div
            className="border rounded-2xl p-6"
            style={{ background: "#0E1016", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-lg font-bold mb-2 text-white">Admin Dashboard</h3>
            <p className="text-sm text-white/40">
              Invite employees, set branding guidelines, track progress.
            </p>
          </div>
          <div
            className="border rounded-2xl p-6"
            style={{ background: "#0E1016", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-lg font-bold mb-2 text-white">Bulk Pricing</h3>
            <p className="text-sm text-white/40">
              Volume discounts starting at 10+ employees.
            </p>
          </div>
          <div
            className="border rounded-2xl p-6"
            style={{ background: "#0E1016", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <h3 className="text-lg font-bold mb-2 text-white">API & SSO</h3>
            <p className="text-sm text-white/40">
              Enterprise-grade security and automation.
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-6 bg-lime-400/10 border border-lime-400/20 rounded-2xl px-6 py-4 text-sm text-lime-400">
          Team features are available to all users — no Pro plan required.
        </div>

        {/* CTA section */}
        <div
          className="border rounded-2xl p-8"
          style={{ background: "#0E1016", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <h2 className="text-2xl font-bold mb-4 text-white">
            Start your team trial
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
            <input
              type="email"
              placeholder="Work email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="flex-1 px-4 py-3 rounded-2xl border text-white placeholder-white/25 focus:ring-2 focus:ring-lime-400/50 outline-none transition disabled:opacity-50"
              style={{
                background: "#0E1016",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            />
            <input
              type="text"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              disabled={status === "loading" || status === "success"}
              className="flex-1 px-4 py-3 rounded-2xl border text-white placeholder-white/25 focus:ring-2 focus:ring-lime-400/50 outline-none transition disabled:opacity-50"
              style={{
                background: "#0E1016",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            />
            <button
              onClick={handleRequestDemo}
              disabled={!email || status === "loading" || status === "success"}
              className="bg-lime-400 text-black px-6 py-3 rounded-2xl font-bold hover:bg-lime-300 transition disabled:opacity-50 shadow-lg shadow-lime-400/20"
            >
              {status === "loading" ? "Sending..." : "Request Demo"}
            </button>
          </div>
          {status === "success" && (
            <p className="text-lime-400 font-semibold mt-4">
              Thanks! We&apos;ll contact you shortly.
            </p>
          )}
          {status === "error" && (
            <p className="text-red-400 text-sm mt-2">{errorMsg}</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}