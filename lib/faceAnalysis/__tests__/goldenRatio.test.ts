import { describe, expect, it } from "vitest";

import { makeIdealLandmarks } from "@/lib/faceAnalysis/__tests__/dummyLandmarks";
import { computeRawMetrics, IDEAL } from "@/lib/faceAnalysis/goldenRatio";
import { computeScore, roundTo } from "@/lib/faceAnalysis/scoring";

describe("goldenRatio.computeRawMetrics", () => {
  it("理想配置の場合、各指標が理想値とほぼ一致する", () => {
    const lms = makeIdealLandmarks();
    const raw = computeRawMetrics(lms);

    // 縦三分割（院内典型 17:39:44）
    expect(raw.verticalThirds.ratios[0]).toBeCloseTo(0.17, 2);
    expect(raw.verticalThirds.ratios[1]).toBeCloseTo(0.39, 2);
    expect(raw.verticalThirds.ratios[2]).toBeCloseTo(0.44, 2);

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
    // T-18
    expect(raw.eyePosition.ratio).toBeCloseTo(IDEAL.eyePosition, 5);
    expect(raw.bilateralSymmetry.meanAsymmetry).toBeCloseTo(0, 5);
  });

  it("ランドマークが 468 点未満なら例外を投げる", () => {
    expect(() => computeRawMetrics([])).toThrow(/Insufficient landmarks/);
  });
});

describe("scoring.computeScore", () => {
  it("キャリブレーション済みダミーは総合80点台以上・各指標も高スコア", () => {
    const result = computeScore(makeIdealLandmarks());

    expect(result.totalScore).toBeGreaterThanOrEqual(80);
    expect(result.scores.verticalThirds).toBe(100);
    expect(result.scores.eyePosition).toBe(100);
    expect(result.scores.faceContour).toBe(100);
    expect(result.scores.horizontalFifths).toBe(100);
    expect(result.scores.eyeSpacing).toBe(100);
    expect(result.scores.noseMouthRatio).toBe(100);
    expect(result.scores.eLine).toBe(100);
    expect(result.scores.bilateralSymmetry).toBe(100);
  });

  it("院内典型に近いプロポートでも総合80点台以上", () => {
    const result = computeScore(
      makeIdealLandmarks({
        verticalSections: [16, 39, 45],
        interEyeToEye: 0.68,
        noseMouthRatio: 0.82,
      }),
    );
    expect(result.totalScore).toBeGreaterThanOrEqual(80);
  });

  it("出力は小数第 1 位まで丸められる", () => {
    const result = computeScore(makeIdealLandmarks());
    for (const key of Object.keys(result.scores) as (keyof typeof result.scores)[]) {
      const v = result.scores[key];
      expect(v).toBe(roundTo(v, 1));
    }
    expect(result.totalScore).toBe(roundTo(result.totalScore, 1));
  });

  it("縦三分割が大きく崩れていれば縦三分割と目の縦位置スコアが下がる", () => {
    const lms = makeIdealLandmarks({ verticalSections: [2, 1, 1] });
    const result = computeScore(lms);
    expect(result.scores.verticalThirds).toBeLessThan(80);
    expect(result.scores.eyePosition).toBeLessThan(100);
  });

  it("典型の目帯比率(約0.16)はスコア下限30に張り付かない", () => {
    const result = computeScore(
      makeIdealLandmarks({ verticalSections: [16, 39, 45] }),
    );
    expect(result.scores.eyePosition).toBeGreaterThan(30);
    expect(result.scores.eyePosition).toBeGreaterThan(85);
  });

  it("左右非対称なら左右対称性スコアが下がる", () => {
    const lms = makeIdealLandmarks({ leftEyeShiftX: 0.08 });
    const raw = computeRawMetrics(lms);
    expect(raw.bilateralSymmetry.meanAsymmetry).toBeGreaterThan(0.001);
    const result = computeScore(lms);
    expect(result.scores.bilateralSymmetry).toBeLessThan(100);
  });

  it("鼻口比率が典型から大きく外れるとスコアが下がる", () => {
    const lms = makeIdealLandmarks({ noseMouthRatio: 1.0 }); // 鼻幅 = 口幅
    const result = computeScore(lms);
    expect(result.scores.noseMouthRatio).toBeLessThan(70);
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
