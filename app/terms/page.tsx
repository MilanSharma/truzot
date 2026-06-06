import { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — Truzot AI Headshots",
  description:
    "Terms and conditions governing the use of Truzot's AI headshot generation service.",
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white font-display">
          Terms of Service
        </h1>
        <p className="text-slate-500 mb-8">Last updated: May 2026</p>
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            1. Acceptance
          </h2>
          <p>
            By using Truzot, you agree to these terms. If you do not agree, do
            not use the service.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            2. Eligibility
          </h2>
          <p>
            You must be at least 18 years old. By uploading photos, you
            represent that you own the rights to those photos or have explicit
            permission from every identifiable person depicted.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            3. License to Generated Images
          </h2>
          <p>
            You are granted a perpetual, worldwide, royalty-free, non-exclusive
            license to use the AI-generated headshots for any lawful purpose,
            including professional profiles, resumes, marketing materials, and
            company websites.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            4. Prohibited Uses
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Uploading photos of minors without parental consent</li>
            <li>Uploading illegal, offensive, or NSFW content</li>
            <li>
              Using the service to create deepfakes, impersonate others, or
              commit fraud
            </li>
            <li>Attempting to reverse-engineer the AI models</li>
            <li>
              Automated scraping or bulk access without written permission
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            5. Payments & Refunds
          </h2>
          <p>
            All prices are in USD and one-time (no subscriptions). Refunds are
            governed by our Refund Policy. We use Stripe for payment processing
            and do not store payment card details.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            6. Service Availability
          </h2>
          <p>
            We strive for 99.9% uptime but do not guarantee uninterrupted
            service. We are not liable for delays in headshot generation due to
            third-party AI provider outages.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            7. Limitation of Liability
          </h2>
          <p>
            Truzot&apos;s total liability is limited to the amount you paid for
            the specific order giving rise to the claim. We are not liable for
            indirect, incidental, or consequential damages.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            8. Termination
          </h2>
          <p>
            We may suspend or terminate your account if you violate these terms.
            Upon termination, your data will be deleted per our Privacy Policy.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            9. Changes
          </h2>
          <p>
            We may update these terms. Continued use after changes constitutes
            acceptance. Material changes will be notified via email.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            10. Contact
          </h2>
          <p>
            <a
              href="mailto:hello@truzot.com"
              className="text-blue-600 underline"
            >
              hello@truzot.com
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
