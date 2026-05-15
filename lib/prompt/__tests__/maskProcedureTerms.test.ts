import { describe, expect, it } from "vitest";

import {
  MEDICAL_PROCEDURE_TERMS,
  maskDiagnoseResponse,
  maskProcedureTerms,
  scanForbidden,
} from "@/lib/prompt/forbiddenWords";

describe("maskProcedureTerms", () => {
  it("ヒアルロン酸を中立表現に置換する", () => {
    expect(maskProcedureTerms("目元にヒアルロン酸を検討する")).toBe(
      "目元に美容バランスの整え方を検討する",
    );
  });

  it("複数の施術語を順に置換する", () => {
    const t = maskProcedureTerms("ボトックスとHIFUの併用について");
    expect(t).not.toContain("ボトックス");
    expect(t).not.toContain("HIFU");
    expect(t.split("美容バランスの整え方").length).toBeGreaterThanOrEqual(3);
  });

  it("長い語を先に処理し部分一致の二重置換を避ける", () => {
    const t = maskProcedureTerms("脂肪吸引と脂肪移植の違い");
    expect(t).not.toContain("脂肪吸引");
    expect(t).not.toContain("脂肪移植");
  });

  it("マスク後の全文に施術語リストの語が残らない", () => {
    const raw = MEDICAL_PROCEDURE_TERMS.slice(0, 6).join("、");
    const masked = maskProcedureTerms(raw);
    for (const term of MEDICAL_PROCEDURE_TERMS) {
      expect(masked.includes(term)).toBe(false);
    }
  });

  it("施術語以外の日本語は変化させない", () => {
    const plain = "縦三分割のバランスが整いやすい傾向です。";
    expect(maskProcedureTerms(plain)).toBe(plain);
  });

  it("maskDiagnoseResponse が全フィールドにマスクを適用する", () => {
    const json = {
      overallComment:
        "TIAM 観点では鼻整形の話題は避けます。縦三分割と鼻口比のバランスが読み取りやすく、横五分割も安定した傾向が見られます。",
      strengths: [
        "目元は自然でバランスが取れています。",
        "輪郭が読みやすい配置になっています。",
        "横五分割の安定感が伝わります。",
      ],
      improvements: [
        "糸リフトの話は避けますが、表情の余白に注目できます。",
        "生活リズムを整えると印象が落ち着きます。",
      ],
      recommendedCare: [
        "ダーマペンは使わず、メイクで陰影を調整します。",
        "スキンケアは保湿を中心に整えます。",
        "表情筋をほぐすストレッチを続けます。",
      ],
      tiamMessage: "サーマクールの話はせず、日々のケアを大切にします。",
    };
    const out = maskDiagnoseResponse(json);
    expect(out.overallComment).not.toContain("鼻整形");
    expect(out.improvements.join(" ")).not.toContain("糸リフト");
    expect(out.recommendedCare.join(" ")).not.toContain("ダーマペン");
    expect(out.tiamMessage).not.toContain("サーマクール");
  });

  it("マスク後に scanForbidden で施術語ヒットが消えている", () => {
    const masked = maskProcedureTerms("ピコレーザー後のケアとして");
    const scan = scanForbidden(masked);
    const procHits = scan.hits.filter((h) => MEDICAL_PROCEDURE_TERMS.includes(h));
    expect(procHits.length).toBe(0);
  });
});
