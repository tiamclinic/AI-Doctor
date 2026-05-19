import { z } from "zod";

/** 管理 API 共通のエラーレスポンス（T-13 由来、doctor-notes 等で継続利用） */
export const ApiErrorSchema = z.object({
  error: z.enum([
    "fetch_failed",
    "not_found",
    "invalid_request",
    "unauthorized",
    "forbidden",
    "write_failed",
    "forbidden_content",
    "missing_token",
    "invalid_token",
    "insufficient_role",
    "not_staff_or_admin",
    "draft_only",
    "persist_failed",
  ]),
  message: z.string(),
  forbiddenHits: z.array(z.string()).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/** @deprecated T-23 以降は `ApiError` を使用 */
export type DoctorContentError = ApiError;
export const DoctorContentErrorSchema = ApiErrorSchema;
