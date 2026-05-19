"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { StaffLoginForm } from "@/components/admin/StaffLoginForm";
import { resolvePostLoginPath } from "@/lib/admin/loginRedirect";

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const nextPath = searchParams.get("next");

  const queryError =
    errorParam === "not_admin"
      ? "管理者権限（admin クレーム）がありません。`npm run grant:admin <uid>` で付与してください。"
      : errorParam === "not_staff_or_admin"
        ? "スタッフ権限（admin または staff クレーム）がありません。"
        : null;

  return (
    <>
      {queryError ? (
        <p className="text-destructive text-sm" role="alert">
          {queryError}
        </p>
      ) : null}

      <StaffLoginForm
        inputIdPrefix="admin"
        redirectTo={resolvePostLoginPath(nextPath)}
      />
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
        <h1 className="font-heading text-2xl">管理ログイン</h1>
        <p className="text-muted-foreground text-sm">
          メールとパスワードでログインしてください。
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-muted-foreground text-center text-sm">読み込み中…</p>
        }
      >
        <AdminLoginContent />
      </Suspense>

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        <Link href="/staff" className="underline-offset-4 hover:underline">
          院内スタッフ用の業務開始画面へ
        </Link>
        <span className="mx-2">·</span>
        <Link href="/" className="underline-offset-4 hover:underline">
          トップへ戻る
        </Link>
        <span className="mx-2">·</span>
        <Link
          href="/admin/login?next=%2Fadmin%2Fdiagnoses"
          className="underline-offset-4 hover:underline"
        >
          診断一覧・所見編集へ
        </Link>
      </p>
    </main>
  );
}
