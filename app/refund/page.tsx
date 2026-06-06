import { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Refund Policy — Truzot AI Headshots",
  description:
    "Truzot's 100% satisfaction guarantee and refund policy for AI headshot orders.",
  robots: { index: false },
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Nav />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white font-display">
          Refund Policy
        </h1>
        <p className="text-slate-500 mb-8">Last updated: May 2026</p>
        <div className="space-y-6 text-slate-600 dark:text-slate-400 leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            100% Satisfaction Guarantee
          </h2>
          <p>
            We stand behind our AI headshot quality. If you are not satisfied
            with your generated headshots for any reason, you are eligible for a
            full refund within 14 days of delivery.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            How to Request a Refund
          </h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Log in to your account and navigate to Dashboard → order details
            </li>
            <li>
              Click <strong>&ldquo;Request Refund&rdquo;</strong> on the order
              (available within 14 days of completion)
            </li>
            <li>
              Alternatively, email{" "}
              <a
                href="mailto:hello@truzot.com"
                className="text-blue-600 underline"
              >
                hello@truzot.com
              </a>{" "}
              with your order ID
            </li>
          </ol>
          <p>
            Refunds are processed within 3–5 business days and credited to the
            original payment method.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            Self-Service via Stripe
          </h2>
          <p>
            You can also manage refunds and view your payment history through
            the{" "}
            <a href="/billing" className="text-blue-600 underline">
              Stripe Customer Portal
            </a>
            .
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            Exceptions
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Team/Enterprise plans:</strong> Refunds are prorated based
              on unused employee seats.
            </li>
            <li>
              <strong>Chargebacks:</strong> Disputing a charge with your bank
              without first contacting us may result in permanent account
              suspension.
            </li>
            <li>
              <strong>Fraud:</strong> No refunds for accounts terminated due to
              Terms of Service violations.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            Automatic Refunds
          </h2>
          <p>
            If your order fails and we are unable to successfully retry
            generation after 3 attempts, a full refund is automatically issued
            within 7 days.
          </p>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8">
            Contact
          </h2>
          <p>
            Refund questions:{" "}
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
