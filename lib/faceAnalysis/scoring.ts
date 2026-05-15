// 黄金比スコアリングを行うための関数
import {
  computeRawMetrics,
  IDEAL,
  type MetricKey,
  type RawMetrics,
} from "@/lib/faceAnalysis/goldenRatio";
import type { Landmark } from "@/lib/faceAnalysis/types";

export type ScoreResult = {
  totalScore: number; // 総合スコア
  scores: Record<MetricKey, number>; // 各指標のスコア
  rawValues: RawMetrics; // 生値
};

// 加重平均の重み（合計 1.0）。T-18 で eyePosition / bilateralSymmetry を追加し再配分。
export const METRIC_WEIGHTS: Record<MetricKey, number> = {
  verticalThirds: 0.17,
  horizontalFifths: 0.12,
  eyeSpacing: 0.12,
  eyePosition: 0.09,
  noseMouthRatio: 0.17,
  eLine: 0.12,
  faceContour: 0.12,
  bilateralSymmetry: 0.09,
};

// 正規化係数 k: |相対乖離| × k × 100 を 100 から引く。
// 値を大きくすると同じ乖離でもスコアが厳しく出る。チューニング用。
const K: Record<MetricKey, number> = {
  verticalThirds: 2.6,
  horizontalFifths: 2.2,
  eyeSpacing: 2.0,
  eyePosition: 2.2,
  noseMouthRatio: 2.4,
  eLine: 2.0,
  faceContour: 2.2,
  /** meanAsymmetry は顔幅正規化済の小さな量のため k を大きめに */
  bilateralSymmetry: 22,
};

// 下限・上限（極端な顔でも 30 点を下回らない）
const MIN_SCORE = 30; // 最低スコア
const MAX_SCORE = 100; // 最高スコア

const clamp = (v: number, min = MIN_SCORE, max = MAX_SCORE) => // スコアをクランプ
  Math.max(min, Math.min(max, v));

// 比率 (実測 / 理想) または相対乖離から 0-100 を算出する共通関数
const scoreFromDeviation = (deviation: number, key: MetricKey): number => { // 比率 (実測 / 理想) または相対乖離から 0-100 を算出する共通関数   
  const raw = 100 - Math.abs(deviation) * K[key] * 100; // 生値を計算
  return clamp(raw); // スコアをクランプ
};

// 縦三分割: 各セクション比率 (a, b, c) の理想 (1/3 ずつ) からの分散
const scoreVerticalThirds = (raw: RawMetrics["verticalThirds"]): number => { // 縦三分割: 各セクション比率 (a, b, c) の理想 (1/3 ずつ) からの分散
  const ideal = 1 / 3; // 理想値
  const dev =
    raw.ratios.reduce((sum, r) => sum + Math.abs(r - ideal), 0) / 3; // 分散を計算
  return scoreFromDeviation(dev, "verticalThirds"); // スコアを計算
};

// 横五分割 / 目間 / 顔輪郭比 / 鼻口比: 1 つの比率に対する乖離
const scoreRatio = ( // 横五分割 / 目間 / 顔輯/ 鼻口比: 1 つの比率に対する乖離
  actual: number,
  ideal: number,
  key: MetricKey,
): number => {
  if (!Number.isFinite(actual) || ideal === 0) return MIN_SCORE; // スコアを計算
  const dev = (actual - ideal) / ideal; // 分散を計算
  return scoreFromDeviation(dev, key);
};

// E ライン: 上下唇の平均乖離。値は顔幅で正規化済（0 が理想）
const scoreELine = (raw: RawMetrics["eLine"]): number => {
  const dev = (raw.upperLipDeviation + raw.lowerLipDeviation) / 2;
  return scoreFromDeviation(dev, "eLine");
};

const scoreBilateralSymmetry = (raw: RawMetrics["bilateralSymmetry"]): number =>
  scoreFromDeviation(raw.meanAsymmetry, "bilateralSymmetry");

export function scoreRawMetrics(raw: RawMetrics): ScoreResult {
  const scores: Record<MetricKey, number> = {
    verticalThirds: scoreVerticalThirds(raw.verticalThirds),
    horizontalFifths: scoreRatio(
      raw.horizontalFifths.ratio,
      IDEAL.horizontalFifths,
      "horizontalFifths",
    ),
    eyeSpacing: scoreRatio(
      raw.eyeSpacing.ratio,
      IDEAL.eyeSpacing,
      "eyeSpacing",
    ),
    eyePosition: scoreRatio(
      raw.eyePosition.ratio,
      IDEAL.eyePosition,
      "eyePosition",
    ),
    noseMouthRatio: scoreRatio(
      raw.noseMouthRatio.ratio,
      IDEAL.noseMouthRatio,
      "noseMouthRatio",
    ),
    eLine: scoreELine(raw.eLine),
    faceContour: scoreRatio(
      raw.faceContour.ratio,
      IDEAL.faceContour,
      "faceContour",
    ),
    bilateralSymmetry: scoreBilateralSymmetry(raw.bilateralSymmetry),
  };

  const total =
    (Object.keys(scores) as MetricKey[]).reduce(
      (acc, key) => acc + scores[key] * METRIC_WEIGHTS[key],
      0,
    );

  return {
    totalScore: roundTo(total, 1),
    scores: {
      verticalThirds: roundTo(scores.verticalThirds, 1),
      horizontalFifths: roundTo(scores.horizontalFifths, 1),
      eyeSpacing: roundTo(scores.eyeSpacing, 1),
      eyePosition: roundTo(scores.eyePosition, 1),
      noseMouthRatio: roundTo(scores.noseMouthRatio, 1),
      eLine: roundTo(scores.eLine, 1),
      faceContour: roundTo(scores.faceContour, 1),
      bilateralSymmetry: roundTo(scores.bilateralSymmetry, 1),
    },
    rawValues: raw,
  };
}

export function computeScore(landmarks: Landmark[]): ScoreResult {
  const raw = computeRawMetrics(landmarks);
  return scoreRawMetrics(raw);
}

export function roundTo(value: number, digits: number): number {
  const m = 10 ** digits;
  return Math.round(value * m) / m;
}

export const METRIC_LABELS: Record<MetricKey, string> = {
  verticalThirds: "縦三分割バランス",
  horizontalFifths: "横五分割バランス",
  eyeSpacing: "目間バランス",
  eyePosition: "目の位置（縦）",
  noseMouthRatio: "鼻口比率",
  eLine: "E ライン整合度",
  faceContour: "顔輪郭比率",
  bilateralSymmetry: "左右対称性",
};

// チューニングメモ:
// - 指標は「理想値からの相対乖離」または顔幅正規化済の絶対乖離で 0-100 に正規化し、加重平均する。
// - T-18: eyePosition（目帯の縦位置比率）と bilateralSymmetry（左右ペア中点のずれ平均）を追加。
// - MIN_SCORE=30, MAX_SCORE=100 で下限ガード。
