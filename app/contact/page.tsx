"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    orderId: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          orderId: form.orderId || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-[var(--text)]">
          Contact Us
        </h1>
        <p className="text-lg text-[var(--text-muted)] mb-10 font-light">
          Have a question, need a refund, or just want to say hello? We’re here to help.
        </p>

        {/* Contact cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div
            className="border rounded-2xl p-8"
            
          >
            <div className="text-3xl mb-4">📧</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Email Support</h3>
            <p className="text-[var(--text-muted)] mb-4 text-sm">
              For order inquiries, refunds, or technical issues.
            </p>
            <a
              href="mailto:hello@truzot.com"
              className="text-lime-400 font-semibold hover:underline"
            >
              hello@truzot.com
            </a>
          </div>
          <div
            className="border rounded-2xl p-8"
            
          >
            <div className="text-3xl mb-4">⏱️</div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Support Hours</h3>
            <p className="text-[var(--text-muted)] mb-4 text-sm">
              We typically respond within a few hours.
            </p>
            <div className="font-semibold text-[var(--text)]">Mon - Fri: 9 AM - 5 PM EST</div>
          </div>
        </div>

        {/* Form */}
        <div
          className="border rounded-2xl p-8 mb-8"
          
        >
          <h2 className="text-2xl font-bold mb-6 text-[var(--text)]">
            Send us a message
          </h2>
          {status === "sent" ? (
            <div className="bg-lime-400/10 border border-lime-400/20 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lime-400 font-semibold">
                Message sent! We’ll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-lime-400/50 outline-none transition"
                    style={{
                      background: "#0E1016",
                      borderColor: "rgba(255,255,255,0.07)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-lime-400/50 outline-none transition"
                    style={{
                      background: "#0E1016",
                      borderColor: "rgba(255,255,255,0.07)",
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-lime-400/50 outline-none transition"
                  placeholder="e.g. Refund request"
                  style={{
                    background: "#0E1016",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">
                  Order ID (optional)
                </label>
                <input
                  type="text"
                  value={form.orderId}
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-lime-400/50 outline-none transition"
                  placeholder="e.g. TRU-12345"
                  style={{
                    background: "#0E1016",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-1">
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border text-[var(--text)] placeholder-[var(--text-faint)] focus:ring-2 focus:ring-lime-400/50 outline-none transition resize-y"
                  style={{
                    background: "#0E1016",
                    borderColor: "rgba(255,255,255,0.07)",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="bg-lime-400 text-black px-8 py-3 rounded-2xl font-bold hover:bg-lime-300 transition disabled:opacity-50 shadow-lg shadow-lime-400/20"
              >
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>
              {status === "error" && (
                <p className="text-red-400 text-sm">
                  Failed to send. Please email us directly at hello@truzot.com.
                </p>
              )}
            </form>
          )}
        </div>

        {/* Bottom CTA */}
        <div
          className="border rounded-2xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(163,230,53,0.08) 0%, rgba(99,102,241,0.05) 100%)",
            borderColor: "rgba(163,230,53,0.15)",
          }}
        >
          <h3 className="text-2xl font-bold mb-3 text-[var(--text)]">
            Need immediate help with an order?
          </h3>
          <p className="text-[var(--text-muted)] mb-6">
            Please include your Order ID so we can assist you faster.
          </p>
          <a
            href="mailto:hello@truzot.com?subject=Help%20with%20my%20Order"
            className="inline-block bg-lime-400 text-black px-8 py-3 rounded-2xl font-bold hover:bg-lime-300 transition shadow-lg shadow-lime-400/20"
          >
            Contact Support →
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}