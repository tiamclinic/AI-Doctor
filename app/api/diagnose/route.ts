// API ルートハンドラ
import { NextRequest, NextResponse } from "next/server";

import { generateDiagnosis } from "@/lib/diagnosis/openai";
import {
  DiagnoseRequestSchema, // 診断リクエストの型
  type DiagnoseError,
} from "@/lib/diagnosis/types"; // 診断レスポンスの型
import { OpenAiNotConfiguredError } from "@/lib/openai/client";

export const runtime = "nodejs"; // ランタイムを指定
export const maxDuration = 30; // 最大実行時間を指定  30 秒
export const dynamic = "force-dynamic"; // 動的ルートを強制

function errorResponse(status: number, error: DiagnoseError["error"], message: string) {
  const body: DiagnoseError = { error, message };
  return NextResponse.json(body, { status });
} // エラーレスポンスを返す

export async function POST(req: NextRequest) { // POST リクエストを処理
  let body: unknown;
  try {
    body = await req.json(); // リクエストの JSON を解析
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "リクエストの JSON を解析できませんでした。",
    );
  } // JSON を解析できない場合  400 エラーを返す

  const parsed = DiagnoseRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return errorResponse(
      400,
      "invalid_request",
      `入力のバリデーションに失敗しました（${message}）。`,
    );
  }

  try {
    const result = await generateDiagnosis(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    if (e instanceof OpenAiNotConfiguredError) {
      return errorResponse(503, "service_unavailable", e.message);
    }
    const err = e as { status?: number; message?: string };
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
        "OpenAI の応答が一時的に不安定です。再度お試しください。",
      );
    }
    const message =
      err instanceof Error
        ? err.message
        : "診断文の生成中に予期しないエラーが発生しました。";
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/diagnose] error", e);
    }
    return errorResponse(500, "unknown", message);
  }
}
