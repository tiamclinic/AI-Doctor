import { PART_IDS } from "@/lib/result/parts";

import {
  DoctorPartNotePublicSchema,
  DoctorReportNotePublicSchema,
} from "./types";

import type { DoctorNote, DoctorNotePublic } from "./types";

/** 公開 GET 用に `internalMemo` を除去する */
export function toPublicDoctorNote(note: DoctorNote): DoctorNotePublic {
  const parts = {} as DoctorNotePublic["parts"];
  for (const id of PART_IDS) {
    const p = note.parts[id];
    parts[id] = DoctorPartNotePublicSchema.parse(p);
  }
  if (note.status !== "published" || !note.publishedAt) {
    throw new Error("toPublicDoctorNote: published ノートのみ変換できます。");
  }
  const report = note.report
    ? DoctorReportNotePublicSchema.parse(note.report)
    : undefined;

  return {
    resultId: note.resultId,
    parts,
    ...(report ? { report } : {}),
    status: "published",
    updatedAt: note.updatedAt,
    updatedBy: note.updatedBy,
    publishedAt: note.publishedAt,
  };
}
