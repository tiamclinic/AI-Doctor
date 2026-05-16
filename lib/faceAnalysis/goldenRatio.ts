// 黄金比スコアリングを行うための関数
import {
  TIAM_BILATERAL_POINT_PAIRS,
  TIAM_LANDMARK_INDEX,
} from "@/lib/faceAnalysis/landmarks";
import type { Landmark } from "@/lib/faceAnalysis/types";

// 指標のキーを管理するための型
export type MetricKey =
  | "verticalThirds"
  | "horizontalFifths"
  | "eyeSpacing"
  | "eyePosition"
  | "noseMouthRatio"
  | "eLine"
  | "faceContour"
  | "bilateralSymmetry";

// 生値を管理するための型
export type RawMetrics = {
  // 縦三分割: [上段, 中段, 下段] の長さ
  verticalThirds: { sections: [number, number, number]; ratios: [number, number, number] };
  // 横五分割: 顔幅 / (片目幅 × 5)
  horizontalFifths: { faceWidth: number; eyeWidth: number; ratio: number };
  // 目間 / 目幅
  eyeSpacing: { interEye: number; eyeWidth: number; ratio: number };
  // 鼻口比率: 鼻幅 / 口幅
  noseMouthRatio: { noseWidth: number; mouthWidth: number; ratio: number };
  // E ライン整合度: 鼻先-顎先を結ぶ直線からの上唇/下唇の垂直距離（顔幅で正規化）
  eLine: { upperLipDeviation: number; lowerLipDeviation: number };
  // 顔輪郭比率: 顔幅 / 顔長
  faceContour: { faceWidth: number; faceHeight: number; ratio: number };
  // 目の縦位置: (両眼 y 平均 − 眉間 y) / 顔長（眉間〜顎）
  eyePosition: { eyeY: number; faceHeight: number; ratio: number };
  // 左右対称性: 各左右ペアの中点 x が顔の左右中点からずれる量の平均（顔幅で正規化、0 が理想）
  bilateralSymmetry: { meanAsymmetry: number };
};

/**
 * 生え際〜眉間が顔長に占める典型比率（正面・MediaPipe 478 点の経験値）。
 * 眉間基準に顔長を切り替えたときの顔輪郭比理想へ換算するために使う。
 */
export const TYPICAL_FOREHEAD_SHARE = 0.21;

/** 眉間〜顎の縦三分割（眉〜目 / 目〜鼻下 / 鼻下〜顎）の正面典型比率 */
export const TYPICAL_VERTICAL_THIRDS = [0.17, 0.39, 0.44] as const;

// 理想値を管理するためのオブジェクト（理論黄金比より MediaPipe 正面の典型を優先）
export const IDEAL = {
  verticalThirds: TYPICAL_VERTICAL_THIRDS,
  horizontalFifths: 1.0,
  /** 目間/目幅。正面ランドマークでは 1.0 より狭めに出やすい */
  eyeSpacing: 0.72,
  /**
   * 目帯の縦位置（眉間〜顎）。生値は verticalThirds の上段比率と同じ。
   */
  eyePosition: TYPICAL_VERTICAL_THIRDS[0],
  /** 鼻幅/口幅。黄金比 1:φ より正面メッシュではやや大きめに出やすい */
  noseMouthRatio: 0.78,
  /** 顔幅:顔長（眉間〜顎）。1:1.46 を生え際基準から眉間基準へ換算し、典型を微調整 */
  faceContour: 0.92,
} as const;

const requirePoint = (landmarks: Landmark[], index: number): Landmark => {
  const p = landmarks[index];
  if (!p) {
    throw new Error(`Landmark index ${index} is out of range (got ${landmarks.length}).`);
  }
  return p;
};

