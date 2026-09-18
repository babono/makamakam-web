import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";

const engraved = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const spoken = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://makamakam.com"),
  title: {
    default: "Makamakam — find a grave, and know what to do there",
    template: "%s · Makamakam",
  },
  description:
    "An iOS app that walks you to one grave, tells you what to do once you are standing there, and carries what you remember to a family who may never have heard it.",
  openGraph: {
    title: "Makamakam",
    description:
      "Find a grave you were never shown, tend it in your own tradition, and leave the family a memory only you hold.",
    url: "https://makamakam.com",
    siteName: "Makamakam",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${engraved.variable} ${spoken.variable} font-[family-name:var(--font-sans)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
