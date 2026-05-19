"use client";

import { Sparkles } from "lucide-react";

import {
  DISPLAYED_METRIC_KEYS,
  METRIC_LABELS,
  type ScoreResult,
} from "@/lib/faceAnalysis/scoring";

export function ScoreSummary({ result }: { result: ScoreResult }) {
  return (
    <div className="border-border/60 bg-accent/30 flex flex-col gap-5 rounded-xl border p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-muted-foreground flex items-center gap-1 text-xs tracking-wide">
            <Sparkles className="text-tiam-gold size-3.5" />
            TIAM バランス指数
          </div>
          <p className="font-heading text-tiam-primary mt-1 text-3xl tracking-tight sm:text-4xl">
            {result.totalScore.toFixed(1)}
            <span className="text-muted-foreground ml-1 text-sm">/ 100</span>
          </p>
        </div>
        <div className="text-muted-foreground text-right text-[10px] leading-tight">
          TIAM 独自 AI 解析
          <br />
          478 点ランドマーク
        </div>
      </div>

      <ul className="flex flex-col gap-2.5">
        {DISPLAYED_METRIC_KEYS.map((key) => {
          const value = result.scores[key];
          return (
            <li key={key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-foreground">{METRIC_LABELS[key]}</span>
                <span className="text-muted-foreground tabular-nums">
                  {value.toFixed(1)}
                </span>
              </div>
              <div className="bg-muted relative h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-tiam-gold absolute inset-y-0 left-0 rounded-full transition-[width]"
                  style={{ width: `${value}%` }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
