import { describe, expect, it } from "vitest";

import {
  makeIdealLandmarks,
  makeScoringTargetLandmarks,
} from "@/lib/faceAnalysis/__tests__/dummyLandmarks";
import { computeRawMetrics, IDEAL } from "@/lib/faceAnalysis/goldenRatio";
import { computeScore, roundTo } from "@/lib/faceAnalysis/scoring";

describe("goldenRatio.computeRawMetrics", () => {
  it("理想配置の場合、各指標が表示用典型値とほぼ一致する", () => {
    const lms = makeIdealLandmarks();
    const raw = computeRawMetrics(lms);

    expect(raw.verticalThirds.ratios[0]).toBeCloseTo(0.17, 2);
    expect(raw.horizontalFifths.ratio).toBeCloseTo(IDEAL.horizontalFifths, 5);
    expect(raw.eyeSpacing.ratio).toBeCloseTo(IDEAL.eyeSpacing, 5);
    expect(raw.noseMouthRatio.ratio).toBeCloseTo(IDEAL.noseMouthRatio, 5);
    expect(raw.faceContour.ratio).toBeCloseTo(IDEAL.faceContour, 5);
    expect(raw.eLine.upperLipDeviation).toBeCloseTo(0, 5);
    expect(raw.eyePosition.ratio).toBeCloseTo(IDEAL.eyePosition, 5);
    expect(raw.bilateralSymmetry.meanAsymmetry).toBeCloseTo(0, 5);
    expect(raw.eyeLevelSymmetry.eyeLevelDelta).toBeCloseTo(0, 5);
    expect(raw.mouthLevelSymmetry.mouthLevelDelta).toBeCloseTo(0, 5);
  });

  it("ランドマークが 468 点未満なら例外を投げる", () => {
    expect(() => computeRawMetrics([])).toThrow(/Insufficient landmarks/);
  });
});

