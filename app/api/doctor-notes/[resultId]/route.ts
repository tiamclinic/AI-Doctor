import { NextRequest, NextResponse } from "next/server";

import {
  AdminAuthError,
  verifyStaffOrAdminFromRequest,
} from "@/lib/admin/authGuard";
import { scanDoctorNoteForbidden } from "@/lib/doctor-notes/scanForbidden";
import { buildDoctorNoteEtag, etagMatches } from "@/lib/doctor-notes/etag";
import {
  getDoctorNote,
  getPublishedDoctorNote,
  saveDoctorNote,
} from "@/lib/doctor-notes/repository";
import { toPublicDoctorNote } from "@/lib/doctor-notes/publicNote";
import {
  DoctorNotePublicSchema,
  DoctorNotePublishBodySchema,
  DoctorNoteSchema,
  type DoctorNotePutResponse,
} from "@/lib/doctor-notes/types";
import type { DoctorContentError } from "@/lib/doctor/types";
import { isFirestoreAdminConfigured } from "@/lib/firebase/admin";

const FIRESTORE_SETUP_HINT =
  ".env.local に FIREBASE_SERVICE_ACCOUNT_KEY を設定するか、gcloud auth application-default login を実行してください。";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=600";

function errorResponse(
  status: number,
  error: DoctorContentError["error"],
  message: string,
  extra?: Partial<DoctorContentError>,
) {
  const body: DoctorContentError = { error, message, ...extra };
  return NextResponse.json(body, { status });
}

function mapAuthError(err: AdminAuthError): NextResponse {
  if (err.code === "missing_token") {
    return errorResponse(401, "missing_token", err.message);
  }
  if (err.code === "invalid_token") {
    return errorResponse(401, "invalid_token", err.message);
  }
  if (err.code === "not_staff_or_admin") {
    return errorResponse(403, "insufficient_role", err.message);
  }
  return errorResponse(401, "invalid_token", err.message);
}

type RouteContext = { params: Promise<{ resultId: string }> };

/** 公開: 公開済みのみ。Bearer + staff/admin: 下書き含む編集用フルノート */
export async function GET(
  req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { resultId } = await context.params;
  if (!resultId || resultId.length < 8) {
    return errorResponse(400, "invalid_request", "resultId が不正です。");
  }

  const authHeader = req.headers.get("authorization");
  const wantsStaffEdit =
    authHeader?.startsWith("Bearer ") && authHeader.slice(7).trim().length > 0;

  if (wantsStaffEdit) {
    try {
      await verifyStaffOrAdminFromRequest(req);
    } catch (err) {
      if (err instanceof AdminAuthError) return mapAuthError(err);
      throw err;
    }
    try {
      const note = await getDoctorNote(resultId);
      if (!note) {
        return errorResponse(404, "not_found", "ノートはまだ作成されていません。");
      }
      return NextResponse.json(DoctorNoteSchema.parse(note), { status: 200 });
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[GET /api/doctor-notes/:id] staff", e);
      }
      return errorResponse(500, "fetch_failed", "ノートの取得に失敗しました。");
    }
  }

  try {
    const note = await getPublishedDoctorNote(resultId);
    if (!note) {
      return errorResponse(
        404,
        "not_found",
        "公開済みのノートはまだありません。",
      );
    }

    const publicNote = toPublicDoctorNote(note);
    const validated = DoctorNotePublicSchema.parse(publicNote);
    const etag = buildDoctorNoteEtag(validated.publishedAt);
    const ifNoneMatch = req.headers.get("if-none-match");

    if (etagMatches(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": CACHE_CONTROL,
        },
      });
    }

    return NextResponse.json(validated, {
      status: 200,
      headers: {
        ETag: etag,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GET /api/doctor-notes/:id]", e);
    }
    return errorResponse(500, "fetch_failed", "ノートの取得に失敗しました。");
  }
}

/** スタッフ: 個別ノートの保存（draft / published） */
export async function PUT(
  req: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  if (!isFirestoreAdminConfigured()) {
    return errorResponse(
      503,
      "write_failed",
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
    return errorResponse(400, "invalid_request", "resultId が不正です。");
  }

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

  const parsed = DoctorNotePublishBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return errorResponse(
      400,
      "invalid_request",
      `入力の形式が不正です（${message}）。`,
    );
  }

  const forbidden = scanDoctorNoteForbidden(parsed.data);
  if (!forbidden.ok) {
    return errorResponse(
      400,
      "forbidden_content",
      "禁止語または景表法上避けるべき表現が含まれています。修正してから保存してください。",
      { forbiddenHits: forbidden.hits },
    );
  }

  const now = new Date().toISOString();
  const updatedBy = admin.email ?? admin.uid;

  const noteBase = {
    resultId,
    parts: parsed.data.parts,
    ...(parsed.data.report ? { report: parsed.data.report } : {}),
    status: parsed.data.status,
    updatedAt: now,
    updatedBy,
  };

  const note =
    parsed.data.status === "published"
      ? { ...noteBase, publishedAt: now }
      : noteBase;

  try {
    const validated = DoctorNoteSchema.parse(note);
    await saveDoctorNote(validated);
    const resBody: DoctorNotePutResponse =
      parsed.data.status === "published"
        ? { ok: true, status: "published", publishedAt: now }
        : { ok: true, status: "draft" };
    return NextResponse.json(resBody, { status: 200 });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[PUT /api/doctor-notes/:id]", e);
    }
    return errorResponse(500, "write_failed", "Firestore への保存に失敗しました。");
  }
}
