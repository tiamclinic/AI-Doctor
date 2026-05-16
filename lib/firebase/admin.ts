import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { parseServiceAccountFromEnv } from "@/lib/firebase/parseServiceAccount";

function resolveProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    undefined
  );
}

function initFirebaseAdmin(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = resolveProjectId();
  const serviceAccount = parseServiceAccountFromEnv(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  );

  if (serviceAccount) {
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id ?? projectId,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      projectId: serviceAccount.project_id ?? projectId,
    });
  }

  if (
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim() &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      "[firebase/admin] FIREBASE_SERVICE_ACCOUNT_KEY が無効です。組織で鍵作成が禁止されている場合は gcloud auth application-default login を使ってください。",
    );
  }

  return initializeApp({ projectId });
}

export function getAdminFirestore(): Firestore {
  initFirebaseAdmin();
  return getFirestore();
}

export function getAdminAuth(): Auth {
  initFirebaseAdmin();
  return getAuth();
}

/**
 * Firestore 読み書きに使える認証情報があるか。
 * ローカルでは `gcloud auth application-default login` による ADC も可（鍵 JSON 不要）。
 */
export function isFirestoreAdminConfigured(): boolean {
  if (parseServiceAccountFromEnv(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) {
    return true;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return true;
  if (process.env.K_SERVICE || process.env.CLOUD_RUN_JOB) {
    return Boolean(resolveProjectId());
  }
  if (process.env.NODE_ENV === "development" && resolveProjectId()) {
    return true;
  }
  return false;
}

/** @deprecated Firestore 用 */
export function isFirebaseAdminConfigured(): boolean {
  return isFirestoreAdminConfigured();
}

export function isFirebaseCredentialError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("could not load the default credentials") ||
    msg.includes("unable to detect a project id") ||
    (msg.includes("credential") && msg.includes("application default"))
  );
}
