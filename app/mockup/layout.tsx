import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "デザインモック",
  robots: { index: false, follow: false },
};

export default function MockupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
