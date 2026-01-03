import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { CurrencyProvider } from "./context/CurrencyContext";
import { CSPostHogProvider } from "./providers";

import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0047AB",
};

export const metadata: Metadata = {
  title: "ZyraHealth - Global Healthcare for NRIs",
  description: "Connect with top Indian doctors for video consultations and prescriptions.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // This script handles the deep link callback for Capacitor
  const capacitorScript = `
    if (typeof window !== 'undefined' && window.Capacitor) {
      window.Capacitor.Plugins.App.addListener('appUrlOpen', async (data) => {
        const url = new URL(data.url);
        
        // If it's an auth redirect (contains hash with access_token)
        if (url.hash && (url.hash.includes('access_token') || url.hash.includes('refresh_token'))) {
            // Manually propagate the hash to the window location so Supabase picks it up
            // AND force a navigation to the callback page to handle the exchange
            window.location.href = '/auth/callback' + url.hash;
        }
      });
    }
  `;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: capacitorScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <CurrencyProvider>
          <CSPostHogProvider>
            {children}
            <SpeedInsights />
          </CSPostHogProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
