"use client";

import { DoctorSourceBadge } from "@/components/result/SourceBadges";
import { formatDoctorByline } from "@/lib/doctor-notes/publicDisplay";
import type { DoctorPartNotePublic } from "@/lib/doctor-notes/types";

type DoctorPartBlockProps = {
  part: DoctorPartNotePublic;
  updatedBy: string;
  publishedAt: string;
};

export function DoctorPartBlock({
  part,
  updatedBy,
  publishedAt,
}: DoctorPartBlockProps) {
  return (
    <section
      className="result-doctor-block border-border/60 mt-4 border-t border-dashed pt-3"
      aria-label="当院医師より"
    >
      <DoctorSourceBadge />
      {part.body.trim().length > 0 && part.body.trim() !== " " ? (
        <p className="text-foreground mt-2 text-xs leading-relaxed whitespace-pre-wrap">
          {part.body.trim()}
        </p>
      ) : null}
      {part.recommendedCare.length > 0 ? (
        <ul className="text-muted-foreground mt-2 list-inside list-disc text-[11px] leading-relaxed">
          {part.recommendedCare.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <footer className="text-muted-foreground mt-3 text-[10px] leading-relaxed">
        {formatDoctorByline(updatedBy, publishedAt)}
      </footer>
    </section>
  );
}
