// App Hosting / 監視用の軽量ヘルスチェックエンドポイント。
// 認証・DB アクセスを行わず、必ず 200 を返すことで Cloud Run の readiness 判定に利用する。
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "tiam-beauty-ai",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
