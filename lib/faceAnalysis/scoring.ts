// 黄金比スコアリングを行うための関数
import {
  computeRawMetrics,
  SCORING_TARGET,
  type MetricKey,
  type RawMetrics,
} from "@/lib/faceAnalysis/goldenRatio";
import type { Landmark } from "@/lib/faceAnalysis/types";

export type ScoreResult = {
  totalScore: number; // 総合スコア
  scores: Record<MetricKey, number>; // 各指標のスコア
  rawValues: RawMetrics; // 生値
};

// 加重平均の重み（合計 1.0）。eLine は正面では判別力がないため 0（算出のみ保持）。
export const METRIC_WEIGHTS: Record<MetricKey, number> = {
  verticalThirds: 0.15,
  horizontalFifths: 0.09,
  eyeSpacing: 0.09,
  eyePosition: 0.07,
  noseMouthRatio: 0.15,
  eLine: 0,
  faceContour: 0.1,
  bilateralSymmetry: 0.07,
  eyeLevelSymmetry: 0.15,
  mouthLevelSymmetry: 0.13,
};

const METRIC_KEYS = Object.keys(METRIC_WEIGHTS) as MetricKey[];

/** UI・AI診断・シェアカードに載せる指標（正面で実際にばらつくもののみ） */
export const DISPLAYED_METRIC_KEYS = [
  "verticalThirds",
  "horizontalFifths",
  "eyeSpacing",
  "eyePosition",
  "noseMouthRatio",
  "faceContour",
  "bilateralSymmetry",
  "eyeLevelSymmetry",
  "mouthLevelSymmetry",
] as const satisfies readonly MetricKey[];

export type DisplayedMetricKey = (typeof DISPLAYED_METRIC_KEYS)[number];

/** 総合スコアの加重平均に使う指標（重み > 0） */
export const WEIGHTED_METRIC_KEYS = DISPLAYED_METRIC_KEYS.filter(
  (key) => METRIC_WEIGHTS[key] > 0,
);

export function pickDisplayedScores(
  scores: Record<MetricKey, number>,
): Record<DisplayedMetricKey, number> {
  return Object.fromEntries(
    DISPLAYED_METRIC_KEYS.map((key) => [key, scores[key]]),
  ) as Record<DisplayedMetricKey, number>;
}

/**
 * 乖離ペナルティの全体スケール（1.0=厳しめ、小さいほど甘め）。
 * 表示用典型値（IDEAL）と採点基準（SCORING_TARGET）を分離したうえで 0.88 前後。
 */
export const SCORE_PENALTY_SCALE = 0.88;

// 正規化係数 k: |相対乖離| × k × SCORE_PENALTY_SCALE × 100 を 100 から引く。
const K: Record<MetricKey, number> = {
  verticalThirds: 2.2,
  horizontalFifths: 1.9,
  eyeSpacing: 1.7,
  eyePosition: 1.2,
  noseMouthRatio: 2.0,
  eLine: 1.8,
  faceContour: 1.9,
  bilateralSymmetry: 18,
  eyeLevelSymmetry: 16,
  mouthLevelSymmetry: 18,
};

// 下限・上限（極端な顔でも 30 点を下回らない）
const MIN_SCORE = 30;
const MAX_SCORE = 100;

const clamp = (v: number, min = MIN_SCORE, max = MAX_SCORE) =>
  Math.max(min, Math.min(max, v));

const scoreFromDeviation = (deviation: number, key: MetricKey): number => {
  const raw =
    100 - Math.abs(deviation) * K[key] * SCORE_PENALTY_SCALE * 100;
  return clamp(raw);
};

// 縦三分割: 採点基準は 1:1:1（SCORING_TARGET）
const scoreVerticalThirds = (raw: RawMetrics["verticalThirds"]): number => {
  const dev =
    raw.ratios.reduce(
      (sum, r, i) =>
        sum + Math.abs(r - SCORING_TARGET.verticalThirds[i]!),
      0,
    ) / 3;
  return scoreFromDeviation(dev, "verticalThirds");
};

const scoreRatio = (
  actual: number,
  target: number,
  key: MetricKey,
): number => {
  if (!Number.isFinite(actual) || target === 0) return MIN_SCORE;
  const dev = (actual - target) / target;
  return scoreFromDeviation(dev, key);
};

const scoreELine = (raw: RawMetrics["eLine"]): number => {
  const dev = (raw.upperLipDeviation + raw.lowerLipDeviation) / 2;
  return scoreFromDeviation(dev, "eLine");
};

const scoreBilateralSymmetry = (raw: RawMetrics["bilateralSymmetry"]): number =>
  scoreFromDeviation(raw.meanAsymmetry, "bilateralSymmetry");

const scoreEyeLevelSymmetry = (raw: RawMetrics["eyeLevelSymmetry"]): number =>
  scoreFromDeviation(raw.eyeLevelDelta, "eyeLevelSymmetry");