describe("scoring.computeScore", () => {
  it("採点基準に合わせたダミーは総合80点台以上", () => {
    const result = computeScore(makeScoringTargetLandmarks());
    expect(result.totalScore).toBeGreaterThanOrEqual(80);
    expect(result.scores.faceContour).toBeGreaterThan(90);
    expect(result.scores.eyeLevelSymmetry).toBe(100);
    expect(result.scores.mouthLevelSymmetry).toBe(100);
  });

  it("MediaPipe 典型配置は厳しめ採点で総合は中程度（全指標100にならない）", () => {
    const result = computeScore(makeIdealLandmarks());
    expect(result.totalScore).toBeGreaterThan(45);
    expect(result.totalScore).toBeLessThan(85);
    const allPerfect = Object.values(result.scores).every((v) => v >= 99);
    expect(allPerfect).toBe(false);
  });

  it("MediaPipe 正面でよく出る目間比(1.35〜1.42)は下限30に張り付かない", () => {
    for (const interEyeToEye of [1.35, 1.4, 1.42]) {
      const result = computeScore(makeIdealLandmarks({ interEyeToEye }));
      expect(result.scores.eyeSpacing).toBeGreaterThan(30);
      expect(result.scores.eyeSpacing).not.toBe(30);
    }
  });

  it("MediaPipe 典型の顔輪郭比(1.28〜1.35)は下限30に張り付かず差別化される", () => {
    const scores = [1.28, 1.29, 1.35].map((faceWidthToHeight) =>
      computeScore(makeIdealLandmarks({ faceWidthToHeight })).scores.faceContour,
    );
    for (const s of scores) {
      expect(s).toBeGreaterThan(65);
      expect(s).not.toBe(30);
    }
    expect(scores[2]!).toBeLessThan(scores[0]!);
  });

  it("顔輪郭が採点基準(1.15)から外れると輪郭比スコアが下がる", () => {
    const aligned = computeScore(
      makeIdealLandmarks({ faceWidthToHeight: 1.15 }),
    );
    const round = computeScore(makeIdealLandmarks({ faceWidthToHeight: 1.45 }));
    expect(round.scores.faceContour).toBeLessThan(aligned.scores.faceContour);
    expect(round.scores.faceContour).not.toBe(30);
  });

  it("目間比が採点基準(1.0)から外れると目の間隔スコアが下がる", () => {
    const aligned = computeScore(makeIdealLandmarks({ interEyeToEye: 1.0 }));
    const wide = computeScore(makeIdealLandmarks({ interEyeToEye: 1.75 }));
    const typicalMp = computeScore(makeIdealLandmarks({ interEyeToEye: 1.39 }));
    expect(wide.scores.eyeSpacing).toBeLessThan(aligned.scores.eyeSpacing);
    expect(typicalMp.scores.eyeSpacing).toBeLessThan(aligned.scores.eyeSpacing);
  });

  it("目の高さ差が大きいと eyeLevelSymmetry が下がる", () => {
    const symmetric = computeScore(makeIdealLandmarks());
    const asymmetric = computeScore(
      makeIdealLandmarks({ leftEyeShiftY: faceSpanShiftY(0.04) }),
    );
    expect(asymmetric.rawValues.eyeLevelSymmetry.eyeLevelDelta).toBeGreaterThan(
      0.02,
    );
    expect(asymmetric.scores.eyeLevelSymmetry).toBeLessThan(
      symmetric.scores.eyeLevelSymmetry,
    );
    expect(asymmetric.scores.eyeLevelSymmetry).toBeLessThan(75);
  });

  it("口角の高さ差が大きいと mouthLevelSymmetry が下がる", () => {
    const symmetric = computeScore(makeIdealLandmarks());
    const asymmetric = computeScore(
      makeIdealLandmarks({ leftMouthShiftY: faceSpanShiftY(0.05) }),
    );
    expect(
      asymmetric.rawValues.mouthLevelSymmetry.mouthLevelDelta,
    ).toBeGreaterThan(0.02);
    expect(asymmetric.scores.mouthLevelSymmetry).toBeLessThan(
      symmetric.scores.mouthLevelSymmetry,
    );
    expect(asymmetric.scores.mouthLevelSymmetry).toBeLessThan(75);
  });

  it("非対称が強いと総合スコアは採点基準適合より低い", () => {
    const aligned = computeScore(makeScoringTargetLandmarks());
    const skewed = computeScore(
      makeScoringTargetLandmarks({
        leftEyeShiftY: faceSpanShiftY(0.05),
        leftMouthShiftY: faceSpanShiftY(0.06),
        leftEyeShiftX: 0.06,
      }),
    );
    expect(skewed.totalScore).toBeLessThan(aligned.totalScore);
    expect(skewed.totalScore).toBeLessThan(80);
  });

  it("出力は小数第 1 位まで丸められる", () => {
    const result = computeScore(makeIdealLandmarks());
    for (const key of Object.keys(result.scores) as (keyof typeof result.scores)[]) {
      const v = result.scores[key];
      expect(v).toBe(roundTo(v, 1));
    }
    expect(result.totalScore).toBe(roundTo(result.totalScore, 1));
  });

  it("典型の目帯比率(約0.17)は目の縦位置が高スコア（下限30に張り付かない）", () => {
    const result = computeScore(
      makeIdealLandmarks({ verticalSections: [17, 39, 44] }),
    );
    expect(result.rawValues.eyePosition.ratio).toBeCloseTo(0.17, 2);
    expect(result.scores.eyePosition).toBeGreaterThan(85);
    expect(result.scores.eyePosition).not.toBe(30);
  });

  it("縦三分割が大きく崩れていれば縦三分割と目の縦位置スコアが下がる", () => {
    const lms = makeIdealLandmarks({ verticalSections: [2, 1, 1] });
    const result = computeScore(lms);
    expect(result.scores.verticalThirds).toBeLessThan(80);
    expect(result.scores.eyePosition).toBeLessThan(100);
  });

  it("左右非対称なら左右対称性スコアが下がる", () => {
    const lms = makeIdealLandmarks({ leftEyeShiftX: 0.08 });
    const raw = computeRawMetrics(lms);
    expect(raw.bilateralSymmetry.meanAsymmetry).toBeGreaterThan(0.001);
    const result = computeScore(lms);
    expect(result.scores.bilateralSymmetry).toBeLessThan(100);
  });

  it("どんな入力でもスコアは 30〜100 の範囲に収まる（下限ガード）", () => {
    const lms = makeIdealLandmarks({
      verticalSections: [5, 1, 1],
      faceWidthToEye: 1,
      interEyeToEye: 5,
      noseMouthRatio: 5,
      faceWidthToHeight: 5,
      lipDeviation: 0.5,
      leftEyeShiftY: 0.2,
      leftMouthShiftY: 0.2,
    });
    const result = computeScore(lms);
    for (const v of Object.values(result.scores)) {
      expect(v).toBeGreaterThanOrEqual(30);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("eLine は算出されるが総合スコアの加重には含まれない", () => {
    const result = computeScore(makeIdealLandmarks());
    expect(result.scores.eLine).toBeGreaterThan(95);
    const weightedOnly = result.scores.verticalThirds * 0.15
      + result.scores.horizontalFifths * 0.09
      + result.scores.eyeSpacing * 0.09
      + result.scores.eyePosition * 0.07
      + result.scores.noseMouthRatio * 0.15
      + result.scores.faceContour * 0.1
      + result.scores.bilateralSymmetry * 0.07
      + result.scores.eyeLevelSymmetry * 0.15
      + result.scores.mouthLevelSymmetry * 0.13;
    expect(result.totalScore).toBeCloseTo(weightedOnly, 1);
  });

  it("同じ入力に対して何度実行しても同じスコアを返す（決定論）", () => {
    const lms = makeIdealLandmarks({ noseMouthRatio: 0.9 });
    expect(computeScore(lms)).toEqual(computeScore(lms));
  });
});

/** 顔長（眉間〜顎）に対する正規化 y シフトの目安（ダミー faceSpan ≈ 0.39） */
function faceSpanShiftY(fractionOfFaceHeight: number): number {
  return fractionOfFaceHeight * 0.39;
}
