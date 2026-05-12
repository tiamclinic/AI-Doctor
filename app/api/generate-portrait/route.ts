import { NextRequest, NextResponse } from "next/server";

import { editPortrait } from "@/lib/openai/images";
import { OpenAiNotConfiguredError } from "@/lib/openai/client";
import { normalizeForOpenAi } from "@/lib/portrait/normalize";
import { checkPortraitRateLimit } from "@/lib/portrait/rateLimit";
import {
  type PortraitError,
  type PortraitErrorCode,
  PortraitRequestSchema,
  type PortraitResponse,
} from "@/lib/portrait/types";
import { buildPortraitPrompt } from "@/lib/prompt/portraitPrompt";

export const runtime = "nodejs";
// gpt-image-1 の edit は実時間 20-40 秒かかる事が多いので 60 秒で。
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function errorResponse(
  status: number,
  error: PortraitErrorCode,
  message: string,
  extra?: Partial<PortraitError>,
) {
  const body: PortraitError = { error, message, ...extra };
  return NextResponse.json(body, { status });
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// data URL もしくは生 base64 を Buffer に。MIME も抽出する。
function decodeImageBase64(input: string): { buffer: Buffer; mime: string } {
  const dataUrlMatch = input.match(
    /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/,
  );
  if (dataUrlMatch) {
    const mime = dataUrlMatch[1] === "image/jpg" ? "image/jpeg" : dataUrlMatch[1];
    const buffer = Buffer.from(dataUrlMatch[2], "base64");
    return { buffer, mime };
  }
  // 生 base64（MIME 不明）の場合は PNG と仮定する
  const buffer = Buffer.from(input, "base64");
  if (buffer.byteLength === 0) {
    throw new Error("empty image buffer");
  }
  return { buffer, mime: "image/png" };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "リクエストの JSON を解析できませんでした。",
    );
  }

  const parsed = PortraitRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    // consent: false の場合だけは専用エラーコードで返す
    const consentIssue = parsed.error.issues.find(
      (i) => i.path.join(".") === "consent",
    );
    if (consentIssue) {
      return errorResponse(
        400,
        "consent_required",
        "OpenAI への写真送信に同意してから生成を開始してください。",
      );
    }
    return errorResponse(
      400,
      "invalid_request",
      `入力のバリデーションに失敗しました（${message}）。`,
    );
  }

  const ip = getClientIp(req);
  const rate = checkPortraitRateLimit(ip);
  if (!rate.ok) {
    return errorResponse(
      429,
      "rate_limited",
      `本日の理想顔生成回数の上限に達しました。約 ${Math.ceil(
        rate.retryAfterSec / 3600,
      )} 時間後に再度お試しください。`,
      { retryAfterSec: rate.retryAfterSec },
    );
  }

  let imageBuffer: Buffer;
  try {
    const decoded = decodeImageBase64(parsed.data.imageBase64);
    imageBuffer = decoded.buffer;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/generate-portrait] decode error", e);
    }
    return errorResponse(
      400,
      "image_decode_failed",
      "送信された画像の形式を解釈できませんでした。",
    );
  }

  // OpenAI Images API は EXIF Orientation や色空間に厳しいので、必ず sRGB PNG 1024 に正規化する。
  let normalized;
  try {
    normalized = await normalizeForOpenAi(imageBuffer);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/generate-portrait] normalize error", e);
    }
    return errorResponse(
      400,
      "image_decode_failed",
      "送信された画像を正規化できませんでした。別の写真でお試しください。",
    );
  }

  const { prompt, summary } = buildPortraitPrompt({ scores: parsed.data.scores });
  const start = performance.now();

  try {
    const { imageBase64 } = await editPortrait({
      imageBuffer: normalized.buffer,
      imageMime: normalized.mime,
      prompt,
    });
    const durationMs = performance.now() - start;
    const body: PortraitResponse = {
      imageBase64,
      promptSummary: summary,
      durationMs: Math.round(durationMs),
    };
    return NextResponse.json(body, { status: 200 });
  } catch (e) {
    if (e instanceof OpenAiNotConfiguredError) {
      return errorResponse(503, "openai_not_configured", e.message);
    }
    const err = e as { status?: number; message?: string; name?: string };
    if (err.name === "AbortError") {
      return errorResponse(
        504,
        "timeout",
        "理想顔の生成がタイムアウトしました。少し時間を置いて再度お試しください。",
      );
    }
    if (err.status === 429) {
      return errorResponse(
        429,
        "rate_limited",
        "OpenAI 側のレート制限に達しました。少し時間を置いて再度お試しください。",
      );
    }
    if (typeof err.status === "number" && err.status >= 500) {
      return errorResponse(
        502,
        "upstream_error",
        "OpenAI Images API の応答が一時的に不安定です。再度お試しください。",
      );
    }
    const message =
      err instanceof Error
        ? err.message
        : "理想顔の生成中に予期しないエラーが発生しました。";
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/generate-portrait] error", e);
    }
    return errorResponse(500, "unknown", message);
  }
}
