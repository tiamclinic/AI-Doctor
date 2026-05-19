"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  DiagnosisSortMode,
  NoteStatusFilter,
} from "@/lib/diagnoses/listDisplay";
const FILTER_OPTIONS: { value: NoteStatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "none", label: "未記入のみ" },
  { value: "draft", label: "下書きあり" },
  { value: "published", label: "公開済み" },
];

type DiagnosisListFiltersProps = {
  filter: NoteStatusFilter;
  sort: DiagnosisSortMode;
  onFilterChange: (value: NoteStatusFilter) => void;
  onSortChange: (value: DiagnosisSortMode) => void;
  onRefresh: () => void;
  refreshing?: boolean;
};

export function DiagnosisListFilters({
  filter,
  sort,
  onFilterChange,
  onSortChange,
  onRefresh,
  refreshing,
}: DiagnosisListFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground text-xs">記入状況</Label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="記入状況フィルタ">
            {FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="xs"
                variant={filter === opt.value ? "default" : "outline"}
                onClick={() => onFilterChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="diagnosis-sort" className="text-muted-foreground text-xs">
            並び順
          </Label>
          <select
            id="diagnosis-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as DiagnosisSortMode)}
            className="border-input bg-background h-8 min-w-[10rem] rounded-lg border px-2 text-sm"
          >
            <option value="unentered_first">未記入を優先</option>
            <option value="newest">新しい順</option>
          </select>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={refreshing}
        onClick={onRefresh}
      >
        {refreshing ? "更新中…" : "一覧を更新"}
      </Button>
    </div>
  );
}
