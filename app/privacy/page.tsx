import { Metadata } from "next";
import B2BNav from "@/components/B2BNav";
import B2BFooter from "@/components/B2BFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Truzot",
  description: "How Truzot collects, processes, and protects your data. Privacy-first synthetic training data.",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <B2BNav />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-[var(--text)]">
            Privacy Policy
          </h1>
          <p className="text-[var(--text-muted)] mb-8">Last updated: January 2026</p>

          <div className="space-y-6 text-[var(--text-muted)] leading-relaxed">
            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              1. Information We Collect
            </h2>
            <p>
              <strong className="text-[var(--text)]">Contact information:</strong>{" "}
              When you request custom datasets or contact us, we collect your name, email,
              company, and data requirements. This information is used solely to fulfill
              your request and provide support.
            </p>
            <p>
              <strong className="text-[var(--text)]">Payment information:</strong>{" "}
              We process payments through Stripe. We never store or have access to your
              full credit card numbers. Stripe retains payment records per their policies.
            </p>
            <p>
              <strong className="text-[var(--text)]">Usage data:</strong>{" "}
              We use Vercel Analytics for anonymous usage metrics. No personal data is
              tied to analytics events.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              2. Synthetic Data Nature
            </h2>
            <p>
              All datasets provided by Truzot are <strong className="text-[var(--text)]">100% synthetically generated</strong>.
              We do not use real user data, PII, or scraped content in our datasets. Our
              synthetic data is created using local LLMs and human verification processes
              to ensure quality and compliance.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              3. How We Use Your Data
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill custom dataset requests</li>
              <li>Communicate about your orders and requests</li>
              <li>Process payments through Stripe</li>
              <li>Improve our services through aggregated analytics</li>
              <li>Provide customer support</li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              4. Data Retention & Deletion
            </h2>
            <p>
              We retain contact information and communication history for as long as necessary
              to provide our services and comply with legal obligations. You may request
              deletion of your data by contacting hello@truzot.com. We respond within 30 days.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              5. Third-Party Services
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Stripe</strong> — Payment processing. Truzot never sees your full
                card number.
              </li>
              <li>
                <strong>Vercel</strong> — Hosting and edge functions.
              </li>
              <li>
                <strong>Hugging Face</strong> — Public dataset hosting (for free samples).
              </li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              6. Your Rights (GDPR & CCPA)
            </h2>
            <p>
              Depending on your jurisdiction, you may have the right to access, correct,
              delete, or port your data. To exercise these rights, email hello@truzot.com.
              We respond within 30 days.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              7. Cookies
            </h2>
            <p>
              We use essential cookies for site functionality. We do not use advertising
              or tracking cookies.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              8. Security
            </h2>
            <p>
              All data is encrypted in transit (TLS 1.3). We follow industry best practices
              for data security. No user data is used to train our public models.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              9. Compliance
            </h2>
            <p>
              Our synthetic datasets are designed to be compliant with GDPR, DPDP, and
              other privacy regulations. Since our data is synthetically generated and
              contains no real PII, it can be used freely for ML training without privacy
              concerns.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              10. Contact
            </h2>
            <p>
              For privacy inquiries:{" "}
              <a
                href="mailto:hello@truzot.com"
                className="text-[var(--lime)] hover:underline"
              >
                hello@truzot.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <B2BFooter />
    </div>
  );
}
