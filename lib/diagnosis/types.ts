// 診断リクエストとレスポンスの型定義
import { z } from "zod";

import type { MetricKey } from "@/lib/faceAnalysis/goldenRatio";

// 指標のキー
const METRIC_KEYS = [
  "verticalThirds",
  "horizontalFifths",
  "eyeSpacing",
  "eyePosition",
  "noseMouthRatio",
  "eLine",
  "faceContour",
  "bilateralSymmetry",
] as const satisfies readonly MetricKey[];

// スコアの型定義
const scoreNumber = z
  .number()
  .min(0, "スコアは 0 以上である必要があります")
  .max(100, "スコアは 100 以下である必要があります");

// 診断リクエストの型定義
export const DiagnoseRequestSchema = z.object({
  totalScore: scoreNumber, // 総合スコア
  scores: z.object({
    verticalThirds: scoreNumber, // 縦三分割スコア
    horizontalFifths: scoreNumber, // 横五分割スコア
    eyeSpacing: scoreNumber, // 目間スコア
    eyePosition: scoreNumber, // 目の位置（縦）スコア
    noseMouthRatio: scoreNumber, // 鼻口比率スコア
    eLine: scoreNumber, // E ラインスコア
    faceContour: scoreNumber, // 顔輪郭比率スコア
    bilateralSymmetry: scoreNumber, // 左右対称性スコア
  }),
  locale: z.literal("ja").default("ja"), // 言語
});

export type DiagnoseRequest = z.infer<typeof DiagnoseRequestSchema>; // 診断リクエストの型

export const DiagnoseResponseSchema = z.object({
  overallComment: z.string().min(30).max(300), // 総合コメント  100-150 文字
  strengths: z.array(z.string().min(8).max(120)).length(3), // 強み 3 件
  improvements: z.array(z.string().min(8).max(120)).length(2), // 改善点 2 件
  recommendedCare: z.array(z.string().min(8).max(120)).length(3), // 推奨ケア 3 件
  tiamMessage: z.string().min(10).max(120), // TIAM メッセージ 50 文字
});

export type DiagnoseResponse = z.infer<typeof DiagnoseResponseSchema>; // 診断レスポンスの型

export const DiagnoseErrorSchema = z.object({
  error: z.enum([
    "invalid_request",
    "service_unavailable",
    "upstream_error",
    "schema_violation",
    "rate_limited",
    "unknown",
  ]),
  message: z.string(),
});

export type DiagnoseError = z.infer<typeof DiagnoseErrorSchema>;

export { METRIC_KEYS };
