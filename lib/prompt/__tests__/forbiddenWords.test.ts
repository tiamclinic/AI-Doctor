import { describe, expect, it } from "vitest";

import {
  replaceMedicalTerms,
  scanForbidden,
} from "@/lib/prompt/forbiddenWords";

describe("scanForbidden", () => {
  it("禁止語が含まれない場合は ok=true", () => {
    const r = scanForbidden(
      "縦三分割 88.0 が示すとおり、額・目元・口元の縦比率が整っています。",
    );
    expect(r.ok).toBe(true);
    expect(r.hits).toEqual([]);
  });

  it("GPT 頻出フレーズを検出する", () => {
    const r = scanForbidden(
      "とても素晴らしいバランスで、いかがでしょうか？",
    );
    expect(r.ok).toBe(false);
    expect(r.hits).toContain("素晴らしい");
    expect(r.hits).toContain("いかがでしょうか");
  });

  it("最上級表現を検出する", () => {
    const r = scanForbidden("最も美しいラインです。");
    expect(r.ok).toBe(false);
    expect(r.hits).toContain("最も美しい");
  });

  it("美容医療の施術名を検出する", () => {
    const r = scanForbidden("ヒアルロン酸の注入をおすすめします。");
    expect(r.ok).toBe(false);
    expect(r.hits).toContain("ヒアルロン酸");
  });

  it("HIFU 等の機器名を検出する", () => {
    const r = scanForbidden("HIFU で引き締める方法");
    expect(r.ok).toBe(false);
    expect(r.hits).toContain("HIFU");
  });
});

describe("replaceMedicalTerms", () => {
  it("「治療」が「ケア」に置換される", () => {
    expect(replaceMedicalTerms("適切な治療が必要です。")).toBe(
      "適切なケアが必要です。",
    );
  });

  it("「改善されます」が「整いやすくなります」に置換される", () => {
    expect(replaceMedicalTerms("印象が改善されます。")).toBe(
      "印象が整いやすくなります。",
    );
  });

  it("「改善できます」も「整えやすくなります」に置換される", () => {
    expect(replaceMedicalTerms("目元の印象を改善できます。")).toBe(
      "目元の印象を整えやすくなります。",
    );
  });

  it("「改善する」「改善し」など活用形を一括処理する", () => {
    expect(replaceMedicalTerms("印象を改善する方法を改善し続ける。")).toBe(
      "印象を整える方法を整え続ける。",
    );
  });

  it("「治る」が「整える」に置換される", () => {
    expect(replaceMedicalTerms("傾向が治るでしょう。")).toBe(
      "傾向が整えるでしょう。",
    );
  });

  it("医療表現を含まない文は変化しない", () => {
    const text = "余白を生かした静かな整いが TIAM らしい美しさです。";
    expect(replaceMedicalTerms(text)).toBe(text);
  });
});
