import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/components/theme/themeBootScript";

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
    // suppressHydrationWarning because the boot script below mutates this
    // element's class list before React ever sees it — that mismatch is the
    // intended behaviour, not a bug to be warned about.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Must be inline and blocking. Anything deferred paints light first
            and snaps to dark on hydration. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      {/* No colour literal here — body's background comes from --color-canvas
          in globals.css, which is the only file that names a colour. */}
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
