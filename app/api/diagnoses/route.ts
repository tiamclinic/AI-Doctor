import { NextRequest, NextResponse } from "next/server";

import {
  AdminAuthError,
  verifyStaffOrAdminFromRequest,
} from "@/lib/admin/authGuard";
import {
  buildDiagnosisRecord,
  listDiagnoses,
  saveDiagnosis,
} from "@/lib/diagnoses/repository";
import {
  type DiagnosesApiError,
  DiagnosesListQuerySchema,
  DiagnosisCreateBodySchema,
} from "@/lib/diagnoses/types";
import { isFirestoreAdminConfigured } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(
  status: number,
  error: DiagnosesApiError["error"],
  message: string,
) {
  const body: DiagnosesApiError = { error, message };
  return NextResponse.json(body, { status });
}

function mapAuthError(err: AdminAuthError): NextResponse {
  if (err.code === "missing_token") {
    return jsonError(401, "missing_token", err.message);
  }
  if (err.code === "not_staff_or_admin") {
    return jsonError(403, "not_staff_or_admin", err.message);
  }
  return jsonError(401, "invalid_token", err.message);
}

/** 来院者: 診断メタデータの保存（認証なし・ボディ検証のみ） */
export async function POST(req: NextRequest) {
  if (!isFirestoreAdminConfigured()) {
    return jsonError(
      503,
      "persist_failed",
      "サーバー側の Firebase 設定が完了していないため、診断結果を保存できません。",
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(
      400,
      "invalid_request",
      "リクエストの JSON を解析できませんでした。",
    );
  }

  const parsed = DiagnosisCreateBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return jsonError(
      400,
      "invalid_request",
      `入力のバリデーションに失敗しました（${message}）。`,
    );
  }

  try {
    const record = buildDiagnosisRecord({
      resultId: parsed.data.resultId,
      scoreResult: parsed.data.scoreResult,
      diagnosisText: parsed.data.diagnosisText,
    });
    await saveDiagnosis(record);
    return NextResponse.json(
      { ok: true as const, resultId: record.resultId },
      { status: 200 },
    );
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[POST /api/diagnoses]", e);
    }
    const message =
      e instanceof Error ? e.message : "診断結果の保存に失敗しました。";
    return jsonError(500, "persist_failed", message);
  }
}

/** スタッフ: 診断一覧（`admin` または `staff`） */
export async function GET(req: NextRequest) {
  if (!isFirestoreAdminConfigured()) {
    return jsonError(
      503,
      "fetch_failed",
      "サーバー側の Firebase 設定が完了していないため、一覧を取得できません。",
    );
  }

  try {
    await verifyStaffOrAdminFromRequest(req);
  } catch (err) {
    if (err instanceof AdminAuthError) return mapAuthError(err);
    throw err;
  }

  const url = new URL(req.url);
  const q = DiagnosesListQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!q.success) {
    return jsonError(
      400,
      "invalid_request",
      "limit パラメータが不正です。",
    );
  }

  try {
    const items = await listDiagnoses({ limit: q.data.limit });
    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/diagnoses]", e);
    }
    const message =
      e instanceof Error ? e.message : "診断一覧の取得に失敗しました。";
    return jsonError(500, "fetch_failed", message);
  }
}
