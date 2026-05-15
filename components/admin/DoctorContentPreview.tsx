"use client";

import { PartAnalysisCard } from "@/components/result/PartAnalysisCard";
import { ADMIN_PREVIEW_SCORE } from "@/lib/admin/previewScores";
import type { DoctorContentPublishBody } from "@/lib/doctor/types";
import { getPartDisplayScore, PART_LABELS, type PartId } from "@/lib/result/parts";
import { getPartSummary } from "@/lib/result/partSummaries";

type DoctorContentPreviewProps = {
  partId: PartId;
  draft: DoctorContentPublishBody;
};

function DoctorPreviewSlot({ body }: { body: string }) {
  if (!body.trim()) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex w-fit items-center rounded border border-rose-200/60 bg-rose-100/20 px-2 py-0.5 dark:border-rose-900/40 dark:bg-rose-950/30">
        <span className="text-[10px] font-medium tracking-wide text-rose-900/90 dark:text-rose-100/90">
          顧問医師コメント
        </span>
      </div>
      <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap">
        {body}
      </p>
    </div>
  );
}

export function DoctorContentPreview({
  partId,
  draft,
}: DoctorContentPreviewProps) {
  const part = draft.parts[partId];
  const title = part.title?.trim() || PART_LABELS[partId];
  const score = getPartDisplayScore(ADMIN_PREVIEW_SCORE, partId);
  const aiSummary = getPartSummary(ADMIN_PREVIEW_SCORE, partId);

  return (
    <div className="border-border/60 bg-muted/30 rounded-xl border p-4">
      <p className="text-muted-foreground mb-3 text-xs">
        プレビュー（スコア {ADMIN_PREVIEW_SCORE.totalScore.toFixed(1)} のモック）
      </p>
      <PartAnalysisCard
        partId={partId}
        title={title}
        score={score}
        aiSummary={aiSummary}
        doctorSlot={<DoctorPreviewSlot body={part.body} />}
      />
    </div>
  );
}
