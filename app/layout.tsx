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
  return (
    <html lang="en">
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
