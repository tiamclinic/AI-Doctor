import { cn } from "@/lib/utils";
import type { DiagnosisNoteStatus } from "@/lib/diagnoses/types";

const LABEL: Record<DiagnosisNoteStatus, string> = {
  none: "未記入",
  draft: "下書き",
  published: "公開",
};

const STYLES: Record<DiagnosisNoteStatus, string> = {
  none: "border-border/80 bg-muted/50 text-muted-foreground",
  draft: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  published:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
};

type StatusBadgeProps = {
  status: DiagnosisNoteStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        STYLES[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}
