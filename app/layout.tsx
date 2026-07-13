import "./globals.css";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import { getEnv } from "@/lib/env";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ToastProvider } from "@/components/Toast";
import CookieConsent from "@/components/CookieConsent";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthSync from "@/components/AuthSync";
import {
  OrganizationSchema,
  WebSiteSchema,
  ServiceSchema,
  HowToSchema,
  SpeakableSchema,
} from "@/components/JsonLd";
import { SITE_CONFIG } from "@/lib/seo";

if (typeof window === "undefined") {
  try {
    getEnv();
  } catch (e) {
    console.error("Environment validation failed:", e);
  }
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  style: ["normal", "italic"],
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
    default: "Truzot AI Headshots — Professional Headshots in Minutes",
    template: "%s — Truzot AI Headshots",
  },
  description:
    "Generate AI-powered professional headshots from your photos. Get LinkedIn-ready corporate headshots in under an hour.",
  keywords: [
    "AI headshots",
    "professional headshots",
    "LinkedIn headshots",
    "corporate headshots",
    "AI photo generator",
    "headshot generator",
    "professional portrait AI",
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
    title: "Truzot AI Headshots — Professional Headshots in Minutes",
    description:
      "Generate AI-powered professional headshots from your photos. No studio, no photographer. Get LinkedIn-ready corporate headshots in under an hour.",
    url: SITE_CONFIG.url,
    siteName: "Truzot",
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: "Truzot AI Headshots",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Truzot AI Headshots — Professional Headshots in Minutes",
    description:
      "Generate AI-powered professional headshots from your photos. No studio, no photographer.",
    images: [SITE_CONFIG.ogImage],
  },
  category: "technology",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="en"
      className={`${inter.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18276640380"
          strategy="afterInteractive"
        />
        <Script
          id="google-ads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18276640380');
            `,
          }}
        />
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1385221020153603');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1385221020153603&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <link rel="dns-prefetch" href="https://fal.ai" />
        <link rel="preconnect" href="https://fal.ai" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://api.stripe.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link
            rel="preconnect"
            href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            crossOrigin="anonymous"
          />
        )}
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
        <HowToSchema />
        <SpeakableSchema />
        {process.env.NEXT_PUBLIC_REWARDFUL_API_KEY && (
          <>
            <Script
              id="rewardful-init"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`,
              }}
            />
            <Script
              src="https://r.wdfl.co/rw.js"
              data-rewardful={process.env.NEXT_PUBLIC_REWARDFUL_API_KEY}
              strategy="lazyOnload"
            />
          </>
        )}
        <ThemeProvider>
          <PostHogProvider>
            <ToastProvider>
              <AuthSync />
              {children}
              <Analytics />
              <CookieConsent />
            </ToastProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
