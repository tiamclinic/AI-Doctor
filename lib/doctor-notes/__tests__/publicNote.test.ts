import { describe, expect, it } from "vitest";

import { toPublicDoctorNote } from "@/lib/doctor-notes/publicNote";
import type { DoctorNote } from "@/lib/doctor-notes/types";

const minimalParts = {
  eyes: { body: "a", recommendedCare: [] },
  nose: { body: "a", recommendedCare: [] },
  mouth: { body: "a", recommendedCare: [] },
  contour: { body: "a", recommendedCare: [] },
  symmetry: { body: "a", recommendedCare: [] },
};

describe("toPublicDoctorNote", () => {
  it("internalMemo を除去する", () => {
    const note: DoctorNote = {
      resultId: "12345678",
      parts: {
        ...minimalParts,
        eyes: {
          body: "目",
          recommendedCare: ["ケア1"],
          internalMemo: "院内のみ",
        },
      },
      status: "published",
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "doc@example.com",
      publishedAt: "2026-01-01T01:00:00.000Z",
    };
    const pub = toPublicDoctorNote(note);
    expect(pub.parts.eyes).not.toHaveProperty("internalMemo");
    expect(pub.parts.eyes.body).toBe("目");
    expect(pub.parts.eyes.recommendedCare).toEqual(["ケア1"]);
  });
});
