import type { DoctorPartNotePublic, DoctorReportNotePublic } from "./types";

export function hasVisibleDoctorPartBody(body: string): boolean {
  const trimmed = body.trim();
  if (trimmed.length === 0 || trimmed === " ") return false;
  if (trimmed.includes("（医師が後で記入）")) return false;
  return true;
}

export function hasVisibleDoctorReport(report?: DoctorReportNotePublic): boolean {
  if (!report) return false;
  return (
    (report.overallComment?.trim().length ?? 0) > 0 ||
    report.strengths.length > 0 ||
    report.improvements.length > 0 ||
    report.recommendedCare.length > 0 ||
    (report.closingMessage?.trim().length ?? 0) > 0
  );
}

export function formatDoctorByline(
  updatedBy: string,
  publishedAt: string,
): string {
  const date = new Date(publishedAt);
  const when = Number.isNaN(date.getTime())
    ? publishedAt
    : date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
  return `記入: ${updatedBy} ／ 公開: ${when}`;
}

export function partNoteIsVisible(part: DoctorPartNotePublic): boolean {
  return (
    hasVisibleDoctorPartBody(part.body) || part.recommendedCare.length > 0
  );
}
