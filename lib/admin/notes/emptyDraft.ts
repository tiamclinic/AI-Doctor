import type { DoctorNotePublishBody, DoctorReportNote } from "@/lib/doctor-notes/types";
import { PART_IDS, type PartId } from "@/lib/result/parts";

const EMPTY_PART_BODY = " ";

export function createEmptyReportDraft(): DoctorReportNote {
  return {
    overallComment: "",
    strengths: [],
    improvements: [],
    recommendedCare: [],
    closingMessage: "",
    internalMemo: "",
  };
}

export function createEmptyDoctorNotePublishBody(): DoctorNotePublishBody {
  const parts = Object.fromEntries(
    PART_IDS.map((id) => [
      id,
      {
        body: EMPTY_PART_BODY,
        recommendedCare: [] as string[],
        internalMemo: "",
      },
    ]),
  ) as DoctorNotePublishBody["parts"];

  return {
    parts,
    report: createEmptyReportDraft(),
    status: "draft",
  };
}

export function doctorNoteToPublishBody(note: {
  parts: DoctorNotePublishBody["parts"];
  report?: DoctorReportNote;
  status: "draft" | "published";
}): DoctorNotePublishBody {
  return {
    parts: note.parts,
    report: note.report ?? createEmptyReportDraft(),
    status: note.status,
  };
}

export function linesToRecommendedCare(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 5);
}

export function recommendedCareToLines(lines: string[]): string {
  return lines.join("\n");
}

export type EditorTab = "summary" | PartId;
