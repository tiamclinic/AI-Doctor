import type { MetricKey } from "@/lib/faceAnalysis/goldenRatio";
import { roundTo, type ScoreResult } from "@/lib/faceAnalysis/scoring";

/** パーツ分析カードの識別子（T-13 院方コンテンツのキーと揃える） */
export const PART_IDS = [
  "eyes",
  "nose",
  "mouth",
  "contour",
  "symmetry",
] as const;

export type PartId = (typeof PART_IDS)[number];

export const PART_LABELS: Record<PartId, string> = {
  eyes: "目",
  nose: "鼻",
  mouth: "口元",
  contour: "輪郭",
  symmetry: "左右対称性",
};

/**
 * パーツカードに表示する代表スコア（0–100、小数第 1 位）。
 * 複数指標にまたがるパーツは加重ではなく単純平均（MVP・表示用）。
 */
export function getPartDisplayScore(result: ScoreResult, partId: PartId): number {
  const { scores } = result;
  switch (partId) {
    case "eyes":
      return scores.eyeSpacing;
    case "nose":
      return roundTo((scores.noseMouthRatio + scores.eLine) / 2, 1);
    case "mouth":
      return scores.noseMouthRatio;
    case "contour":
      return roundTo((scores.faceContour + scores.verticalThirds) / 2, 1);
    case "symmetry":
      return scores.horizontalFifths;
    default: {
      const _exhaustive: never = partId;
      return _exhaustive;
    }
  }
}

/** デバッグ・将来の院方紐付け用に、参照している指標キーを列挙 */
export function getPartMetricKeys(partId: PartId): readonly MetricKey[] {
  switch (partId) {
    case "eyes":
      return ["eyeSpacing"];
    case "nose":
      return ["noseMouthRatio", "eLine"];
    case "mouth":
      return ["noseMouthRatio"];
    case "contour":
      return ["faceContour", "verticalThirds"];
    case "symmetry":
      return ["horizontalFifths"];
    default: {
      const _exhaustive: never = partId;
      return _exhaustive;
    }
  }
}
