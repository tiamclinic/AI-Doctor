import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import { replaceMedicalTerms } from "@/lib/prompt/forbiddenWords";

/**
 * 顔タイプ: 顔輪郭比率（顔幅 / 顔長）と縦三分割のバランスから決める。
 * 理想 (1 / 1.46 ≒ 0.685) を中心に、面長寄り / 卵型 / 丸顔寄りで段階を切る。
 * 文言は薬機法配慮で「型」「寄り」止まり（治す・改善等の語は避ける）。
 */
export function deriveFaceType(scoreResult: ScoreResult): string {
  const ratio = scoreResult.rawValues.faceContour.ratio;

  if (!Number.isFinite(ratio)) return "卵型ベース";

  if (ratio < 0.62) return "面長ベース";
  if (ratio < 0.68) return "卵型ベース（やや面長寄り）";
  if (ratio <= 0.72) return "卵型ベース";
  if (ratio <= 0.78) return "卵型ベース（やや丸顔寄り）";
  return "丸顔ベース";
}

/**
 * 印象（最大 3 件）。スコア帯から決定論的に選び、出力は禁止語フィルタに掛ける。
 * 各候補は「美容バランスの傾向」に沿う中立的な形容に限定。
 */
export function deriveImpressions(scoreResult: ScoreResult): string[] {
  const s = scoreResult.scores;
  const total = scoreResult.totalScore;

  const picks: string[] = [];

  if (total >= 85) picks.push("上品");
  if (s.eLine >= 80) picks.push("優しい");
  if (s.horizontalFifths >= 80) picks.push("親しみやすい");
  if (s.faceContour >= 85) picks.push("洗練された");
  if (s.noseMouthRatio >= 85) picks.push("整った");
  if (s.eyeSpacing >= 85) picks.push("穏やか");

  if (picks.length < 3) {
    for (const candidate of ["親しみやすい", "穏やか", "ナチュラル", "落ち着いた"]) {
      if (picks.length >= 3) break;
      if (!picks.includes(candidate)) picks.push(candidate);
    }
  }

  return picks.slice(0, 3).map(replaceMedicalTerms);
}

/** 顔タイプ + 印象を 1 回で取り出すヘルパ */
export type FaceTypeAndImpressions = {
  faceType: string;
  impressions: string[];
};

export function deriveFaceTypeAndImpressions(
  scoreResult: ScoreResult,
): FaceTypeAndImpressions {
  return {
    faceType: deriveFaceType(scoreResult),
    impressions: deriveImpressions(scoreResult),
  };
}
