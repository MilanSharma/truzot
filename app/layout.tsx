import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Truzot AI Headshots",
  description: "Generate AI-powered professional headshots",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
