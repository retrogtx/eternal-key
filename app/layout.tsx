import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react"
import '@solana/wallet-adapter-react-ui/styles.css';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eternalkey.xyz"),
  title: "Eternal Key - Decentralized Crypto Inheritance on Solana",
  description: "A decentralized dead man's switch for crypto inheritance on Solana. Secure your digital assets' future with automated, trustless transfers to designated beneficiaries.",
  keywords: ["crypto inheritance", "Solana", "dead man's switch", "digital assets", "blockchain inheritance", "crypto inheritance", "decentralized inheritance"],
  openGraph: {
    title: "Eternal Key - Decentralized Crypto Inheritance on Solana",
    description: "Secure your crypto assets' future with automated, trustless inheritance on Solana. Set up a dead man's switch for your digital assets.",
    url: "https://eternalkey.xyz",
    siteName: "Eternal Key",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eternal Key - Decentralized Crypto Inheritance on Solana",
    description: "Secure your crypto assets' future with automated, trustless inheritance on Solana.",
    creator: "@amritwt",
  },
  icons: {
    icon: [
      { url: 'favicon.ico', sizes: 'any' },
      { url: 'android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: 'android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "6JtALOS_ykm2LnlrEBOUUjVoc7NCwn",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Analytics />
        <Toaster />
        {children}
      </body>
    </html>
  );
}
