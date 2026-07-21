import { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Truzot collects, processes, stores, and protects your personal data and uploaded photos.",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-6 text-[var(--text)] font-display">
          Privacy Policy
        </h1>
        <p className="text-[var(--text-muted)] mb-8">Last updated: May 2026</p>
        <div className="space-y-6 text-[var(--text-secondary)] leading-relaxed">
          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            1. Information We Collect
          </h2>
          <p>
            <strong className="text-[var(--text)]">Photos you upload:</strong>{" "}
            You upload selfies for AI model training. These images are processed
            ephemerally and stored only until automatic deletion (30 days after
            order completion).
          </p>
          <p>
            <strong className="text-[var(--text)]">Account data:</strong>{" "}
            Email address, hashed password, and Stripe payment identifiers. We
            never store raw credit card numbers.
          </p>
          <p>
            <strong className="text-[var(--text)]">Biometric data:</strong>{" "}
            Our AI processes facial features (eye spacing, jawline, skin tone)
            solely to generate headshots. We do not create biometric profiles,
            perform facial recognition, or share biometric data with third
            parties. All biometric feature vectors are deleted within 30 days
            per our automatic purge policy.
          </p>
          <p>
            <strong className="text-[var(--text)]">Usage data:</strong>{" "}
            Page views, feature interactions, and conversion events via Vercel
            Analytics and optional PostHog. No personal data is tied to
            analytics events.
          </p>

          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            2. How We Use Your Data
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Train a custom LoRA AI model to generate your headshots</li>
            <li>Deliver your generated headshots via email and dashboard</li>
            <li>Process payments and issue refunds through Stripe</li>
            <li>Send order confirmations and delivery notifications</li>
            <li>Improve our service quality through aggregated analytics</li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            3. Data Retention & Deletion
          </h2>
          <p>
            All uploaded photos, trained AI models, and generated headshots are
            automatically and permanently deleted 30 days after your order is
            completed. You may request earlier deletion by contacting
            hello@truzot.com. Stripe retains payment records for 7 years per
            financial regulations.
          </p>

          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            4. Third-Party Processors
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>fal.ai</strong> — AI model training and image generation.
              Images are processed in-memory and not retained.
            </li>
            <li>
              <strong>Stripe</strong> — Payment processing. Truzot never sees
              your full card number.
            </li>
            <li>
              <strong>Supabase</strong> — Database and file storage (encrypted
              at rest).
            </li>
            <li>
              <strong>Resend</strong> — Transactional email delivery.
            </li>
            <li>
              <strong>Vercel</strong> — Hosting and edge functions.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            5. Your Rights (GDPR & CCPA)
          </h2>
          <p>
            Depending on your jurisdiction, you may have the right to access,
            correct, delete, or port your data. To exercise these rights, email
            hello@truzot.com. We respond within 30 days.
          </p>

          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            6. Cookies
          </h2>
          <p>
            We use essential cookies for authentication and session management.
            Optional analytics cookies (PostHog) are set only if you consent. No
            advertising or tracking cookies are used.
          </p>

          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            7. Security
          </h2>
          <p>
            All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We
            enforce row-level security in Supabase to isolate user data. Our AI
            processing occurs in isolated environments and no user data is used
            for training our public models.
          </p>

          <h2 className="text-xl font-bold text-[var(--text)] mt-8">
            8. Contact
          </h2>
          <p>
            For privacy inquiries:{" "}
            <a
              href="mailto:hello@truzot.com"
              className="text-lime-400 hover:underline"
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