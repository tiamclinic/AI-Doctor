"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DiagnosisText } from "@/components/DiagnosisText";
import { FaceLandmarkOverlay } from "@/components/FaceLandmarkOverlay";
import { ScoreSummary } from "@/components/ScoreSummary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFaceLandmarker } from "@/hooks/useFaceLandmarker";
import { trackEvent } from "@/lib/analytics/track";
import { requestDiagnosis } from "@/lib/diagnosis/client";
import { computeScore } from "@/lib/faceAnalysis/scoring";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";

type DiagnosisStatus = "idle" | "loading" | "success" | "error";

export default function DiagnosePage() {
  const router = useRouter();
  const photoDataUrl = useDiagnosisStore((s) => s.photoDataUrl);
  const detectResult = useDiagnosisStore((s) => s.detectResult);
  const scoreResult = useDiagnosisStore((s) => s.scoreResult);
  const diagnosisText = useDiagnosisStore((s) => s.diagnosisText);
  const setDetectResult = useDiagnosisStore((s) => s.setDetectResult);
  const setScoreResult = useDiagnosisStore((s) => s.setScoreResult);
  const setDiagnosisText = useDiagnosisStore((s) => s.setDiagnosisText);
  const clearPhoto = useDiagnosisStore((s) => s.clearPhoto);

  const { status, result, error, detect } = useFaceLandmarker();
  const [showLandmarks, setShowLandmarks] = React.useState(true);
  const [scoreError, setScoreError] = React.useState<string | null>(null);
  const [diagnosisStatus, setDiagnosisStatus] = React.useState<DiagnosisStatus>(
    "idle",
  );
  const [diagnosisError, setDiagnosisError] = React.useState<string | null>(
    null,
  );
  const triggeredRef = React.useRef(false);
  const faceDetectedLoggedRef = React.useRef(false);

  React.useEffect(() => {
    if (!photoDataUrl) {
      router.replace("/");
    }
  }, [photoDataUrl, router]);

  React.useEffect(() => {
    if (!photoDataUrl) return;
    if (detectResult) return;
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    void detect(photoDataUrl).then((r) => {
      if (r) setDetectResult(r);
    });
  }, [photoDataUrl, detectResult, detect, setDetectResult]);

  React.useEffect(() => {
    const active = detectResult ?? result;
    const ok = status === "success" || (!!detectResult && status !== "error");
    if (!ok || !active?.landmarks?.length || faceDetectedLoggedRef.current) return;
    faceDetectedLoggedRef.current = true;
    void trackEvent("face_detected", {
      landmark_count: active.landmarks.length,
      duration_ms: Math.round(active.durationMs),
    });
  }, [detectResult, result, status]);

  const retry = React.useCallback(() => {
    if (!photoDataUrl) return;
    faceDetectedLoggedRef.current = false;
    setScoreError(null);
    setScoreResult(null);
    setDiagnosisText(null);
    setDiagnosisStatus("idle");
    setDiagnosisError(null);
    triggeredRef.current = true;
    void detect(photoDataUrl).then((r) => {
      if (r) setDetectResult(r);
    });
  }, [
    photoDataUrl,
    detect,
    setDetectResult,
    setScoreResult,
    setDiagnosisText,
  ]);

  const startOver = React.useCallback(() => {
    clearPhoto();
    router.push("/");
  }, [clearPhoto, router]);

  const handleComputeScore = React.useCallback(() => {
    const source = detectResult ?? result;
    if (!source) return;
    setScoreError(null);
    try {
      const start = performance.now();
      const score = computeScore(source.landmarks);
      const elapsed = performance.now() - start;
      if (process.env.NODE_ENV !== "production") {
        console.info(`[scoring] computeScore in ${elapsed.toFixed(1)}ms`);
      }
      setScoreResult(score);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "スコア計算でエラーが発生しました。";
      setScoreError(message);
    }
  }, [detectResult, result, setScoreResult]);

  const handleGenerateDiagnosis = React.useCallback(async () => {
    if (!scoreResult) return;
    setDiagnosisStatus("loading");
    setDiagnosisError(null);
    const start = performance.now();
    const res = await requestDiagnosis(scoreResult);
    const elapsed = performance.now() - start;
    if (process.env.NODE_ENV !== "production") {
      console.info(`[/api/diagnose] ${elapsed.toFixed(0)}ms`);
    }
    if (res.ok) {
      setDiagnosisText(res.data);
      setDiagnosisStatus("success");
      void trackEvent("diagnosis_completed", {
        total_score: scoreResult.totalScore,
        duration_ms: Math.round(elapsed),
      });
      // 診断完了したら自動的に結果画面へ遷移する
      const id = useDiagnosisStore.getState().resultId;
      if (id) {
        router.push(`/result/${id}`);
      }
    } else {
      setDiagnosisError(res.error.message);
      setDiagnosisStatus("error");
    }
  }, [scoreResult, setDiagnosisText, router]);

  const handleGoToResult = React.useCallback(() => {
    const id = useDiagnosisStore.getState().resultId;
    if (id) router.push(`/result/${id}`);
  }, [router]);

  const activeResult = detectResult ?? result;
  const isLoading = status === "loading";
  const isError = status === "error";
  const isSuccess = status === "success" || (!!detectResult && status !== "error");

  if (!photoDataUrl) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-muted-foreground text-sm">読み込み中…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <Card className="border-border/80 w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            ブラウザ内で顔を解析しています
          </CardTitle>
          <CardDescription>
            写真は端末から外に出ません。MediaPipe FaceLandmarker（478点）で輪郭・目・鼻・口の位置を検出します。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="border-border bg-muted/30 relative mx-auto w-full max-w-md overflow-hidden rounded-xl border">
            <FaceLandmarkOverlay
              dataUrl={photoDataUrl}
              result={activeResult}
              showLandmarks={showLandmarks && isSuccess}
            />
            {isLoading && (
              <div className="bg-background/40 absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                <Loader2 className="text-tiam-gold size-8 animate-spin" />
                <p className="text-foreground text-xs font-medium">
                  TIAM AI が解析中…
                </p>
              </div>
            )}
          </div>

          {isSuccess && activeResult && !scoreResult && (
            <div className="bg-accent/30 border-border/60 flex flex-col gap-2 rounded-lg border p-4 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="text-tiam-gold size-4" />
                <span className="font-medium">顔を検出しました</span>
              </div>
              <dl className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt>ランドマーク数</dt>
                <dd>{activeResult.landmarks.length} 点</dd>
                <dt>解像度</dt>
                <dd>
                  {activeResult.imageWidth} × {activeResult.imageHeight}
                </dd>
                <dt>処理時間</dt>
                <dd>{activeResult.durationMs.toFixed(0)} ms</dd>
              </dl>
              <label className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={showLandmarks}
                  onChange={(e) => setShowLandmarks(e.target.checked)}
                  className="accent-tiam-gold size-3.5"
                />
                ランドマーク点を重ねて表示
              </label>
            </div>
          )}

          {scoreResult && <ScoreSummary result={scoreResult} />}

          {diagnosisStatus === "loading" && (
            <div className="border-border/60 bg-accent/30 flex items-center justify-center gap-3 rounded-lg border px-4 py-6">
              <Loader2 className="text-tiam-gold size-5 animate-spin" />
              <span className="text-foreground text-sm font-medium">
                TIAM AI が診断レポートを書き起こしています…
              </span>
            </div>
          )}

          {diagnosisText && <DiagnosisText result={diagnosisText} />}

          {(isError || scoreError || diagnosisError) && (
            <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm leading-relaxed">
              {diagnosisError ?? scoreError ?? error}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {(isError || scoreError) && (
              <Button type="button" variant="outline" onClick={retry}>
                もう一度解析
              </Button>
            )}
            {diagnosisError && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateDiagnosis}
              >
                診断文を再生成
              </Button>
            )}
            <Button type="button" variant="outline" onClick={startOver}>
              別の写真を選ぶ
            </Button>
            {!scoreResult ? (
              <Button
                type="button"
                disabled={!isSuccess}
                title={!isSuccess ? "顔の検出が完了してから進めます" : undefined}
                onClick={handleComputeScore}
              >
                スコアを計算する
              </Button>
            ) : !diagnosisText ? (
              <Button
                type="button"
                onClick={handleGenerateDiagnosis}
                disabled={diagnosisStatus === "loading"}
              >
                AI 診断文を生成する
              </Button>
            ) : (
              <Button type="button" onClick={handleGoToResult}>
                結果画面へ
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
