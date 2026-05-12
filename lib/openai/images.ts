import "server-only";

import { toFile } from "openai";

import { getOpenAi } from "@/lib/openai/client";

export type EditPortraitParams = {
  imageBuffer: Buffer;
  imageMime: string; // "image/png" | "image/jpeg" | ...
  prompt: string;
  // 30〜60 秒程度。OpenAI 側で実時間 20-40 秒かかることが多い。
  timeoutMs?: number;
};

export type EditPortraitResult = {
  imageBase64: string; // PNG base64（"data:" プレフィックスなし）
  model: string;
};

// OpenAI からのレスポンスから b64 を取り出すヘルパ（型は SDK バージョン違いに耐えるよう緩める）
function extractB64(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  if (!first || typeof first !== "object") return null;
  const b64 = (first as { b64_json?: unknown }).b64_json;
  return typeof b64 === "string" ? b64 : null;
}

export async function editPortrait({
  imageBuffer,
  imageMime,
  prompt,
  timeoutMs = 60_000,
}: EditPortraitParams): Promise<EditPortraitResult> {
  const openai = getOpenAi();

  // toFile で OpenAI SDK が期待する Uploadable に変換する。
  const ext = imageMime === "image/jpeg" ? "jpg" : "png";
  const file = await toFile(imageBuffer, `input.${ext}`, { type: imageMime });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // gpt-image-1 は input_fidelity="high" で顔のアイデンティティ保持を強くできる。
    const response = await openai.images.edit(
      {
        model: "gpt-image-1",
        image: file,
        prompt,
        size: "1024x1024",
        n: 1,
        input_fidelity: "high",
      },
      { signal: controller.signal },
    );

    const b64 = extractB64(response);
    if (!b64) {
      throw new Error("OpenAI Images API returned no b64_json data");
    }
    return { imageBase64: b64, model: "gpt-image-1" };
  } finally {
    clearTimeout(timer);
  }
}
