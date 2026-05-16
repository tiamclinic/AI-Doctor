import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDiagnosisSession,
  diagnosisSessionStorageKey,
  getDiagnosisSessionSnapshot,
  loadDiagnosisSession,
  saveDiagnosisSession,
  type DiagnosisSessionCache,
} from "@/lib/diagnoses/session-cache";

function mockSessionStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("sessionStorage", storage);
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  return store;
}

const sample: DiagnosisSessionCache = {
  resultId: "abc1234567",
  photoDataUrl: "data:image/jpeg;base64,abc",
  detectResult: null,
  scoreResult: {
    totalScore: 80,
    scores: {
      verticalThirds: 80,
      horizontalFifths: 80,
      eyeSpacing: 80,
      eyePosition: 80,
      noseMouthRatio: 80,
      eLine: 80,
      faceContour: 80,
      bilateralSymmetry: 80,
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
    },
  },
  diagnosisText: null,
  savedAt: "2026-05-16T00:00:00.000Z",
};

describe("session-cache", () => {
  beforeEach(() => {
    mockSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("save and load roundtrip", () => {
    expect(saveDiagnosisSession(sample)).toBe(true);
    const loaded = loadDiagnosisSession(sample.resultId);
    expect(loaded?.photoDataUrl).toBe(sample.photoDataUrl);
  });

  it("clear removes entry", () => {
    saveDiagnosisSession(sample);
    clearDiagnosisSession(sample.resultId);
    expect(sessionStorage.getItem(diagnosisSessionStorageKey(sample.resultId))).toBeNull();
  });

  it("getDiagnosisSessionSnapshot returns stable reference for same raw", () => {
    saveDiagnosisSession(sample);
    const a = getDiagnosisSessionSnapshot(sample.resultId);
    const b = getDiagnosisSessionSnapshot(sample.resultId);
    expect(a).toBe(b);
  });
});
