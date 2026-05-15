"use client";

import Link from "next/link";
import * as React from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { DoctorContentEditor } from "@/components/admin/DoctorContentEditor";
import { DoctorContentPreview } from "@/components/admin/DoctorContentPreview";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  doctorContentToDraft,
  publishDoctorContent,
} from "@/lib/admin/client";
import { createEmptyDoctorDraft } from "@/lib/admin/emptyDraft";
import {
  getAdminIdToken,
  signOutAdmin,
} from "@/lib/admin/firebaseClient";
import { scanDoctorContentForbidden } from "@/lib/admin/scanDoctorContent";
import { fetchDoctorContent } from "@/lib/doctor/client";
import type { DoctorContentPublishBody } from "@/lib/doctor/types";
import { PART_IDS, type PartId } from "@/lib/result/parts";

const MAX_BODY = 800;

function canPublish(draft: DoctorContentPublishBody): boolean {
  const overLimit = PART_IDS.some((id) => draft.parts[id].body.length > MAX_BODY);
  if (overLimit) return false;
  const forbidden = scanDoctorContentForbidden(draft);
  if (!forbidden.ok) return false;
  const emptyBody = PART_IDS.some((id) => !draft.parts[id].body.trim());
  return !emptyBody;
}

function DoctorContentAdminPage() {
  const [draft, setDraft] = React.useState<DoctorContentPublishBody>(
    createEmptyDoctorDraft,
  );
  const [activePart, setActivePart] = React.useState<PartId>("eyes");
  const [showPreview, setShowPreview] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [publishing, setPublishing] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchDoctorContent();
      if (cancelled) return;
      if (result.ok) {
        setDraft(doctorContentToDraft(result.data));
      } else if (result.status === 404) {
        setDraft(createEmptyDoctorDraft());
        setLoadError(
          "公開済みコンテンツがありません。編集して「公開」してください。",
        );
      } else {
        setLoadError(result.error.message);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!publishSuccess) return;
    const t = window.setTimeout(() => setPublishSuccess(false), 3000);
    return () => window.clearTimeout(t);
  }, [publishSuccess]);

  async function handlePublish() {
    setPublishError(null);
    setPublishing(true);
    try {
      const token = await getAdminIdToken();
      if (!token) {
        setPublishError("セッションが切れました。再ログインしてください。");
        return;
      }
      const result = await publishDoctorContent(token, draft);
      if (!result.ok) {
        setPublishError(
          result.error.forbiddenHits?.length
            ? `${result.error.message}（${result.error.forbiddenHits.join("、")}）`
            : result.error.message,
        );
        return;
      }
      setPublishSuccess(true);
    } finally {
      setPublishing(false);
    }
  }

  async function handleSignOut() {
    await signOutAdmin();
    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-muted-foreground text-sm">読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            TIAM Admin
          </p>
          <h1 className="font-heading text-2xl">院方コンテンツ編集</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
            ログアウト
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            トップ
          </Link>
        </div>
      </header>

      {loadError ? (
        <p className="text-muted-foreground rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          {loadError}
        </p>
      ) : null}

      {publishSuccess ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100">
          公開しました（キャッシュ反映まで最大 5 分かかる場合があります）
        </p>
      ) : null}

      {publishError ? (
        <p className="text-destructive text-sm" role="alert">
          {publishError}
        </p>
      ) : null}

      <DoctorContentEditor
        draft={draft}
        onChange={setDraft}
        activePart={activePart}
        onActivePartChange={setActivePart}
      />

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPreview((v) => !v)}
        >
          {showPreview ? "プレビューを閉じる" : "プレビュー"}
        </Button>
        <Button
          type="button"
          disabled={!canPublish(draft) || publishing}
          onClick={() => void handlePublish()}
        >
          {publishing ? "公開中…" : "公開"}
        </Button>
      </div>

      {showPreview ? (
        <DoctorContentPreview partId={activePart} draft={draft} />
      ) : null}
    </main>
  );
}

export default function DoctorContentAdminRoute() {
  return (
    <AdminGuard>
      <DoctorContentAdminPage />
    </AdminGuard>
  );
}
