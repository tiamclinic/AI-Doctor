"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

import { StaffOrAdminGuard } from "@/components/admin/StaffOrAdminGuard";
import { DiagnosisReferencePanel } from "@/components/admin/diagnoses/DiagnosisReferencePanel";
import {
  DoctorNoteEditor,
  type EditorTab,
} from "@/components/admin/diagnoses/DoctorNoteEditor";
import { DoctorNotePreview } from "@/components/admin/diagnoses/DoctorNotePreview";
import { PatientLabelField } from "@/components/admin/diagnoses/PatientLabelField";
import { Button, buttonVariants } from "@/components/ui/button";
import { useDiagnosisRecordForAdmin } from "@/hooks/useDiagnosisRecordForAdmin";
import { useDoctorNoteForEdit } from "@/hooks/useDoctorNoteForEdit";
import { getAdminIdToken, signOutAdmin } from "@/lib/admin/firebaseClient";
import {
  patchDiagnosisPatientLabel,
  putDoctorNote,
} from "@/lib/admin/notes/client";
import { createEmptyDoctorNotePublishBody } from "@/lib/admin/notes/emptyDraft";
import { validateDoctorNoteDraft } from "@/lib/admin/notes/validation";
import { cn } from "@/lib/utils";
import type { PartId } from "@/lib/result/parts";

