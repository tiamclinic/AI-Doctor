import { z } from "zod";

import { PART_IDS, type PartId } from "@/lib/result/parts";

export const DOCTOR_NOTES_COLLECTION = "doctor_notes" as const;

const isoDateTime = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "有効な ISO 8601 日時である必要があります",
  });

/** Firestore / 内部で保持するパーツノート */
export const DoctorPartNoteSchema = z.object({
  title: z.string().min(1).max(40).optional(),
  body: z.string().min(1).max(800),
  recommendedCare: z.array(z.string().min(1).max(120)).max(5).default([]),
  internalMemo: z.string().max(400).optional(),
});

export type DoctorPartNote = z.infer<typeof DoctorPartNoteSchema>;

/** 総評・詳細レポートへの医師追記（AI 文は diagnoses に保持、ここは追記のみ） */
export const DoctorReportNoteSchema = z.object({
  overallComment: z.string().max(800).optional(),
  strengths: z.array(z.string().min(1).max(120)).max(3).default([]),
  improvements: z.array(z.string().min(1).max(120)).max(2).default([]),
  recommendedCare: z.array(z.string().min(1).max(120)).max(3).default([]),
  closingMessage: z.string().max(120).optional(),
  internalMemo: z.string().max(400).optional(),
});

export type DoctorReportNote = z.infer<typeof DoctorReportNoteSchema>;

export const DoctorReportNotePublicSchema = DoctorReportNoteSchema.omit({
  internalMemo: true,
});

export type DoctorReportNotePublic = z.infer<typeof DoctorReportNotePublicSchema>;

const partsNoteShape = Object.fromEntries(
  PART_IDS.map((id) => [id, DoctorPartNoteSchema]),
) as Record<PartId, typeof DoctorPartNoteSchema>;

export const DoctorNoteSchema = z.object({
  resultId: z.string().min(8).max(32),
  parts: z.object(partsNoteShape),
  report: DoctorReportNoteSchema.optional(),
  status: z.enum(["draft", "published"]),
  updatedAt: isoDateTime,
  updatedBy: z.string().min(1).max(80),
  publishedAt: isoDateTime.optional(),
});

export type DoctorNote = z.infer<typeof DoctorNoteSchema>;

/** GET 公開レスポンス用（internalMemo を含まない） */
export const DoctorPartNotePublicSchema = DoctorPartNoteSchema.omit({
  internalMemo: true,
});

export type DoctorPartNotePublic = z.infer<typeof DoctorPartNotePublicSchema>;

const partsPublicShape = Object.fromEntries(
  PART_IDS.map((id) => [id, DoctorPartNotePublicSchema]),
) as Record<PartId, typeof DoctorPartNotePublicSchema>;

export const DoctorNotePublicSchema = z.object({
  resultId: z.string().min(8).max(32),
  parts: z.object(partsPublicShape),
  report: DoctorReportNotePublicSchema.optional(),
  status: z.literal("published"),
  updatedAt: isoDateTime,
  updatedBy: z.string().min(1).max(80),
  publishedAt: isoDateTime,
});

export type DoctorNotePublic = z.infer<typeof DoctorNotePublicSchema>;

const partsPublishShape = Object.fromEntries(
  PART_IDS.map((id) => [id, DoctorPartNoteSchema]),
) as Record<PartId, typeof DoctorPartNoteSchema>;

/** PUT ボディ（サーバーが updatedAt / updatedBy / publishedAt を付与） */
export const DoctorNotePublishBodySchema = z.object({
  parts: z.object(partsPublishShape),
  report: DoctorReportNoteSchema.optional(),
  status: z.enum(["draft", "published"]),
});

export type DoctorNotePublishBody = z.infer<typeof DoctorNotePublishBodySchema>;

export const DoctorNotePutResponseSchema = z.object({
  ok: z.literal(true),
  status: z.enum(["draft", "published"]),
  publishedAt: isoDateTime.optional(),
});

export type DoctorNotePutResponse = z.infer<typeof DoctorNotePutResponseSchema>;
