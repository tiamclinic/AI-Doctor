import { describe, expect, it } from "vitest";

import {
  diagnosisDisplayLabel,
  filterAndSortDiagnosisListItems,
} from "@/lib/diagnoses/listDisplay";
import type { DiagnosisListItem } from "@/lib/diagnoses/types";

function item(
  partial: Partial<DiagnosisListItem> & Pick<DiagnosisListItem, "resultId" | "noteStatus" | "createdAt">,
): DiagnosisListItem {
  return {
    resultId: partial.resultId,
    createdAt: partial.createdAt,
    noteStatus: partial.noteStatus,
    patientLabel: partial.patientLabel,
    photoPolicy: "none",
    scoreResult: {
      totalScore: 70,
      scores: {
        verticalThirds: 70,
        horizontalFifths: 70,
        eyeSpacing: 70,
        eyePosition: 70,
        noseMouthRatio: 70,
        eLine: 70,
        faceContour: 70,
        bilateralSymmetry: 70,
        eyeLevelSymmetry: 70,
        mouthLevelSymmetry: 70,
      },
      rawValues: {
        verticalThirds: { sections: [1, 1, 1], ratios: [1, 1, 1] },
        horizontalFifths: { faceWidth: 1, eyeWidth: 1, ratio: 1 },
        eyeSpacing: { interEye: 1, eyeWidth: 1, ratio: 1 },
        noseMouthRatio: { noseWidth: 1, mouthWidth: 1, ratio: 1 },
        eLine: { upperLipDeviation: 0, lowerLipDeviation: 0 },
        faceContour: { faceWidth: 1, faceHeight: 1, ratio: 1 },
        eyePosition: { eyeY: 1, faceHeight: 1, ratio: 1 },
        bilateralSymmetry: { meanAsymmetry: 0 },
        eyeLevelSymmetry: { eyeLevelDelta: 0 },
        mouthLevelSymmetry: { mouthLevelDelta: 0 },
      },
    },
    diagnosisText: {
      overallComment: "test",
      strengths: ["a", "b", "c"],
      improvements: ["x", "y"],
      recommendedCare: ["1", "2", "3"],
      tiamMessage: "msg",
    },
  };
}

describe("listDisplay", () => {
  it("diagnosisDisplayLabel prefers patientLabel", () => {
    expect(
      diagnosisDisplayLabel({
        patientLabel: "カルテ A-12",
        resultId: "abcdefghij",
      }),
    ).toBe("カルテ A-12");
    expect(diagnosisDisplayLabel({ resultId: "CtxXayQpuf" })).toBe("ayQpuf");
  });

  it("filterAndSortDiagnosisListItems filters by note status", () => {
    const items = [
      item({ resultId: "a", noteStatus: "none", createdAt: "2026-01-02T00:00:00.000Z" }),
      item({ resultId: "b", noteStatus: "published", createdAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(filterAndSortDiagnosisListItems(items, "none", "newest")).toHaveLength(1);
    expect(filterAndSortDiagnosisListItems(items, "none", "newest")[0]?.resultId).toBe("a");
  });

  it("filterAndSortDiagnosisListItems sorts unentered first", () => {
    const items = [
      item({ resultId: "pub", noteStatus: "published", createdAt: "2026-01-03T00:00:00.000Z" }),
      item({ resultId: "none", noteStatus: "none", createdAt: "2026-01-01T00:00:00.000Z" }),
      item({ resultId: "draft", noteStatus: "draft", createdAt: "2026-01-02T00:00:00.000Z" }),
    ];
    const sorted = filterAndSortDiagnosisListItems(items, "all", "unentered_first");
    expect(sorted.map((i) => i.noteStatus)).toEqual(["none", "draft", "published"]);
  });
});
