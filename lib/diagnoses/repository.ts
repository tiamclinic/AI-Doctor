import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { DOCTOR_NOTES_COLLECTION } from "@/lib/doctor-notes/types";
import {
  DIAGNOSES_COLLECTION,
  type DiagnosisListItem,
  type DiagnosisNoteStatus,
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
  cursor?: string;
};

function resolveNoteStatus(
  raw: { status?: string } | undefined,
): DiagnosisNoteStatus {
  if (raw?.status === "published") return "published";
  if (raw?.status === "draft") return "draft";
  return "none";
}

export type ListDiagnosesResult = {
  items: DiagnosisListItem[];
  nextCursor: string | null;
};

export async function listDiagnoses(
  options: ListDiagnosesOptions,
): Promise<ListDiagnosesResult> {
  if (!isFirestoreAdminConfigured()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY または GOOGLE_APPLICATION_CREDENTIALS が未設定です。",
    );
  }
  const db = getAdminFirestore();
  let query = db
    .collection(DIAGNOSES_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(options.limit);

  if (options.cursor) {
    query = query.startAfter(options.cursor);
  }

  const snap = await query.get();

  const records: DiagnosisRecord[] = [];
  for (const doc of snap.docs) {
    const parsed = DiagnosisRecordSchema.safeParse(doc.data());
    if (parsed.success) records.push(parsed.data);
  }

  if (records.length === 0) {
    return { items: [], nextCursor: null };
  }

  const noteRefs = records.map((r) =>
    db.collection(DOCTOR_NOTES_COLLECTION).doc(r.resultId),
  );
  const noteSnaps = await db.getAll(...noteRefs);

  const noteStatusById = new Map<string, DiagnosisNoteStatus>();
  for (const noteSnap of noteSnaps) {
    if (!noteSnap.exists) continue;
    noteStatusById.set(
      noteSnap.id,
      resolveNoteStatus(noteSnap.data() as { status?: string }),
    );
  }

  const items: DiagnosisListItem[] = records.map((record) => ({
    ...record,
    noteStatus: noteStatusById.get(record.resultId) ?? "none",
  }));

  const last = records[records.length - 1]!;
  const nextCursor =
    snap.docs.length >= options.limit ? last.createdAt : null;

  return { items, nextCursor };
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
