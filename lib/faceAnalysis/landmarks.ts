// MediaPipe Face Landmarker (478 点 / Face Mesh) における主要点のインデックス。
// 画像は鏡像でないため、座標系は「画像上の x が右に増える」前提。
// MediaPipe の "right/left" は被写体本人の左右ではなく画像上の左右で定義されている。

export const TIAM_LANDMARK_INDEX = {
  // 顔の縦軸
  hairline: 10, // 額の上端（髪生え際の近似）
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

export const PHI = (1 + Math.sqrt(5)) / 2; // 1.618...
