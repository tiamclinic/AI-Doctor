import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";

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

export const metadata: Metadata = {
  title: {
    default: "TIAM Beauty AI",
    template: "%s | TIAM Beauty AI",
  },
  description:
    "TIAM 独自の美容バランスの傾向を、写真から読み解く参考情報です。医療診断ではありません。",
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
        <div className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
