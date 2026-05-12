// Zustand で写真・検出結果・スコア・AI 診断文・理想顔をまとめて管理するストア
import { nanoid } from "nanoid";
import { create } from "zustand";

import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import type { DetectResult } from "@/lib/faceAnalysis/types";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import type { PortraitResponse } from "@/lib/portrait/types";

export type DiagnosisState = {
  resultId: string | null;
  photoFile: File | null;
  photoDataUrl: string | null;
  detectResult: DetectResult | null;
  scoreResult: ScoreResult | null;
  diagnosisText: DiagnoseResponse | null;
  idealPortrait: PortraitResponse | null;
  setPhoto: (file: File, dataUrl: string) => void;
  setDetectResult: (result: DetectResult | null) => void;
  setScoreResult: (result: ScoreResult | null) => string | null;
  setDiagnosisText: (result: DiagnoseResponse | null) => void;
  setIdealPortrait: (result: PortraitResponse | null) => void;
  clearPhoto: () => void;
};

export const useDiagnosisStore = create<DiagnosisState>((set) => ({
  resultId: null,
  photoFile: null,
  photoDataUrl: null,
  detectResult: null,
  scoreResult: null,
  diagnosisText: null,
  idealPortrait: null,
  setPhoto: (file, dataUrl) =>
    set({
      resultId: null,
      photoFile: file,
      photoDataUrl: dataUrl,
      detectResult: null,
      scoreResult: null,
      diagnosisText: null,
      idealPortrait: null,
    }),
  setDetectResult: (result) =>
    set({
      resultId: null,
      detectResult: result,
      scoreResult: null,
      diagnosisText: null,
      idealPortrait: null,
    }),
  setScoreResult: (result) => {
    if (!result) {
      set({
        resultId: null,
        scoreResult: null,
        diagnosisText: null,
        idealPortrait: null,
      });
      return null;
    }
    const id = nanoid(10);
    set({
      resultId: id,
      scoreResult: result,
      diagnosisText: null,
      idealPortrait: null,
    });
    return id;
  },
  setDiagnosisText: (result) => set({ diagnosisText: result }),
  setIdealPortrait: (result) => set({ idealPortrait: result }),
  clearPhoto: () =>
    set({
      resultId: null,
      photoFile: null,
      photoDataUrl: null,
      detectResult: null,
      scoreResult: null,
      diagnosisText: null,
      idealPortrait: null,
    }),
}));
