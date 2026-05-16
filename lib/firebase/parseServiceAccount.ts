import "server-only";

export type ParsedServiceAccount = {
  project_id?: string;
  client_email: string;
  private_key: string;
};

/** ドキュメント用プレースホルダー（そのまま貼ると JSON パース失敗する） */
const PLACEHOLDER_MARKERS = ["...", "YOUR_", "ここに", "貼り付け"];

/**
 * `.env.local` の `FIREBASE_SERVICE_ACCOUNT_KEY` をパースする。
 * 無効・プレースホルダーのときは `null`（例外は投げない）。
 */
export function parseServiceAccountFromEnv(
  raw?: string,
): ParsedServiceAccount | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  for (const marker of PLACEHOLDER_MARKERS) {
    if (trimmed.includes(marker)) return null;
  }

  let jsonText = trimmed;
  if (
    (jsonText.startsWith("'") && jsonText.endsWith("'")) ||
    (jsonText.startsWith('"') && jsonText.endsWith('"'))
  ) {
    jsonText = jsonText.slice(1, -1);
  }

  try {
    const parsed = JSON.parse(jsonText) as ParsedServiceAccount;
    if (
      typeof parsed.client_email !== "string" ||
      typeof parsed.private_key !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
