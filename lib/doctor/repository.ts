import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_TENANT_ID,
  DOCTOR_CONTENT_COLLECTION,
  DoctorContentSchema,
  type DoctorContent,
} from "@/lib/doctor/types";
import { getAdminFirestore, isFirestoreAdminConfigured } from "@/lib/firebase/admin";

export class DoctorContentNotFoundError extends Error {
  constructor(tenantId: string) {
    super(`Doctor content not found for tenant: ${tenantId}`);
    this.name = "DoctorContentNotFoundError";
  }
}

function loadSeedFallback(): DoctorContent {
  const path = join(process.cwd(), "scripts/seed/doctor-content.seed.json");
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  return DoctorContentSchema.parse(raw);
}

/**
 * Firestore `doctor_contents/{tenantId}` を読み取る。
 * 開発時のみ: 未設定・未存在時はシード JSON にフォールバック（`NODE_ENV=development`）。
 */
export async function getDoctorContent(
  tenantId: string = DEFAULT_TENANT_ID,
): Promise<DoctorContent> {
  if (!isFirestoreAdminConfigured()) {
    if (process.env.NODE_ENV === "development") {
      return loadSeedFallback();
    }
    throw new Error(
      "FIREBASE_PROJECT_ID または FIREBASE_SERVICE_ACCOUNT_KEY が未設定です。",
    );
  }

  try {
    const db = getAdminFirestore();
    const snap = await db
      .collection(DOCTOR_CONTENT_COLLECTION)
      .doc(tenantId)
      .get();

    if (!snap.exists) {
      if (process.env.NODE_ENV === "development") {
        return loadSeedFallback();
      }
      throw new DoctorContentNotFoundError(tenantId);
    }

    return DoctorContentSchema.parse(snap.data());
  } catch (err) {
    if (
      process.env.NODE_ENV === "development" &&
      !(err instanceof DoctorContentNotFoundError)
    ) {
      console.warn("[getDoctorContent] Firestore failed, using seed fallback:", err);
      return loadSeedFallback();
    }
    throw err;
  }
}

export async function saveDoctorContent(
  content: DoctorContent,
  tenantId: string = DEFAULT_TENANT_ID,
): Promise<void> {
  if (!isFirestoreAdminConfigured()) {
    throw new Error(
      "FIREBASE_PROJECT_ID または FIREBASE_SERVICE_ACCOUNT_KEY が未設定です。",
    );
  }

  const parsed = DoctorContentSchema.parse(content);
  const db = getAdminFirestore();
  await db.collection(DOCTOR_CONTENT_COLLECTION).doc(tenantId).set(parsed);
}
