import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://climabr-two.vercel.app"),
  title: "ClimaBR - Previsão do Tempo para Municípios Brasileiros",
  description:
    "Consulte a previsão meteorológica em tempo real, curva térmica 24h, radiação UV e dados oficiais de qualquer município do Brasil sem anúncios invasivos.",
  manifest: "/manifest.webmanifest",
  applicationName: "ClimaBR",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://climabr-two.vercel.app",
    siteName: "ClimaBR",
    title: "ClimaBR - Previsão do Tempo para Municípios Brasileiros",
    description:
      "Previsão meteorológica limpa, rápida e sem anúncios invasivos para os 5.570 municípios do Brasil com dados do IBGE e INMET.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClimaBR - Previsão do Tempo para Municípios Brasileiros",
    description:
      "Previsão meteorológica limpa, rápida e sem anúncios invasivos para os 5.570 municípios do Brasil.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ClimaBR",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png" },
    ],
    shortcut: "/icon",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
