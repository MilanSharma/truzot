import "./globals.css";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import {
  OrganizationSchema,
  WebSiteSchema,
  ServiceSchema,
} from "@/components/JsonLd";
import { SITE_CONFIG } from "@/lib/seo";



const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#A3E635",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: "Truzot Data — Resilience & Failure Benchmarks for Agentic AI",
    template: "%s — Truzot",
  },
  description:
    "Enterprise synthetic API failure and recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience. 100% schema-validated.",
  keywords: [
    "synthetic training data",
    "AI training data",
    "JSONL datasets",
    "fine-tuning data",
    "agentic AI",
    "error recovery datasets",
    "machine learning data",
    "synthetic data generation",
    "API failure trajectories",
    "tool calling resilience",
  ],
  authors: [{ name: "Truzot" }],
  creator: "Truzot",
  publisher: "Truzot",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    title: "Truzot Data — Resilience & Failure Benchmarks for Agentic AI",
    description:
      "Enterprise synthetic API failure and recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience. 100% schema-validated.",
    url: SITE_CONFIG.url,
    siteName: "Truzot",
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: "Truzot Synthetic Training Data",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Truzot Data — Resilience & Failure Benchmarks for Agentic AI",
    description:
      "Enterprise synthetic API failure and recovery trajectories for fine-tuning and evaluating autonomous tool-calling resilience. 100% schema-validated.",
    images: [SITE_CONFIG.ogImage],
  },
  category: "technology",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/logo.png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] focus:bg-[var(--lime)] focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
        >
          Skip to main content
        </a>
        <OrganizationSchema />
        <WebSiteSchema />
        <ServiceSchema />
        <ThemeProvider>
          <PostHogProvider>
            <ToastProvider>
              {children}
              <Analytics />
            </ToastProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
