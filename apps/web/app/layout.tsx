import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uzimatek | AI Revenue Cycle Management for Kenya",
  description:
    "AI-powered SHA/SHIF claims management for Kenyan healthcare providers. Code, validate, submit and track claims 5× faster with 60% fewer denials.",
  keywords: "SHA, SHIF, claims management, Kenya health insurance, AI coding, RCM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
