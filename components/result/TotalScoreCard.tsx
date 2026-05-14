"use client";

import { ScoreCircle } from "@/components/ScoreCircle";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import { getHeroSummaryLine } from "@/lib/result/partSummaries";

type TotalScoreCardProps = {
  scoreResult: ScoreResult;
};

export function TotalScoreCard({ scoreResult }: TotalScoreCardProps) {
  const summary = getHeroSummaryLine(scoreResult.totalScore);

  return (
    <section className="border-border/80 bg-card flex flex-col items-center gap-3 rounded-xl border p-5 text-center shadow-sm sm:p-6">
      <div className="border-tiam-gold/40 w-full border-b pb-2 text-center">
        <h2 className="font-heading text-tiam-primary text-sm tracking-tight sm:text-base">
          総合評価
        </h2>
      </div>
      <ScoreCircle value={scoreResult.totalScore} size={180} />
      <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">{summary}</p>
    </section>
  );
}
