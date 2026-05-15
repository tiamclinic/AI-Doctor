"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scanDoctorContentForbidden } from "@/lib/admin/scanDoctorContent";
import type { DoctorContentPublishBody } from "@/lib/doctor/types";
import { PART_IDS, PART_LABELS, type PartId } from "@/lib/result/parts";
import { scanForbidden } from "@/lib/prompt/forbiddenWords";

const MAX_BODY = 800;
const MAX_PREAMBLE = 400;
const MAX_DISCLAIMER = 400;

type DoctorContentEditorProps = {
  draft: DoctorContentPublishBody;
  onChange: (next: DoctorContentPublishBody) => void;
  activePart: PartId;
  onActivePartChange: (partId: PartId) => void;
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
  const scan = scanForbidden(text);
  if (scan.ok) return null;
  return (
    <p className="text-destructive text-xs" role="alert">
      注意: {scan.hits.join("、")}
    </p>
  );
}

export function DoctorContentEditor({
  draft,
  onChange,
  activePart,
  onActivePartChange,
}: DoctorContentEditorProps) {
  const globalForbidden = React.useMemo(
    () => scanDoctorContentForbidden(draft),
    [draft],
  );

  const updatePart = (partId: PartId, patch: Partial<DoctorContentPublishBody["parts"][PartId]>) => {
    onChange({
      ...draft,
      parts: {
        ...draft.parts,
        [partId]: { ...draft.parts[partId], ...patch },
      },
    });
  };

  const anyBodyOverLimit = PART_IDS.some(
    (id) => draft.parts[id].body.length > MAX_BODY,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="preamble">冒頭文（任意）</Label>
            <CharCount value={draft.preamble ?? ""} max={MAX_PREAMBLE} />
          </div>
          <textarea
            id="preamble"
            className="border-input bg-background min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm"
            value={draft.preamble ?? ""}
            onChange={(e) => onChange({ ...draft, preamble: e.target.value })}
          />
          <ForbiddenWarning text={draft.preamble ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="disclaimer">免責（任意）</Label>
            <CharCount value={draft.disclaimer ?? ""} max={MAX_DISCLAIMER} />
          </div>
          <textarea
            id="disclaimer"
            className="border-input bg-background min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm"
            value={draft.disclaimer ?? ""}
            onChange={(e) => onChange({ ...draft, disclaimer: e.target.value })}
          />
          <ForbiddenWarning text={draft.disclaimer ?? ""} />
        </div>
      </div>

      {!globalForbidden.ok ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          全体で禁止語の可能性: {globalForbidden.hits.join("、")}
        </p>
      ) : null}

      <Tabs
        value={activePart}
        onValueChange={(v) => onActivePartChange(v as PartId)}
      >
        <TabsList className="flex h-auto w-full flex-wrap">
          {PART_IDS.map((id) => (
            <TabsTrigger key={id} value={id} className="flex-1 min-w-[4.5rem]">
              {PART_LABELS[id]}
            </TabsTrigger>
          ))}
        </TabsList>
        {PART_IDS.map((id) => {
          const part = draft.parts[id];
          return (
            <TabsContent key={id} value={id} className="mt-4 space-y-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`title-${id}`}>見出し上書き（任意）</Label>
                <input
                  id={`title-${id}`}
                  type="text"
                  maxLength={40}
                  className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
                  placeholder={PART_LABELS[id]}
                  value={part.title ?? ""}
                  onChange={(e) =>
                    updatePart(id, {
                      title: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`body-${id}`}>本文</Label>
                  <CharCount value={part.body} max={MAX_BODY} />
                </div>
                <textarea
                  id={`body-${id}`}
                  className="border-input bg-background min-h-[160px] w-full rounded-lg border px-3 py-2 text-sm leading-relaxed"
                  value={part.body}
                  onChange={(e) => updatePart(id, { body: e.target.value })}
                />
                <ForbiddenWarning text={part.body} />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {anyBodyOverLimit ? (
        <p className="text-destructive text-xs">
          800 字を超えているパーツがあります。公開前に短くしてください。
        </p>
      ) : null}
    </div>
  );
}
