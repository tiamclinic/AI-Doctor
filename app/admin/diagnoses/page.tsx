"use client";

import Link from "next/link";
import * as React from "react";

import { DiagnosisListFilters } from "@/components/admin/diagnoses/DiagnosisListFilters";
import { DiagnosisRow } from "@/components/admin/diagnoses/DiagnosisRow";
import { StaffOrAdminGuard } from "@/components/admin/StaffOrAdminGuard";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDiagnosesList } from "@/hooks/useDiagnosesList";
import { signOutAdmin } from "@/lib/admin/firebaseClient";
import {
  filterAndSortDiagnosisListItems,
  type DiagnosisSortMode,
  type NoteStatusFilter,
} from "@/lib/diagnoses/listDisplay";
import { cn } from "@/lib/utils";

function DiagnosesListPageInner() {
  const { state, refresh, loadMore, loadingMore, isInitialLoading } =
    useDiagnosesList();
  const [filter, setFilter] = React.useState<NoteStatusFilter>("all");
  const [sort, setSort] = React.useState<DiagnosisSortMode>("unentered_first");

  const displayed = React.useMemo(() => {
    if (state.status !== "ready") return [];
    return filterAndSortDiagnosisListItems(state.items, filter, sort);
  }, [state, filter, sort]);

  async function handleSignOut() {
    await signOutAdmin();
    window.location.href = "/staff";
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="border-border/60 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            TIAM Admin
          </p>
          <h1 className="font-heading text-2xl">診断一覧</h1>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            過去の診断を選び、ドクター所見を追記・編集できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/staff" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            業務メニュー
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            新規診断
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleSignOut()}>
            ログアウト
          </Button>
        </div>
      </header>

      <DiagnosisListFilters
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
        onRefresh={refresh}
        refreshing={isInitialLoading && state.status !== "ready"}
      />

      {isInitialLoading && state.status !== "ready" ? (
        <p className="text-muted-foreground py-8 text-center text-sm">読み込み中…</p>
      ) : null}

      {state.status === "error" ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <>
          <p className="text-muted-foreground text-xs">
            {displayed.length} 件表示
            {filter !== "all" ? "（フィルタ適用後）" : ""}
            {" · "}
            読み込み済み {state.items.length} 件
          </p>

          {displayed.length === 0 ? (
            <p className="text-muted-foreground border-border/60 rounded-xl border border-dashed px-4 py-12 text-center text-sm">
              {state.items.length === 0
                ? "まだ保存された診断がありません。新規診断を実行するとここに表示されます。"
                : "条件に一致する診断がありません。フィルタを変更してください。"}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {displayed.map((item) => (
                <li key={item.resultId}>
                  <DiagnosisRow item={item} />
                </li>
              ))}
            </ul>
          )}

          {state.hasMore ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? "読み込み中…" : "さらに読み込む（50件）"}
            </Button>
          ) : state.items.length > 0 ? (
            <p className="text-muted-foreground text-center text-xs">
              これ以上の診断はありません
            </p>
          ) : null}
        </>
      ) : null}
    </main>
  );
}

export default function DiagnosesListPage() {
  return (
    <StaffOrAdminGuard loginNext="/admin/diagnoses">
      <DiagnosesListPageInner />
    </StaffOrAdminGuard>
  );
}
