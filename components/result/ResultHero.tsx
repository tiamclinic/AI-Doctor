"use client";

import { FaceLandmarkOverlay } from "@/components/FaceLandmarkOverlay";
import { FaceTypeImpressionCard } from "@/components/result/FaceTypeImpressionCard";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import type { DetectResult } from "@/lib/faceAnalysis/types";

type ResultHeroProps = {
  photoDataUrl?: string | null;
  detectResult: DetectResult | null;
  scoreResult: ScoreResult;
};

export function ResultHero({
  photoDataUrl,
  detectResult,
  scoreResult,
}: ResultHeroProps) {
  return (
    <section className="result-hero border-border/80 bg-card overflow-hidden rounded-xl border p-4 shadow-sm sm:p-5">
      {photoDataUrl ? (
        <div className="border-border bg-muted/30 relative overflow-hidden rounded-xl border">
          <FaceLandmarkOverlay
            dataUrl={photoDataUrl}
            result={detectResult}
            showLandmarks={false}
            showGoldenGuide
            rawMetrics={scoreResult.rawValues}
          />
        </div>
      ) : (
        <div className="border-border bg-muted/40 text-muted-foreground flex aspect-[3/4] max-h-[420px] items-center justify-center rounded-xl border px-6 text-center text-xs leading-relaxed">
          写真は診断した端末のブラウザにのみ保持されています。スコアとレポートは表示できます。
        </div>
      )}
      <FaceTypeImpressionCard scoreResult={scoreResult} />
    </section>
  );
}