function DiagnosisEditPageInner() {
  const params = useParams<{ resultId: string }>();
  const router = useRouter();
  const resultId = params.resultId;

  const diagnosisState = useDiagnosisRecordForAdmin(resultId);
  const noteState = useDoctorNoteForEdit(resultId);

  const [draft, setDraft] = React.useState(noteState.status === "ready" ? noteState.draft : null);
  const [dirty, setDirty] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<EditorTab>("summary");
  const [activePart, setActivePart] = React.useState<PartId>("eyes");
  const [showPreview, setShowPreview] = React.useState(false);
  const [patientLabel, setPatientLabel] = React.useState("");
  const [labelSaving, setLabelSaving] = React.useState(false);
  const [labelError, setLabelError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const emptyDraft = React.useMemo(() => createEmptyDoctorNotePublishBody(), []);
  const prevNoteStatusRef = React.useRef(noteState.status);

  // ノート取得の status が変わったときだけ draft を同期（毎レンダー同期すると入力が消える）
  React.useEffect(() => {
    const prev = prevNoteStatusRef.current;
    const next = noteState.status;
    prevNoteStatusRef.current = next;

    const timer = globalThis.setTimeout(() => {
      if (next === "ready" && prev !== "ready" && noteState.status === "ready") {
        setDraft(noteState.draft);
        setDirty(false);
        return;
      }
      if (
        next === "error" &&
        prev !== "error" &&
        diagnosisState.status === "success"
      ) {
        setDraft((current) => current ?? emptyDraft);
      }
    }, 0);
    return () => globalThis.clearTimeout(timer);
    // noteState / diagnosisState は useMemo 済みだが、同期は status 遷移時のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft 本文は noteState.status の遷移時だけ読む
  }, [noteState.status, diagnosisState.status]);

  const prevDiagnosisStatusRef = React.useRef(diagnosisState.status);
  React.useEffect(() => {
    const prev = prevDiagnosisStatusRef.current;
    const next = diagnosisState.status;
    prevDiagnosisStatusRef.current = next;
    if (next !== "success" || prev === "success") return;
    const timer = globalThis.setTimeout(() => {
      if (diagnosisState.status === "success") {
        setPatientLabel(diagnosisState.data.patientLabel ?? "");
      }
    }, 0);
    return () => globalThis.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosisState.status]);

  React.useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const handleDraftChange = React.useCallback(
    (next: NonNullable<typeof draft>) => {
      setDraft(next);
      setDirty(true);
      setActionSuccess(null);
    },
    [],
  );

  async function runSave(status: "draft" | "published") {
    if (!resultId) return;
    const bodyDraft = draft ?? emptyDraft;
    setActionError(null);
    setActionSuccess(null);
    setSaving(true);
    try {
      const token = await getAdminIdToken();
      if (!token) {
        setActionError("セッションが切れました。再ログインしてください。");
        router.replace(`/admin/login?next=${encodeURIComponent(`/admin/diagnoses/${resultId}`)}`);
        return;
      }
      const body = { ...bodyDraft, status };
      const result = await putDoctorNote(token, resultId, body);
      if (!result.ok) {
        if (result.status === 401 || result.status === 403) {
          setActionError(result.error.message);
          if (result.status === 401) {
            router.replace(
              `/admin/login?next=${encodeURIComponent(`/admin/diagnoses/${resultId}`)}`,
            );
          }
          return;
        }
        const hits = result.error.forbiddenHits?.length
          ? `（${result.error.forbiddenHits.join("、")}）`
          : "";
        setActionError(`${result.error.message}${hits}`);
        return;
      }
      setDirty(false);
      if (status === "published") {
        setActionSuccess("公開しました。結果画面で医師所見をご確認ください。");
        router.push(`/result/${resultId}?refresh=1`);
        return;
      }
      setActionSuccess("下書きを保存しました。");
      if (noteState.status === "ready") {
        void noteState.reload();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveLabel() {
    if (!resultId) return;
    setLabelError(null);
    setLabelSaving(true);
    try {
      const token = await getAdminIdToken();
      if (!token) {
        setLabelError("セッションが切れました。");
        return;
      }
      const result = await patchDiagnosisPatientLabel(token, resultId, patientLabel);
      if (!result.ok) {
        setLabelError(result.error.message);
        return;
      }
      setActionSuccess("カルテ識別子を保存しました。");
    } finally {
      setLabelSaving(false);
    }
  }

  async function handleSignOut() {
    await signOutAdmin();
    window.location.href = "/admin/login";
  }

  const loading =
    diagnosisState.status === "loading" ||
    diagnosisState.status === "idle" ||
    ((noteState.status === "loading" || noteState.status === "idle") &&
      diagnosisState.status !== "success");

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-muted-foreground text-sm">読み込み中…</p>
      </main>
    );
  }

  if (diagnosisState.status === "not_found") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-muted-foreground text-sm">
          診断が見つかりません。同じブラウザで診断直後に開くか、Firestore に保存済みの ID
          を指定してください。
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
          トップへ
        </Link>
      </main>
    );
  }

  if (diagnosisState.status === "error") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-destructive text-sm" role="alert">
          {diagnosisState.message}
        </p>
        <Link
          href={`/result/${resultId}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 inline-flex")}
        >
          結果画面へ戻る
        </Link>
      </main>
    );
  }

  if (diagnosisState.status !== "success") {
    return null;
  }

  const workingDraft = draft ?? emptyDraft;
  const validation = validateDoctorNoteDraft(workingDraft);

  const noteLoadError =
    noteState.status === "error" ? noteState.message : null;

  const diagnosis = diagnosisState.data;
  const fromSession =
    diagnosisState.status === "success" && diagnosisState.fromSession;
  const previewPart = activeTab === "summary" ? activePart : activeTab;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {fromSession ? (
        <p
          className="border-tiam-gold/30 bg-tiam-gold/8 text-tiam-primary rounded-lg border px-3 py-2 text-xs leading-relaxed"
          role="status"
        >
          Firestore に診断が未保存のため、この端末の診断セッションから表示しています。下書き・公開の保存には
          <code className="mx-1 font-mono text-[10px]">FIREBASE_SERVICE_ACCOUNT_KEY</code>
          にサービスアカウント JSON（プレースホルダー不可）を設定してください。
        </p>
      ) : null}
      {noteLoadError ? (
        <p className="text-destructive rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm" role="alert">
          ノートの取得: {noteLoadError}
          {noteLoadError.includes("認証") ? (
            <>
              {" "}
              <Link
                href={`/admin/login?next=${encodeURIComponent(`/admin/diagnoses/${resultId}`)}`}
                className="underline"
              >
                再ログイン
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      <header className="border-border/60 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">TIAM Admin</p>
          <h1 className="font-heading text-2xl">ドクター所見の編集</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">{resultId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/result/${resultId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            結果画面へ
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleSignOut()}>
            ログアウト
          </Button>
        </div>
      </header>

      <PatientLabelField
        value={patientLabel}
        onChange={setPatientLabel}
        onSave={() => void handleSaveLabel()}
        saving={labelSaving}
        saveError={labelError}
      />

      {actionSuccess ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100">
          {actionSuccess}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-destructive text-sm" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <DiagnosisReferencePanel diagnosis={diagnosis} />
        <div className="flex flex-col gap-4">
          <DoctorNoteEditor
            draft={workingDraft}
            onChange={handleDraftChange}
            activeTab={activeTab}
            onActiveTabChange={(tab) => {
              setActiveTab(tab);
              if (tab !== "summary") setActivePart(tab);
            }}
            aiOverallComment={diagnosis.diagnosisText.overallComment}
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
              variant="outline"
              disabled={saving || !validation?.canSaveDraft}
              onClick={() => void runSave("draft")}
            >
              {saving ? "保存中…" : "下書き保存"}
            </Button>
            <Button
              type="button"
              disabled={saving || !validation?.canPublish}
              onClick={() => void runSave("published")}
            >
              {saving ? "反映中…" : "反映（公開）"}
            </Button>
            {noteState.status === "ready" && noteState.published ? (
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => void runSave("draft")}
              >
                公開取り消し（下書きへ）
              </Button>
            ) : null}
          </div>

          {showPreview ? (
            <DoctorNotePreview
              diagnosis={diagnosis}
              draft={workingDraft}
              activePart={previewPart}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function DiagnosisEditPage() {
  const params = useParams<{ resultId: string }>();
  const resultId = params.resultId;
  const loginNext = `/admin/diagnoses/${resultId}`;

  return (
    <StaffOrAdminGuard loginNext={loginNext}>
      <DiagnosisEditPageInner />
    </StaffOrAdminGuard>
  );
}
