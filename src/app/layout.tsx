import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#18181b",
};

export const metadata: Metadata = {
  title: "Hustle | Elite Athletic Performance Tracking",
  description: "Professional development tracking for committed athletes. Transparent data parents and recruiters trust.",
  keywords: ["athletic performance", "youth sports", "player development", "recruiting"],
  authors: [{ name: "Jeremy Longshore", url: "https://jeremylongshore.com" }],
  creator: "Intent Solutions",
  publisher: "Intent Solutions",
  metadataBase: new URL("https://hustlestats.io"),
  openGraph: {
    title: "Hustle | Performance Data Recruiters Trust",
    description: "Professional athletic tracking for families invested in elite player development and college recruiting.",
    url: "https://hustlestats.io",
    siteName: "Hustle",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hustle - Elite Athletic Performance Tracking",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hustle | Performance Data Recruiters Trust",
    description: "Professional athletic tracking for families invested in elite player development and college recruiting.",
    images: ["/images/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900 font-sans`}>
        {children}
      </body>
    </html>
  );
}
