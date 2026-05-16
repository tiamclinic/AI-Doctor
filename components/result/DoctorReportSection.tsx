"use client";

import type { ReactNode } from "react";

import { DoctorSourceBadge } from "@/components/result/SourceBadges";
import { formatDoctorByline } from "@/lib/doctor-notes/publicDisplay";

type DoctorReportSectionProps = {
  children: ReactNode;
  updatedBy: string;
  publishedAt: string;
  showByline?: boolean;
};

export function DoctorReportSection({
  children,
  updatedBy,
  publishedAt,
  showByline = true,
}: DoctorReportSectionProps) {
  return (
    <section
      className="result-doctor-block border-border/60 mt-4 border-t border-dashed pt-4"
      aria-label="当院医師より"
    >
      <DoctorSourceBadge />
      <div className="text-foreground mt-2 text-sm leading-relaxed">{children}</div>
      {showByline ? (
        <footer className="text-muted-foreground mt-3 text-[10px] leading-relaxed">
          {formatDoctorByline(updatedBy, publishedAt)}
        </footer>
      ) : null}
    </section>
  );
}
