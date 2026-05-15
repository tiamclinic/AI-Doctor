/**
 * Firestore に院方コンテンツのシードを投入する。
 *
 * 認証の優先順位:
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY（firebase-admin）
 *   2. `firebase login` 済みの CLI refresh token（Firestore REST API）
 *   3. Application Default Credentials（firebase-admin）
 *
 * 実行: FIREBASE_PROJECT_ID=ai-doctor-5681b npm run seed:doctor
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { OAuth2Client } from "google-auth-library";

import {
  DEFAULT_TENANT_ID,
  DOCTOR_CONTENT_COLLECTION,
  DoctorContentSchema,
  type DoctorContent,
} from "../../lib/doctor/types";

/** Firebase CLI が `firebase login` で保存する OAuth クライアント（公開値） */
const FIREBASE_CLI_OAUTH = {
  clientId:
    "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e.apps.googleusercontent.com",
  clientSecret: "j9pDvcCGDMmTVfa6JAYELqBs",
} as const;

function resolveProjectId(): string {
  return (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    "ai-doctor-5681b"
  );
}

type FirebaseCliTokens = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
};

function loadFirebaseCliTokens(): FirebaseCliTokens | undefined {
  try {
    const configPath = join(
      homedir(),
      ".config/configstore/firebase-tools.json",
    );
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      tokens?: FirebaseCliTokens;
    };
    return config.tokens;
  } catch {
    return undefined;
  }
}

function hasFirebaseCliLogin(): boolean {
  return Boolean(loadFirebaseCliTokens()?.refresh_token);
}

function initAdminWithServiceAccount(projectId: string) {
  if (getApps().length) return;
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) return;

  const sa = JSON.parse(rawKey) as {
    project_id?: string;
    client_email: string;
    private_key: string;
  };
  initializeApp({
    credential: cert({
      projectId: sa.project_id ?? projectId,
      clientEmail: sa.client_email,
      privateKey: sa.private_key,
    }),
    projectId: sa.project_id ?? projectId,
  });
}

function initAdminWithAdc(projectId: string) {
  if (getApps().length) return;
  initializeApp({ projectId });
}

async function getAccessTokenFromFirebaseCli(): Promise<string> {
  const tokens = loadFirebaseCliTokens();
  if (!tokens?.refresh_token) {
    throw new Error(
      "`firebase login` が未実行です。`npx firebase-tools@latest login` を実行してください。",
    );
  }

  const stillValid =
    tokens.access_token &&
    tokens.expires_at &&
    Date.now() < tokens.expires_at - 60_000;

  if (stillValid && tokens.access_token) {
    return tokens.access_token;
  }

  const client = new OAuth2Client(
    FIREBASE_CLI_OAUTH.clientId,
    FIREBASE_CLI_OAUTH.clientSecret,
  );
  client.setCredentials({ refresh_token: tokens.refresh_token });
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error(
      "Firebase CLI のトークンを更新できませんでした。`firebase login --reauth` を試してください。",
    );
  }
  return token;
}

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { doubleValue: number }
  | { nullValue: null }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return { doubleValue: value };
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((item) => toFirestoreValue(item)),
      },
    };
  }
  if (typeof value === "object") {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      fields[key] = toFirestoreValue(nested);
    }
    return { mapValue: { fields } };
  }
  throw new Error(`Unsupported Firestore value type: ${typeof value}`);
}

function toFirestoreFields(
  data: Record<string, unknown>,
): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    fields[key] = toFirestoreValue(value);
  }
  return fields;
}

async function seedViaRestApi(projectId: string, content: DoctorContent) {
  const accessToken = await getAccessTokenFromFirebaseCli();
  const docPath = `${DOCTOR_CONTENT_COLLECTION}/${DEFAULT_TENANT_ID}`;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: toFirestoreFields(content) }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firestore REST API error ${res.status}: ${body}`);
  }
}

async function seedViaAdminSdk(content: DoctorContent) {
  const db = getFirestore();
  await db
    .collection(DOCTOR_CONTENT_COLLECTION)
    .doc(DEFAULT_TENANT_ID)
    .set(content);
}

async function main() {
  const projectId = resolveProjectId();
  const seedPath = join(process.cwd(), "scripts/seed/doctor-content.seed.json");
  const raw = JSON.parse(readFileSync(seedPath, "utf8")) as unknown;
  const content = DoctorContentSchema.parse(raw);

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    initAdminWithServiceAccount(projectId);
    await seedViaAdminSdk(content);
  } else if (hasFirebaseCliLogin()) {
    await seedViaRestApi(projectId, content);
  } else {
    initAdminWithAdc(projectId);
    await seedViaAdminSdk(content);
  }

  console.info(
    `Seeded ${DOCTOR_CONTENT_COLLECTION}/${DEFAULT_TENANT_ID} (publishedAt=${content.publishedAt})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
