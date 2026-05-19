"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  isFirebaseAuthConfigured,
  signInAdmin,
  userHasStaffOrAdminClaim,
} from "@/lib/admin/firebaseClient";

export type StaffLoginFormProps = {
  /** input の id 重複回避（同一ページに複数フォームを置かない想定） */
  inputIdPrefix?: string;
  /** 指定時はログイン成功後に replace（/admin/login 向け） */
  redirectTo?: string;
  /** redirectTo 未指定時（/staff 向け）。認証状態の再描画のみで足りる場合は省略可 */
  onLoggedIn?: () => void;
};

export function StaffLoginForm({
  inputIdPrefix = "staff",
  redirectTo,
  onLoggedIn,
}: StaffLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const authConfigured = isFirebaseAuthConfigured();
  const emailId = `${inputIdPrefix}-email`;
  const passwordId = `${inputIdPrefix}-password`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);
    try {
      const user = await signInAdmin(email.trim(), password);
      const allowed = await userHasStaffOrAdminClaim(user);
      if (!allowed) {
        setSubmitError(
          "このアカウントには admin / staff クレームがありません。管理者にお問い合わせください。",
        );
        return;
      }
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        onLoggedIn?.();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ログインに失敗しました。";
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!authConfigured) {
    return (
      <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
        Firebase Auth が未設定です。管理者に{" "}
        <code className="text-xs">NEXT_PUBLIC_FIREBASE_*</code>{" "}
        の本番設定を依頼してください。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={emailId}>メールアドレス</Label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={passwordId}>パスワード</Label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          required
          disabled={loading}
          className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {submitError ? (
        <p className="text-destructive text-sm" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "ログイン中…" : "ログインして業務を開始"}
      </Button>
    </form>
  );
}
