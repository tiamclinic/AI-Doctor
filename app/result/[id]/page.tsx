"use client";

import { Share2, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DiagnosisText } from "@/components/DiagnosisText";
import { FaceLandmarkOverlay } from "@/components/FaceLandmarkOverlay";
import { IdealPortrait } from "@/components/IdealPortrait";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ScoreRadar } from "@/components/ScoreRadar";
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

  // ストアと URL の id が一致しなければ MVP では復元できないので / に戻す
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
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col items-center text-center">
          <span className="text-tiam-gold font-heading text-[10px] tracking-[0.3em] uppercase">
            TIAM Beauty AI Report
          </span>
          <h1 className="font-heading text-tiam-primary mt-2 text-2xl tracking-tight sm:text-3xl">
            あなたの美容バランス診断結果
          </h1>
          <p className="text-muted-foreground mt-2 text-xs">
            ID: <span className="font-mono">{id}</span>
          </p>
        </header>

        <Card className="border-border/80 overflow-hidden">
          <CardContent className="grid gap-8 p-6 sm:grid-cols-[1.1fr_1fr] sm:p-8">
            <div className="border-border bg-muted/30 relative overflow-hidden rounded-xl border">
              <FaceLandmarkOverlay
                dataUrl={photoDataUrl}
                result={detectResult}
                showLandmarks
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              <ScoreCircle value={scoreResult.totalScore} size={220} />
              <p className="text-muted-foreground text-center text-xs leading-relaxed">
                6 大指標を加重平均した、TIAM 独自の
                <br />
                美容バランス指数です。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-8">
            <div className="flex w-full items-center gap-2">
              <Sparkles className="text-tiam-gold size-4" />
              <h2 className="font-heading text-tiam-primary text-sm tracking-tight">
                6 大指標バランス
              </h2>
            </div>
            <ScoreRadar result={scoreResult} size={340} />
          </CardContent>
        </Card>

        {diagnosisText && <DiagnosisText result={diagnosisText} />}

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
