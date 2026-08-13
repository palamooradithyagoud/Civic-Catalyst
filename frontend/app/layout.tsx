import type { Metadata } from "next";
import { Noto_Sans, Inter } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nivaaran AI — AI-Powered Civic Issue Reporting",
  description:
    "Nivaaran AI helps villagers report civic problems and connects them with the right Gram Panchayat authority using AI. Simple, fast, and accessible for rural communities.",
  keywords: ["civic tech", "gram panchayat", "village complaints", "AI", "india", "government"],
  openGraph: {
    title: "Nivaaran AI",
    description: "AI can turn every citizen's voice into action.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${notoSans.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
