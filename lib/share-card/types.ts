import { z } from "zod";

import { DISPLAYED_METRIC_KEYS } from "@/lib/faceAnalysis/scoring";

const ScoreNumber = z.number().min(0).max(100);

const displayedScoresSchema = z.object(
  Object.fromEntries(
    DISPLAYED_METRIC_KEYS.map((key) => [key, ScoreNumber]),
  ) as Record<(typeof DISPLAYED_METRIC_KEYS)[number], typeof ScoreNumber>,
);

export const ShareCardRequestSchema = z.object({
  totalScore: ScoreNumber,
  scores: displayedScoresSchema,
  // 任意：診断要約。1-2 行に抑える
  topStrength: z.string().min(1).max(80).optional(),
  tiamMessage: z.string().min(1).max(80).optional(),
});

export type ShareCardRequest = z.infer<typeof ShareCardRequestSchema>;
