import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { AdminAuthError } from "@/lib/admin/authErrors";
import * as authGuard from "@/lib/admin/authGuard";
import { GET, PUT } from "@/app/api/doctor-notes/[resultId]/route";
import * as firebaseAdmin from "@/lib/firebase/admin";
import {
  getPublishedDoctorNote,
  saveDoctorNote,
} from "@/lib/doctor-notes/repository";
import type { DoctorNote } from "@/lib/doctor-notes/types";

vi.mock("@/lib/doctor-notes/repository", () => ({
  getPublishedDoctorNote: vi.fn(),
  saveDoctorNote: vi.fn(),
}));

const minimalParts = {
  eyes: { body: "目所見", recommendedCare: [] },
  nose: { body: "鼻所見", recommendedCare: [] },
  mouth: { body: "口所見", recommendedCare: [] },
  contour: { body: "輪郭所見", recommendedCare: [] },
  symmetry: { body: "対称所見", recommendedCare: [] },
};

function publishedFixture(): DoctorNote {
  return {
    resultId: "12345678",
    parts: { ...minimalParts },
    status: "published",
    updatedAt: "2026-01-01T00:00:00.000Z",
    updatedBy: "doc@example.com",
    publishedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("GET /api/doctor-notes/[resultId]", () => {
  beforeEach(() => {
    vi.spyOn(firebaseAdmin, "isFirestoreAdminConfigured").mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("公開ノートを返す", async () => {
    vi.mocked(getPublishedDoctorNote).mockResolvedValue(publishedFixture());
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678");
    const res = await GET(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(200);
    const j = (await res.json()) as { status: string; parts: { eyes: object } };
    expect(j.status).toBe("published");
    expect(j.parts.eyes).not.toHaveProperty("internalMemo");
  });

  it("未公開は 404", async () => {
    vi.mocked(getPublishedDoctorNote).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678");
    const res = await GET(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(404);
  });

  it("Firestore 未設定は未公開扱いで 404", async () => {
    vi.spyOn(firebaseAdmin, "isFirestoreAdminConfigured").mockReturnValue(false);
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678");
    const res = await GET(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/doctor-notes/[resultId]", () => {
  beforeEach(() => {
    vi.spyOn(firebaseAdmin, "isFirestoreAdminConfigured").mockReturnValue(true);
    vi.spyOn(authGuard, "verifyStaffOrAdminFromRequest").mockResolvedValue({
      uid: "u1",
      email: "staff@example.com",
    });
    vi.mocked(saveDoctorNote).mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("スタッフが保存できる", async () => {
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678", {
      method: "PUT",
      body: JSON.stringify({ parts: minimalParts, status: "draft" }),
      headers: { "Content-Type": "application/json", Authorization: "Bearer x" },
    });
    const res = await PUT(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(200);
    expect(saveDoctorNote).toHaveBeenCalledOnce();
  });

  it("トークンなしは 401 missing_token", async () => {
    vi.spyOn(authGuard, "verifyStaffOrAdminFromRequest").mockRejectedValue(
      new AdminAuthError("missing_token", "認証トークンがありません。"),
    );
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678", {
      method: "PUT",
      body: JSON.stringify({ parts: minimalParts, status: "draft" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PUT(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(401);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("missing_token");
  });

  it("無効トークンは 401 invalid_token", async () => {
    vi.spyOn(authGuard, "verifyStaffOrAdminFromRequest").mockRejectedValue(
      new AdminAuthError("invalid_token", "認証トークンが無効です。"),
    );
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678", {
      method: "PUT",
      body: JSON.stringify({ parts: minimalParts, status: "draft" }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer bad",
      },
    });
    const res = await PUT(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(401);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("invalid_token");
  });

  it("クレーム不足は 403 insufficient_role", async () => {
    vi.spyOn(authGuard, "verifyStaffOrAdminFromRequest").mockRejectedValue(
      new AdminAuthError(
        "not_staff_or_admin",
        "スタッフ権限がありません。admin または staff クレームの付与を確認してください。",
      ),
    );
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678", {
      method: "PUT",
      body: JSON.stringify({ parts: minimalParts, status: "draft" }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer ok",
      },
    });
    const res = await PUT(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(403);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("insufficient_role");
  });

  it("不正 JSON は 400", async () => {
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678", {
      method: "PUT",
      body: "not-json",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer x",
      },
    });
    const res = await PUT(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(400);
  });

  it("禁止語は 400 forbidden_content", async () => {
    const badParts = {
      ...minimalParts,
      eyes: { body: "いかがでしょうか", recommendedCare: [] },
    };
    const req = new NextRequest("http://localhost/api/doctor-notes/12345678", {
      method: "PUT",
      body: JSON.stringify({ parts: badParts, status: "draft" }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer x",
      },
    });
    const res = await PUT(req, {
      params: Promise.resolve({ resultId: "12345678" }),
    });
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string; forbiddenHits?: string[] };
    expect(j.error).toBe("forbidden_content");
    expect(j.forbiddenHits?.length).toBeGreaterThan(0);
  });
});
