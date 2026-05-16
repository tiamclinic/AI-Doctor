import { describe, expect, it } from "vitest";

import {
  formatDoctorByline,
  hasVisibleDoctorPartBody,
  hasVisibleDoctorReport,
  partNoteIsVisible,
} from "@/lib/doctor-notes/publicDisplay";

describe("publicDisplay", () => {
  it("hasVisibleDoctorPartBody は空白・プレースホルダを除外", () => {
    expect(hasVisibleDoctorPartBody(" ")).toBe(false);
    expect(hasVisibleDoctorPartBody("（医師が後で記入）")).toBe(false);
    expect(hasVisibleDoctorPartBody("所見です。")).toBe(true);
  });

  it("hasVisibleDoctorReport はいずれかのフィールドがあれば true", () => {
    expect(hasVisibleDoctorReport(undefined)).toBe(false);
    expect(
      hasVisibleDoctorReport({
        overallComment: "",
        strengths: [],
        improvements: [],
        recommendedCare: [],
      }),
    ).toBe(false);
    expect(
      hasVisibleDoctorReport({
        overallComment: "総評",
        strengths: [],
        improvements: [],
        recommendedCare: [],
      }),
    ).toBe(true);
  });

  it("partNoteIsVisible は本文または推奨ケア", () => {
    expect(
      partNoteIsVisible({ body: " ", recommendedCare: ["ケア"] }),
    ).toBe(true);
    expect(partNoteIsVisible({ body: " ", recommendedCare: [] })).toBe(false);
  });

  it("formatDoctorByline", () => {
    const line = formatDoctorByline("doctor@clinic.jp", "2026-05-16T05:00:00.000Z");
    expect(line).toContain("doctor@clinic.jp");
    expect(line).toContain("公開:");
  });
});
