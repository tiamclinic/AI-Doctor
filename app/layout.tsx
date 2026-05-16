import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";

import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { DiagnosisSessionPersistence } from "@/components/DiagnosisSessionPersistence";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  fontCormorant,
  fontInter,
  fontSans,
  fontSerifJp,
} from "@/lib/fonts";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// OGP / シェアリンクのベース URL。本番では apphosting.yaml で NEXT_PUBLIC_APP_URL を
// 注入する。未設定でも new URL() で落ちないようローカル既定値を持たせておく。
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "TIAM Beauty AI",
    template: "%s | TIAM Beauty AI",
  },
  description:
    "TIAM 独自の美容バランスの傾向を、写真から読み解く参考情報です。医療診断ではありません。",
  openGraph: {
    type: "website",
    siteName: "TIAM Beauty AI",
    locale: "ja_JP",
    url: "/",
    title: "TIAM Beauty AI — 美容バランスの傾向を AI が読み解く",
    description:
      "TIAM 独自 AI が写真から美容バランスの傾向を分析する参考情報サービス。医療診断ではありません。",
  },
  twitter: {
    card: "summary_large_image",
    title: "TIAM Beauty AI",
    description:
      "TIAM 独自 AI が写真から美容バランスの傾向を読み解きます。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${fontSans.variable} ${fontSerifJp.variable} ${fontCormorant.variable} ${fontInter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className={`${fontSans.className} bg-background text-foreground flex min-h-full flex-col`}
      >
        <Header />
        <AnalyticsProvider>
          <DiagnosisSessionPersistence />
          <div className="flex flex-1 flex-col">{children}</div>
        </AnalyticsProvider>
        <Footer />
      </body>
    </html>
  );
}
