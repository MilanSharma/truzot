import "./globals.css";
import { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { getEnv } from "@/lib/env";
import { PostHogProvider } from "@/components/PostHogProvider";

if (typeof window === "undefined") {
  try {
    getEnv();
  } catch (e) {
    console.error("Environment validation failed:", e);
  }
}

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Truzot AI Headshots",
  description:
    "Generate AI-powered professional headshots without the studio hassle.",
  openGraph: {
    title: "Truzot AI Headshots",
    description:
      "Generate AI-powered professional headshots without the studio hassle.",
    url: siteUrl,
    siteName: "Truzot",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Truzot AI Headshots",
    description:
      "Generate AI-powered professional headshots without the studio hassle.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try { document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)); } catch(e) {}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <PostHogProvider>
          {children}
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
