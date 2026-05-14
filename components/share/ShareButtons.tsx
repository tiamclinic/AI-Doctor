"use client";

import { Download, MessageCircle, Share2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import {
  buildShareCardRequest,
  requestShareCard,
  triggerDownload,
} from "@/lib/share-card/client";
import {
  buildDefaultShareTweetText,
  buildLineShareUrl,
  buildXIntentUrl,
} from "@/lib/share/shareUrls";

type ShareButtonsProps = {
  resultId: string;
  pageUrl: string;
  score: ScoreResult;
  diagnosis: DiagnoseResponse | null;
  className?: string;
};

export function ShareButtons({
  resultId,
  pageUrl,
  score,
  diagnosis,
  className,
}: ShareButtonsProps) {
  const [igBusy, setIgBusy] = React.useState(false);
  const [igError, setIgError] = React.useState<string | null>(null);

  const tweetText = React.useMemo(
    () => buildDefaultShareTweetText(score.totalScore),
    [score.totalScore],
  );

  const xHref = React.useMemo(
    () =>
      pageUrl
        ? buildXIntentUrl({ pageUrl, tweetText })
        : "",
    [pageUrl, tweetText],
  );

  const lineHref = React.useMemo(
    () => (pageUrl ? buildLineShareUrl(pageUrl) : ""),
    [pageUrl],
  );

  const openX = React.useCallback(() => {
    if (!xHref) return;
    window.open(xHref, "_blank", "noopener,noreferrer");
  }, [xHref]);

  const openLine = React.useCallback(() => {
    if (!lineHref) return;
    window.open(lineHref, "_blank", "noopener,noreferrer");
  }, [lineHref]);

  const downloadShareCardForInstagram = React.useCallback(async () => {
    setIgError(null);
    setIgBusy(true);
    try {
      const payload = buildShareCardRequest(score, diagnosis);
      const res = await requestShareCard(payload);
      if (!res.ok) {
        setIgError(res.message);
        return;
      }
      const file = new File([res.blob], `tiam-share-${resultId}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "TIAM シェアカード",
          text: "ストーリーズに画像を貼り付けてください。",
        });
        return;
      }
      triggerDownload(res.blob, `tiam-share-${resultId}.png`);
    } catch (e) {
      setIgError(
        e instanceof Error ? e.message : "ダウンロードに失敗しました。",
      );
    } finally {
      setIgBusy(false);
    }
  }, [diagnosis, resultId, score]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={!pageUrl}
          onClick={openX}
        >
          <span className="font-semibold" aria-hidden>
            𝕏
          </span>
          X で共有
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={!pageUrl}
          onClick={openLine}
        >
          <MessageCircle className="size-4" />
          LINE で共有
        </Button>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={igBusy}
          onClick={downloadShareCardForInstagram}
        >
          <Download className="size-4" />
          {igBusy ? "準備中…" : "画像をダウンロード"}
        </Button>
      </div>

      <p className="text-muted-foreground mt-3 text-center text-[11px] leading-relaxed">
        X に画像を添付する場合は、上の「SNS 用シェアカード」で PNG を生成してから添付するか、
        <br className="hidden sm:inline" />
        Instagram 向けに「画像をダウンロード」で同じカードを保存してください。
      </p>

      <div className="border-border bg-muted/20 mt-4 rounded-lg border p-3 text-[11px] leading-relaxed">
        <div className="text-tiam-primary flex items-center gap-1.5 font-medium">
          <Share2 className="text-tiam-gold size-3.5 shrink-0" />
          Instagram ストーリーズの目安
        </div>
        <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-4">
          <li>「画像をダウンロード」でシェアカード PNG を保存（共有シートが開く端末もあります）。</li>
          <li>Instagram を開き、ストーリーズでギャラリからその画像を選択。</li>
          <li>必要ならリンク用の「リンクをコピー」で URL をプロフィールやテキストに貼り付け。</li>
        </ol>
      </div>

      {igError ? (
        <p className="text-destructive mt-2 text-center text-xs">{igError}</p>
      ) : null}
    </div>
  );
}
