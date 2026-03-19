import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import FloatingFashionBackground from "@/components/FloatingFashionBackground";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-transparent text-white`} suppressHydrationWarning>
        <FloatingFashionBackground />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
