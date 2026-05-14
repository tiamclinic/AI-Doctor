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

// 加重平均の重み（合計 1.0）
export const METRIC_WEIGHTS: Record<MetricKey, number> = {
  verticalThirds: 0.2, // 縦三分割バランスの重み  
  horizontalFifths: 0.15, // 横五分割バランスの重み
  eyeSpacing: 0.15, // 目間バランスの重み
  noseMouthRatio: 0.2, // 鼻口比率の重み
  eLine: 0.15, // E ライン整合度の重み
  faceContour: 0.15, // 顔輪郭比率の重み
};

// 正規化係数 k: |相対乖離| × k × 100 を 100 から引く。
// 値を大きくすると同じ乖離でもスコアが厳しく出る。チューニング用。
const K: Record<MetricKey, number> = { // 正規化係数 k
  verticalThirds: 2.6, // 縦三分割バランスの正規化係数
  horizontalFifths: 2.2, // 横五分割バランスの正規化係数
  eyeSpacing: 2.0, // 目間バランスの正規化係数
  noseMouthRatio: 2.4, // 鼻口比率の正規化係数
  eLine: 2.0, // eLine は乖離値自体が小さい（顔幅正規化済）ので k は小さめ
  faceContour: 2.2, // 顔輪郭比率の正規化係数
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
const scoreELine = (raw: RawMetrics["eLine"]): number => { // E ライン: 上下唇の平均乖離。値は顔幅で正規化済（0 が理想）
  const dev = (raw.upperLipDeviation + raw.lowerLipDeviation) / 2; // 分散を計算
  return scoreFromDeviation(dev, "eLine"); // スコアを計算
};

export function scoreRawMetrics(raw: RawMetrics): ScoreResult { // 生値から 0-100 のスコアを計算
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
      noseMouthRatio: roundTo(scores.noseMouthRatio, 1),
      eLine: roundTo(scores.eLine, 1),
      faceContour: roundTo(scores.faceContour, 1),
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
  noseMouthRatio: "鼻口比率",
  eLine: "E ライン整合度",
  faceContour: "顔輪郭比率",
};

// チューニングメモ:
// - 全 6 指標を「理想値からの相対乖離」で 0-100 に正規化し、加重平均する設計。
// - k 値は MVP のデモ用に "うっすらメリハリが出る" 程度に調整：
//   * verticalThirds: 3 セクションの平均乖離（理想 0.333 から）→ k=2.6
//   * 顔幅依存の比率指標は k=2.0〜2.4
// - MIN_SCORE=30, MAX_SCORE=100 で下限ガード。極端な顔でも 30 を下回らない。
// - 加重: noseMouthRatio と verticalThirds が体感に直結するので各 0.20。
//   残りは 0.15 ずつ。マーケ要望に応じて再チューニング可能。
