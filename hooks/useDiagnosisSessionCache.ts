"use client";

import * as React from "react";

import {
  getDiagnosisSessionSnapshot,
  subscribeDiagnosisSession,
  type DiagnosisSessionCache,
} from "@/lib/diagnoses/session-cache";

/** 同一タブの sessionStorage から診断セッション（写真含む）を購読する */
export function useDiagnosisSessionCache(
  resultId: string,
): DiagnosisSessionCache | null {
  return React.useSyncExternalStore(
    (onStoreChange) => subscribeDiagnosisSession(resultId, onStoreChange),
    () => getDiagnosisSessionSnapshot(resultId),
    () => null,
  );
}
