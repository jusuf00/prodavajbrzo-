import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProdavajBrzo - Buy & Sell Marketplace",
  description: "Discover great deals on products from sellers worldwide. Buy and sell with ease on ProdavajBrzo.",
  keywords: "marketplace, buy, sell, products, online shopping, deals",
  authors: [{ name: "ProdavajBrzo Team" }],
  openGraph: {
    title: "ProdavajBrzo - Buy & Sell Marketplace",
    description: "Discover great deals on products from sellers worldwide",
    url: "https://prodavajbrzo.vercel.app",
    siteName: "ProdavajBrzo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProdavajBrzo - Buy & Sell Marketplace",
    description: "Discover great deals on products from sellers worldwide",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <Providers>
          <Header />
          <main className="flex-1 pb-45">
            {children}
          </main>
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
