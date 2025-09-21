import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZamaVault - Secure Confidential Voting Platform",
  description: "ZamaVault is a secure confidential voting platform built with FHEVM technology. Create and participate in private polls with fully encrypted votes on Sepolia testnet.",
  keywords: "blockchain voting, confidential voting, FHEVM, Zama, encrypted polls, Web3 voting, Sepolia",
  authors: [{ name: "ZamaVault Team" }],
  robots: "index, follow",
  openGraph: {
    title: "ZamaVault - Secure Confidential Voting Platform",
    description: "Create and participate in private polls with fully encrypted votes using FHEVM technology",
    type: "website",
    siteName: "ZamaVault"
  },
  twitter: {
    card: "summary_large_image",
    title: "ZamaVault - Secure Confidential Voting Platform",
    description: "Create and participate in private polls with fully encrypted votes using FHEVM technology"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1
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
        {children}
      </body>
    </html>
  );
}
