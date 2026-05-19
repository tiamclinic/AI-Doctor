import { describe, expect, it } from "vitest";

import {
  formatPrintDateTime,
  getClinicDisplayName,
  PRINT_REPORT_TITLE,
} from "@/lib/result/print";

describe("print helpers", () => {
  it("デフォルトのクリニック名", () => {
    const prev = process.env.NEXT_PUBLIC_CLINIC_NAME;
    delete process.env.NEXT_PUBLIC_CLINIC_NAME;
    expect(getClinicDisplayName()).toBe("TIAM Beauty Lab");
    process.env.NEXT_PUBLIC_CLINIC_NAME = prev;
  });

  it("環境変数でクリニック名を上書き", () => {
    const prev = process.env.NEXT_PUBLIC_CLINIC_NAME;
    process.env.NEXT_PUBLIC_CLINIC_NAME = " テストクリニック ";
    expect(getClinicDisplayName()).toBe("テストクリニック");
    process.env.NEXT_PUBLIC_CLINIC_NAME = prev;
  });

  it("レポートタイトルが定義されている", () => {
    expect(PRINT_REPORT_TITLE).toContain("TIAM");
  });

  it("日時を日本語でフォーマット", () => {
    const s = formatPrintDateTime(new Date("2026-05-19T10:30:00+09:00"));
    expect(s).toMatch(/2026/);
    expect(s).toMatch(/5/);
  });
});
