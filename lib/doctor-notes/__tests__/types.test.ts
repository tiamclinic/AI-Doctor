import { describe, expect, it } from "vitest";

import { scanDoctorNoteForbidden } from "@/lib/doctor-notes/scanForbidden";
import {
  DoctorNotePublishBodySchema,
  DoctorNoteSchema,
} from "@/lib/doctor-notes/types";

const minimalParts = {
  eyes: { body: "目元の所見です。", recommendedCare: [] },
  nose: { body: "鼻の所見です。", recommendedCare: [] },
  mouth: { body: "口元の所見です。", recommendedCare: [] },
  contour: { body: "輪郭の所見です。", recommendedCare: [] },
  symmetry: { body: "対称性の所見です。", recommendedCare: [] },
} as const;

describe("DoctorNotePublishBodySchema", () => {
  it("draft / published どちらも通る", () => {
    expect(
      DoctorNotePublishBodySchema.safeParse({
        parts: minimalParts,
        status: "draft",
      }).success,
    ).toBe(true);
    expect(
      DoctorNotePublishBodySchema.safeParse({
        parts: minimalParts,
        status: "published",
      }).success,
    ).toBe(true);
  });
});

describe("DoctorNoteSchema", () => {
  it("published では publishedAt が必須", () => {
    const ok = DoctorNoteSchema.safeParse({
      resultId: "12345678",
      parts: minimalParts,
      status: "published",
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "a@b.com",
      publishedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(ok.success).toBe(true);
  });
});

describe("scanDoctorNoteForbidden", () => {
  it("禁止語を検出する", () => {
    const body = DoctorNotePublishBodySchema.parse({
      parts: {
        ...minimalParts,
        eyes: {
          body: "いかがでしょうか",
          recommendedCare: [],
        },
      },
      status: "draft",
    });
    const r = scanDoctorNoteForbidden(body);
    expect(r.ok).toBe(false);
    expect(r.hits.length).toBeGreaterThan(0);
  });

  it("クリーンな本文は通る", () => {
    const body = DoctorNotePublishBodySchema.parse({
      parts: minimalParts,
      status: "draft",
    });
    expect(scanDoctorNoteForbidden(body).ok).toBe(true);
  });
});
