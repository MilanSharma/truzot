import Link from "next/link";
import { Database, CheckCircle, Shield, ArrowRight, Download } from "lucide-react";

export default function B2BHomepage() {
  const codeSnippet = `{
  "task_id": "DEVO-D1FCDF",
  "domain": "DevOps / GitHub REST API",
  "user_intent": "Squash and merge PR #114 after head branch conflict",
  "initial_tool_call": {
    "tool": "github_pulls_merge",
    "parameters": {"pull_number": 114, "merge_method": "squash"}
  },
  "error_encountered": {
    "status_code": 409,
    "error_type": "Conflict",
    "message": "Head branch was modified. Base branch requires PR update."
  },
  "recovery_reasoning": "Branch has diverged. Agent synchronizes head branch via fast-forward rebase before re-attempting squash merge.",
  "corrective_tool_call": {
    "tool": "github_pulls_update_branch",
    "parameters": {"pull_number": 114, "expected_head_sha": "d670460b"}
  },
  "subsequent_tool_call": {
    "tool": "github_pulls_merge",
    "parameters": {"pull_number": 114, "merge_method": "squash"}
  },
  "final_state": "SUCCESS: Branch synchronized and PR #114 squashed and merged."
}`;

  const valueProps = [
    {
      icon: CheckCircle,
      title: "100% Schema Validated",
      description: "Automated quality checks guarantee parseable JSONL. No malformed data, no cleaning required. Saves 20+ hours of data prep.",
    },
    {
      icon: Database,
      title: "Edge-Case Focused",
      description: "Built-in API error states and logical agent recovery paths. Real-world scenarios that are expensive to scrape or simulate.",
    },
    {
      icon: Shield,
      title: "Legally Safe & PII-Free",
      description: "100% synthetically generated, compliant with GDPR/DPDP. No privacy concerns. Ready for immediate deployment.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold text-[var(--text)] mb-6 leading-tight">
              Premium Synthetic Training Data for{" "}
              <span className="text-[var(--lime)]">Agentic AI</span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] mb-8 leading-relaxed">
              Stop agents from crash-looping on production APIs. Schema-validated, multi-turn error recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="https://huggingface.co/datasets/milansharma82/agentic-workflows-sample"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                <Download className="w-5 h-5" />
                Download Free Sample
              </Link>
              <a
                href="mailto:milan@truzot.com?subject=Custom%20Agentic%20Dataset%20Inquiry"
                className="inline-flex items-center justify-center gap-2 text-lg px-8 py-4 bg-[var(--surface2)] text-[var(--text)] font-semibold rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface3)] transition"
              >
                Request Custom Dataset
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Code Preview */}
      <section className="py-16 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
              Clean, Schema-Validated JSONL
            </h2>
            <p className="text-[var(--text-muted)]">
              See the quality of our data. Every record is validated, structured, and ready for training.
              Download the sample to verify the format yourself.
            </p>
          </div>
          <div className="bg-[#0D1117] rounded-2xl p-6 border border-[var(--border)] overflow-x-auto mb-6">
            <pre className="font-mono text-sm text-[#C9D1D9] whitespace-pre-wrap">
              <code>{codeSnippet}</code>
            </pre>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://huggingface.co/datasets/milansharma82/agentic-workflows-sample"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Sample Dataset
            </a>
            <span className="text-sm text-[var(--text-muted)]">64 verified trajectories • Full multi-turn schema • MIT License</span>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
              Why Truzot Data?
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              We understand the ML pipeline. We're builders, not just scrapers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => (
              <div
                key={index}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 hover:border-[var(--lime-border)] transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--lime-dim)] text-[var(--lime)] flex items-center justify-center mb-6 group-hover:scale-110 transition">
                  <prop.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-3">
                  {prop.title}
                </h3>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-16 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[var(--text)] mb-4">
            Calculate Your Time Savings
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-8">
            Building this data in-house takes significant engineering time. See what you save.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6">
              <div className="text-4xl font-bold text-[var(--lime)] mb-2">40+ hours</div>
              <div className="text-sm text-[var(--text-muted)]">Time to collect edge cases</div>
            </div>
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6">
              <div className="text-4xl font-bold text-[var(--lime)] mb-2">$5,000+</div>
              <div className="text-sm text-[var(--text-muted)]">Engineering cost at $125/hr</div>
            </div>
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6">
              <div className="text-4xl font-bold text-[var(--lime)] mb-2">$299</div>
              <div className="text-sm text-[var(--text-muted)]">Our standard dataset price</div>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            *Estimates based on typical senior ML engineer rates. Your actual costs may vary.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Designed for agents calling production APIs
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {["GitHub", "Stripe", "AWS", "HubSpot", "Slack", "Vercel"].map((name, index) => (
              <div key={index} className="text-2xl font-bold text-[var(--text-muted)]">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto">
          <a
            href="https://huggingface.co/datasets/milansharma82/agentic-workflows-sample"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 rounded-2xl border border-[var(--border)] hover:border-[var(--lime-border)] transition"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-8 h-8 text-[var(--lime)]" />
                <span className="text-lg font-semibold text-[var(--text)]">
                  Featured on Hugging Face
                </span>
              </div>
              <p className="text-[var(--text-muted)]">
                Our datasets are publicly available with full quality reports and validation metrics.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--lime)] text-white font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition">
              View on Hugging Face
              <ArrowRight className="w-4 h-4" />
            </div>
          </a>
        </div>
      </section>

      {/* Benchmark QA & Validation Report */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
              Benchmark QA & Validation Report
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Technical validation metrics for our agentic workflow datasets.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                metric: "100% Deterministic Schema",
                description: "Every record passes strict Pydantic and JSON-RPC schema verification. Guaranteed parseable JSON Lines with zero terminal escape artifacts.",
              },
              {
                metric: "Multi-Turn Remediation",
                description: "Includes initial failure state, technical diagnosis, corrective remediation call, and subsequent successful state for deep tool-use training.",
              },
              {
                metric: "15+ Production Environments",
                description: "Realistic error envelopes covering HTTP 409 concurrency locks, 412 ETag conflicts, 429 Retry-After backoffs, and OAuth token invalidations.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8"
              >
                <div className="text-2xl font-bold text-[var(--lime)] mb-4">
                  {item.metric}
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-[var(--text-muted)]">
              Common questions about our synthetic training data.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What makes your data different from scraped data?",
                a: "Our data is 100% synthetically generated using local LLMs with human verification. This means no PII, no legal concerns, and edge cases you can't easily scrape from real APIs.",
              },
              {
                q: "Can I use this data for commercial applications?",
                a: "Yes! All purchased datasets come with a commercial license. You can use them for fine-tuning, production models, and commercial applications.",
              },
              {
                q: "How do you ensure data quality?",
                a: "We use a multi-step pipeline: local LLM generation, regex cleaning to eliminate artifacts, automated schema validation, and human verification of edge cases.",
              },
              {
                q: "What format are the datasets in?",
                a: "All datasets are provided in JSONL format, which is the standard for ML training. Each line is a valid JSON object ready for fine-tuning.",
              },
              {
                q: "Can I request custom datasets?",
                a: "Absolutely! Use our custom data request form to describe your requirements. We'll work with you to build a dataset tailored to your domain and schema.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6"
              >
                <h3 className="font-semibold text-[var(--text)] mb-2">{faq.q}</h3>
                <p className="text-[var(--text-muted)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-4">
              Getting Started
            </h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              Three simple steps to get high-quality training data.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Download Sample",
                description: "Get our free sample from Hugging Face to test the data quality and format.",
              },
              {
                step: "2",
                title: "Purchase Dataset",
                description: "Choose from our catalog or request a custom dataset tailored to your needs.",
              },
              {
                step: "3",
                title: "Start Training",
                description: "Load the JSONL file and start fine-tuning your models immediately.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8"
              >
                <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-[var(--lime)] text-white flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-3 mt-4">
                  {item.title}
                </h3>
                <p className="text-[var(--text-muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-6">
            Ready to train better agents?
          </h2>
          <p className="text-lg text-[var(--text-muted)] mb-8">
            Download our free sample or request a custom dataset tailored to your use case.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://huggingface.co/datasets/milansharma82/agentic-workflows-sample"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4"
            >
              Browse Datasets
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="mailto:milan@truzot.com?subject=Custom%20Agentic%20Dataset%20Inquiry"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--surface2)] text-[var(--text)] font-semibold rounded-xl border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface3)] transition"
            >
              Get Custom Data
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
