import type { Metadata, Viewport } from 'next';
import { Fredoka, Quicksand } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://hustlestats.io'
  ),
  title: 'Hustle — Youth Soccer Performance Tracker',
  description:
    "Track your athlete's soccer performance, training progress, and development with Hustle.",
  openGraph: {
    title: 'Hustle — Youth Soccer Performance Tracker',
    description: "Track your athlete's soccer performance with Hustle.",
    images: ['/images/og-image.jpg'],
    siteName: 'Hustle',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
