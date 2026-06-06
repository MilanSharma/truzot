import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Truzot AI Headshots",
  robots: { index: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
