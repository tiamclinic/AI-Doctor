import { PHI, TIAM_LANDMARK_INDEX } from "@/lib/faceAnalysis/landmarks";
import type { Landmark } from "@/lib/faceAnalysis/types";

/**
 * テスト用に、TIAM が参照する主要点だけ「目的の比率になるよう配置」した
 * 478 点ランドマーク配列を生成する。
 * 残りの点はすべて (0,0,0)。スコア計算は主要点のみを参照するため問題ない。
 */
type OverrideOptions = Partial<{
  // 縦三分割を 1:1:1 から崩したいときに上段・中段・下段の比を指定
  verticalSections: [number, number, number];
  // 顔幅 / 目幅 の比率（理想 5）
  faceWidthToEye: number;
  // 目間 / 目幅 の比率（理想 1）
  interEyeToEye: number;
  // 鼻幅 / 口幅 の比率（理想 1/PHI ≈ 0.618）
  noseMouthRatio: number;
  // 顔幅 / 顔長 の比率（理想 1/1.46 ≈ 0.685）
  faceWidthToHeight: number;
  // E ラインのずれ（0 なら鼻先-顎先の中心軸上）
  lipDeviation: number;
  /** 画像左側の目（leftEye*）の x をずらす量。左右対称性テスト用 */
  leftEyeShiftX: number;
}>;

const TOTAL_POINTS = 478;

export function makeIdealLandmarks(
  overrides: OverrideOptions = {},
): Landmark[] {
  const verticalSections = overrides.verticalSections ?? [1, 1, 1];
  const faceWidthToEye = overrides.faceWidthToEye ?? 5;
  const interEyeToEye = overrides.interEyeToEye ?? 1;
  const noseMouthRatio = overrides.noseMouthRatio ?? 1 / PHI;
  const faceWidthToHeight = overrides.faceWidthToHeight ?? 1 / 1.46;
  const lipDeviation = overrides.lipDeviation ?? 0;
  const leftEyeShiftX = overrides.leftEyeShiftX ?? 0;

  // 顔幅を 0.5、顔長は (顔幅 / faceWidthToHeight)
  const faceWidth = 0.5;
  const faceHeight = faceWidth / faceWidthToHeight;

  // 顔の中心と上下端
  const centerX = 0.5;
  const top = 0.5 - faceHeight / 2;
  const bottom = 0.5 + faceHeight / 2;
  const left = centerX - faceWidth / 2; // 画像上の左（被写体の右）
  const right = centerX + faceWidth / 2;

  // 縦三分割: top → brow → subnasale → chin
  const sectionSum =
    verticalSections[0] + verticalSections[1] + verticalSections[2];
  const browY = top + faceHeight * (verticalSections[0] / sectionSum);
  const subnasaleY =
    top + faceHeight * ((verticalSections[0] + verticalSections[1]) / sectionSum);

  // 目幅と目間
  const eyeWidth = faceWidth / faceWidthToEye;
  const interEye = eyeWidth * interEyeToEye;
  // 目は brow と subnasale の中間（中段の中央）あたりに置く
  const eyeY = (browY + subnasaleY) / 2;
  const rightEyeOuter = centerX - interEye / 2 - eyeWidth;
  const rightEyeInner = centerX - interEye / 2;
  const leftEyeInner = centerX + interEye / 2;
  const leftEyeOuter = centerX + interEye / 2 + eyeWidth;

  // 鼻と口
  const noseTipY = subnasaleY - faceHeight * 0.03;
  const mouthY = subnasaleY + faceHeight * 0.07;
  // 口幅は eyeWidth × 約 1.5 を基準とし、鼻幅は口幅 × noseMouthRatio
  const mouthWidth = eyeWidth * 1.8;
  const noseWidth = mouthWidth * noseMouthRatio;
  const upperLipY = mouthY - faceHeight * 0.02;
  const lowerLipY = mouthY + faceHeight * 0.02;

  const points: Landmark[] = new Array(TOTAL_POINTS)
    .fill(0)
    .map(() => ({ x: 0, y: 0, z: 0 }));

  const idx = TIAM_LANDMARK_INDEX;
  points[idx.hairline] = { x: centerX, y: top, z: 0 };
  points[idx.glabella] = { x: centerX, y: browY, z: 0 };
  points[idx.subnasale] = { x: centerX, y: subnasaleY, z: 0 };
  points[idx.chin] = { x: centerX, y: bottom, z: 0 };
  points[idx.noseTip] = { x: centerX, y: noseTipY, z: 0 };

  points[idx.faceRight] = { x: left, y: (top + bottom) / 2, z: 0 };
  points[idx.faceLeft] = { x: right, y: (top + bottom) / 2, z: 0 };

  points[idx.rightEyeOuter] = { x: rightEyeOuter, y: eyeY, z: 0 };
  points[idx.rightEyeInner] = { x: rightEyeInner, y: eyeY, z: 0 };
  points[idx.leftEyeInner] = { x: leftEyeInner + leftEyeShiftX, y: eyeY, z: 0 };
  points[idx.leftEyeOuter] = { x: leftEyeOuter + leftEyeShiftX, y: eyeY, z: 0 };

  points[idx.rightAla] = { x: centerX - noseWidth / 2, y: subnasaleY, z: 0 };
  points[idx.leftAla] = { x: centerX + noseWidth / 2, y: subnasaleY, z: 0 };

  points[idx.rightMouthCorner] = {
    x: centerX - mouthWidth / 2,
    y: mouthY,
    z: 0,
  };
  points[idx.leftMouthCorner] = {
    x: centerX + mouthWidth / 2,
    y: mouthY,
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
