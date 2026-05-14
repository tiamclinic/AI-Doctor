"use client";

import { FaceLandmarkOverlay } from "@/components/FaceLandmarkOverlay";
import { FaceTypeImpressionCard } from "@/components/result/FaceTypeImpressionCard";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import type { DetectResult } from "@/lib/faceAnalysis/types";

type ResultHeroProps = {
  photoDataUrl: string;
  detectResult: DetectResult | null;
  scoreResult: ScoreResult;
};

export function ResultHero({
  photoDataUrl,
  detectResult,
  scoreResult,
}: ResultHeroProps) {
  return (
    <section className="border-border/80 bg-card overflow-hidden rounded-xl border p-4 shadow-sm sm:p-5">
      <div className="border-border bg-muted/30 relative overflow-hidden rounded-xl border">
        <FaceLandmarkOverlay
          dataUrl={photoDataUrl}
          result={detectResult}
          showLandmarks={false}
          showGoldenGuide
          rawMetrics={scoreResult.rawValues}
        />
      </div>
      <FaceTypeImpressionCard scoreResult={scoreResult} />
    </section>
  );
}
