import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import type { DetectResult } from "@/lib/faceAnalysis/types";
import { normalizeScoreResult, type ScoreResult } from "@/lib/faceAnalysis/scoring";

const KEY_PREFIX = "tiam-diagnosis-session:";
const SESSION_CHANGE_EVENT = "tiam-diagnosis-session-change";

function notifySessionChange(resultId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SESSION_CHANGE_EVENT, { detail: { resultId } }),
  );
}

export function subscribeDiagnosisSession(
  resultId: string,
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ resultId: string }>).detail;
    if (!detail?.resultId || detail.resultId === resultId) {
      onStoreChange();
    }
  };

  window.addEventListener(SESSION_CHANGE_EVENT, handler);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, handler);
}

export type DiagnosisSessionCache = {
  resultId: string;
  photoDataUrl: string;
  detectResult: DetectResult | null;
  scoreResult: ScoreResult;
  diagnosisText: DiagnoseResponse | null;
  savedAt: string;
};

export function diagnosisSessionStorageKey(resultId: string): string {
  return `${KEY_PREFIX}${resultId}`;
}

export function saveDiagnosisSession(cache: DiagnosisSessionCache): boolean {
  if (typeof window === "undefined") return false;
  try {
    sessionStorage.setItem(
      diagnosisSessionStorageKey(cache.resultId),
      JSON.stringify(cache),
    );
    invalidateSnapshot(cache.resultId);
    notifySessionChange(cache.resultId);
    return true;
  } catch {
    return false;
  }
}

function parseDiagnosisSession(
  resultId: string,
  raw: string,
): DiagnosisSessionCache | null {
  try {
    const parsed = JSON.parse(raw) as DiagnosisSessionCache;
    if (parsed.resultId !== resultId || !parsed.photoDataUrl || !parsed.scoreResult) {
      return null;
    }
    return {
      ...parsed,
      scoreResult: normalizeScoreResult(
        parsed.scoreResult,
        parsed.detectResult?.landmarks,
      ),
    };
  } catch {
    return null;
  }
}

/** useSyncExternalStore 用。同一 raw なら同じオブジェクト参照を返す */
const snapshotByResultId = new Map<
  string,
  { raw: string | null; value: DiagnosisSessionCache | null }
>();

function invalidateSnapshot(resultId: string): void {
  snapshotByResultId.delete(resultId);
}

export function getDiagnosisSessionSnapshot(
  resultId: string,
): DiagnosisSessionCache | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(diagnosisSessionStorageKey(resultId));
  } catch {
    return null;
  }

  const cached = snapshotByResultId.get(resultId);
  if (cached && cached.raw === raw) {
    return cached.value;
  }

  const value = raw ? parseDiagnosisSession(resultId, raw) : null;
  snapshotByResultId.set(resultId, { raw, value });
  return value;
}

export function loadDiagnosisSession(resultId: string): DiagnosisSessionCache | null {
  return getDiagnosisSessionSnapshot(resultId);
}

export function clearDiagnosisSession(resultId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(diagnosisSessionStorageKey(resultId));
    invalidateSnapshot(resultId);
    notifySessionChange(resultId);
  } catch {
    // ignore
  }
}
