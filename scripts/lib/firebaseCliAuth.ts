import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { OAuth2Client } from "google-auth-library";

/** Firebase CLI が `firebase login` で保存する OAuth クライアント（公開値） */
const FIREBASE_CLI_OAUTH = {
  clientId:
    "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e.apps.googleusercontent.com",
  clientSecret: "j9pDvcCGDMmTVfa6JAYELqBs",
} as const;

export function resolveFirebaseProjectId(): string {
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

export function loadFirebaseCliTokens(): FirebaseCliTokens | undefined {
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

export function hasFirebaseCliLogin(): boolean {
  return Boolean(loadFirebaseCliTokens()?.refresh_token);
}

export function initAdminWithServiceAccount(projectId: string): boolean {
  if (getApps().length > 0) return true;

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!rawKey) return false;

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
  return true;
}

export function initAdminWithAdc(projectId: string): void {
  if (getApps().length > 0) return;
  initializeApp({ projectId });
}

export async function getAccessTokenFromFirebaseCli(): Promise<string> {
  const tokens = loadFirebaseCliTokens();
  if (!tokens?.refresh_token) {
    throw new Error(
      "`firebase login` が未実行です。`npx -y firebase-tools@latest login` を実行してください。",
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
