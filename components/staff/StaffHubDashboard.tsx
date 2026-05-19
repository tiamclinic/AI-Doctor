"use client";

import Link from "next/link";
import { BookOpenCheck, LogOut, PenLine, Sparkles } from "lucide-react";
import * as React from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { signOutAdmin } from "@/lib/admin/firebaseClient";
import { cn } from "@/lib/utils";

type StaffHubDashboardProps = {
  email: string;
  /** ログイン前に開こうとしていた画面（例: ドクター所見編集） */
  resumePath?: string | null;
};

export function StaffHubDashboard({ email, resumePath }: StaffHubDashboardProps) {
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOutAdmin();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="border-tiam-gold/30 bg-tiam-gold/8 rounded-lg border px-4 py-3 text-center">
        <p className="text-muted-foreground text-xs">ログイン中</p>
        <p className="text-tiam-primary mt-0.5 text-sm font-medium">{email}</p>
      </div>

      {resumePath ? (
        <Link
          href={resumePath}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "border-tiam-gold/50 w-full",
          )}
        >
          続きの業務へ進む
        </Link>
      ) : null}

      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-tiam-primary hover:bg-tiam-primary/90 h-14 w-full gap-2 text-base text-white",
          )}
        >
          <Sparkles className="size-5" aria-hidden />
          新規診断をはじめる
        </Link>
        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          来院者の写真撮影・AI 診断はこちらから。結果画面では「ドクター所見を追記」が表示されます。
        </p>
      </div>

      <nav className="border-border flex flex-col gap-2 border-t pt-6">
        <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
          その他の業務
        </p>
        <Link
          href="/staff/how-to-use"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "justify-start gap-2",
          )}
        >
          <BookOpenCheck className="size-3.5" aria-hidden />
          運用フロー説明書（How to Use）
        </Link>
        <p className="text-muted-foreground text-[10px] leading-relaxed">
          受付〜結果共有までの操作手順・口頭スクリプト・トラブル対応をまとめています。
        </p>
        <Link
          href="/admin/diagnoses"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "justify-start gap-2",
          )}
        >
          <PenLine className="size-3.5" aria-hidden />
          診断一覧・ドクター所見の編集
        </Link>
        <p className="text-muted-foreground text-[10px] leading-relaxed">
          スタッフ・管理者で一覧を閲覧。所見の編集・公開は管理者（admin）またはスタッフ権限が必要です。
        </p>
      </nav>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground mx-auto gap-1.5"
        disabled={loggingOut}
        onClick={() => void handleLogout()}
      >
        <LogOut className="size-3.5" aria-hidden />
        {loggingOut ? "ログアウト中…" : "ログアウト"}
      </Button>
    </div>
  );
}
