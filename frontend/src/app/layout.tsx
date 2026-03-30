// TODO: Production Sentry setup — install @sentry/nextjs and configure:
//   1. Run: npx @sentry/wizard@latest -i nextjs
//   2. Add NEXT_PUBLIC_SENTRY_DSN and SENTRY_AUTH_TOKEN to env vars
//   3. Configure sentry.client.config.ts and sentry.server.config.ts
//   4. Wrap this layout with Sentry error boundary for client-side error capture
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ClientShell } from "@/components/ClientShell";
import { Analytics } from "@vercel/analytics/next";

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

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumiqe | Discover Your True Colors",
  description: "AI-Powered Color Analysis Engine. Find your exact season and palette instantly.",
  manifest: "/manifest.json",
  themeColor: "#DC2626",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lumiqe",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-transparent text-white`} suppressHydrationWarning>
        <SkipLink />
        <ClientShell />
        <Providers>
          <main id="main-content" role="main">
            {children}
          </main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
