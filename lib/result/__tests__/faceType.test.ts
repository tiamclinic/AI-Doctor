import { describe, expect, it } from "vitest";

import { makeIdealLandmarks } from "@/lib/faceAnalysis/__tests__/dummyLandmarks";
import { computeScore } from "@/lib/faceAnalysis/scoring";
import { scanForbidden } from "@/lib/prompt/forbiddenWords";
import {
  deriveFaceType,
  deriveImpressions,
} from "@/lib/result/faceType";

describe("deriveFaceType", () => {
  it("理想顔（ratio ≈ 0.685）は卵型ベース", () => {
    const score = computeScore(makeIdealLandmarks());
    expect(deriveFaceType(score)).toBe("卵型ベース");
  });

  it("面長寄り（faceWidthToHeight 小さめ）は面長系の文言", () => {
    const score = computeScore(makeIdealLandmarks({ faceWidthToHeight: 0.6 }));
    const label = deriveFaceType(score);
    expect(label).toMatch(/面長/);
  });

  it("丸顔寄り（faceWidthToHeight 大きめ）は丸顔系の文言", () => {
    const score = computeScore(makeIdealLandmarks({ faceWidthToHeight: 0.82 }));
    const label = deriveFaceType(score);
    expect(label).toMatch(/丸顔/);
  });
});

describe("deriveImpressions", () => {
  it("常に最大 3 件・禁止語なしで返る", () => {
    const score = computeScore(makeIdealLandmarks());
    const impressions = deriveImpressions(score);
    expect(impressions.length).toBeGreaterThan(0);
    expect(impressions.length).toBeLessThanOrEqual(3);
    for (const text of impressions) {
      expect(scanForbidden(text).ok).toBe(true);
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("非理想（強い崩れ）でも 3 件のフォールバックがある", () => {
    const score = computeScore(
      makeIdealLandmarks({ faceWidthToEye: 3.8, lipDeviation: 0.06 }),
    );
    const impressions = deriveImpressions(score);
    expect(impressions.length).toBeGreaterThanOrEqual(1);
    for (const text of impressions) {
      expect(scanForbidden(text).ok).toBe(true);
    }
  });
});
