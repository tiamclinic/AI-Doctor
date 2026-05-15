import { describe, expect, it } from "vitest";

import { makeIdealLandmarks } from "@/lib/faceAnalysis/__tests__/dummyLandmarks";
import type { MetricKey } from "@/lib/faceAnalysis/goldenRatio";
import { computeScore, type ScoreResult } from "@/lib/faceAnalysis/scoring";
import { replaceMedicalTerms, scanForbidden } from "@/lib/prompt/forbiddenWords";
import { PART_IDS } from "@/lib/result/parts";
import {
  assertPartSummaryTemplatesSafe,
  getHeroSummaryLine,
  getPartSummary,
} from "@/lib/result/partSummaries";

function withScores(overrides: Partial<Record<MetricKey, number>>): ScoreResult {
  const base = computeScore(makeIdealLandmarks());
  return {
    ...base,
    scores: { ...base.scores, ...overrides },
    totalScore: base.totalScore,
  };
}

describe("partSummaries", () => {
  it("静的テンプレートが禁止語スキャンに通る", () => {
    expect(() => assertPartSummaryTemplatesSafe()).not.toThrow();
  });

  it.each(PART_IDS)("getPartSummary が禁止語を含まない (%s)", (partId) => {
    const high = withScores({
      eyeSpacing: 92,
      eyePosition: 92,
      noseMouthRatio: 92,
      eLine: 92,
      faceContour: 92,
      verticalThirds: 92,
      horizontalFifths: 92,
      bilateralSymmetry: 92,
    });
    const mid = withScores({
      eyeSpacing: 78,
      eyePosition: 78,
      noseMouthRatio: 78,
      eLine: 78,
      faceContour: 78,
      verticalThirds: 78,
      horizontalFifths: 78,
      bilateralSymmetry: 78,
    });
    const low = withScores({
      eyeSpacing: 55,
      eyePosition: 55,
      noseMouthRatio: 55,
      eLine: 55,
      faceContour: 55,
      verticalThirds: 55,
      horizontalFifths: 55,
      bilateralSymmetry: 55,
    });
    for (const r of [high, mid, low]) {
      const text = replaceMedicalTerms(getPartSummary(r, partId));
      expect(scanForbidden(text).ok).toBe(true);
      expect(text.length).toBeGreaterThan(10);
    }
  });

  it("ヒーロー用サマリーも禁止語を含まない", () => {
    for (const t of [65, 80, 95]) {
      const line = replaceMedicalTerms(getHeroSummaryLine(t));
      expect(scanForbidden(line).ok).toBe(true);
    }
  });
});
