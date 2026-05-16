import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";

export type PersistDiagnosisResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * 診断完了後に Firestore `diagnoses/{resultId}` へメタデータを保存する。
 * 失敗しても診断 UI は継続できるよう、呼び出し側でログのみとする想定。
 */
export async function persistDiagnosis(input: {
  resultId: string;
  scoreResult: ScoreResult;
  diagnosisText: DiagnoseResponse;
}): Promise<PersistDiagnosisResult> {
  try {
    const res = await fetch("/api/diagnoses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultId: input.resultId,
        scoreResult: input.scoreResult,
        diagnosisText: input.diagnosisText,
      }),
    });

    const json = (await res.json().catch(() => null)) as unknown;

    if (!res.ok) {
      const message =
        json &&
        typeof json === "object" &&
        "message" in json &&
        typeof (json as { message: unknown }).message === "string"
          ? (json as { message: string }).message
          : `HTTP ${res.status}: 診断結果の保存に失敗しました。`;
      return { ok: false, message };
    }

    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "診断結果の保存でネットワークエラーが発生しました。";
    return { ok: false, message };
  }
}
