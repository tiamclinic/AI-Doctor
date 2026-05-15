import type { ScoreResult } from "@/lib/faceAnalysis/scoring";

/** 管理画面プレビュー用の固定スコア（モック準拠） */
export const ADMIN_PREVIEW_SCORE: ScoreResult = {
  totalScore: 86,
  scores: {
    verticalThirds: 88,
    horizontalFifths: 84,
    eyeSpacing: 91,
    eyePosition: 87,
    noseMouthRatio: 90,
    eLine: 80,
    faceContour: 83,
    bilateralSymmetry: 89,
  },
  rawValues: {
    verticalThirds: {
      sections: [1, 1, 1],
      ratios: [1 / 3, 1 / 3, 1 / 3],
    },
    horizontalFifths: { faceWidth: 1, eyeWidth: 0.2, ratio: 1 },
    eyeSpacing: { interEye: 1, eyeWidth: 1, ratio: 1 },
    eyePosition: { eyeY: 0.5, faceHeight: 1, ratio: 0.5 },
    noseMouthRatio: { noseWidth: 0.6, mouthWidth: 1, ratio: 0.6 },
    eLine: { upperLipDeviation: 0, lowerLipDeviation: 0 },
    faceContour: { faceWidth: 0.68, faceHeight: 1, ratio: 0.68 },
    bilateralSymmetry: { meanAsymmetry: 0 },
  },
};
