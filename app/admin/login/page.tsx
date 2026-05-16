"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  isFirebaseAuthConfigured,
  signInAdmin,
  userHasStaffOrAdminClaim,
} from "@/lib/admin/firebaseClient";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const nextPath = searchParams.get("next");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const authConfigured = isFirebaseAuthConfigured();
  const queryError =
    errorParam === "not_admin"
      ? "管理者権限（admin クレーム）がありません。`npm run grant:admin <uid>` で付与してください。"
      : errorParam === "not_staff_or_admin"
        ? "スタッフ権限（admin または staff クレーム）がありません。"
        : null;
  const error = submitError ?? queryError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);
    try {
      const user = await signInAdmin(email.trim(), password);
      const allowed = await userHasStaffOrAdminClaim(user);
      if (!allowed) {
        setSubmitError(
          "このアカウントには admin / staff クレームがありません。Firebase Console でユーザーを作成し、クレームを付与してください。",
        );
        return;
      }
      const dest =
        nextPath && nextPath.startsWith("/admin/")
          ? nextPath
          : "/admin/doctor-content";
      router.replace(dest);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ログインに失敗しました。";
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!authConfigured ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Firebase Auth が未設定です。`.env.local` に{" "}
          <code className="text-xs">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          を設定し、Firebase Console でメール認証を有効化してください。
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">メールアドレス</Label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={!authConfigured || loading}
            className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">パスワード</Label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={!authConfigured || loading}
            className="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={!authConfigured || loading}
          className="w-full"
        >
          {loading ? "ログイン中…" : "ログイン"}
        </Button>
      </form>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          TIAM Admin
        </p>
        <h1 className="font-heading text-2xl">院方コンテンツ管理</h1>
        <p className="text-muted-foreground text-sm">
          メールとパスワードでログインしてください。
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-muted-foreground text-center text-sm">読み込み中…</p>
        }
      >
        <AdminLoginForm />
      </Suspense>

      <p className="text-muted-foreground text-center text-xs">
        <Link href="/" className="underline-offset-4 hover:underline">
          トップへ戻る
        </Link>
      </p>
    </main>
  );
}
