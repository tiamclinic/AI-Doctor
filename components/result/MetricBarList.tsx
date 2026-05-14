"use client";

import type { MetricKey } from "@/lib/faceAnalysis/goldenRatio";
import { PHI } from "@/lib/faceAnalysis/landmarks";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";

const METRIC_ORDER: MetricKey[] = [
  "verticalThirds",
  "horizontalFifths",
  "eyeSpacing",
  "noseMouthRatio",
  "eLine",
  "faceContour",
];

/** モック準拠の短いラベル + 理想値（カッコ内） */
const METRIC_LINE_LABELS: Record<MetricKey, { name: string; ideal: string }> = {
  verticalThirds: { name: "縦の比率", ideal: "1 : 1 : 1" },
  horizontalFifths: { name: "横の比率", ideal: "1 : 1 : 1 : 1 : 1" },
  eyeSpacing: { name: "目の間隔", ideal: "目幅と同等" },
  noseMouthRatio: { name: "鼻口比率", ideal: `1 : ${PHI.toFixed(3)}` },
  eLine: { name: "Eライン整合度", ideal: "鼻先 — 顎先 軸上" },
  faceContour: { name: "顔の輪郭比", ideal: "1 : 1.46" },
};

type MetricBarListProps = {
  result: ScoreResult;
  /** 見出し（カード化したい場合は省略し外側で付ける） */
  showHeader?: boolean;
};

export function MetricBarList({ result, showHeader = false }: MetricBarListProps) {
  return (
    <div className="flex w-full flex-col">
      {showHeader ? (
        <div className="border-tiam-gold/40 mb-3 border-b pb-2">
          <h2 className="font-heading text-tiam-primary text-sm tracking-tight sm:text-base">
            各パーツの比率
          </h2>
        </div>
      ) : null}
      <ul className="flex flex-col gap-3.5">
        {METRIC_ORDER.map((key) => {
          const score = result.scores[key];
          const width = Math.max(0, Math.min(100, score));
          const { name, ideal } = METRIC_LINE_LABELS[key];
          return (
            <li key={key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-foreground font-medium leading-snug">
                  {name}
                  <span className="text-muted-foreground ml-1 text-[10px]">
                    （{ideal}）
                  </span>
                </span>
                <span className="text-tiam-gold font-heading tabular-nums tracking-tight">
                  {score.toFixed(1)}%
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="from-tiam-gold/80 to-tiam-gold h-full rounded-full bg-gradient-to-r"
                  style={{ width: `${width}%` }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground mt-3 text-[10px] leading-relaxed">
        ※ 100% に近いほど黄金比に近い数値です。
      </p>
    </div>
  );
}
