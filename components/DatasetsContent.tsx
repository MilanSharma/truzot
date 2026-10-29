"use client";
import { Database, CheckCircle, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { useState } from "react";
import QualityReportModal from "@/components/QualityReportModal";

const datasets = [
  {
    id: "agentic-error-recovery",
    name: "Agentic AI Error-Recovery Dataset",
    description: "Comprehensive dataset covering API error states, rate limiting, timeout handling, and logical agent recovery paths across multiple domains. Perfect for training agents to handle failures gracefully.",
    domains: ["SaaS", "Healthcare", "Banking", "E-commerce"],
    format: "JSONL",
    size: "50 - 5,000+ records",
    useCases: [
      "Training retry logic in autonomous agents",
      "Building robust API integration workflows",
      "Teaching error recovery patterns to LLMs",
      "Fine-tuning models for production resilience"
    ],
    valueProp: "Saves 40+ hours of data cleaning and manual error case collection",
    pricing: [
      { tier: "Free Sample", price: "$0", features: ["64 verified trajectories", "Full multi-turn schema", "MIT License", "Full documentation"] },
      { tier: "Standard", price: "$299", features: ["1,000 records", "Commercial license", "Priority support", "Data dictionary", "Schema documentation"] },
      { tier: "Custom", price: "$499+", features: ["5,000+ records", "Custom schema", "Dedicated support", "Custom domains", "Extended validation"] },
    ],
    metrics: {
      schemaCompliance: "100%",
      terminalArtifacts: "0%",
      validation: "Automated + Human",
    },
  },
  {
    id: "api-rate-limiting",
    name: "API Rate-Limiting Dataset",
    description: "Focused dataset on rate limit scenarios, backoff strategies, retry patterns, and quota management for various API types. Essential for building resilient integrations.",
    domains: ["SaaS", "Finance", "Healthcare"],
    format: "JSONL",
    size: "100 - 3,000+ records",
    useCases: [
      "Training rate limit detection and handling",
      "Implementing exponential backoff strategies",
      "Building quota management systems",
      "Testing API resilience under load"
    ],
    valueProp: "Eliminates the need to simulate rate limit scenarios manually",
    pricing: [
      { tier: "Free Sample", price: "$0", features: ["100 records", "Public access", "Standard validation", "Full documentation"] },
      { tier: "Standard", price: "$199", features: ["1,000 records", "Commercial license", "Priority support", "Data dictionary", "Schema documentation"] },
      { tier: "Custom", price: "$399+", features: ["3,000+ records", "Custom schema", "Dedicated support", "Custom APIs", "Extended validation"] },
    ],
    metrics: {
      schemaCompliance: "100%",
      terminalArtifacts: "0%",
      validation: "Automated + Human",
    },
  },
  {
    id: "webhook-handling",
    name: "Webhook Event Handling Dataset",
    description: "Dataset covering webhook delivery, signature verification, retry logic, and event processing across popular services. Critical for building reliable webhook receivers.",
    domains: ["SaaS", "Payments", "E-commerce"],
    format: "JSONL",
    size: "75 - 2,500+ records",
    useCases: [
      "Building robust webhook receivers",
      "Testing signature verification implementations",
      "Training models to process webhook events",
      "Simulating webhook delivery scenarios"
    ],
    valueProp: "Includes real-world failure scenarios hard to reproduce in testing",
    pricing: [
      { tier: "Free Sample", price: "$0", features: ["75 records", "Public access", "Standard validation", "Full documentation"] },
      { tier: "Standard", price: "$249", features: ["1,000 records", "Commercial license", "Priority support", "Data dictionary", "Schema documentation"] },
      { tier: "Custom", price: "$449+", features: ["2,500+ records", "Custom schema", "Dedicated support", "Custom webhook providers", "Extended validation"] },
    ],
    metrics: {
      schemaCompliance: "100%",
      terminalArtifacts: "0%",
      validation: "Automated + Human",
    },
  },
  {
    id: "retry-patterns",
    name: "Retry Pattern Dataset",
    description: "Comprehensive retry strategies including exponential backoff, jitter, circuit breaker patterns, and failure recovery scenarios. The foundation of resilient distributed systems.",
    domains: ["Cloud Services", "Databases", "Microservices"],
    format: "JSONL",
    size: "100 - 4,000+ records",
    useCases: [
      "Training intelligent retry mechanisms",
      "Building circuit breaker implementations",
      "Simulating network failure scenarios",
      "Testing distributed system resilience"
    ],
    valueProp: "Would take 2 senior engineers 3+ weeks to replicate this dataset",
    pricing: [
      { tier: "Free Sample", price: "$0", features: ["100 records", "Public access", "Standard validation", "Full documentation"] },
      { tier: "Standard", price: "$279", features: ["1,500 records", "Commercial license", "Priority support", "Data dictionary", "Schema documentation"] },
      { tier: "Custom", price: "$529+", features: ["4,000+ records", "Custom schema", "Dedicated support", "Custom patterns", "Extended validation"] },
    ],
    metrics: {
      schemaCompliance: "100%",
      terminalArtifacts: "0%",
      validation: "Automated + Human",
    },
  },
];

export default function DatasetsContent() {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
            Dataset Catalog
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            Premium synthetic training data designed for Agentic AI workflows.
            Schema-validated, human-verified, and ready for fine-tuning.
          </p>
        </div>

        {/* Dataset Cards */}
        {datasets.map((dataset) => (
          <div
            key={dataset.id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 mb-8 hover:border-[var(--lime-border)] transition"
          >
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--lime-dim)] text-[var(--lime)] flex items-center justify-center">
                      <Database className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text)]">
                      {dataset.name}
                    </h2>
                  </div>
                </div>

                <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                  {dataset.description}
                </p>

                {/* Value Proposition */}
                <div className="bg-[var(--success-dim)] border border-[var(--success)]/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                    <span className="font-semibold text-[var(--text)]">Why This Dataset?</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{dataset.valueProp}</p>
                </div>

                {/* Use Cases */}
                <div className="mb-6">
                  <h4 className="font-semibold text-[var(--text)] mb-3">Use Cases</h4>
                  <ul className="space-y-2">
                    {dataset.useCases.map((useCase, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                        <CheckCircle className="w-4 h-4 text-[var(--lime)] flex-shrink-0 mt-0.5" />
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-[var(--text-muted)] mb-1">Domains</div>
                    <div className="text-[var(--text)] font-medium">
                      {dataset.domains.join(", ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-muted)] mb-1">Format</div>
                    <div className="text-[var(--text)] font-medium">{dataset.format}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-muted)] mb-1">Size</div>
                    <div className="text-[var(--text)] font-medium">{dataset.size}</div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-muted)] mb-1">Validation</div>
                    <div className="text-[var(--text)] font-medium">{dataset.metrics.validation}</div>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                    <span className="font-semibold text-[var(--text)]">Quality Metrics</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-[var(--text-muted)]">Schema Compliance</div>
                      <div className="text-[var(--success)] font-bold">{dataset.metrics.schemaCompliance}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">Terminal Artifacts</div>
                      <div className="text-[var(--success)] font-bold">{dataset.metrics.terminalArtifacts}</div>
                    </div>
                    <div>
                      <div className="text-[var(--text-muted)]">PII-Free</div>
                      <div className="text-[var(--success)] font-bold">100%</div>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-[var(--text)] mb-3">What's Included</h4>
                  <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--lime)]" />
                      Data dictionary and schema documentation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--lime)]" />
                      Quality validation report
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--lime)]" />
                      Commercial usage license
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--lime)]" />
                      Free updates for 30 days
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setSelectedDataset(dataset.name)}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Quality Report
                  </button>
                  <a
                    href="https://buy.stripe.com/28E4gA9Q09wrbzKai3cQU00"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Buy Standard License (${dataset.pricing.find(t => t.tier === "Standard")?.price.replace("$", "") || "299"})
                  </a>
                  <a
                    href="https://huggingface.co/datasets/milansharma82/agentic-workflows-sample"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--surface2)] text-[var(--text)] font-semibold rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface3)] transition"
                  >
                    Free Sample (Hugging Face)
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Pricing */}
              <div className="lg:w-80">
                <h3 className="font-semibold text-[var(--text)] mb-4">Pricing</h3>
                <div className="space-y-3">
                  {dataset.pricing.map((tier, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        tier.tier === "Standard"
                          ? "border-[var(--lime)] bg-[var(--lime-dim)]"
                          : "border-[var(--border)] bg-[var(--bg)]"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-[var(--text)]">{tier.tier}</span>
                        <span className="text-[var(--lime)] font-bold">{tier.price}</span>
                      </div>
                      <ul className="text-sm text-[var(--text-muted)] space-y-1">
                        {tier.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-[var(--success)]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {tier.tier === "Custom" && (
                        <a
                          href="https://buy.stripe.com/6oU4gAd2c8sn33e2PBcQU01"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[var(--lime)] font-semibold mt-3 hover:underline"
                        >
                          Order Custom License
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4">
            Need a specific niche?
          </h2>
          <p className="text-[var(--text-muted)] mb-6">
            We build custom datasets tailored to your domain, schema, and use case.
          </p>
          <a
            href="mailto:hello@truzot.com?subject=Custom%20Agentic%20Dataset%20Inquiry"
            className="btn-primary inline-flex items-center gap-2"
          >
            Request Custom Dataset
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>

      {selectedDataset && (
        <QualityReportModal
          isOpen={!!selectedDataset}
          onClose={() => setSelectedDataset(null)}
          datasetName={selectedDataset}
        />
      )}
    </>
  );
}
