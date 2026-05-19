import type { DiagnosisListItem, DiagnosisNoteStatus } from "@/lib/diagnoses/types";

export type NoteStatusFilter = "all" | DiagnosisNoteStatus;
export type DiagnosisSortMode = "newest" | "unentered_first";

const NOTE_RANK: Record<DiagnosisNoteStatus, number> = {
  none: 0,
  draft: 1,
  published: 2,
};

export function diagnosisDisplayLabel(item: {
  patientLabel?: string | null;
  resultId: string;
}): string {
  const label = item.patientLabel?.trim();
  if (label) return label;
  return item.resultId.slice(-6);
}

export function filterAndSortDiagnosisListItems(
  items: DiagnosisListItem[],
  filter: NoteStatusFilter,
  sort: DiagnosisSortMode,
): DiagnosisListItem[] {
  const filtered =
    filter === "all"
      ? [...items]
      : items.filter((item) => item.noteStatus === filter);

  if (sort === "newest") {
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return [...filtered].sort((a, b) => {
    const rank = NOTE_RANK[a.noteStatus] - NOTE_RANK[b.noteStatus];
    if (rank !== 0) return rank;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function formatDiagnosisCreatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
