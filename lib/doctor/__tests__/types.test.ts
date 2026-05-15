import { describe, expect, it } from "vitest";

import {
  DoctorContentSchema,
  DoctorPartContentSchema,
} from "@/lib/doctor/types";

const validPart = {
  body: "目元のバランスについての補足です。",
  tags: ["目元"],
  updatedAt: "2026-01-01T00:00:00.000Z",
  updatedBy: "seed",
};

const validContent = {
  tenantId: "default" as const,
  preamble: "補足です。",
  disclaimer: "参考情報です。",
  parts: {
    eyes: validPart,
    nose: validPart,
    mouth: validPart,
    contour: validPart,
    symmetry: validPart,
  },
  publishedAt: "2026-05-15T00:00:00.000Z",
};

describe("DoctorPartContentSchema", () => {
  it("有効なパーツ本文を通す", () => {
    expect(DoctorPartContentSchema.safeParse(validPart).success).toBe(true);
  });

  it("body が空なら拒否する", () => {
    expect(
      DoctorPartContentSchema.safeParse({ ...validPart, body: "" }).success,
    ).toBe(false);
  });

  it("body が 800 字超なら拒否する", () => {
    expect(
      DoctorPartContentSchema.safeParse({
        ...validPart,
        body: "あ".repeat(801),
      }).success,
    ).toBe(false);
  });

  it("tags が 10 件超なら拒否する", () => {
    expect(
      DoctorPartContentSchema.safeParse({
        ...validPart,
        tags: Array.from({ length: 11 }, (_, i) => `t${i}`),
      }).success,
    ).toBe(false);
  });
});

describe("DoctorContentSchema", () => {
  it("5 パーツすべて揃っていれば通す", () => {
    const r = DoctorContentSchema.safeParse(validContent);
    expect(r.success).toBe(true);
  });

  it("tenantId が default 以外なら拒否する", () => {
    expect(
      DoctorContentSchema.safeParse({
        ...validContent,
        tenantId: "other",
      }).success,
    ).toBe(false);
  });

  it("parts のキーが欠けると拒否する", () => {
    const parts = { ...validContent.parts };
    delete (parts as Partial<typeof parts>).symmetry;
    expect(
      DoctorContentSchema.safeParse({
        ...validContent,
        parts,
      }).success,
    ).toBe(false);
  });

  it("publishedAt が不正な日時なら拒否する", () => {
    expect(
      DoctorContentSchema.safeParse({
        ...validContent,
        publishedAt: "not-a-date",
      }).success,
    ).toBe(false);
  });
});
