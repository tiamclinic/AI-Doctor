import { NextRequest, NextResponse } from "next/server";

import {
  AdminAuthError,
  verifyAdminFromRequest,
} from "@/lib/admin/authGuard";
import { scanDoctorContentForbidden } from "@/lib/admin/scanDoctorContent";
import { buildDoctorContentEtag, etagMatches } from "@/lib/doctor/etag";
import {
  DoctorContentNotFoundError,
  getDoctorContent,
  saveDoctorContent,
} from "@/lib/doctor/repository";
import {
  DEFAULT_TENANT_ID,
  DoctorContentPublishBodySchema,
  type DoctorContent,
  type DoctorContentError,
} from "@/lib/doctor/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CACHE_CONTROL =
  "public, s-maxage=300, stale-while-revalidate=86400";

function errorResponse(
  status: number,
  error: DoctorContentError["error"],
  message: string,
  extra?: Partial<DoctorContentError>,
) {
  const body: DoctorContentError = { error, message, ...extra };
  return NextResponse.json(body, { status });
}

export async function GET(req: NextRequest) {
  try {
    const content = await getDoctorContent();
    const etag = buildDoctorContentEtag(content);
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

    return NextResponse.json(content, {
      status: 200,
      headers: {
        ETag: etag,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (err) {
    if (err instanceof DoctorContentNotFoundError) {
      return errorResponse(
        404,
        "not_found",
        "院方コンテンツがまだ公開されていません。",
      );
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[GET /api/doctor-content]", err);
    }
    return errorResponse(
      500,
      "fetch_failed",
      "院方コンテンツの取得に失敗しました。",
    );
  }
}

export async function PUT(req: NextRequest) {
  let admin;
  try {
    admin = await verifyAdminFromRequest(req);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      if (err.code === "missing_token" || err.code === "invalid_token") {
        return errorResponse(401, "unauthorized", err.message);
      }
      return errorResponse(403, "forbidden", err.message);
    }
    return errorResponse(401, "unauthorized", "認証に失敗しました。");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "invalid_request", "JSON を解析できませんでした。");
  }

  const parsed = DoctorContentPublishBodySchema.safeParse(body);
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

  const forbidden = scanDoctorContentForbidden(parsed.data);
  if (!forbidden.ok) {
    return errorResponse(
      400,
      "forbidden_content",
      "禁止語または景表法上避けるべき表現が含まれています。修正してから公開してください。",
      { forbiddenHits: forbidden.hits },
    );
  }

  const now = new Date().toISOString();
  const updatedBy = admin.email ?? admin.uid;

  const toSave: DoctorContent = {
    tenantId: DEFAULT_TENANT_ID,
    preamble: parsed.data.preamble,
    disclaimer: parsed.data.disclaimer,
    parts: {
      eyes: {
        ...parsed.data.parts.eyes,
        updatedAt: now,
        updatedBy,
      },
      nose: {
        ...parsed.data.parts.nose,
        updatedAt: now,
        updatedBy,
      },
      mouth: {
        ...parsed.data.parts.mouth,
        updatedAt: now,
        updatedBy,
      },
      contour: {
        ...parsed.data.parts.contour,
        updatedAt: now,
        updatedBy,
      },
      symmetry: {
        ...parsed.data.parts.symmetry,
        updatedAt: now,
        updatedBy,
      },
    },
    publishedAt: now,
  };

  try {
    await saveDoctorContent(toSave);
    return NextResponse.json({
      ok: true as const,
      publishedAt: now,
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[PUT /api/doctor-content]", err);
    }
    return errorResponse(500, "write_failed", "Firestore への保存に失敗しました。");
  }
}
