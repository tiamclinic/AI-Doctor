"use client";

import { PartAnalysisCard } from "@/components/result/PartAnalysisCard";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import { getPartDisplayScore, PART_IDS, PART_LABELS } from "@/lib/result/parts";
import { getPartSummary } from "@/lib/result/partSummaries";

type PartAnalysisGridProps = {
  scoreResult: ScoreResult;
};

export function PartAnalysisGrid({ scoreResult }: PartAnalysisGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PART_IDS.map((partId) => (
        <PartAnalysisCard
          key={partId}
          partId={partId}
          title={PART_LABELS[partId]}
          score={getPartDisplayScore(scoreResult, partId)}
          aiSummary={getPartSummary(scoreResult, partId)}
        />
      ))}
    </div>
  );
}
