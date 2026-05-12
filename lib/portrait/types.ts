import { z } from "zod";

const ScoreNumber = z.number().min(0).max(100);

// dataURL or base64 文字列を受け取る（最大 ~10MB を想定）
const DataUrlString = z
  .string()
  .min(20)
  .max(15_000_000)
  .refine(
    (s) =>
      s.startsWith("data:image/") || /^[A-Za-z0-9+/=\r\n]+$/.test(s.slice(0, 80)),
    {
      message: "imageBase64 must be a data URL or base64 string",
    },
  );

export const PortraitRequestSchema = z.object({
  imageBase64: DataUrlString,
  scores: z.object({
    verticalThirds: ScoreNumber,
    horizontalFifths: ScoreNumber,
    eyeSpacing: ScoreNumber,
    noseMouthRatio: ScoreNumber,
    eLine: ScoreNumber,
    faceContour: ScoreNumber,
  }),
  consent: z.literal(true, {
    message: "OpenAI への写真送信に同意していません。",
  }),
});

export type PortraitRequest = z.infer<typeof PortraitRequestSchema>;

export const PortraitResponseSchema = z.object({
  imageBase64: z.string(),
  promptSummary: z.string(),
  durationMs: z.number().nonnegative(),
});
export type PortraitResponse = z.infer<typeof PortraitResponseSchema>;

export type PortraitErrorCode =
  | "invalid_request"
  | "consent_required"
  | "rate_limited"
  | "openai_not_configured"
  | "image_decode_failed"
  | "upstream_error"
  | "timeout"
  | "unknown";

export type PortraitError = {
  error: PortraitErrorCode;
  message: string;
  retryAfterSec?: number;
};
