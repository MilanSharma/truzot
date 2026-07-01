import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Free LinkedIn Photo Checker & Analyzer | Truzot",
  description: "Analyze your LinkedIn profile picture with our free AI tool. Get instant feedback on brightness, face centering, and background complexity to boost your profile views.",
  alternates: { canonical: `${SITE_CONFIG.url}/tools/linkedin-photo-checker` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
