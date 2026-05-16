"use client";

import { FileText } from "lucide-react";
import * as React from "react";

import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createEmptyReportDraft,
  linesToRecommendedCare,
  recommendedCareToLines,
} from "@/lib/admin/notes/emptyDraft";
import { validateDoctorNoteDraft } from "@/lib/admin/notes/validation";
import { scanDoctorNoteForbidden } from "@/lib/doctor-notes/scanForbidden";
import type { DoctorNotePublishBody, DoctorReportNote } from "@/lib/doctor-notes/types";
import { PART_IDS, PART_LABELS, type PartId } from "@/lib/result/parts";
import { scanForbidden } from "@/lib/prompt/forbiddenWords";

const MAX_BODY = 800;
const MAX_MEMO = 400;
const MAX_REPORT = 800;

type EditorTab = "summary" | PartId;

type DoctorNoteEditorProps = {
  draft: DoctorNotePublishBody;
  onChange: (next: DoctorNotePublishBody) => void;
  activeTab: EditorTab;
  onActiveTabChange: (tab: EditorTab) => void;
  aiOverallComment?: string;
};

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span
      className={
        over ? "text-destructive text-xs tabular-nums" : "text-muted-foreground text-xs tabular-nums"
      }
    >
      {value.length} / {max}
    </span>
  );
}

function ForbiddenWarning({ text }: { text: string }) {
  if (!text.trim()) return null;
  const scan = scanForbidden(text);
  if (scan.ok) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      注意: {scan.hits.join("、")}
    </p>
  );
}

