import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import {
  type PortraitError,
  type PortraitResponse,
  PortraitResponseSchema,
} from "@/lib/portrait/types";

export type RequestPortraitResult =
  | { ok: true; data: PortraitResponse }
  | { ok: false; error: PortraitError };

export async function requestIdealPortrait(
  imageBase64: string,
  score: ScoreResult,
  signal?: AbortSignal,
): Promise<RequestPortraitResult> {
  const res = await fetch("/api/generate-portrait", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64,
      scores: score.scores,
      consent: true,
    }),
    signal,
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    if (
      json &&
      typeof json === "object" &&
      "error" in json &&
      "message" in json
    ) {
      return { ok: false, error: json as PortraitError };
    }
    return {
      ok: false,
      error: {
        error: "unknown",
        message: `HTTP ${res.status}: 理想顔の生成に失敗しました。`,
      },
    };
  }

  const parsed = PortraitResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        error: "unknown",
        message:
          "サーバーから受け取った理想顔データが想定の形式ではありませんでした。",
      },
    };
  }

  return { ok: true, data: parsed.data };
}
