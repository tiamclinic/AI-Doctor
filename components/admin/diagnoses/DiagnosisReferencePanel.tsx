"use client";

import { DiagnosisText } from "@/components/DiagnosisText";
import { MetricBarList } from "@/components/result/MetricBarList";
import { TotalScoreCard } from "@/components/result/TotalScoreCard";
import type { DiagnosisRecord } from "@/lib/diagnoses/types";

type DiagnosisReferencePanelProps = {
  diagnosis: DiagnosisRecord;
};

export function DiagnosisReferencePanel({ diagnosis }: DiagnosisReferencePanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-xs leading-relaxed">
        AI 診断結果（参照のみ）。右カラムで医師追記を編集してください。
      </p>
      <TotalScoreCard scoreResult={diagnosis.scoreResult} />
      <section className="border-border/80 bg-card rounded-xl border p-4 shadow-sm">
        <MetricBarList result={diagnosis.scoreResult} showHeader />
      </section>
      <DiagnosisText result={diagnosis.diagnosisText} />
      {diagnosis.thumbnailUrl ? (
        <figure className="border-border/60 overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={diagnosis.thumbnailUrl}
            alt="診断サムネイル"
            className="max-h-48 w-full object-cover"
          />
        </figure>
      ) : null}
    </div>
  );
}
