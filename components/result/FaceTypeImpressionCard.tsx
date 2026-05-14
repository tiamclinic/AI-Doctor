"use client";

import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import { deriveFaceTypeAndImpressions } from "@/lib/result/faceType";

type FaceTypeImpressionCardProps = {
  scoreResult: ScoreResult;
};

export function FaceTypeImpressionCard({ scoreResult }: FaceTypeImpressionCardProps) {
  const { faceType, impressions } = deriveFaceTypeAndImpressions(scoreResult);

  return (
    <div className="border-border/60 bg-card mt-4 grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 rounded-xl border p-4 text-sm sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-x-4">
      <span className="font-heading text-tiam-gold text-[11px] tracking-[0.2em] whitespace-nowrap">
        顔タイプ
      </span>
      <span className="text-foreground leading-snug">{faceType}</span>

      <span className="font-heading text-tiam-gold text-[11px] tracking-[0.2em] whitespace-nowrap">
        印象
      </span>
      <span className="text-foreground leading-snug">
        {impressions.join(" ・ ")}
      </span>
    </div>
  );
}
