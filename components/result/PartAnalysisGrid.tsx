"use client";

import { PartAnalysisCard } from "@/components/result/PartAnalysisCard";
import type { DoctorContent } from "@/lib/doctor/types";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import {
  getPartDisplayScore,
  PART_IDS,
  PART_LABELS,
  type PartId,
} from "@/lib/result/parts";
import { getPartSummary } from "@/lib/result/partSummaries";

type PartAnalysisGridProps = {
  scoreResult: ScoreResult;
  /** T-13: 院方コンテンツ。T-15 で DoctorPartBlock に差し替え予定 */
  doctorContent?: DoctorContent | null;
};

function isPlaceholderDoctorBody(body: string): boolean {
  return body.includes("（医師が後で記入）");
}

function DoctorPartPreview({
  partId,
  content,
}: {
  partId: PartId;
  content: DoctorContent;
}) {
  const part = content.parts[partId];
  if (!part?.body || isPlaceholderDoctorBody(part.body)) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex w-fit items-center rounded border border-rose-200/60 bg-rose-100/20 px-2 py-0.5 dark:border-rose-900/40 dark:bg-rose-950/30">
        <span className="text-[10px] font-medium tracking-wide text-rose-900/90 dark:text-rose-100/90">
          顧問医師コメント
        </span>
      </div>
      <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap">
        {part.body}
      </p>
    </div>
  );
}

export function PartAnalysisGrid({
  scoreResult,
  doctorContent,
}: PartAnalysisGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PART_IDS.map((partId) => {
        const partContent = doctorContent?.parts[partId];
        const title = partContent?.title ?? PART_LABELS[partId];
        const doctorSlot = doctorContent ? (
          <DoctorPartPreview partId={partId} content={doctorContent} />
        ) : undefined;

        return (
          <PartAnalysisCard
            key={partId}
            partId={partId}
            title={title}
            score={getPartDisplayScore(scoreResult, partId)}
            aiSummary={getPartSummary(scoreResult, partId)}
            doctorSlot={doctorSlot}
          />
        );
      })}
    </div>
  );
}
