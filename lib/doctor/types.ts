import { z } from "zod";

import { PART_IDS, type PartId } from "@/lib/result/parts";

export { PART_IDS, type PartId };

export const DOCTOR_CONTENT_COLLECTION = "doctor_contents" as const;
export const DEFAULT_TENANT_ID = "default" as const;

const isoDateTime = z
  .string()
  .min(1)
  .refine((s) => !Number.isNaN(Date.parse(s)), {
    message: "有効な ISO 8601 日時である必要があります",
  });

export const DoctorPartContentSchema = z.object({
  title: z.string().min(1).max(40).optional(),
  body: z.string().min(1).max(800),
  tags: z.array(z.string().min(1).max(20)).max(10).default([]),
  updatedAt: isoDateTime,
  updatedBy: z.string().min(1).max(80),
});

export type DoctorPartContent = z.infer<typeof DoctorPartContentSchema>;

const partsShape = Object.fromEntries(
  PART_IDS.map((id) => [id, DoctorPartContentSchema]),
) as Record<PartId, typeof DoctorPartContentSchema>;

export const DoctorContentSchema = z.object({
  tenantId: z.literal(DEFAULT_TENANT_ID),
  preamble: z.string().max(400).optional(),
  disclaimer: z.string().max(400).optional(),
  parts: z.object(partsShape),
  publishedAt: isoDateTime,
});

export type DoctorContent = z.infer<typeof DoctorContentSchema>;

export const DoctorContentErrorSchema = z.object({
  error: z.enum([
    "fetch_failed",
    "not_found",
    "invalid_request",
    "unauthorized",
    "forbidden",
    "write_failed",
    "forbidden_content",
  ]),
  message: z.string(),
  forbiddenHits: z.array(z.string()).optional(),
});

export type DoctorContentError = z.infer<typeof DoctorContentErrorSchema>;

/** PUT /api/doctor-content のリクエストボディ（メタはサーバーが付与） */
export const DoctorPartDraftSchema = z.object({
  title: z.string().min(1).max(40).optional(),
  body: z.string().min(1).max(800),
  tags: z.array(z.string().min(1).max(20)).max(10).default([]),
});

export type DoctorPartDraft = z.infer<typeof DoctorPartDraftSchema>;

const partsDraftShape = Object.fromEntries(
  PART_IDS.map((id) => [id, DoctorPartDraftSchema]),
) as Record<PartId, typeof DoctorPartDraftSchema>;

export const DoctorContentPublishBodySchema = z.object({
  preamble: z.string().max(400).optional(),
  disclaimer: z.string().max(400).optional(),
  parts: z.object(partsDraftShape),
});

export type DoctorContentPublishBody = z.infer<
  typeof DoctorContentPublishBodySchema
>;

export type DoctorContentPublishResponse = {
  ok: true;
  publishedAt: string;
};
