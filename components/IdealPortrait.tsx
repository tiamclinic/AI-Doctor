"use client";

import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics/track";
import {
  hasOpenAiPortraitConsent,
  subscribeConsent,
} from "@/lib/consent";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import { requestIdealPortrait } from "@/lib/portrait/client";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";

type Status = "idle" | "loading" | "success" | "error";

type IdealPortraitProps = {
  photoDataUrl: string;
  score: ScoreResult;
};

const consentInitialSnapshot = () => false;

export function IdealPortrait({ photoDataUrl, score }: IdealPortraitProps) {
  // 同意状態を SSR セーフに購読する
  const consented = React.useSyncExternalStore(
    subscribeConsent,
    hasOpenAiPortraitConsent,
    consentInitialSnapshot,
  );

  const idealPortrait = useDiagnosisStore((s) => s.idealPortrait);
  const setIdealPortrait = useDiagnosisStore((s) => s.setIdealPortrait);

  const [status, setStatus] = React.useState<Status>(
    idealPortrait ? "success" : "idle",
  );
  const [error, setError] = React.useState<string | null>(null);

  const generate = React.useCallback(async () => {
    if (!consented) {
      setError("OpenAI への写真送信に同意してから生成してください。");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError(null);
    const started = performance.now();
    const res = await requestIdealPortrait(photoDataUrl, score);
    const elapsed = performance.now() - started;
    if (process.env.NODE_ENV !== "production") {
      console.info(`[/api/generate-portrait] ${elapsed.toFixed(0)}ms`);
    }
    if (res.ok) {
      setIdealPortrait(res.data);
      setStatus("success");
      void trackEvent("portrait_generated", {
        duration_ms: Math.round(elapsed),
      });
    } else {
      setError(res.error.message);
      setStatus("error");
    }
  }, [consented, photoDataUrl, score, setIdealPortrait]);

  const reset = React.useCallback(() => {
    setIdealPortrait(null);
    setStatus("idle");
    setError(null);
  }, [setIdealPortrait]);

  if (!consented) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <ShieldCheck className="text-muted-foreground size-6" />
        <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
          理想顔の生成には、OpenAI への写真送信に対する同意が必要です。
          <br />
          初期画面に戻り、同意モーダルで該当チェックを ON にしてからお試しください。
        </p>
      </div>
    );
  }

  if (status === "success" && idealPortrait) {
    const src = idealPortrait.imageBase64.startsWith("data:")
      ? idealPortrait.imageBase64
      : `data:image/png;base64,${idealPortrait.imageBase64}`;
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <div className="grid w-full max-w-lg grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-[10px] tracking-[0.25em] uppercase">
              Original
            </span>
            <div className="border-border bg-muted/30 aspect-square overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoDataUrl}
                alt="入力写真"
                className="block h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-tiam-gold text-[10px] tracking-[0.25em] uppercase">
              TIAM ideal
            </span>
            <div className="border-tiam-gold/40 bg-muted/30 aspect-square overflow-hidden rounded-lg border-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="TIAM AI が描いた理想顔の参考イメージ"
                className="block h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
        <p className="text-muted-foreground max-w-md text-center text-[10px] leading-relaxed">
          ※ あくまでメイク／ヘア／ライティング調整による参考イメージで、医療的な変形ではありません。実際のあなたとは差異があります。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={reset}>
            やり直す
          </Button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="border-border/60 bg-muted/30 flex aspect-square w-56 animate-pulse items-center justify-center rounded-lg border">
          <Loader2 className="text-tiam-gold size-7 animate-spin" />
        </div>
        <p className="text-muted-foreground text-xs">
          TIAM AI が黄金比に近づけた参考イメージを描き起こしています…
          <br />
          生成には 20〜40 秒ほどかかります。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {status === "error" && error && (
        <p className="text-destructive max-w-md text-center text-xs">{error}</p>
      )}
      <Button type="button" onClick={generate} className="gap-2">
        <Sparkles className="size-4" />
        AI で理想顔を生成する
      </Button>
      <p className="text-muted-foreground max-w-md text-center text-[10px] leading-relaxed">
        生成は OpenAI gpt-image-1
        による参考イメージです。写真は生成リクエスト時にのみ OpenAI
        に送信され、保存はされません。
      </p>
    </div>
  );
}
