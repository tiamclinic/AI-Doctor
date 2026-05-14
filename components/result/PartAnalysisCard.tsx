"use client";

import type { ReactNode } from "react";

import type { PartId } from "@/lib/result/parts";

type PartAnalysisCardProps = {
  partId: PartId;
  title: string;
  /** 0–100、表示は小数第 1 位 */
  score: number;
  /** ルールベースの TIAM AI 参考短文 */
  aiSummary: string;
  /** T-15: 院方コンテンツ。未指定なら枠ごと非表示 */
  doctorSlot?: ReactNode;
};

export function PartAnalysisCard({
  partId,
  title,
  score,
  aiSummary,
  doctorSlot,
}: PartAnalysisCardProps) {
  return (
    <article
      data-part-id={partId}
      className="border-border/60 bg-card flex h-full flex-col rounded-xl border p-5 shadow-sm"
    >
      <header className="border-tiam-gold/40 flex items-baseline justify-between gap-2 border-b pb-2">
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">{title}</h3>
        <span className="text-tiam-gold font-heading text-lg tabular-nums tracking-tight">
          {score.toFixed(1)}
        </span>
      </header>

      <section className="mt-3 flex flex-1 flex-col" aria-label="TIAM AI 由来コメント">
        <div className="inline-flex w-fit items-center rounded border border-tiam-gold/40 bg-tiam-gold/10 px-2 py-0.5">
          <span className="text-tiam-primary text-[10px] font-medium tracking-wide">TIAM AI</span>
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{aiSummary}</p>
      </section>

      {doctorSlot ? (
        <div
          className="border-border/60 mt-4 border-t border-dashed pt-3"
          aria-label="院方コメント枠"
        >
          {doctorSlot}
        </div>
      ) : null}

      <footer className="text-muted-foreground mt-auto pt-3 text-[10px] leading-relaxed">
        ※ 美容バランスの傾向を読み解く参考情報です。院方のコメントは今後ここに表示予定です。
      </footer>
    </article>
  );
}
