"use client";
import { useState } from "react";
import { Mail, Clock, CheckCircle, Send } from "lucide-react";

export default function ContactContent() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <main className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Have questions about our datasets, need custom data, or want to explore partnerships?
            We're here to help.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--lime-dim)] text-[var(--lime)] flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Email</h3>
            <p className="text-[var(--text-muted)] mb-4 text-sm">
              For general inquiries, dataset questions, or custom data requests.
            </p>
            <a
              href="mailto:milan@truzot.com?subject=Custom%20Agentic%20Dataset%20Inquiry"
              className="text-[var(--lime)] font-semibold hover:underline"
            >
              milan@truzot.com
            </a>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--lime-dim)] text-[var(--lime)] flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Response Time</h3>
            <p className="text-[var(--text-muted)] mb-4 text-sm">
              We typically respond within 24 hours for inquiries.
            </p>
            <div className="font-semibold text-[var(--text)]">Mon - Fri: 9 AM - 6 PM EST</div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-[var(--text)]">
            Send us a message
          </h2>
          {status === "sent" ? (
            <div className="bg-[var(--success-dim)] border border-[var(--success)]/20 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--success-dim)] text-[var(--success)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-[var(--success)] font-semibold text-lg">
                Message sent! We'll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition"
                  placeholder="e.g. Custom dataset inquiry"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Message *
                </label>
                <textarea
                  rows={5}
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition resize-none"
                  placeholder="Tell us about your data needs..."
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full btn-primary inline-flex items-center justify-center gap-2 py-4"
              >
                {status === "sending" ? "Sending..." : (
                  <>
                    Send Message
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
              {status === "error" && (
                <p className="text-[var(--error)] text-sm text-center">
                  Failed to send. Please email us directly at milan@truzot.com.
                </p>
              )}
            </form>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-3 text-[var(--text)]">
            Need custom data?
          </h3>
          <p className="text-[var(--text-muted)] mb-6">
            Describe your requirements and we'll build a dataset tailored to your needs.
          </p>
          <a
            href="mailto:milan@truzot.com?subject=Custom%20Agentic%20Dataset%20Inquiry"
            className="btn-primary inline-flex items-center gap-2"
          >
            Request Custom Dataset
            <Send className="w-5 h-5" />
          </a>
        </div>
      </div>
    </main>
  );
}
