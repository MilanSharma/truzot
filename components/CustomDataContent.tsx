"use client";

import { Database, Send, CheckCircle, ArrowRight, Zap, Shield, Users } from "lucide-react";
import { useState } from "react";

export default function CustomDataContent() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    requirements: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fallback to mailto since no backend is configured
    const subject = encodeURIComponent("Custom Agentic Dataset Inquiry");
    const body = encodeURIComponent(
      `Name: ${formData.name}\nCompany: ${formData.company}\nEmail: ${formData.email}\n\nRequirements:\n${formData.requirements}`
    );
    window.location.href = `mailto:hello@truzot.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const steps = [
    {
      icon: Database,
      title: "1. Define Your Schema",
      description: "Tell us your data structure, domain, and specific requirements. We'll work with you to ensure the schema meets your needs.",
    },
    {
      icon: Zap,
      title: "2. We Generate & Verify",
      description: "Our human-in-the-loop pipeline generates synthetic data with rigorous validation. Every record is checked for quality and compliance.",
    },
    {
      icon: Send,
      title: "3. You Receive Clean Data",
      description: "Get a licensed JSONL file ready for immediate fine-tuning. Full documentation and quality report included.",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
          Need a Specific Niche? We Build It.
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
          Custom synthetic datasets tailored to your domain, schema, and use case.
          From edge cases to complex workflows, we've got you covered.
        </p>
      </div>

      {/* Process Steps */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 relative"
          >
            <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-[var(--lime)] text-white flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="w-12 h-12 rounded-xl bg-[var(--lime-dim)] text-[var(--lime)] flex items-center justify-center mb-6 mt-4">
              <step.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-3">
              {step.title}
            </h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--success-dim)] text-[var(--success)] flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-2">Privacy-First</h3>
            <p className="text-sm text-[var(--text-muted)]">
              100% synthetic data. No PII, no real user data, fully compliant with GDPR/DPDP.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--success-dim)] text-[var(--success)] flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-2">Quality Guaranteed</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Human-in-the-loop validation ensures 100% schema compliance and zero terminal artifacts.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--success-dim)] text-[var(--success)] flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text)] mb-2">Dedicated Support</h3>
            <p className="text-sm text-[var(--var(--text-muted)]">
              Work directly with our team to iterate on schema, edge cases, and data requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[var(--success-dim)] text-[var(--success)] flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text)] mb-4">
                Request Received
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Thanks for your interest! We'll review your requirements and get back to you within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-[var(--lime)] hover:underline"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[var(--text)] mb-6">
                Request Custom Dataset
              </h2>
              <div className="bg-[var(--success-dim)] border border-[var(--success)]/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-[var(--success)] font-medium">
                  🔒 Strict Enterprise NDA Available Upon Request • Guaranteed 24-48h Delivery
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition"
                    placeholder="Your company"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-[var(--text)] mb-2">
                    Data Requirements *
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    required
                    value={formData.requirements}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--lime)] transition resize-none"
                    placeholder="Describe your data needs: domain, schema, use case, edge cases, record count, etc."
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    E.g., 500 error-recovery trajectories for Stripe Billing and Salesforce CRM OpenAPI specs.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary inline-flex items-center justify-center gap-2 py-4"
                >
                  Submit Request
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {/* Direct Email Fallback */}
              <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
                <p className="text-sm text-[var(--text-muted)] mb-3">
                  Prefer direct email? Send your OpenAPI/Swagger spec to{" "}
                  <a
                    href="mailto:hello@truzot.com?subject=Custom%20Agentic%20Dataset%20Inquiry"
                    className="text-[var(--lime)] font-semibold hover:underline"
                  >
                    hello@truzot.com
                  </a>{" "}
                  for a quote in 2 hours.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
