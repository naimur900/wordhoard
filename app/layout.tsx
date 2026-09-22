import type { Metadata, Viewport } from "next";
import ThemeProvider from "@/components/ThemeProvider";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

const DESCRIPTION =
  "A pocket vocabulary deck — 810 words across 27 sets, with pictures, synonyms, antonyms, and easily confused pairs.";

// Absolute URLs are what unfurlers need. Set NEXT_PUBLIC_SITE_URL to the real
// domain in production; Vercel's own host is used as a fallback.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Wordhoard — illustrated vocabulary sets",
    template: "%s · Wordhoard",
  },
  description: DESCRIPTION,
  applicationName: "Wordhoard",
  keywords: [
    "vocabulary",
    "GRE words",
    "flashcards",
    "synonyms",
    "antonyms",
    "word list",
    "English vocabulary",
  ],
  authors: [{ name: "Naimur", url: "https://naimurrahman.dev/" }],
  creator: "Naimur",
  publisher: "Naimur",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Wordhoard",
    title: "Wordhoard — illustrated vocabulary sets",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wordhoard — illustrated vocabulary sets",
    description: DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wordhoard",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Dark is the default theme, whatever the device prefers.
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // next-themes writes the theme class on <html> before paint; React must be
    // told not to flag that difference against the server-rendered markup.
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans text-ink antialiased dark:text-ink-dark">
        <ThemeProvider>{children}</ThemeProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
