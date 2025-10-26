'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import enMessages from '../../messages/en.json';
import mkMessages from '../../messages/mk.json';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, setLocale] = useState('en')
  const pathname = usePathname()

  useEffect(() => {
    const pathLocale = pathname.split('/')[1]
    if (pathLocale && (pathLocale === 'en' || pathLocale === 'mk')) {
      setLocale(pathLocale)
      document.documentElement.lang = pathLocale
    }
  }, [pathname])

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} timeZone="Europe/Skopje" messages={locale === 'mk' ? mkMessages : enMessages}>
          <Providers>
            <Header locale={locale} />
            <main className="flex-1 pb-45">
              {children}
            </main>
            <Footer />
            <CookieBanner />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
