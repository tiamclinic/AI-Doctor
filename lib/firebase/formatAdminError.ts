import "server-only";

import { isFirebaseCredentialError } from "@/lib/firebase/admin";

/**
 * Firestore Admin / ADC 失敗を院内スタッフ向けの短文に変換する。
 * 開発時の gRPC 生文字列をそのまま UI に出さない。
 */
export function formatFirebaseAdminErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (isFirebaseCredentialError(err)) {
    return (
      "Firestore への接続認証が無効です。開発環境ではターミナルで " +
      "`gcloud auth application-default login --project=ai-doctor-5681b` を再実行してください。"
    );
  }

  const msg =
    err instanceof Error
      ? `${err.message}${err.cause instanceof Error ? ` ${err.cause.message}` : ""}`
      : String(err);

  const lower = msg.toLowerCase();
  if (
    lower.includes("invalid_grant") ||
    lower.includes("invalid_rapt") ||
    lower.includes("reauth related") ||
    lower.includes("getting metadata from plugin failed")
  ) {
    return (
      "Google クラウドのログインが期限切れです。ターミナルで " +
      "`gcloud auth application-default login --project=ai-doctor-5681b` を実行し、" +
      "dev サーバーを再起動してから、もう一度「一覧を更新」を押してください。"
    );
  }

  if (process.env.NODE_ENV === "production") {
    return fallback;
  }

  return msg.length > 280 ? `${msg.slice(0, 280)}…` : msg;
}
