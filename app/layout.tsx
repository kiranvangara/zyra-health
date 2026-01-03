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
      window.Capacitor.Plugins.App.addListener('appUrlOpen', (data) => {
        // If the URL contains 'access_token', we need to let Supabase handle it
        if (data.url.includes('access_token') || data.url.includes('refresh_token')) {
            // We manually parse the hash and set the session via Supabase client if needed,
            // or effectively we just reload the page with the hash so Supabase's auto-detect picks it up.
            // Since we use the 'Live URL' method, simply navigating to the URL (which is dashboard) might work
            // but we need to ensure the hash is preserved.
            
            // However, Supabase's startAutoRefresh() usually picks up the hash from window.location.
            // When deep linking, we might need to update window.location manually.
            const url = new URL(data.url);
            if (url.hash) {
                window.location.hash = url.hash;
                window.location.reload();
            }
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
