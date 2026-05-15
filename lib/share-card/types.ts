import { z } from "zod";

const ScoreNumber = z.number().min(0).max(100);

export const ShareCardRequestSchema = z.object({
  totalScore: ScoreNumber,
  scores: z.object({
    verticalThirds: ScoreNumber,
    horizontalFifths: ScoreNumber,
    eyeSpacing: ScoreNumber,
    eyePosition: ScoreNumber,
    noseMouthRatio: ScoreNumber,
    eLine: ScoreNumber,
    faceContour: ScoreNumber,
    bilateralSymmetry: ScoreNumber,
  }),
  // 任意：診断要約。1-2 行に抑える
  topStrength: z.string().min(1).max(80).optional(),
  tiamMessage: z.string().min(1).max(80).optional(),
});

export type ShareCardRequest = z.infer<typeof ShareCardRequestSchema>;
