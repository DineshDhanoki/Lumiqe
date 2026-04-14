// TODO: Production Sentry setup — install @sentry/nextjs and configure:
//   1. Run: npx @sentry/wizard@latest -i nextjs
//   2. Add NEXT_PUBLIC_SENTRY_DSN and SENTRY_AUTH_TOKEN to env vars
//   3. Configure sentry.client.config.ts and sentry.server.config.ts
//   4. Wrap this layout with Sentry error boundary for client-side error capture
import type { Metadata, Viewport } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  Cormorant_Garamond,
  JetBrains_Mono,
  DM_Sans,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ClientShell } from "@/components/ClientShell";
import { Analytics } from "@vercel/analytics/next";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-md focus:font-semibold"
    >
      Skip to main content
    </a>
  );
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Lumiqe | Discover Your True Colors",
  description: "AI-Powered Color Analysis Engine. Find your exact season and palette instantly.",
  manifest: "/manifest.json",
  themeColor: "#09090B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lumiqe",
  },
  icons: {
    apple: "/icon-192.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth overflow-x-hidden" suppressHydrationWarning>
      <head>
        {/* Material Symbols Outlined — used throughout Obsidian Luxe UI */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${inter.variable} ${jakarta.variable} ${cormorant.variable} ${jetbrains.variable} ${dmSans.variable} antialiased bg-background text-on-surface`}
        suppressHydrationWarning
      >
        <SkipLink />
        {/* Film grain texture overlay */}
        <div className="grain-overlay" aria-hidden="true" />
        <ClientShell />
        <Providers>
          <main id="main-content" role="main">
            {children}
          </main>
        </Providers>
        <Analytics />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
