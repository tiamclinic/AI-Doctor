import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

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
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawKey) {
    const serviceAccount = JSON.parse(rawKey) as {
      project_id?: string;
      client_email: string;
      private_key: string;
    };
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id ?? projectId,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
      projectId: serviceAccount.project_id ?? projectId,
    });
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

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(resolveProjectId() || process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
}
