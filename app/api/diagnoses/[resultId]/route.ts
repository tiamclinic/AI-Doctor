import { NextRequest, NextResponse } from "next/server";

import {
  AdminAuthError,
  verifyStaffOrAdminFromRequest,
} from "@/lib/admin/authGuard";
import {
  DiagnosisNotFoundError,
  getDiagnosis,
  updateDiagnosisMeta,
} from "@/lib/diagnoses/repository";
import {
  type DiagnosesApiError,
  DiagnosisPatchBodySchema,
} from "@/lib/diagnoses/types";
import { isFirestoreAdminConfigured } from "@/lib/firebase/admin";

const FIRESTORE_SETUP_HINT =
  ".env.local に FIREBASE_SERVICE_ACCOUNT_KEY を設定するか、gcloud auth application-default login を実行してください。";

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

type RouteContext = { params: Promise<{ resultId: string }> };

/** 来院者: 診断 1 件の読み取り（`resultId` を知っている前提） */
export async function GET(
  _req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { resultId } = await context.params;
  if (!resultId || resultId.length < 8) {
    return jsonError(400, "invalid_request", "resultId が不正です。");
  }

  try {
    const record = await getDiagnosis(resultId);
    if (!record) {
      return jsonError(404, "not_found", "該当する診断が見つかりません。");
    }
    return NextResponse.json(record, { status: 200 });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/diagnoses/:id]", e);
    }
    return jsonError(500, "fetch_failed", "診断結果の取得に失敗しました。");
  }
}

/** スタッフ: `patientLabel` 等のメタ更新 */
export async function PATCH(
  req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  if (!isFirestoreAdminConfigured()) {
    return jsonError(
      503,
      "persist_failed",
      `Firestore に接続できません。${FIRESTORE_SETUP_HINT}`,
    );
  }

  let admin;
  try {
    admin = await verifyStaffOrAdminFromRequest(req);
  } catch (err) {
    if (err instanceof AdminAuthError) return mapAuthError(err);
    throw err;
  }

  const { resultId } = await context.params;
  if (!resultId || resultId.length < 8) {
    return jsonError(400, "invalid_request", "resultId が不正です。");
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

  const parsed = DiagnosisPatchBodySchema.safeParse(body);
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

  const now = new Date().toISOString();
  const updatedBy = admin.email ?? admin.uid;

  try {
    await updateDiagnosisMeta(resultId, {
      patientLabel: parsed.data.patientLabel,
      patientLabelUpdatedBy: updatedBy,
      patientLabelUpdatedAt: now,
    });
    return NextResponse.json({ ok: true as const }, { status: 200 });
  } catch (e) {
    if (e instanceof DiagnosisNotFoundError) {
      return jsonError(404, "not_found", e.message);
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("[PATCH /api/diagnoses/:id]", e);
    }
    return jsonError(500, "persist_failed", "診断メタデータの更新に失敗しました。");
  }
}
