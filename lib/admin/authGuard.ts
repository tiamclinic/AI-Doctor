import "server-only";

import type { NextRequest } from "next/server";

import { getAdminAuth } from "@/lib/firebase/admin";

export type VerifiedAdmin = {
  uid: string;
  email?: string;
};

export class AdminAuthError extends Error {
  constructor(
    readonly code: "missing_token" | "invalid_token" | "not_admin",
    message: string,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export async function verifyAdminFromRequest(
  req: NextRequest,
): Promise<VerifiedAdmin> {
  const token = extractBearerToken(req);
  if (!token) {
    throw new AdminAuthError("missing_token", "認証トークンがありません。");
  }
  return verifyAdminIdToken(token);
}

export async function verifyAdminIdToken(idToken: string): Promise<VerifiedAdmin> {
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    if (decoded.admin !== true) {
      throw new AdminAuthError(
        "not_admin",
        "管理者権限がありません。admin クレームの付与を確認してください。",
      );
    }
    return {
      uid: decoded.uid,
      email: decoded.email,
    };
  } catch (err) {
    if (err instanceof AdminAuthError) throw err;
    throw new AdminAuthError("invalid_token", "認証トークンが無効です。");
  }
}
