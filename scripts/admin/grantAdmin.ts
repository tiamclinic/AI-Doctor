/**
 * Firebase Auth ユーザーに admin カスタムクレームを付与する。
 *
 * 実行例:
 *   FIREBASE_PROJECT_ID=ai-doctor-5681b npm run grant:admin -- <uid>
 *
 * 認証の優先順位:
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY（firebase-admin）
 *   2. `firebase login` 済みの CLI トークン（Identity Toolkit REST API）
 *   3. Application Default Credentials（firebase-admin）
 */
import { getAuth } from "firebase-admin/auth";

import {
  getAccessTokenFromFirebaseCli,
  hasFirebaseCliLogin,
  initAdminWithAdc,
  initAdminWithServiceAccount,
  resolveFirebaseProjectId,
} from "../lib/firebaseCliAuth";

async function grantViaAdminSdk(uid: string) {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, { admin: true });
  return user.email ?? uid;
}

async function grantViaRestApi(projectId: string, uid: string) {
  const accessToken = await getAccessTokenFromFirebaseCli();
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify({ admin: true }),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Identity Toolkit API error ${res.status}: ${body}\n` +
        "プロジェクトのオーナー権限がある Google アカウントで `firebase login` しているか確認してください。",
    );
  }

  const data = (await res.json()) as { email?: string };
  return data.email ?? uid;
}

async function main() {
  const uid = process.argv[2]?.trim();
  if (!uid) {
    console.error("Usage: npm run grant:admin -- <firebase-auth-uid>");
    process.exit(1);
  }

  const projectId = resolveFirebaseProjectId();
  let label: string;

  if (initAdminWithServiceAccount(projectId)) {
    label = await grantViaAdminSdk(uid);
  } else if (hasFirebaseCliLogin()) {
    label = await grantViaRestApi(projectId, uid);
  } else {
    initAdminWithAdc(projectId);
    label = await grantViaAdminSdk(uid);
  }

  console.log(`admin claim granted for ${label}`);
  console.log(
    "クライアントで反映するには、一度ログアウトして再ログインしてください。",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
