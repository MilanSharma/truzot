import { Metadata } from "next";
import B2BNav from "@/components/B2BNav";
import B2BFooter from "@/components/B2BFooter";

export const metadata: Metadata = {
  title: "Terms of Service — Truzot",
  description: "Terms and conditions governing the use of Truzot's synthetic training data services.",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <B2BNav />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-[var(--text)]">
            Terms of Service
          </h1>
          <p className="text-[var(--text-muted)] mb-8">Last updated: January 2026</p>

          <div className="space-y-6 text-[var(--text-muted)] leading-relaxed">
            <h2 className="text-xl font-bold text-[var(--text)] mt-8">1. Acceptance</h2>
            <p>
              By using Truzot services, you agree to these terms. If you do not agree,
              do not use our services.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">2. Services</h2>
            <p>
              Truzot provides synthetic training datasets for machine learning purposes.
              Our datasets are 100% synthetically generated and contain no real PII or
              user data. Services include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Download of free sample datasets</li>
              <li>Purchase of standard datasets</li>
              <li>Custom dataset generation services</li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">3. License to Use Data</h2>
            <p>
              Upon purchase, you are granted a perpetual, worldwide, royalty-free,
              non-exclusive license to use the datasets for any lawful purpose, including
              machine learning training, fine-tuning, and commercial applications. You may
              not resell or redistribute the datasets in their original form.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">4. Prohibited Uses</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using datasets for illegal, fraudulent, or harmful purposes</li>
              <li>Reselling or redistributing datasets without modification</li>
              <li>Claiming synthetic data as real user data</li>
              <li>Attempting to reverse-engineer our generation methods</li>
              <li>Automated scraping or bulk downloading without permission</li>
            </ul>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              5. Payments & Refunds
            </h2>
            <p>
              All prices are in USD. Standard datasets are one-time purchases. Custom
              dataset pricing is determined based on scope and complexity. Due to the
              digital nature of the product, refunds are only provided if the dataset
              does not meet the agreed-upon specifications. We use Stripe for payment
              processing and do not store payment card details.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              6. Custom Dataset Services
            </h2>
            <p>
              For custom dataset requests, we will provide a quote based on your requirements.
              Work begins only after payment confirmation. Delivery timelines are estimates
              and may vary based on complexity. You will have the opportunity to review
              and request one round of revisions before final delivery.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              7. Data Quality & Warranty
            </h2>
            <p>
              We strive to provide high-quality, schema-validated datasets. Our datasets
              undergo automated validation and human verification. However, we do not
              warrant that the datasets will be error-free or suitable for every specific
              use case. You are responsible for testing and validating datasets before
              production use.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">
              8. Limitation of Liability
            </h2>
            <p>
              Truzot's total liability is limited to the amount you paid for the specific
              dataset or service giving rise to the claim. We are not liable for indirect,
              incidental, or consequential damages, including but not limited to lost
              profits or data loss.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">9. Intellectual Property</h2>
            <p>
              Truzot retains all intellectual property rights to our generation methods,
              processes, and proprietary algorithms. You receive a license to use the
              output datasets but do not acquire any rights to our underlying technology.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">10. Changes</h2>
            <p>
              We may update these terms. Continued use after changes constitutes
              acceptance. Material changes will be notified via email for registered users.
            </p>

            <h2 className="text-xl font-bold text-[var(--text)] mt-8">11. Contact</h2>
            <p>
              For questions about these terms:{" "}
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
