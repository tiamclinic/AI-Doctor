import { describe, expect, it } from "vitest";

import {
  isCompleteScoreResult,
  normalizeScoreResult,
  type ScoreResult,
} from "@/lib/faceAnalysis/scoring";

const legacyScores: ScoreResult["scores"] = {
  verticalThirds: 80,
  horizontalFifths: 80,
  eyeSpacing: 80,
  noseMouthRatio: 80,
  eLine: 80,
  faceContour: 80,
  bilateralSymmetry: 80,
} as ScoreResult["scores"];

describe("normalizeScoreResult", () => {
  it("欠損した指標キーを補完する", () => {
    const normalized = normalizeScoreResult({
      totalScore: 80,
      scores: legacyScores,
      rawValues: {
        verticalThirds: { sections: [1, 1, 1], ratios: [1 / 3, 1 / 3, 1 / 3] },
        horizontalFifths: { faceWidth: 1, eyeWidth: 1, ratio: 1 },
        eyeSpacing: { interEye: 1, eyeWidth: 1, ratio: 1 },
        noseMouthRatio: { noseWidth: 1, mouthWidth: 1, ratio: 0.6 },
        eLine: { upperLipDeviation: 0, lowerLipDeviation: 0 },
        faceContour: { faceWidth: 1, faceHeight: 1, ratio: 0.7 },
        bilateralSymmetry: { meanAsymmetry: 0.01 },
      },
    });

    expect(isCompleteScoreResult(normalized)).toBe(true);
    expect(normalized.scores.eyePosition).toBeTypeOf("number");
    expect(normalized.scores.eyeLevelSymmetry).toBeTypeOf("number");
    expect(normalized.scores.mouthLevelSymmetry).toBeTypeOf("number");
  });
});
