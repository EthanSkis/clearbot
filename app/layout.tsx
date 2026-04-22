import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClearBot — Business license renewals, automated.",
  description:
    "ClearBot tracks, prepares, and files every renewal for every location you operate — across every agency, every jurisdiction, every form. A lapse is no longer possible.",
  metadataBase: new URL("https://clearbot.io"),
  openGraph: {
    title: "ClearBot — Business license renewals, automated.",
    description:
      "Stop managing license renewals in spreadsheets. ClearBot files every renewal across every jurisdiction.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="bg-bg text-ink font-sans antialiased">{children}</body>
    </html>
  );
}
