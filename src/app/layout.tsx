import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BoviTrack — Suivi intelligent du cheptel",
  description:
    "BoviTrack : gestion du cheptel, suivi sanitaire et traçabilité du bétail au Sénégal.",
  applicationName: "BoviTrack",
};

export const viewport: Viewport = {
  themeColor: "#0F7B45",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-dvh bg-sand text-earth antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
