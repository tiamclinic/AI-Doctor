"use client";

import { DoctorPartBlock } from "@/components/result/DoctorPartBlock";
import { PartAnalysisCard } from "@/components/result/PartAnalysisCard";
import { partNoteIsVisible } from "@/lib/doctor-notes/publicDisplay";
import type { DoctorNotePublic } from "@/lib/doctor-notes/types";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import {
  getPartDisplayScore,
  PART_IDS,
  PART_LABELS,
} from "@/lib/result/parts";
import { getPartSummary } from "@/lib/result/partSummaries";

type PartAnalysisGridProps = {
  scoreResult: ScoreResult;
  doctorNote?: DoctorNotePublic | null;
};

export function PartAnalysisGrid({
  scoreResult,
  doctorNote,
}: PartAnalysisGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PART_IDS.map((partId) => {
        const partNote = doctorNote?.parts[partId];
        const title = partNote?.title ?? PART_LABELS[partId];
        const doctorBlock =
          doctorNote && partNote && partNoteIsVisible(partNote) ? (
            <DoctorPartBlock
              part={partNote}
              updatedBy={doctorNote.updatedBy}
              publishedAt={doctorNote.publishedAt}
            />
          ) : undefined;

        return (
          <PartAnalysisCard
            key={partId}
            partId={partId}
            title={title}
            score={getPartDisplayScore(scoreResult, partId)}
            aiSummary={getPartSummary(scoreResult, partId)}
            doctorBlock={doctorBlock}
          />
        );
      })}
    </div>
  );
}
