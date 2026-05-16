import "server-only";

import {
  DOCTOR_NOTES_COLLECTION,
  DoctorNoteSchema,
  type DoctorNote,
} from "@/lib/doctor-notes/types";
import {
  getAdminFirestore,
  isFirebaseCredentialError,
  isFirestoreAdminConfigured,
} from "@/lib/firebase/admin";

/** 編集用: 下書き・公開を問わず 1 件取得。未作成は `null`。 */
export async function getDoctorNote(resultId: string): Promise<DoctorNote | null> {
  if (!isFirestoreAdminConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[getDoctorNote] Firestore 認証情報が未設定のため null を返します。",
      );
    }
    return null;
  }
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(DOCTOR_NOTES_COLLECTION).doc(resultId).get();
    if (!snap.exists) return null;
    const parsed = DoctorNoteSchema.safeParse(snap.data());
    if (!parsed.success) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[getDoctorNote] schema mismatch", parsed.error.flatten());
      }
      return null;
    }
    return parsed.data;
  } catch (err) {
    if (isFirebaseCredentialError(err)) {
      console.warn("[getDoctorNote] Firestore 認証エラー:", err);
      return null;
    }
    throw err;
  }
}

/**
 * `status === "published"` のドキュメントのみ返す。未作成・draft は `null`。
 */
export async function getPublishedDoctorNote(
  resultId: string,
): Promise<DoctorNote | null> {
  const note = await getDoctorNote(resultId);
  if (!note || note.status !== "published" || !note.publishedAt) return null;
  return note;
}

export async function saveDoctorNote(note: DoctorNote): Promise<void> {
  if (!isFirestoreAdminConfigured()) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY または GOOGLE_APPLICATION_CREDENTIALS が未設定です。",
    );
  }
  const parsed = DoctorNoteSchema.parse(note);
  const db = getAdminFirestore();
  await db.collection(DOCTOR_NOTES_COLLECTION).doc(parsed.resultId).set(parsed);
}