export function computeRawMetrics(landmarks: Landmark[]): RawMetrics {
  if (landmarks.length < 468) {
    throw new Error(
      `Insufficient landmarks: expected at least 468, got ${landmarks.length}.`,
    );
  }

  const idx = TIAM_LANDMARK_INDEX;
  const p = (i: number) => requirePoint(landmarks, i);

  // --- 顔の縦基準: 眉間〜顎（生え際は個人差が大きくスコアから除外）---
  const brow = p(idx.glabella);
  const nasal = p(idx.subnasale);
  const chin = p(idx.chin);

  const reOuter = p(idx.rightEyeOuter);
  const reInner = p(idx.rightEyeInner);
  const leInner = p(idx.leftEyeInner);
  const leOuter = p(idx.leftEyeOuter);
  const eyeY =
    (reOuter.y + reInner.y + leInner.y + leOuter.y) / 4;

  const faceHeight = Math.abs(chin.y - brow.y);

  // --- 縦三分割: 眉間〜目 / 目〜鼻下 / 鼻下〜顎 ---
  const section1 = Math.abs(eyeY - brow.y);
  const section2 = Math.abs(nasal.y - eyeY);
  const section3 = Math.abs(chin.y - nasal.y);
  const totalVertical = section1 + section2 + section3;

  const verticalThirds = {
    sections: [section1, section2, section3] as [number, number, number],
    ratios: [
      section1 / totalVertical,
      section2 / totalVertical,
      section3 / totalVertical,
    ] as [number, number, number],
  };

  // --- 顔幅 / 顔長（眉間〜顎）---
  const faceR = p(idx.faceRight);
  const faceL = p(idx.faceLeft);
  const faceWidth = Math.abs(faceL.x - faceR.x);
  const eyeWidthR = Math.abs(reInner.x - reOuter.x);
  const eyeWidthL = Math.abs(leOuter.x - leInner.x);
  const eyeWidth = (eyeWidthR + eyeWidthL) / 2;
  const interEye = Math.abs(leInner.x - reInner.x);

  // --- 横五分割: 顔幅 = 目幅 × 5 が理想 ---
  const horizontalFifths = {
    faceWidth,
    eyeWidth,
    ratio: faceWidth / (eyeWidth * 5),
  };

  // --- 目間バランス: 目間 / 目幅 ---
  const eyeSpacing = {
    interEye,
    eyeWidth,
    ratio: interEye / eyeWidth,
  };

  // --- 鼻口比率: 鼻幅 / 口幅 ---
  const rAla = p(idx.rightAla);
  const lAla = p(idx.leftAla);
  const rMouth = p(idx.rightMouthCorner);
  const lMouth = p(idx.leftMouthCorner);
  const noseWidth = Math.abs(lAla.x - rAla.x);
  const mouthWidth = Math.abs(lMouth.x - rMouth.x);
  const noseMouthRatio = {
    noseWidth,
    mouthWidth,
    ratio: mouthWidth === 0 ? 0 : noseWidth / mouthWidth,
  };

  // --- E ライン整合度 ---
  // 鼻先 - 顎先を結ぶ直線（顔の側面プロファイル相当）に対する、
  // 上唇 / 下唇の符号付き水平距離。本来は側面写真で意味を持つ概念だが、
  // 正面写真でも「鼻先-顎先の中心軸からの唇のはみ出し具合」として近似する。
  const nose = p(idx.noseTip);
  const upperLip = p(idx.upperLipTop);
  const lowerLip = p(idx.lowerLipBottom);

  const lineDx = chin.x - nose.x;
  const lineDy = chin.y - nose.y;
  const lineLen = Math.hypot(lineDx, lineDy) || 1;
  const projectDeviation = (q: Landmark): number => {
    // 点 q と直線（nose -> chin）の符号付き距離。線が y 軸付近に立つので、
    // 顔幅で正規化して 0 に近いほど良い。
    const cross = lineDx * (q.y - nose.y) - lineDy * (q.x - nose.x);
    return Math.abs(cross) / lineLen / (faceWidth || 1);
  };
  const eLine = {
    upperLipDeviation: projectDeviation(upperLip),
    lowerLipDeviation: projectDeviation(lowerLip),
  };

  // --- 顔輪郭比率 ---
  const faceContour = {
    faceWidth,
    faceHeight,
    ratio: faceHeight === 0 ? 0 : faceWidth / faceHeight,
  };

  // --- 目の縦位置（T-18）---
  const eyePosition = {
    eyeY,
    faceHeight,
    ratio: faceHeight === 0 ? 0 : (eyeY - brow.y) / faceHeight,
  };

  // --- 左右対称性（T-18）: 左右ペアの中点が頬ラインの中点から離れる量 ---
  const xMid = (faceR.x + faceL.x) / 2;
  let asymSum = 0;
  let asymCount = 0;
  for (const [aKey, bKey] of TIAM_BILATERAL_POINT_PAIRS) {
    const ia = TIAM_LANDMARK_INDEX[aKey];
    const ib = TIAM_LANDMARK_INDEX[bKey];
    const pa = p(ia);
    const pb = p(ib);
    const pairMidX = (pa.x + pb.x) / 2;
    const err = Math.abs(pairMidX - xMid) / (faceWidth || 1);
    asymSum += err;
    asymCount += 1;
  }
  const bilateralSymmetry = {
    meanAsymmetry: asymCount === 0 ? 0 : asymSum / asymCount,
  };

  return {
    verticalThirds,
    horizontalFifths,
    eyeSpacing,
    eyePosition,
    noseMouthRatio,
    eLine,
    faceContour,
    bilateralSymmetry,
  };
}
