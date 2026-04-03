import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FeedLoop Decode — Turn messy feedback into actionable tickets",
  description:
    "AI-powered clustering turns 50 raw user complaints into 7 actionable tickets in 12 seconds. Free, no signup required.",
  openGraph: {
    title: "FeedLoop Decode",
    description: "Turn messy user feedback into actionable tickets with AI",
    type: "website",
    siteName: "FeedLoop Decode",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeedLoop Decode",
    description: "Turn messy user feedback into actionable tickets with AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A]">
        {children}
      </body>
    </html>
  );
}