const scoreMouthLevelSymmetry = (raw: RawMetrics["mouthLevelSymmetry"]): number =>
  scoreFromDeviation(raw.mouthLevelDelta, "mouthLevelSymmetry");

export function scoreRawMetrics(raw: RawMetrics): ScoreResult {
  const scores: Record<MetricKey, number> = {
    verticalThirds: scoreVerticalThirds(raw.verticalThirds),
    horizontalFifths: scoreRatio(
      raw.horizontalFifths.ratio,
      SCORING_TARGET.horizontalFifths,
      "horizontalFifths",
    ),
    eyeSpacing: scoreRatio(
      raw.eyeSpacing.ratio,
      SCORING_TARGET.eyeSpacing,
      "eyeSpacing",
    ),
    eyePosition: scoreRatio(
      raw.eyePosition.ratio,
      SCORING_TARGET.eyePosition,
      "eyePosition",
    ),
    noseMouthRatio: scoreRatio(
      raw.noseMouthRatio.ratio,
      SCORING_TARGET.noseMouthRatio,
      "noseMouthRatio",
    ),
    eLine: scoreELine(raw.eLine),
    faceContour: scoreRatio(
      raw.faceContour.ratio,
      SCORING_TARGET.faceContour,
      "faceContour",
    ),
    bilateralSymmetry: scoreBilateralSymmetry(raw.bilateralSymmetry),
    eyeLevelSymmetry: scoreEyeLevelSymmetry(raw.eyeLevelSymmetry),
    mouthLevelSymmetry: scoreMouthLevelSymmetry(raw.mouthLevelSymmetry),
  };

  const total = WEIGHTED_METRIC_KEYS.reduce(
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
      eyeLevelSymmetry: roundTo(scores.eyeLevelSymmetry, 1),
      mouthLevelSymmetry: roundTo(scores.mouthLevelSymmetry, 1),
    },
    rawValues: raw,
  };
}

export function computeScore(landmarks: Landmark[]): ScoreResult {
  const raw = computeRawMetrics(landmarks);
  return scoreRawMetrics(raw);
}

export function isCompleteScoreResult(result: {
  scores: Partial<Record<MetricKey, number>>;
}): result is { scores: Record<MetricKey, number> } {
  return METRIC_KEYS.every((key) => {
    const value = result.scores[key];
    return typeof value === "number" && Number.isFinite(value);
  });
}

function coerceRawMetrics(partial: Partial<RawMetrics>): RawMetrics {
  const asym = partial.bilateralSymmetry?.meanAsymmetry ?? 0.02;
  const verticalThirds = partial.verticalThirds ?? {
    sections: [1, 1, 1] as [number, number, number],
    ratios: [...SCORING_TARGET.verticalThirds] as [number, number, number],
  };

  return {
    verticalThirds,
    horizontalFifths: partial.horizontalFifths ?? {
      faceWidth: 1,
      eyeWidth: 1,
      ratio: SCORING_TARGET.horizontalFifths,
    },
    eyeSpacing: partial.eyeSpacing ?? {
      interEye: 1,
      eyeWidth: 1,
      ratio: SCORING_TARGET.eyeSpacing,
    },
    eyePosition: partial.eyePosition ?? {
      eyeY: 0,
      faceHeight: 1,
      ratio: verticalThirds.ratios[0] ?? SCORING_TARGET.eyePosition,
    },
    noseMouthRatio: partial.noseMouthRatio ?? {
      noseWidth: 1,
      mouthWidth: 1,
      ratio: SCORING_TARGET.noseMouthRatio,
    },
    eLine: partial.eLine ?? { upperLipDeviation: 0, lowerLipDeviation: 0 },
    faceContour: partial.faceContour ?? {
      faceWidth: 1,
      faceHeight: 1,
      ratio: SCORING_TARGET.faceContour,
    },
    bilateralSymmetry: partial.bilateralSymmetry ?? { meanAsymmetry: asym },
    eyeLevelSymmetry: partial.eyeLevelSymmetry ?? { eyeLevelDelta: asym },
    mouthLevelSymmetry: partial.mouthLevelSymmetry ?? { mouthLevelDelta: asym },
  };
}

/** 旧キャッシュなど欠損キーを補完。ランドマークがあれば再計算を優先 */
export function normalizeScoreResult(
  result: {
    totalScore: number;
    scores: Partial<Record<MetricKey, number>>;
    rawValues: Partial<RawMetrics>;
  },
  landmarks?: Landmark[] | null,
): ScoreResult {
  if (isCompleteScoreResult(result)) {
    return {
      totalScore: result.totalScore,
      scores: result.scores,
      rawValues: result.rawValues as RawMetrics,
    };
  }

  if (landmarks && landmarks.length > 0) {
    return computeScore(landmarks);
  }

  return scoreRawMetrics(coerceRawMetrics(result.rawValues ?? {}));
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
  eyeLevelSymmetry: "目の高さ揃い",
  mouthLevelSymmetry: "口角の高さ揃い",
};
