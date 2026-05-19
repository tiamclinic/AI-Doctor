import { IDEAL, SCORING_TARGET } from "@/lib/faceAnalysis/goldenRatio";
import { TIAM_LANDMARK_INDEX } from "@/lib/faceAnalysis/landmarks";
import type { Landmark } from "@/lib/faceAnalysis/types";

/**
 * テスト用に、TIAM が参照する主要点だけ「目的の比率になるよう配置」した
 * 478 点ランドマーク配列を生成する。
 * 残りの点はすべて (0,0,0)。スコア計算は主要点のみを参照するため問題ない。
 *
 * 縦方向の基準は眉間〜顎（`goldenRatio.ts` と同じ）。
 */
type OverrideOptions = Partial<{
  // 眉間〜顎の縦三分割（眉〜目 / 目〜鼻下 / 鼻下〜顎）の比
  verticalSections: [number, number, number];
  // 顔幅 / 目幅 の比率（理想 5）
  faceWidthToEye: number;
  // 目間 / 目幅 の比率（`IDEAL.eyeSpacing` と整合）
  interEyeToEye: number;
  // 鼻幅 / 口幅 の比率（理想 1/PHI ≈ 0.618）
  noseMouthRatio: number;
  // 顔幅 / 顔長（眉間〜顎）の比率（理想 1/1.46 ≈ 0.685）
  faceWidthToHeight: number;
  // E ラインのずれ（0 なら鼻先-顎先の中心軸上）
  lipDeviation: number;
  /** 画像左側の目（leftEye*）の x をずらす量。左右対称性テスト用 */
  leftEyeShiftX: number;
  /** 画像左側の目の y をずらす量。目の高さ揃いテスト用 */
  leftEyeShiftY: number;
  /** 画像左側の口角の y をずらす量。口角の高さ揃いテスト用 */
  leftMouthShiftY: number;
}>;

const TOTAL_POINTS = 478;

export function makeIdealLandmarks(
  overrides: OverrideOptions = {},
): Landmark[] {
  // 正面ランドマークの典型（眉〜目 / 目〜鼻下 / 鼻下〜顎 ≒ 17:39:44）
  const verticalSections = overrides.verticalSections ?? [17, 39, 44];
  const faceWidthToEye = overrides.faceWidthToEye ?? 5;
  const interEyeToEye = overrides.interEyeToEye ?? IDEAL.eyeSpacing;
  const noseMouthRatio = overrides.noseMouthRatio ?? IDEAL.noseMouthRatio;
  const faceWidthToHeight = overrides.faceWidthToHeight ?? IDEAL.faceContour;
  const lipDeviation = overrides.lipDeviation ?? 0;
  const leftEyeShiftX = overrides.leftEyeShiftX ?? 0;
  const leftEyeShiftY = overrides.leftEyeShiftY ?? 0;
  const leftMouthShiftY = overrides.leftMouthShiftY ?? 0;

  const faceWidth = 0.5;
  const faceSpan = faceWidth / faceWidthToHeight;

  const centerX = 0.5;
  const chinY = 0.5 + faceSpan / 2;
  const browY = chinY - faceSpan;
  const top = browY - faceSpan * 0.12;

  const sectionSum =
    verticalSections[0] + verticalSections[1] + verticalSections[2];
  const seg1 = faceSpan * (verticalSections[0] / sectionSum);
  const seg2 = faceSpan * (verticalSections[1] / sectionSum);
  const eyeY = browY + seg1;
  const subnasaleY = browY + seg1 + seg2;

  const eyeWidth = faceWidth / faceWidthToEye;
  const interEye = eyeWidth * interEyeToEye;
  const rightEyeOuter = centerX - interEye / 2 - eyeWidth;
  const rightEyeInner = centerX - interEye / 2;
  const leftEyeInner = centerX + interEye / 2;
  const leftEyeOuter = centerX + interEye / 2 + eyeWidth;

  const noseTipY = subnasaleY - faceSpan * 0.03;
  const mouthY = subnasaleY + faceSpan * 0.07;
  const mouthWidth = eyeWidth * 1.8;
  const noseWidth = mouthWidth * noseMouthRatio;
  const upperLipY = mouthY - faceSpan * 0.02;
  const lowerLipY = mouthY + faceSpan * 0.02;

  const points: Landmark[] = new Array(TOTAL_POINTS)
    .fill(0)
    .map(() => ({ x: 0, y: 0, z: 0 }));

  const idx = TIAM_LANDMARK_INDEX;
  points[idx.hairline] = { x: centerX, y: top, z: 0 };
  points[idx.glabella] = { x: centerX, y: browY, z: 0 };
  points[idx.subnasale] = { x: centerX, y: subnasaleY, z: 0 };
  points[idx.chin] = { x: centerX, y: chinY, z: 0 };
  points[idx.noseTip] = { x: centerX, y: noseTipY, z: 0 };

  points[idx.faceRight] = { x: centerX - faceWidth / 2, y: (browY + chinY) / 2, z: 0 };
  points[idx.faceLeft] = { x: centerX + faceWidth / 2, y: (browY + chinY) / 2, z: 0 };

  points[idx.rightEyeOuter] = { x: rightEyeOuter, y: eyeY, z: 0 };
  points[idx.rightEyeInner] = { x: rightEyeInner, y: eyeY, z: 0 };
  points[idx.leftEyeInner] = {
    x: leftEyeInner + leftEyeShiftX,
    y: eyeY + leftEyeShiftY,
    z: 0,
  };
  points[idx.leftEyeOuter] = {
    x: leftEyeOuter + leftEyeShiftX,
    y: eyeY + leftEyeShiftY,
    z: 0,
  };

  points[idx.rightAla] = { x: centerX - noseWidth / 2, y: subnasaleY, z: 0 };
  points[idx.leftAla] = { x: centerX + noseWidth / 2, y: subnasaleY, z: 0 };

  points[idx.rightMouthCorner] = {
    x: centerX - mouthWidth / 2,
    y: mouthY,
    z: 0,
  };
  points[idx.leftMouthCorner] = {
    x: centerX + mouthWidth / 2,
    y: mouthY + leftMouthShiftY,
    z: 0,
  };
  points[idx.upperLipTop] = {
    x: centerX + lipDeviation,
    y: upperLipY,
    z: 0,
  };
  points[idx.lowerLipBottom] = {
    x: centerX + lipDeviation,
    y: lowerLipY,
    z: 0,
  };

  return points;
}

/** 厳しめ採点基準（`SCORING_TARGET`）に合わせたランドマーク配置 */
export function makeScoringTargetLandmarks(
  overrides: OverrideOptions = {},
): Landmark[] {
  return makeIdealLandmarks({
    verticalSections: [1, 1, 1],
    interEyeToEye: SCORING_TARGET.eyeSpacing,
    noseMouthRatio: SCORING_TARGET.noseMouthRatio,
    faceWidthToHeight: SCORING_TARGET.faceContour,
    ...overrides,
  });
}
