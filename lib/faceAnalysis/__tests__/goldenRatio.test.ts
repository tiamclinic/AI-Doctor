import { describe, expect, it } from "vitest";

import { makeIdealLandmarks } from "@/lib/faceAnalysis/__tests__/dummyLandmarks";
import { computeRawMetrics, IDEAL } from "@/lib/faceAnalysis/goldenRatio";
import { computeScore, roundTo } from "@/lib/faceAnalysis/scoring";

describe("goldenRatio.computeRawMetrics", () => {
  it("理想配置の場合、各指標が理想値とほぼ一致する", () => {
    const lms = makeIdealLandmarks();
    const raw = computeRawMetrics(lms);

    // 縦三分割
    expect(raw.verticalThirds.ratios[0]).toBeCloseTo(1 / 3, 5);
    expect(raw.verticalThirds.ratios[1]).toBeCloseTo(1 / 3, 5);
    expect(raw.verticalThirds.ratios[2]).toBeCloseTo(1 / 3, 5);

    // 横五分割
    expect(raw.horizontalFifths.ratio).toBeCloseTo(IDEAL.horizontalFifths, 5);
    // 目間
    expect(raw.eyeSpacing.ratio).toBeCloseTo(IDEAL.eyeSpacing, 5);
    // 鼻口比率
    expect(raw.noseMouthRatio.ratio).toBeCloseTo(IDEAL.noseMouthRatio, 5);
    // 顔輪郭比率
    expect(raw.faceContour.ratio).toBeCloseTo(IDEAL.faceContour, 5);
    // E ライン: 中心軸上なので 0 近傍
    expect(raw.eLine.upperLipDeviation).toBeCloseTo(0, 5);
    expect(raw.eLine.lowerLipDeviation).toBeCloseTo(0, 5);
  });

  it("ランドマークが 468 点未満なら例外を投げる", () => {
    expect(() => computeRawMetrics([])).toThrow(/Insufficient landmarks/);
  });
});

describe("scoring.computeScore", () => {
  it("理想配置なら全指標 100、総合 100", () => {
    const lms = makeIdealLandmarks();
    const result = computeScore(lms);

    expect(result.scores.verticalThirds).toBe(100);
    expect(result.scores.horizontalFifths).toBe(100);
    expect(result.scores.eyeSpacing).toBe(100);
    expect(result.scores.noseMouthRatio).toBe(100);
    expect(result.scores.eLine).toBe(100);
    expect(result.scores.faceContour).toBe(100);
    expect(result.totalScore).toBe(100);
  });

  it("出力は小数第 1 位まで丸められる", () => {
    const result = computeScore(makeIdealLandmarks());
    for (const key of Object.keys(result.scores) as (keyof typeof result.scores)[]) {
      const v = result.scores[key];
      expect(v).toBe(roundTo(v, 1));
    }
    expect(result.totalScore).toBe(roundTo(result.totalScore, 1));
  });

  it("縦三分割が大きく崩れていれば縦三分割スコアが下がる", () => {
    const lms = makeIdealLandmarks({ verticalSections: [2, 1, 1] });
    const result = computeScore(lms);
    expect(result.scores.verticalThirds).toBeLessThan(80);
    // 他の指標は影響を受けない
    expect(result.scores.horizontalFifths).toBe(100);
    expect(result.scores.eyeSpacing).toBe(100);
  });

  it("鼻口比率が黄金比から外れるとスコアが下がる", () => {
    const lms = makeIdealLandmarks({ noseMouthRatio: 1.0 }); // 鼻幅 = 口幅
    const result = computeScore(lms);
    expect(result.scores.noseMouthRatio).toBeLessThan(40);
  });

  it("どんな入力でもスコアは 30〜100 の範囲に収まる（下限ガード）", () => {
    const lms = makeIdealLandmarks({
      verticalSections: [5, 1, 1],
      faceWidthToEye: 1,
      interEyeToEye: 5,
      noseMouthRatio: 5,
      faceWidthToHeight: 5,
      lipDeviation: 0.5,
    });
    const result = computeScore(lms);
    for (const v of Object.values(result.scores)) {
      expect(v).toBeGreaterThanOrEqual(30);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(result.totalScore).toBeGreaterThanOrEqual(30);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it("同じ入力に対して何度実行しても同じスコアを返す（決定論）", () => {
    const lms = makeIdealLandmarks({ noseMouthRatio: 0.9 });
    const a = computeScore(lms);
    const b = computeScore(lms);
    expect(b).toEqual(a);
  });
});
