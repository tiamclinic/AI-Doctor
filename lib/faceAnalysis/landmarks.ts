import type { Landmark } from "./types";

// MediaPipe Face Landmarker (478 点 / Face Mesh) における主要点のインデックス。
// 画像は鏡像でないため、座標系は「画像上の x が右に増える」前提。
// MediaPipe の "right/left" は被写体本人の左右ではなく画像上の左右で定義されている。

export const TIAM_LANDMARK_INDEX = {
  // 顔の縦軸
  hairline: 10, // 額の上端（髪生え際の近似・単体参照用）
  glabella: 9, // 眉間
  subnasale: 2, // 鼻下
  chin: 152, // 顎先
  noseTip: 1, // 鼻先

  // 顔の横幅（頬骨ライン）
  faceRight: 234, // 画像右側の頬
  faceLeft: 454, // 画像左側の頬

  // 目（外側コーナー / 内側コーナー）
  rightEyeOuter: 33,
  rightEyeInner: 133,
  leftEyeInner: 362,
  leftEyeOuter: 263,

  // 鼻翼
  rightAla: 49,
  leftAla: 279,

  // 口
  rightMouthCorner: 61,
  leftMouthCorner: 291,
  upperLipTop: 13, // 上唇上端の中央
  lowerLipBottom: 17, // 下唇下端の中央
} as const;

export type TiamLandmarkIndex = (typeof TIAM_LANDMARK_INDEX)[keyof typeof TIAM_LANDMARK_INDEX];

/**
 * 額・こめかみ付近の候補から「最も上」（画像座標で y が最小）の点を選ぶ。
 * 単一の 10 点より実際の生え際に寄せやすい（前髪で 10 が下がりがちな場合の改善）。
 * MediaPipe Face Landmarker 478 点前提。存在しない index は無視。
 */
export const FOREHEAD_TOP_CANDIDATE_INDICES = [10, 151, 338, 297, 109] as const;

export function pickForeheadTopLandmark(landmarks: Landmark[]): Landmark {
  const idx = TIAM_LANDMARK_INDEX;
  const base = landmarks[idx.hairline];
  const brow = landmarks[idx.glabella];
  if (!base || !brow) {
    return base ?? brow!;
  }

  /** index 10 より上に寄せる上限（正規化 y）。大きいとメッシュ飛びで縦三分割が破綻する */
  const MAX_LIFT = 0.08;

  let best = base;
  for (const i of FOREHEAD_TOP_CANDIDATE_INDICES) {
    if (i === idx.hairline) continue;
    const p = landmarks[i];
    if (!p) continue;
    if (p.y >= best.y) continue;
    if (p.y >= brow.y - 0.012) continue;
    if (base.y - p.y > MAX_LIFT) continue;
    best = p;
  }

  if (best.y >= brow.y - 1e-4) {
    return { ...best, y: Math.max(0, brow.y - 0.025) };
  }

  return best;
}

export const PHI = (1 + Math.sqrt(5)) / 2; // 1.618...
