import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import {
  DIAGNOSES_COLLECTION,
  type DiagnosisRecord,
  DiagnosisRecordSchema,
} from "@/lib/diagnoses/types";
import {
  getAdminFirestore,
  isFirebaseCredentialError,
  isFirestoreAdminConfigured,
} from "@/lib/firebase/admin";

export { buildDiagnosisRecord } from "@/lib/diagnoses/buildRecord";

export class DiagnosisNotFoundError extends Error {
  constructor(resultId: string) {
    super(`Diagnosis not found: ${resultId}`);
    this.name = "DiagnosisNotFoundError";
  }
}

export async function saveDiagnosis(record: DiagnosisRecord): Promise<void> {
  if (!isFirestoreAdminConfigured()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY または GOOGLE_APPLICATION_CREDENTIALS が未設定です。",
    );
  }
  const parsed = DiagnosisRecordSchema.parse(record);
  const db = getAdminFirestore();
  await db.collection(DIAGNOSES_COLLECTION).doc(parsed.resultId).set(parsed);
}

export async function getDiagnosis(resultId: string): Promise<DiagnosisRecord | null> {
  if (!isFirestoreAdminConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[getDiagnosis] Firestore 認証情報が未設定のため null を返します（FIREBASE_SERVICE_ACCOUNT_KEY を設定してください）。",
      );
    }
    return null;
  }
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(DIAGNOSES_COLLECTION).doc(resultId).get();
    if (!snap.exists) return null;
    const parsed = DiagnosisRecordSchema.safeParse(snap.data());
    if (!parsed.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[getDiagnosis] schema mismatch", parsed.error.flatten());
      }
      return null;
    }
    return parsed.data;
  } catch (err) {
    if (isFirebaseCredentialError(err)) {
      console.warn("[getDiagnosis] Firestore 認証エラー:", err);
      return null;
    }
    throw err;
  }
}

export type ListDiagnosesOptions = {
  limit: number;
};

export async function listDiagnoses(
  options: ListDiagnosesOptions,
): Promise<DiagnosisRecord[]> {
  if (!isFirestoreAdminConfigured()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY または GOOGLE_APPLICATION_CREDENTIALS が未設定です。",
    );
  }
  const db = getAdminFirestore();
  const snap = await db
    .collection(DIAGNOSES_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(options.limit)
    .get();

  const out: DiagnosisRecord[] = [];
  for (const doc of snap.docs) {
    const parsed = DiagnosisRecordSchema.safeParse(doc.data());
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

export async function updateDiagnosisMeta(
  resultId: string,
  patch: {
    patientLabel: string;
    patientLabelUpdatedBy: string;
    patientLabelUpdatedAt: string;
  },
): Promise<void> {
  if (!isFirestoreAdminConfigured()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY または GOOGLE_APPLICATION_CREDENTIALS が未設定です。",
    );
  }
  const db = getAdminFirestore();
  const ref = db.collection(DIAGNOSES_COLLECTION).doc(resultId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new DiagnosisNotFoundError(resultId);
  }

  const payload: Record<string, unknown> = {
    patientLabelUpdatedBy: patch.patientLabelUpdatedBy,
    patientLabelUpdatedAt: patch.patientLabelUpdatedAt,
  };
  if (patch.patientLabel === "") {
    payload.patientLabel = FieldValue.delete();
  } else {
    payload.patientLabel = patch.patientLabel;
  }

  await ref.update(payload);
}
