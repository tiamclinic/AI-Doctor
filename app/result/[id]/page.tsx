"use client";

import { Share2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DiagnosisText } from "@/components/DiagnosisText";
import { IdealPortrait } from "@/components/IdealPortrait";
import { MetricBarList } from "@/components/result/MetricBarList";
import { PartAnalysisGrid } from "@/components/result/PartAnalysisGrid";
import { ResultHero } from "@/components/result/ResultHero";
import { ResultSectionHeader } from "@/components/result/ResultSectionHeader";
import { TotalScoreCard } from "@/components/result/TotalScoreCard";
import { CopyLinkButton } from "@/components/share/CopyLinkButton";
import { ShareButtons } from "@/components/share/ShareButtons";
import { ShareCardButton } from "@/components/ShareCardButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);

  const resultId = useDiagnosisStore((s) => s.resultId);
  const photoDataUrl = useDiagnosisStore((s) => s.photoDataUrl);
  const detectResult = useDiagnosisStore((s) => s.detectResult);
  const scoreResult = useDiagnosisStore((s) => s.scoreResult);
  const diagnosisText = useDiagnosisStore((s) => s.diagnosisText);
  const clearPhoto = useDiagnosisStore((s) => s.clearPhoto);

  const sharePageUrl = React.useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    if (fromEnv) return `${fromEnv}/result/${id}`;
    if (typeof window !== "undefined") {
      return `${window.location.origin}/result/${id}`;
    }
    return "";
  }, [id]);

  React.useEffect(() => {
    if (!resultId || resultId !== id || !scoreResult || !photoDataUrl) {
      router.replace("/");
    }
  }, [resultId, id, scoreResult, photoDataUrl, router]);

  const handleStartOver = React.useCallback(() => {
    clearPhoto();
    router.push("/");
  }, [clearPhoto, router]);

  if (!scoreResult || !photoDataUrl || resultId !== id) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-muted-foreground text-sm">結果を読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col items-center text-center">
          <span className="text-tiam-gold font-heading text-[10px] tracking-[0.3em] uppercase">
            TIAM Beauty AI Report
          </span>
          <h1 className="font-heading text-tiam-primary mt-2 text-2xl tracking-tight sm:text-3xl">
            黄金比診断結果
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            あなたの顔を黄金比に基づいて分析しました。
          </p>
          <p className="text-muted-foreground mt-2 text-[10px]">
            ID: <span className="font-mono">{id}</span>
          </p>
        </header>

        {/* 上段: 写真+顔タイプ／印象（左） と 総合評価+各パーツの比率（右） */}
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

        {/* 中段: パーツ分析 */}
        <section>
          <ResultSectionHeader
            title="パーツごとの詳細分析"
            subtitle="各部位の傾向を TIAM AI のルールベース短文で要約しています（院方コメントは今後ここに併記予定）。"
          />
          <PartAnalysisGrid scoreResult={scoreResult} />
        </section>

        {/* 下段: 総評 */}
        {diagnosisText ? (
          <section>
            <ResultSectionHeader
              title="総評・詳細レポート"
              subtitle="OpenAI により生成された文章です。"
            />
            <DiagnosisText result={diagnosisText} />
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

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" onClick={handleStartOver}>
            別の写真でもう一度診断
          </Button>
        </div>

        <footer className="text-muted-foreground mt-2 text-center text-[10px] leading-relaxed">
          ※ 本診断は美容バランスの傾向を示す参考情報であり、医療診断ではありません。
          <br />© TIAM Beauty Lab
        </footer>
      </div>
    </main>
  );
}
