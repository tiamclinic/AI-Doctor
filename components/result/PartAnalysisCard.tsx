"use client";

import type { ReactNode } from "react";

import { PartAnalysisIcon } from "@/components/result/PartAnalysisIcon";
import { AiSourceBadge } from "@/components/result/SourceBadges";
import type { PartId } from "@/lib/result/parts";

type PartAnalysisCardProps = {
  partId: PartId;
  title: string;
  /** 0–100、表示は小数第 1 位 */
  score: number;
  /** ルールベースの TIAM AI 参考短文 */
  aiSummary: string;
  /** 医師ブロック（`DoctorPartBlock`）。未指定なら AI のみ */
  doctorBlock?: ReactNode;
};

export function PartAnalysisCard({
  partId,
  title,
  score,
  aiSummary,
  doctorBlock,
}: PartAnalysisCardProps) {
  return (
    <article
      data-part-id={partId}
      className="part-card border-border/60 bg-card flex h-full flex-col rounded-xl border p-5 shadow-sm"
    >
      <header className="border-tiam-gold/40 flex items-center gap-3 border-b pb-3">
        <div
          className="border-tiam-gold/50 bg-tiam-gold/8 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
          aria-hidden
        >
          <PartAnalysisIcon partId={partId} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
            {title}
          </h3>
        </div>
        <span className="text-tiam-gold font-heading shrink-0 text-lg tabular-nums tracking-tight">
          {score.toFixed(1)}
        </span>
      </header>

      <section className="mt-3 flex flex-1 flex-col" aria-label="AI 由来コメント">
        <AiSourceBadge />
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{aiSummary}</p>
      </section>

      {doctorBlock}

      <footer className="text-muted-foreground mt-auto pt-3 text-[10px] leading-relaxed">
        ※ 美容バランスの傾向を読み解く参考情報です。
      </footer>
    </article>
  );
}
