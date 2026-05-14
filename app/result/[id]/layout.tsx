import type { Metadata } from "next";
import * as React from "react";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const base = baseUrl();
  const path = `/result/${id}`;
  const url = `${base}${path}`;
  const title = "美容バランス診断結果";
  const description =
    "TIAM Beauty AI による美容バランスの傾向の参考情報です。医療診断ではありません。";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | TIAM Beauty AI`,
      description,
      url,
      type: "website",
      siteName: "TIAM Beauty AI",
      locale: "ja_JP",
      images: [
        {
          url: `${path}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${title} | TIAM Beauty AI`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | TIAM Beauty AI`,
      description,
    },
  };
}

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
