// GPT 頻出の "ぼかし" フレーズ。出力に出てきたら NG。
// 大文字小文字や記号ゆらぎを意識せず素直な部分一致でチェックする。
export const FORBIDDEN_PHRASES: readonly string[] = [
  "いかがでしょうか",
  "いかがですか",
  "と言えるでしょう",
  "言えるでしょう",
  "素晴らしい",
  "申し分のない",
  "申し分ない",
  "とても良い",
  "可能性があります",
  "と思われます",
  "重要です",
  "おすすめします",
  "とても重要",
  "魅力的です",
  "理想的です",
];

// 薬機法配慮：医療系の断定表現は美容バランス文脈に置換する。
// 順序通りに適用する（前の置換が後ろの対象を作らないよう注意）。
export const MEDICAL_TERM_REPLACEMENTS: readonly { from: RegExp; to: string }[] =
  [
    { from: /医療効果/g, to: "美容バランスの傾向" },
    { from: /治療効果/g, to: "ケアによる整い" },
    // 「改善されます／改善する／改善し／改善でき」など主要活用形を一括カバー
    { from: /改善されます/g, to: "整いやすくなります" },
    { from: /改善できます/g, to: "整えやすくなります" },
    { from: /改善できる/g, to: "整えやすい" },
    { from: /改善でき/g, to: "整えやすく" },
    { from: /改善する/g, to: "整える" },
    { from: /改善し/g, to: "整え" },
    { from: /治療/g, to: "ケア" },
    { from: /治る/g, to: "整える" },
    { from: /疾患/g, to: "傾向" },
    { from: /症状/g, to: "傾向" },
  ];

// 景表法配慮：根拠なき最上級表現も避ける。
export const SUPERLATIVE_PHRASES: readonly string[] = [
  "最も美しい",
  "No.1",
  "業界一",
  "世界一",
  "ナンバーワン",
];

export type ForbiddenScanResult = {
  ok: boolean;
  hits: string[];
};

const scan = (
  text: string,
  dictionaries: readonly (readonly string[])[],
): ForbiddenScanResult => {
  const hits: string[] = [];
  for (const list of dictionaries) {
    for (const word of list) {
      if (text.includes(word)) hits.push(word);
    }
  }
  return { ok: hits.length === 0, hits };
};

export function scanForbidden(text: string): ForbiddenScanResult {
  return scan(text, [FORBIDDEN_PHRASES, SUPERLATIVE_PHRASES]);
}

export function replaceMedicalTerms(text: string): string {
  let result = text;
  for (const { from, to } of MEDICAL_TERM_REPLACEMENTS) {
    result = result.replace(from, to);
  }
  return result;
}
