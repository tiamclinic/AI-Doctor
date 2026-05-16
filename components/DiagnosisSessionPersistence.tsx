"use client";

import * as React from "react";

import {
  clearDiagnosisSession,
  saveDiagnosisSession,
} from "@/lib/diagnoses/session-cache";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";

/**
 * 診断セッション（写真・ランドマーク・スコア）を sessionStorage に同期する。
 * リロードや管理画面経由の遷移後も同一ブラウザなら結果画面で写真を復元できる。
 */
export function DiagnosisSessionPersistence() {
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsub = useDiagnosisStore.subscribe((state, prev) => {
      if (
        state.resultId &&
        state.photoDataUrl &&
        state.scoreResult &&
        (state.resultId !== prev.resultId ||
          state.photoDataUrl !== prev.photoDataUrl ||
          state.scoreResult !== prev.scoreResult ||
          state.detectResult !== prev.detectResult ||
          state.diagnosisText !== prev.diagnosisText)
      ) {
        if (timer) globalThis.clearTimeout(timer);
        timer = globalThis.setTimeout(() => {
          saveDiagnosisSession({
            resultId: state.resultId!,
            photoDataUrl: state.photoDataUrl!,
            detectResult: state.detectResult,
            scoreResult: state.scoreResult!,
            diagnosisText: state.diagnosisText,
            savedAt: new Date().toISOString(),
          });
        }, 200);
      }

      if (prev.resultId && !state.resultId && !state.photoDataUrl) {
        clearDiagnosisSession(prev.resultId);
      }
    });

    return () => {
      if (timer) globalThis.clearTimeout(timer);
      unsub();
    };
  }, []);

  return null;
}
