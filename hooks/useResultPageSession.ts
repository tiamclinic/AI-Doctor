"use client";

import * as React from "react";

import { useDiagnosisRecord } from "@/hooks/useDiagnosisRecord";
import { useDiagnosisSessionCache } from "@/hooks/useDiagnosisSessionCache";
import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import type { DetectResult } from "@/lib/faceAnalysis/types";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";

export type ResultPageSessionState =
  | { status: "loading" }
  | {
      status: "ready";
      scoreResult: ScoreResult;
      diagnosisText: DiagnoseResponse | null;
      photoDataUrl: string | null;
      detectResult: DetectResult | null;
      /** Firestore のみから復元（写真なし） */
      fromPersistedOnly: boolean;
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

function pickDiagnosisText(
  ...candidates: (DiagnoseResponse | null | undefined)[]
): DiagnoseResponse | null {
  for (const c of candidates) {
    if (c) return c;
  }
  return null;
}

/**
 * 結果画面用。優先順: Zustand → sessionStorage → GET /api/diagnoses/{id}
 */
export function useResultPageSession(resultId: string): ResultPageSessionState {
  const storeResultId = useDiagnosisStore((s) => s.resultId);
  const photoDataUrl = useDiagnosisStore((s) => s.photoDataUrl);
  const detectResult = useDiagnosisStore((s) => s.detectResult);
  const scoreResult = useDiagnosisStore((s) => s.scoreResult);
  const diagnosisText = useDiagnosisStore((s) => s.diagnosisText);

  const api = useDiagnosisRecord(resultId);

  const sessionCache = useDiagnosisSessionCache(resultId);

  const storeMatches =
    storeResultId === resultId && scoreResult !== null;

  const apiRecord = api.status === "success" ? api.data : null;
  const apiErrorMessage = api.status === "error" ? api.message : null;

  return React.useMemo((): ResultPageSessionState => {
    if (storeMatches && scoreResult) {
      return {
        status: "ready",
        scoreResult,
        diagnosisText,
        photoDataUrl,
        detectResult,
        fromPersistedOnly: false,
      };
    }

    if (sessionCache) {
      return {
        status: "ready",
        scoreResult: sessionCache.scoreResult,
        diagnosisText: pickDiagnosisText(
          diagnosisText,
          sessionCache.diagnosisText,
          apiRecord?.diagnosisText,
        ),
        photoDataUrl: sessionCache.photoDataUrl,
        detectResult: sessionCache.detectResult ?? detectResult,
        fromPersistedOnly: false,
      };
    }

    if (apiRecord) {
      const photo =
        photoDataUrl ?? apiRecord.thumbnailUrl ?? null;
      return {
        status: "ready",
        scoreResult: apiRecord.scoreResult,
        diagnosisText: pickDiagnosisText(diagnosisText, apiRecord.diagnosisText),
        photoDataUrl: photo,
        detectResult,
        fromPersistedOnly: !photo,
      };
    }

    if (api.status === "loading" || api.status === "idle") {
      return { status: "loading" };
    }

    if (api.status === "not_found") {
      return { status: "not_found" };
    }

    return {
      status: "error",
      message: apiErrorMessage ?? "結果を取得できませんでした。",
    };
  }, [
    storeMatches,
    scoreResult,
    diagnosisText,
    photoDataUrl,
    detectResult,
    sessionCache,
    api.status,
    apiRecord,
    apiErrorMessage,
  ]);
}
