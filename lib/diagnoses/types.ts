import { z } from "zod";

import { DiagnoseResponseSchema } from "@/lib/diagnosis/types";

export const DIAGNOSES_COLLECTION = "diagnoses" as const;

export const PHOTO_POLICY = ["none", "thumbnail"] as const;
export type PhotoPolicy = (typeof PHOTO_POLICY)[number];

const scoreNumber = z
  .number()
  .min(0)
  .max(100);

const metricScoresSchema = z.object({
  verticalThirds: scoreNumber,
  horizontalFifths: scoreNumber,
  eyeSpacing: scoreNumber,
  eyePosition: scoreNumber,
  noseMouthRatio: scoreNumber,
  eLine: scoreNumber,
  faceContour: scoreNumber,
  bilateralSymmetry: scoreNumber,
});

export const RawMetricsSchema = z.object({
  verticalThirds: z.object({
    sections: z.tuple([z.number(), z.number(), z.number()]),
    ratios: z.tuple([z.number(), z.number(), z.number()]),
  }),
  horizontalFifths: z.object({
    faceWidth: z.number(),
    eyeWidth: z.number(),
    ratio: z.number(),
  }),
  eyeSpacing: z.object({
    interEye: z.number(),
    eyeWidth: z.number(),
    ratio: z.number(),
  }),
  noseMouthRatio: z.object({
    noseWidth: z.number(),
    mouthWidth: z.number(),
    ratio: z.number(),
  }),
  eLine: z.object({
    upperLipDeviation: z.number(),
    lowerLipDeviation: z.number(),
  }),
  faceContour: z.object({
    faceWidth: z.number(),
    faceHeight: z.number(),
    ratio: z.number(),
  }),
  eyePosition: z.object({
    eyeY: z.number(),
    faceHeight: z.number(),
    ratio: z.number(),
  }),
  bilateralSymmetry: z.object({
    meanAsymmetry: z.number(),
  }),
});

export const ScoreResultSchema = z.object({
  totalScore: scoreNumber,
  scores: metricScoresSchema,
  rawValues: RawMetricsSchema,
});

export const DiagnosisRecordSchema = z.object({
  resultId: z.string().min(8).max(32),
  createdAt: z.string().min(1),
  scoreResult: ScoreResultSchema,
  diagnosisText: DiagnoseResponseSchema,
  photoPolicy: z.enum(PHOTO_POLICY),
  thumbnailUrl: z.string().url().optional(),
  patientLabel: z.string().min(1).max(120).optional().nullable(),
  patientLabelUpdatedBy: z.string().min(1).max(120).optional().nullable(),
  patientLabelUpdatedAt: z.string().min(1).optional().nullable(),
});

export type DiagnosisRecord = z.infer<typeof DiagnosisRecordSchema>;

/** POST /api/diagnoses クライアントが送るボディ（サーバーが createdAt / photoPolicy を付与） */
export const DiagnosisCreateBodySchema = z.object({
  resultId: z.string().min(8).max(32),
  scoreResult: ScoreResultSchema,
  diagnosisText: DiagnoseResponseSchema,
});

export type DiagnosisCreateBody = z.infer<typeof DiagnosisCreateBodySchema>;

export const DiagnosisPatchBodySchema = z.object({
  /** 空文字で削除（Firestore からフィールド削除） */
  patientLabel: z.union([z.string().min(1).max(120), z.literal("")]),
});

export type DiagnosisPatchBody = z.infer<typeof DiagnosisPatchBodySchema>;

export const DiagnosesListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type DiagnosesApiError = {
  error:
    | "invalid_request"
    | "not_found"
    | "missing_token"
    | "invalid_token"
    | "not_staff_or_admin"
    | "persist_failed"
    | "fetch_failed";
  message: string;
};
