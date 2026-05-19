import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "スタッフ業務開始 | TIAM Beauty AI",
  robots: { index: false, follow: false },
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
