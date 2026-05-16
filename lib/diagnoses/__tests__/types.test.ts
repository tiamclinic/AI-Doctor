import { describe, expect, it } from "vitest";

import { makeIdealLandmarks } from "@/lib/faceAnalysis/__tests__/dummyLandmarks";
import { computeScore } from "@/lib/faceAnalysis/scoring";
import { buildDiagnosisRecord } from "@/lib/diagnoses/buildRecord";
import {
  DiagnosisCreateBodySchema,
  DiagnosisPatchBodySchema,
  DiagnosisRecordSchema,
} from "@/lib/diagnoses/types";

const validDiagnosisText = {
  overallComment:
    "全体的に黄金比に近いバランスが取れています。目元と輪郭の印象が穏やかで、清潔感のある印象です。",
  strengths: [
    "目元の開きと位置が整い、視線の抜けがよいです。",
    "鼻先から顎へのラインがすっきりして見えます。",
    "口元の左右差が小さく、表情の均整が取れています。",
  ],
  improvements: [
    "顔の下半分のボリューム感を少し抑えると、より洗練された印象になります。",
    "輪郭の角をやわらかく見せると、柔らかい印象に寄せられます。",
  ],
  recommendedCare: [
    "眉の形を少し整えると目元の印象が引き締まります。",
    "リップの血色を整えると口元の明るさが増します。",
    "首筋のストレッチで表情筋の緊張をほぐすと自然な笑顔になりやすいです。",
  ],
  tiamMessage: "黄金比のバランスを意識した日々のケアで、自分らしい美しさを楽しんでください。",
};

describe("DiagnosisCreateBodySchema", () => {
  it("理想ランドマークの scoreResult と診断文で通る", () => {
    const scoreResult = computeScore(makeIdealLandmarks());
    const parsed = DiagnosisCreateBodySchema.safeParse({
      resultId: "abcdefghij",
      scoreResult,
      diagnosisText: validDiagnosisText,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("DiagnosisRecordSchema", () => {
  it("buildDiagnosisRecord の出力を通す", () => {
    const scoreResult = computeScore(makeIdealLandmarks());
    const record = buildDiagnosisRecord({
      resultId: "abcdefghij",
      scoreResult,
      diagnosisText: validDiagnosisText,
      createdAt: "2026-05-16T12:00:00.000Z",
      photoPolicy: "none",
    });
    expect(DiagnosisRecordSchema.safeParse(record).success).toBe(true);
  });
});

describe("DiagnosisPatchBodySchema", () => {
  it("ラベル文字列と空文字を受け付ける", () => {
    expect(DiagnosisPatchBodySchema.safeParse({ patientLabel: "K-1024" }).success).toBe(
      true,
    );
    expect(DiagnosisPatchBodySchema.safeParse({ patientLabel: "" }).success).toBe(true);
  });

  it("未指定は拒否する", () => {
    expect(DiagnosisPatchBodySchema.safeParse({}).success).toBe(false);
  });
});
