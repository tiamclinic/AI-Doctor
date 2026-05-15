import { replaceMedicalTerms, scanForbidden } from "@/lib/prompt/forbiddenWords";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";

import { getPartDisplayScore, type PartId } from "@/lib/result/parts";

type Band = "high" | "mid" | "low";

function bandFromScore(score: number): Band {
  if (score >= 90) return "high";
  if (score >= 70) return "mid";
  return "low";
}

/**
 * パーツ別のルールベース短文（外部 AI 不使用）。
 * 語彙は薬機法配慮・`replaceMedicalTerms` と整合する表現に限定。
 */
const MESSAGES: Record<PartId, Record<Band, string>> = {
  eyes: {
    high: "目元周りの比率が整いやすく、全体の印象がまとまりやすい傾向です。",
    mid: "目元のアクセントを整えると、顔立ちのバランスが滑らかに見えやすくなります。",
    low: "目元まわりに個性が出やすいタイプです。ラインや陰影で重心を整えやすくなります。",
  },
  nose: {
    high: "鼻先から口元にかけてのラインが落ち着きやすく、正面の立ち上がりが整いやすいです。",
    mid: "鼻先と口元の距離感を意識すると、縦の流れがなめらかに見えやすくなります。",
    low: "鼻まわりに立体感が出やすい傾向です。光の当て方で縦ラインを整えやすくなります。",
  },
  mouth: {
    high: "口元の幅と鼻幅のバランスが取りやすく、口元が引き締まって見えやすいです。",
    mid: "口元の重心を少し整えると、表情の落ち着きが出やすくなります。",
    low: "口元に表情の強さが出やすいタイプです。リップのトーンでバランスを整えやすくなります。",
  },
  contour: {
    high: "顔の縦横の比率が黄金比に近く、輪郭のシルエットがまとまりやすいです。",
    mid: "顔の縦長・横長の印象を整えると、輪郭のなめらかさが増しやすくなります。",
    low: "輪郭に個性が出やすい傾向です。ヘアラインや陰影で輪郭を整えやすくなります。",
  },
  symmetry: {
    high: "左右のバランスが取りやすく、正面から見た均整が整いやすいです。",
    mid: "左右のわずかな差を意識すると、正面の均整感が高まりやすくなります。",
    low: "左右差が出やすい傾向です。髪の分け目や眉の形で視覚的に整えやすくなります。",
  },
};

export function getPartSummary(result: ScoreResult, partId: PartId): string {
  const s = getPartDisplayScore(result, partId);
  const b = bandFromScore(s);
  return replaceMedicalTerms(MESSAGES[partId][b]);
}

/** ヒーロー直下の 1 行サマリー（総合スコア帯） */
export function getHeroSummaryLine(totalScore: number): string {
  const b = bandFromScore(totalScore);
  const lines: Record<Band, string> = {
    high: "主要指標のバランスがまとまりやすく、TIAM バランス指数は高めの傾向です。",
    mid: "全体のバランスに余白があり、整え方の余地が出やすいタイプです。",
    low: "個性が出やすい比率です。パーツごとのケアでまとまりを高めやすくなります。",
  };
  return replaceMedicalTerms(lines[b]);
}

/** 開発・テスト用: 静的文言が禁止語スキャンに通ることを保証 */
export function assertPartSummaryTemplatesSafe(): void {
  for (const part of Object.keys(MESSAGES) as PartId[]) {
    for (const b of ["high", "mid", "low"] as const) {
      const raw = MESSAGES[part][b];
      const text = replaceMedicalTerms(raw);
      const scan = scanForbidden(text);
      if (!scan.ok) {
        throw new Error(
          `partSummaries template hit forbidden: part=${part} band=${b} hits=${scan.hits.join(",")}`,
        );
      }
    }
  }
}
