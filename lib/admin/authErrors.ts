/** API 認可エラー（クライアント・Vitest からも参照可。`server-only` を避ける） */
export class AdminAuthError extends Error {
  constructor(
    readonly code:
      | "missing_token"
      | "invalid_token"
      | "not_admin"
      | "not_staff_or_admin",
    message: string,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}
