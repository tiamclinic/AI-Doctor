import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
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

  if (!projectId) {
    throw new Error(
      "FIREBASE_PROJECT_ID が未設定です。.env.local に FIREBASE_PROJECT_ID=ai-doctor-5681b を設定してください。",
    );
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
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

function credentialErrorText(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const parts = [err.message];
  if (err.cause instanceof Error) parts.push(err.cause.message);
  return parts.join(" ").toLowerCase();
}

export function isFirebaseCredentialError(err: unknown): boolean {
  const msg = credentialErrorText(err);
  return (
    msg.includes("could not load the default credentials") ||
    msg.includes("unable to detect a project id") ||
    (msg.includes("credential") && msg.includes("application default")) ||
    msg.includes("invalid_grant") ||
    msg.includes("invalid_rapt") ||
    msg.includes("reauth related") ||
    msg.includes("getting metadata from plugin failed")
  );
}
