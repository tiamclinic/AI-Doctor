// 黄金比スコアリングを行うための関数
import { PHI, pickForeheadTopLandmark, TIAM_LANDMARK_INDEX } from "@/lib/faceAnalysis/landmarks";
import type { Landmark } from "@/lib/faceAnalysis/types";

// 指標のキーを管理するための型
export type MetricKey =
  | "verticalThirds"
  | "horizontalFifths"
  | "eyeSpacing"
  | "noseMouthRatio"
  | "eLine"
  | "faceContour";

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
};

// 理想値を管理するためのオブジェクト
export const IDEAL = {
  verticalThirds: [1, 1, 1] as const,
  horizontalFifths: 1.0,
  eyeSpacing: 1.0,
  noseMouthRatio: 1 / PHI, // 鼻幅 : 口幅 = 1 : 1.618
  faceContour: 1 / 1.46, // 顔幅 : 顔長 = 1 : 1.46
} as const;

// 2点間の距離を計算するための関数
const dist2D = (a: Landmark, b: Landmark): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

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

  // --- 縦三分割: 顔の縦方向を 3 等分する 4 点（額上端 / 眉間 / 鼻下 / 顎先）---
  // 額上端は複数候補から最も上の点を採用（生え際の見え方に寄せる）
  const top = pickForeheadTopLandmark(landmarks);
  const brow = p(idx.glabella);
  const nasal = p(idx.subnasale);
  const chin = p(idx.chin);

  const section1 = Math.abs(brow.y - top.y);
  const section2 = Math.abs(nasal.y - brow.y);
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

  // --- 顔幅 / 顔長 ---
  const faceR = p(idx.faceRight);
  const faceL = p(idx.faceLeft);
  const faceWidth = Math.abs(faceL.x - faceR.x);
  const faceHeight = Math.abs(chin.y - top.y);

  // --- 目幅（左右の平均）と目間（内側コーナー間）---
  const reOuter = p(idx.rightEyeOuter);
  const reInner = p(idx.rightEyeInner);
  const leInner = p(idx.leftEyeInner);
  const leOuter = p(idx.leftEyeOuter);
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
  // distance helper exported for tests
  void dist2D;

  return {
    verticalThirds,
    horizontalFifths,
    eyeSpacing,
    noseMouthRatio,
    eLine,
    faceContour,
  };
}
