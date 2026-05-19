"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { StaffLoginForm } from "@/components/admin/StaffLoginForm";
import { StaffHubDashboard } from "@/components/staff/StaffHubDashboard";
import { Button } from "@/components/ui/button";
import { useStaffSession } from "@/hooks/useStaffSession";
import { signOutAdmin } from "@/lib/admin/firebaseClient";
import { isAllowedLoginRedirectPath } from "@/lib/admin/loginRedirect";

function StaffPageContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const nextRaw = searchParams.get("next");
  const resumePath =
    nextRaw && isAllowedLoginRedirectPath(nextRaw) ? nextRaw : null;

  const { user, isStaff, isLoading } = useStaffSession();
  const showHub = isStaff && user;

  const queryError =
    errorParam === "not_staff_or_admin"
      ? "スタッフ権限（admin または staff クレーム）がありません。"
      : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-8 px-4 py-16 sm:py-20">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-tiam-gold font-heading text-xs tracking-[0.35em] uppercase">
          TIAM Staff
        </p>
        <h1 className="font-heading text-tiam-primary text-2xl sm:text-3xl">
          {showHub ? "業務メニュー" : "業務開始"}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {showHub
            ? "診断の開始や管理業務を選んでください。"
            : "院内端末でログインし、来院者の診断を始めます。"}
        </p>
      </header>

      {queryError && !showHub ? (
        <p className="text-destructive text-center text-sm" role="alert">
          {queryError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-muted-foreground text-center text-sm">確認中…</p>
      ) : showHub ? (
        <StaffHubDashboard
          email={user.email ?? "スタッフ"}
          resumePath={resumePath}
        />
      ) : user && !isStaff ? (
        <div className="flex flex-col gap-4">
          <p className="text-destructive text-center text-sm" role="alert">
            このアカウントにはスタッフ権限がありません。管理者にクレーム付与を依頼してください。
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => void signOutAdmin()}
          >
            別のアカウントでログイン
          </Button>
        </div>
      ) : (
        <StaffLoginForm inputIdPrefix="staff-hub" />
      )}

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        <Link href="/" className="underline-offset-4 hover:underline">
          来院者向けトップ（ログイン不要）
        </Link>
        <span className="mx-2">·</span>
        <Link
          href="/admin/login?next=%2Fadmin%2Fdiagnoses"
          className="underline-offset-4 hover:underline"
        >
          管理ログイン
        </Link>
      </p>
    </main>
  );
}

export default function StaffPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-md flex-col px-4 py-16">
          <p className="text-muted-foreground text-center text-sm">読み込み中…</p>
        </main>
      }
    >
      <StaffPageContent />
    </Suspense>
  );
}
