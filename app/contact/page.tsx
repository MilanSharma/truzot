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
    <div
      id="main-content"
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
    >
      <Nav />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">
          Contact Us
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 font-light">
          Have a question, need a refund, or just want to say hello? We&apos;re
          here to help.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <div className="text-blue-600 text-3xl mb-4">📧</div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
              Email Support
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
              For order inquiries, refunds, or technical issues.
            </p>
            <a
              href="mailto:hello@truzot.com"
              className="text-blue-600 font-semibold hover:underline"
            >
              hello@truzot.com
            </a>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <div className="text-blue-600 text-3xl mb-4">⏱️</div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
              Support Hours
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
              We typically respond within a few hours.
            </p>
            <div className="font-semibold text-slate-900 dark:text-white">
              Mon - Fri: 9 AM - 5 PM EST
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
            Send us a message
          </h2>
          {status === "sent" ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-green-800 dark:text-green-300 font-semibold">
                Message sent! We&apos;ll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="e.g. Refund request"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Order ID (optional)
                </label>
                <input
                  type="text"
                  value={form.orderId}
                  onChange={(e) =>
                    setForm({ ...form, orderId: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="e.g. TRU-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition resize-y"
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>
              {status === "error" && (
                <p className="text-red-600 text-sm">
                  Failed to send. Please email us directly at hello@truzot.com.
                </p>
              )}
            </form>
          )}
        </div>

        <div className="bg-blue-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">
            Need immediate help with an order?
          </h3>
          <p className="text-blue-100 mb-6">
            Please include your Order ID so we can assist you faster.
          </p>
          <a
            href="mailto:hello@truzot.com?subject=Help%20with%20my%20Order"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition"
          >
            Contact Support →
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
