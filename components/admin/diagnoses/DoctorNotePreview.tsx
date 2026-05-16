"use client";

import { PartAnalysisCard } from "@/components/result/PartAnalysisCard";
import type { DiagnosisRecord } from "@/lib/diagnoses/types";
import type { DoctorNotePublishBody } from "@/lib/doctor-notes/types";
import { getPartDisplayScore, PART_LABELS, type PartId } from "@/lib/result/parts";
import { getPartSummary } from "@/lib/result/partSummaries";

type DoctorNotePreviewProps = {
  diagnosis: DiagnosisRecord;
  draft: DoctorNotePublishBody;
  activePart: PartId;
};

function DoctorPartSlot({
  body,
  recommendedCare,
}: {
  body: string;
  recommendedCare: string[];
}) {
  if (!body.trim() && recommendedCare.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="inline-flex w-fit items-center rounded border border-tiam-rose/45 bg-tiam-rose/12 px-2 py-0.5">
          <span className="text-tiam-primary text-[10px] font-medium tracking-wide">
            当院医師より
          </span>
        </div>
      </div>
      {body.trim() ? (
        <p className="text-foreground text-xs leading-relaxed whitespace-pre-wrap">{body}</p>
      ) : null}
      {recommendedCare.length > 0 ? (
        <ul className="text-muted-foreground list-inside list-disc text-[11px] leading-relaxed">
          {recommendedCare.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function DoctorNotePreview({
  diagnosis,
  draft,
  activePart,
}: DoctorNotePreviewProps) {
  const part = draft.parts[activePart];
  const title = part.title?.trim() || PART_LABELS[activePart];
  const score = getPartDisplayScore(diagnosis.scoreResult, activePart);
  const aiSummary = getPartSummary(diagnosis.scoreResult, activePart);

  return (
    <div className="border-border/60 bg-muted/30 rounded-xl border p-4">
      <p className="text-muted-foreground mb-3 text-xs">
        パーツプレビュー（実スコア {diagnosis.scoreResult.totalScore.toFixed(1)}）
      </p>
      <PartAnalysisCard
        partId={activePart}
        title={title}
        score={score}
        aiSummary={aiSummary}
        doctorBlock={
          <DoctorPartSlot body={part.body} recommendedCare={part.recommendedCare} />
        }
      />
    </div>
  );
}

export function DoctorNoteReportPreview({
  diagnosis,
  draft,
}: {
  diagnosis: DiagnosisRecord;
  draft: DoctorNotePublishBody;
}) {
  const report = draft.report;
  const ai = diagnosis.diagnosisText;

  return (
    <div className="border-border/60 bg-muted/30 space-y-4 rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">総評プレビュー</p>
      <section>
        <h4 className="font-heading text-tiam-primary text-sm">総評</h4>
        <p className="text-muted-foreground mt-1 text-xs">{ai.overallComment}</p>
        {report?.overallComment?.trim() ? (
          <div className="border-border/60 mt-3 border-t border-dashed pt-3">
            <span className="text-[10px] font-medium text-tiam-rose">当院医師より</span>
            <p className="text-foreground mt-1 text-xs">{report.overallComment}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