export function DoctorNoteEditor({
  draft,
  onChange,
  activeTab,
  onActiveTabChange,
  aiOverallComment,
}: DoctorNoteEditorProps) {
  const report = draft.report ?? createEmptyReportDraft();
  const validation = React.useMemo(() => validateDoctorNoteDraft(draft), [draft]);
  const globalForbidden = React.useMemo(() => scanDoctorNoteForbidden(draft), [draft]);

  const updatePart = (partId: PartId, patch: Partial<DoctorNotePublishBody["parts"][PartId]>) => {
    onChange({
      ...draft,
      parts: {
        ...draft.parts,
        [partId]: { ...draft.parts[partId], ...patch },
      },
    });
  };

  const updateReport = (patch: Partial<DoctorReportNote>) => {
    onChange({
      ...draft,
      report: { ...report, ...patch },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {!globalForbidden.ok ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          全体で禁止語の可能性: {globalForbidden.hits.join("、")}
        </p>
      ) : null}

      {!validation.canPublish && validation.canSaveDraft ? (
        <p className="text-muted-foreground text-xs">
          公開には、パーツ所見または総評のいずれかに内容を入力してください。
        </p>
      ) : null}

      {validation.overLimit ? (
        <p className="text-destructive text-xs">文字数上限を超えている項目があります。</p>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(v) => onActiveTabChange(v as EditorTab)}
      >
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-transparent p-0">
          <TabsTrigger
            value="summary"
            className="data-[state=active]:border-tiam-rose/50 data-[state=active]:bg-tiam-rose/12 border-border shrink-0 gap-1 rounded-md border px-2.5 py-1.5 text-xs data-[state=active]:shadow-none"
          >
            <FileText className="size-3" />
            総評・レポート
          </TabsTrigger>
          {PART_IDS.map((id) => (
            <TabsTrigger
              key={id}
              value={id}
              className="data-[state=active]:border-tiam-gold/60 data-[state=active]:bg-tiam-gold/10 border-border shrink-0 rounded-md border px-2.5 py-1.5 text-xs data-[state=active]:shadow-none"
            >
              {PART_LABELS[id]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          {aiOverallComment ? (
            <div>
              <p className="text-tiam-primary text-xs font-medium">AI の総評（参照のみ）</p>
              <p className="text-muted-foreground mt-2 rounded-lg border border-border/60 bg-muted/25 p-3 text-xs leading-relaxed">
                {aiOverallComment}
              </p>
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="report-overall">ドクター総評</Label>
              <CharCount value={report.overallComment ?? ""} max={MAX_REPORT} />
            </div>
            <textarea
              id="report-overall"
              className="border-input bg-background min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm leading-relaxed"
              value={report.overallComment ?? ""}
              onChange={(e) =>
                updateReport({ overallComment: e.target.value || undefined })
              }
            />
            <ForbiddenWarning text={report.overallComment ?? ""} />
          </div>
          {(
            [
              ["強み（最大3件・1行1件）", "strengths", 3],
              ["注意点（最大2件）", "improvements", 2],
              ["推奨ケア（最大3件）", "recommendedCare", 3],
            ] as const
          ).map(([label, key, maxLines]) => (
            <div key={key}>
              <Label>{label}</Label>
              <textarea
                className="border-input bg-background mt-1.5 min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm"
                value={recommendedCareToLines(report[key])}
                onChange={(e) =>
                  updateReport({
                    [key]: linesToRecommendedCare(e.target.value).slice(0, maxLines),
                  })
                }
              />
            </div>
          ))}
          <div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="report-closing">締めのメッセージ</Label>
              <CharCount value={report.closingMessage ?? ""} max={120} />
            </div>
            <textarea
              id="report-closing"
              className="border-input bg-background min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm"
              value={report.closingMessage ?? ""}
              onChange={(e) =>
                updateReport({ closingMessage: e.target.value || undefined })
              }
            />
            <ForbiddenWarning text={report.closingMessage ?? ""} />
          </div>
          <div>
            <div>
              <Label htmlFor="report-memo">総評まわりの院内メモ</Label>
              <CharCount value={report.internalMemo ?? ""} max={MAX_MEMO} />
            </div>
            <textarea
              id="report-memo"
              className="border-input bg-muted/30 mt-1.5 min-h-[64px] w-full rounded-lg border px-3 py-2 text-sm"
              value={report.internalMemo ?? ""}
              onChange={(e) => updateReport({ internalMemo: e.target.value })}
            />
          </div>
        </TabsContent>

        {PART_IDS.map((id) => {
          const part = draft.parts[id];
          const bodyValue = part.body.trim() === "" ? "" : part.body;
          return (
            <TabsContent key={id} value={id} className="mt-4 space-y-3">
              <div>
                <Label htmlFor={`title-${id}`}>見出し（任意）</Label>
                <input
                  id={`title-${id}`}
                  type="text"
                  maxLength={40}
                  className="border-input bg-background mt-1.5 h-9 w-full rounded-lg border px-3 text-sm"
                  placeholder={PART_LABELS[id]}
                  value={part.title ?? ""}
                  onChange={(e) =>
                    updatePart(id, { title: e.target.value || undefined })
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`body-${id}`}>所見本文</Label>
                  <CharCount value={bodyValue} max={MAX_BODY} />
                </div>
                <textarea
                  id={`body-${id}`}
                  className="border-input bg-background mt-1.5 min-h-[140px] w-full rounded-lg border px-3 py-2 text-sm leading-relaxed"
                  value={bodyValue}
                  onChange={(e) =>
                    updatePart(id, { body: e.target.value.length > 0 ? e.target.value : " " })
                  }
                />
                <ForbiddenWarning text={bodyValue} />
              </div>
              <div>
                <Label htmlFor={`care-${id}`}>推奨ケア（1行1件・最大5件）</Label>
                <textarea
                  id={`care-${id}`}
                  className="border-input bg-background mt-1.5 min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm"
                  value={recommendedCareToLines(part.recommendedCare)}
                  onChange={(e) =>
                    updatePart(id, {
                      recommendedCare: linesToRecommendedCare(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`memo-${id}`}>院内メモ</Label>
                  <CharCount value={part.internalMemo ?? ""} max={MAX_MEMO} />
                </div>
                <textarea
                  id={`memo-${id}`}
                  className="border-input bg-muted/30 mt-1.5 min-h-[64px] w-full rounded-lg border px-3 py-2 text-sm"
                  value={part.internalMemo ?? ""}
                  onChange={(e) => updatePart(id, { internalMemo: e.target.value })}
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export type { EditorTab };
