import { Metadata } from "next";
import B2BNav from "@/components/B2BNav";
import B2BFooter from "@/components/B2BFooter";
import { CheckCircle, Shield, Database, Users, Code, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Quality Assurance — Truzot Data",
  description: "Enterprise synthetic API failure and recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience. 100% schema-validated.",
  openGraph: {
    title: "Quality Assurance — Truzot Data",
    description: "Enterprise synthetic API failure and recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience. 100% schema-validated.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quality Assurance — Truzot Data",
    description: "Enterprise synthetic API failure and recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience. 100% schema-validated.",
  },
};

export default function AboutPage() {
  const pipelineSteps = [
    {
      icon: Database,
      title: "Air-Gapped Sovereign Synthesis",
      description: "Zero-egress offline multi-agent generation pipeline ensuring mathematical data privacy, zero API key leakage, and deterministic seed constraints.",
    },
    {
      icon: Code,
      title: "Deterministic AST & Token Sanitization",
      description: "Custom Abstract Syntax Tree (AST) validation and terminal escape parsers strip invisible ANSI artifacts, normalizing JSONL payloads into strict POSIX-compliant formats.",
    },
    {
      icon: CheckCircle,
      title: "Schema Validation",
      description: "Automated Pydantic v2 and JSON-RPC schema verification. Enforces concrete tool calling parameters, error envelopes, and remediation traces.",
    },
    {
      icon: Users,
      title: "Human Verification",
      description: "Domain expert validation auditing edge-case logic, parameter continuity across turns, and recovery plausibility.",
    },
  ];

  const qualityMetrics = [
    {
      label: "Schema Compliance",
      value: "100%",
      description: "Every record passes strict schema validation",
    },
    {
      label: "Terminal Artifacts",
      value: "0%",
      description: "Zero ANSI escape sequences or formatting issues",
    },
    {
      label: "PII-Free",
      value: "100%",
      description: "No personally identifiable information",
    },
    {
      label: "Human Verified",
      value: "Yes",
      description: "Domain expert review of all edge cases",
    },
  ];

  return (
    <div className="min-h-screen">
      <B2BNav />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
              Quality Assurance
            </h1>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Our rigorous multi-step pipeline ensures every dataset meets enterprise standards.
              From generation to validation, quality is built into every record.
            </p>
          </div>

          {/* Pipeline Steps */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-8 text-center">
              Data Pipeline
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pipelineSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 relative"
                >
                  <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-[var(--lime)] text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--lime-dim)] text-[var(--lime)] flex items-center justify-center mb-4 mt-4">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-8 text-center">
              Quality Metrics
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {qualityMetrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-center"
                >
                  <div className="text-3xl font-bold text-[var(--lime)] mb-2">
                    {metric.value}
                  </div>
                  <div className="text-sm font-semibold text-[var(--text)] mb-2">
                    {metric.label}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {metric.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why It Matters */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--success-dim)] text-[var(--success)] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text)] mb-2">
                    Why Quality Matters
                  </h3>
                  <p className="text-[var(--text-muted)] leading-relaxed">
                    Poor-quality training data leads to models that hallucinate, fail on edge cases, and can't handle real-world errors.
                    Our quality-first approach ensures your agents are trained on clean, validated, and realistic data.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--text)] mb-1">
                      Schema Compliance
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Every record matches the expected schema, preventing parse errors during training.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--text)] mb-1">
                      No Terminal Artifacts
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      ANSI escape sequences and hidden characters are stripped for clean, POSIX-compliant JSONL.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--text)] mb-1">
                      Realistic Error Scenarios
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Edge cases are based on real API failures, not synthetic guesses.
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--text)] mb-1">
                      Multi-Turn Validation
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Recovery trajectories are validated for logical consistency across tool calls.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <B2BFooter />
    </div>
  );
}
