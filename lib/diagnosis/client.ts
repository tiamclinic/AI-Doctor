import {
  pickDisplayedScores,
  type ScoreResult,
} from "@/lib/faceAnalysis/scoring";
import {
  type DiagnoseError,
  type DiagnoseResponse,
  DiagnoseResponseSchema,
} from "@/lib/diagnosis/types";

export type RequestDiagnosisResult =
  | { ok: true; data: DiagnoseResponse }
  | { ok: false; error: DiagnoseError };

export async function requestDiagnosis(
  score: ScoreResult,
  signal?: AbortSignal,
): Promise<RequestDiagnosisResult> {
  const res = await fetch("/api/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      totalScore: score.totalScore,
      scores: pickDisplayedScores(score.scores),
      locale: "ja",
    }),
    signal,
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    if (json && typeof json === "object" && "error" in json && "message" in json) {
      return {
        ok: false,
        error: json as DiagnoseError,
      };
    }
    return {
      ok: false,
      error: {
        error: "unknown",
        message: `HTTP ${res.status}: 診断文の生成に失敗しました。`,
      },
    };
  }

  const parsed = DiagnoseResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        error: "schema_violation",
        message: "サーバーから受け取ったデータが想定の形式ではありませんでした。",
      },
    };
  }

  return { ok: true, data: parsed.data };
}
