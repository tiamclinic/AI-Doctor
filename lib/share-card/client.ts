import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import {
  pickDisplayedScores,
  type ScoreResult,
} from "@/lib/faceAnalysis/scoring";
import type { ShareCardRequest } from "@/lib/share-card/types";

export type RequestShareCardResult =
  | { ok: true; blob: Blob }
  | { ok: false; message: string };

const truncate = (s: string, max: number) =>
  s.length <= max ? s : `${s.slice(0, max - 1)}…`;

export function buildShareCardRequest(
  score: ScoreResult,
  diagnosis: DiagnoseResponse | null,
): ShareCardRequest {
  return {
    totalScore: score.totalScore,
    scores: pickDisplayedScores(score.scores),
    topStrength: diagnosis?.strengths?.[0]
      ? truncate(diagnosis.strengths[0], 80)
      : undefined,
    tiamMessage: diagnosis?.tiamMessage
      ? truncate(diagnosis.tiamMessage, 60)
      : undefined,
  };
}

export async function requestShareCard(
  payload: ShareCardRequest,
  signal?: AbortSignal,
): Promise<RequestShareCardResult> {
  const res = await fetch("/api/share-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const fallback = `HTTP ${res.status}: シェアカードの生成に失敗しました。`;
    const json = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    return { ok: false, message: json?.message ?? fallback };
  }
  const blob = await res.blob();
  return { ok: true, blob };
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 解放はやや遅らせる（一部ブラウザで早すぎるとダウンロードが消える）
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
