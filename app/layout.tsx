import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

import { CurrencyProvider } from "./context/CurrencyContext";
import { CSPostHogProvider } from "./providers";

import { SpeedInsights } from "@vercel/speed-insights/next";
import CapacitorDeepLink from "./components/CapacitorDeepLink";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#0047AB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Medivera - Global Healthcare for NRIs",
  description: "Connect with top Indian doctors for video consultations and prescriptions.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/apple-touch-icon.png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {



  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable}`}>
        <CurrencyProvider>
          <CSPostHogProvider>
            <CapacitorDeepLink />
            {children}
            <SpeedInsights />
          </CSPostHogProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
