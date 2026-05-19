/**
 * /admin/login の `next` クエリ検証（オープンリダイレクト防止）。
 * 接客フロー（/ , /diagnose , /result/*）と管理画面（/admin/*）のみ許可。
 */

const LOGIN_PATH = "/admin/login";

/** ログイン後のデフォルト（院内・接客フロー） */
export const DEFAULT_POST_LOGIN_PATH = "/";

function normalizeRedirectPath(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\") || trimmed.includes("..")) return null;

  try {
    const url = new URL(trimmed, "http://localhost");
    if (url.protocol !== "http:" || url.hostname !== "localhost") {
      return null;
    }
    const path = url.pathname;
    const search = url.search;
    return path + search;
  } catch {
    return null;
  }
}

export function isAllowedLoginRedirectPath(raw: string): boolean {
  const path = normalizeRedirectPath(raw);
  if (!path) return false;

  if (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}?`)) {
    return false;
  }

  if (path === "/") return true;
  if (path === "/staff") return true;
  if (path === "/diagnose" || path.startsWith("/diagnose/")) return true;
  if (path.startsWith("/result/")) return true;
  if (path.startsWith("/admin/")) return true;

  return false;
}

/**
 * ログイン成功後の遷移先。`next` が無効なら DEFAULT_POST_LOGIN_PATH。
 */
export function resolvePostLoginPath(next: string | null | undefined): string {
  if (next && isAllowedLoginRedirectPath(next)) {
    return normalizeRedirectPath(next)!;
  }
  return DEFAULT_POST_LOGIN_PATH;
}
