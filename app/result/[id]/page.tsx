"use client";

import Link from "next/link";
import { Share2, Wand2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { DiagnosisText } from "@/components/DiagnosisText";
import { IdealPortrait } from "@/components/IdealPortrait";
import { DoctorEditCta } from "@/components/result/DoctorEditCta";
import { MetricBarList } from "@/components/result/MetricBarList";
import { PartAnalysisGrid } from "@/components/result/PartAnalysisGrid";
import { ResultDisclaimerBanner } from "@/components/result/ResultDisclaimerBanner";
import { ResultHero } from "@/components/result/ResultHero";
import { ResultSectionHeader } from "@/components/result/ResultSectionHeader";
import { TotalScoreCard } from "@/components/result/TotalScoreCard";
import { CopyLinkButton } from "@/components/share/CopyLinkButton";
import { ShareButtons } from "@/components/share/ShareButtons";
import { ShareCardButton } from "@/components/ShareCardButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDoctorNote } from "@/hooks/useDoctorNote";
import { useResultPageSession } from "@/hooks/useResultPageSession";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";
import {
  RESULT_DISCLAIMER,
  RESULT_FOOTER_COPY,
} from "@/lib/result/disclaimer";
import { cn } from "@/lib/utils";

function ResultPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = React.use(params);

  const session = useResultPageSession(id);
  const clearPhoto = useDiagnosisStore((s) => s.clearPhoto);

  const {
    data: doctorNote,
    isLoading: doctorNoteLoading,
    refresh: refreshDoctorNote,
  } = useDoctorNote(id);

  const refreshHandled = React.useRef(false);

  React.useEffect(() => {
    if (searchParams.get("refresh") !== "1" || refreshHandled.current) return;
    refreshHandled.current = true;
    void refreshDoctorNote();
    const url = new URL(window.location.href);
    url.searchParams.delete("refresh");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [searchParams, refreshDoctorNote, router]);

  React.useEffect(() => {
    if (session.status === "not_found") {
      router.replace("/");
    }
  }, [session.status, router]);

  const sharePageUrl = React.useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    if (fromEnv) return `${fromEnv}/result/${id}`;
    if (typeof window !== "undefined") {
      return `${window.location.origin}/result/${id}`;
    }
    return "";
  }, [id]);

  const handleStartOver = React.useCallback(() => {
    clearPhoto();
    router.push("/");
  }, [clearPhoto, router]);

  if (session.status === "loading") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-muted-foreground text-sm">結果を読み込み中…</p>
      </main>
    );
  }

  if (session.status === "error") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
        <p className="text-destructive text-sm" role="alert">
          {session.message}
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          トップへ
        </Link>
      </main>
    );
  }

  if (session.status !== "ready") {
    return null;
  }

  const {
    scoreResult,
    diagnosisText,
    photoDataUrl,
    detectResult,
    fromPersistedOnly,
  } = session;

  const doctorMeta = doctorNote
    ? { updatedBy: doctorNote.updatedBy, publishedAt: doctorNote.publishedAt }
    : undefined;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        {fromPersistedOnly ? (
          <p
            className="border-tiam-gold/25 bg-tiam-gold/8 text-tiam-primary rounded-lg border px-4 py-2.5 text-center text-[10px] leading-relaxed sm:text-xs"
            role="status"
          >
            スコアとレポートはサーバーから表示しています。写真は診断直後の同じブラウザタブでのみ保持されます（リロード後は復元できない場合があります）。
          </p>
        ) : null}

        <header className="flex flex-col items-center text-center">
          <span className="text-tiam-gold font-heading text-[10px] tracking-[0.3em] uppercase">
            TIAM Beauty AI Report
          </span>
          <div className="mt-2 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
            <h1 className="font-heading text-tiam-primary text-2xl tracking-tight sm:text-3xl">
              黄金比診断結果
            </h1>
            <DoctorEditCta resultId={id} hasPublishedNote={doctorNote !== null} />
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            あなたの顔を黄金比に基づいて分析しました。
          </p>
          <p className="text-muted-foreground mt-2 text-[10px]">
            ID: <span className="font-mono">{id}</span>
          </p>
        </header>

        <ResultDisclaimerBanner />

        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
          <ResultHero
            photoDataUrl={photoDataUrl}
            detectResult={detectResult}
            scoreResult={scoreResult}
          />

          <div className="flex flex-col gap-6">
            <TotalScoreCard scoreResult={scoreResult} />
            <section className="border-border/80 bg-card rounded-xl border p-5 shadow-sm sm:p-6">
              <MetricBarList result={scoreResult} showHeader />
            </section>
          </div>
        </div>

        <section>
          <ResultSectionHeader
            title="パーツごとの詳細分析"
            subtitle="TIAM AI の参考短文と、公開済みの当院医師所見を併記します。"
          />
          <PartAnalysisGrid scoreResult={scoreResult} doctorNote={doctorNote} />
          {doctorNoteLoading ? (
            <p className="text-muted-foreground mt-3 text-center text-xs">
              医師所見を読み込み中…
            </p>
          ) : null}
        </section>

        {diagnosisText ? (
          <section>
            <ResultSectionHeader
              title="総評・詳細レポート"
              subtitle={
                doctorNote?.report
                  ? "AI 生成文と当院医師の追記を、セクションごとに併記して表示します。"
                  : "OpenAI により生成された文章です。"
              }
            />
            <DiagnosisText
              result={diagnosisText}
              doctorReport={doctorNote?.report}
              doctorMeta={doctorMeta}
            />
          </section>
        ) : null}

        <Card className="border-border/80" suppressHydrationWarning>
          <CardContent className="flex flex-col gap-5 p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <Share2 className="text-tiam-gold size-4" />
                <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
                  SNS で共有
                </h3>
              </div>
              <p className="text-muted-foreground mt-2 max-w-md text-xs leading-relaxed">
                X / LINE は Web から共有を開きます。Instagram
                はシェアカード画像の保存後、ストーリーズへ手動で投稿してください。
              </p>
            </div>
            <ShareButtons
              resultId={id}
              pageUrl={sharePageUrl}
              score={scoreResult}
              diagnosis={diagnosisText}
            />
            <div className="flex justify-center">
              <CopyLinkButton url={sharePageUrl} />
            </div>
          </CardContent>
        </Card>

        {photoDataUrl ? (
          <Card className="border-border/80">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
              <div className="flex items-center gap-2">
                <Wand2 className="text-tiam-gold size-4" />
                <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
                  AI 理想顔ジェネレーター
                </h3>
              </div>
              <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
                TIAM AI が黄金比に近づけた、あなたの「整え後イメージ」を描き起こします。
              </p>
              <IdealPortrait photoDataUrl={photoDataUrl} score={scoreResult} />
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/80">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
            <div className="flex items-center gap-2">
              <Share2 className="text-tiam-gold size-4" />
              <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
                SNS 用シェアカード
              </h3>
            </div>
            <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
              Instagram Story / TikTok 向けの 1080×1920
              シェアカード（PNG）を生成します。あなたの顔写真は含まれません。
            </p>
            <ShareCardButton
              resultId={id}
              score={scoreResult}
              diagnosis={diagnosisText}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" onClick={handleStartOver}>
            別の写真でもう一度診断
          </Button>
          <Link
            href={`/admin/diagnoses/${id}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-center")}
          >
            ドクター所見を編集
          </Link>
        </div>

        <footer className="text-muted-foreground mt-2 text-center text-[10px] leading-relaxed">
          {RESULT_DISCLAIMER}
          <br />
          {RESULT_FOOTER_COPY}
        </footer>
      </div>
    </main>
  );
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
          <p className="text-muted-foreground text-sm">結果を読み込み中…</p>
        </main>
      }
    >
      <ResultPageContent params={params} />
    </React.Suspense>
  );
}
