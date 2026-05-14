"use client";

import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import type { ScoreResult } from "@/lib/faceAnalysis/scoring";
import { trackEvent } from "@/lib/analytics/track";
import {
  buildShareCardRequest,
  requestShareCard,
  triggerDownload,
} from "@/lib/share-card/client";

type Status = "idle" | "loading" | "ready" | "error";

type ShareCardButtonProps = {
  resultId: string;
  score: ScoreResult;
  diagnosis: DiagnoseResponse | null;
};

export function ShareCardButton({
  resultId,
  score,
  diagnosis,
}: ShareCardButtonProps) {
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const blobRef = React.useRef<Blob | null>(null);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const generate = React.useCallback(async () => {
    setStatus("loading");
    setError(null);
    const payload = buildShareCardRequest(score, diagnosis);
    const res = await requestShareCard(payload);
    if (!res.ok) {
      setError(res.message);
      setStatus("error");
      return;
    }
    blobRef.current = res.blob;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(res.blob));
    setStatus("ready");
    void trackEvent("share_card_generated", { result_id: resultId });
  }, [score, diagnosis, previewUrl, resultId]);

  const download = React.useCallback(() => {
    if (!blobRef.current) return;
    void trackEvent("share_clicked", { channel: "share_card_png" });
    triggerDownload(blobRef.current, `tiam-share-${resultId}.png`);
  }, [resultId]);

  return (
    <div className="flex flex-col items-center gap-4">
      {status === "idle" && (
        <Button type="button" onClick={generate} className="gap-2">
          <ImageIcon className="size-4" />
          シェアカードを生成する
        </Button>
      )}

      {status === "loading" && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="text-tiam-gold size-4 animate-spin" />
          1080×1920 のシェアカードを書き出し中…
        </div>
      )}

      {status === "ready" && previewUrl && (
        <div className="flex w-full max-w-xs flex-col items-center gap-3">
          <div className="border-border bg-tiam-primary/95 w-full overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="TIAM 診断シェアカード"
              className="block h-auto w-full"
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" onClick={download} className="gap-2">
              <Download className="size-4" />
              PNG をダウンロード
            </Button>
            <Button type="button" variant="outline" onClick={generate}>
              再生成
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-destructive text-xs">
            {error ?? "予期しないエラーが発生しました。"}
          </p>
          <Button type="button" variant="outline" onClick={generate}>
            もう一度試す
          </Button>
        </div>
      )}
    </div>
  );
}
