import Link from "next/link";
import { ChevronRight, LayoutGrid, Pencil, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MockupHubPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <header className="text-center">
          <span className="text-tiam-gold font-heading text-[10px] tracking-[0.35em] uppercase">
            Design mockup
          </span>
          <h1 className="font-heading text-tiam-primary mt-2 text-2xl tracking-tight">
            結果画面フロー（モック）
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg text-xs leading-relaxed">
            実装前の画面イメージ共有用です。下のカードから順に開いて、編集ボタン → 編集画面 →
            反映後の結果、の流れをご確認ください。
          </p>
        </header>

        <div className="flex flex-col gap-3">
          <Card className="border-border/80 border-tiam-gold/20">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="bg-tiam-gold/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-tiam-gold/30">
                  <LayoutGrid className="text-tiam-gold size-4" />
                </div>
                <div>
                  <p className="font-heading text-tiam-primary text-sm">1. 結果（追記前）</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                    パーツ分析は TIAM AI のみ。ヘッダ付近に「ドクター所見を追記」ボタン。
                  </p>
                </div>
              </div>
              <Link
                href="/mockup/result"
                className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1")}
              >
                開く
                <ChevronRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="bg-tiam-rose/12 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-tiam-rose/35">
                  <Pencil className="text-tiam-primary size-4" />
                </div>
                <div>
                  <p className="font-heading text-tiam-primary text-sm">2. 編集画面</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                    総評・レポートとパーツ別の2系統タブ。所見・推奨ケア・院内メモ・公開状態の UI イメージ。
                  </p>
                </div>
              </div>
              <Link
                href="/mockup/edit"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1")}
              >
                開く
                <ChevronRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="bg-tiam-gold/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-tiam-gold/30">
                  <Sparkles className="text-tiam-gold size-4" />
                </div>
                <div>
                  <p className="font-heading text-tiam-primary text-sm">3. 結果（反映後）</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                    総評セクションと各パーツに「当院医師より」が併記された状態のイメージ。
                  </p>
                </div>
              </div>
              <Link
                href="/mockup/result-after"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "shrink-0 gap-1",
                )}
              >
                開く
                <ChevronRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <p className="text-muted-foreground text-center text-[10px]">
          <Link href="/" className="text-tiam-gold underline-offset-2 hover:underline">
            アプリのトップへ戻る
          </Link>
        </p>
      </div>
    </main>
  );
}
