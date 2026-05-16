"use client";

import { Camera, ImageIcon, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { PhotoCropper } from "@/components/PhotoCropper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics/track";
import { hasTermsConsent } from "@/lib/consent";
import { heicToJpegFile } from "@/lib/image/heicToJpeg";
import { normalizeImageForCrop } from "@/lib/image/normalizeForCrop";
import { readFileAsDataURL } from "@/lib/image/readDataUrl";
import { isHeicLike, validateImageFile } from "@/lib/image/validate";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";
import { cn } from "@/lib/utils";

export type PhotoUploaderProps = {
  onSelect: (file: File, dataUrl: string) => void;
  maxSizeMB?: number;
};

export function PhotoUploader({
  onSelect,
  maxSizeMB = 10,
}: PhotoUploaderProps) {
  const router = useRouter();
  const clearStorePhoto = useDiagnosisStore((s) => s.clearPhoto);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  // クロップ前の元画像。preview ではなく source として保持する。
  const [source, setSource] = React.useState<{
    file: File;
    dataUrl: string;
  } | null>(null);
  // クロップ確定後の画像。決定済みフラグも兼ねる。
  const [cropped, setCropped] = React.useState<{
    file: File;
    dataUrl: string;
  } | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const reset = () => {
    clearStorePhoto();
    setSource(null);
    setCropped(null);
    setError(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const processFile = React.useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;

      setError(null);

      const validated = validateImageFile(file, maxBytes);
      if (!validated.ok) {
        setError(validated.message);
        return;
      }

      setBusy(true);
      try {
        let output = file;
        if (isHeicLike(file)) {
          output = await heicToJpegFile(file);
        }

        const rawDataUrl = await readFileAsDataURL(output);
        const dataUrl = await normalizeImageForCrop(rawDataUrl);
        // この時点ではまだクロップ前。ストアへの反映はクロップ確定時に行う。
        setSource({ file: output, dataUrl });
        setCropped(null);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "画像の読み込みに失敗しました。";
        setError(
          message.includes("ERR_LIBHEIF")
            ? "この HEIC ファイルはブラウザで変換できませんでした。JPEG に書き出してからお試しください。"
            : message,
        );
      } finally {
        setBusy(false);
      }
    },
    [maxBytes],
  );

  const handleCropConfirm = React.useCallback(
    (file: File, dataUrl: string) => {
      setCropped({ file, dataUrl });
      onSelect(file, dataUrl);
      void trackEvent("upload", {
        mime: file.type || "unknown",
        size_kb: Math.round(file.size / 1024),
      });
    },
    [onSelect],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void processFile(file);
  };

  const goNext = () => {
    if (!cropped) return;
    if (!hasTermsConsent()) {
      setError(
        "利用規約とプライバシーポリシーへの同意が必要です。ページ上部から同意してください。",
      );
      return;
    }
    router.push("/diagnose");
  };

  return (
    <Card
      className={cn(
        "border-border/80 w-full shadow-sm",
        source && !cropped ? "max-w-4xl" : "max-w-xl",
      )}
    >
      <CardHeader className="text-left">
        <CardTitle className="font-heading text-xl">顔写真をアップロード</CardTitle>
        <CardDescription>
          明るい場所で、正面から顔全体が写る写真を選んでください。JPEG / PNG /
          WebP / HEIC（最大 {maxSizeMB}MB）。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!source && (
          <>
            <div
              role="presentation"
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={onDrop}
              className={`border-border hover:border-tiam-gold/60 hover:bg-accent/40 flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-10 transition-colors md:min-h-[240px] ${isDragging ? "border-tiam-gold bg-accent/50" : ""}`}
              onClick={() => galleryInputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="text-tiam-gold size-10 animate-spin" />
              ) : (
                <Upload className="text-muted-foreground size-10" />
              )}
              <div className="space-y-1 text-center">
                <p className="text-foreground text-sm font-medium">
                  ドラッグ＆ドロップ、またはクリックして選択
                </p>
                <p className="text-muted-foreground text-xs">
                  ブラウザ内でのみ解析します（この時点ではサーバーに送信しません）。
                </p>
              </div>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="sr-only"
              onChange={onInputChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="sr-only"
              onChange={onInputChange}
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:hidden">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              >
                <Camera className="size-4" />
                撮影する
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  galleryInputRef.current?.click();
                }}
              >
                <ImageIcon className="size-4" />
                写真を選ぶ
              </Button>
            </div>
          </>
        )}

        {source && !cropped && (
          <PhotoCropper
            key={source.dataUrl}
            imageDataUrl={source.dataUrl}
            fileName={source.file.name}
            onConfirm={handleCropConfirm}
            onReset={reset}
            disabled={busy}
          />
        )}

        {cropped && (
          <div className="flex flex-col gap-4">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="border-border bg-muted/30 relative aspect-[4/5] w-full overflow-hidden rounded-xl border shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cropped.dataUrl}
                  alt="クロップ後の顔写真"
                  className="block h-full w-full object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  aria-hidden
                >
                  <div className="absolute inset-y-0 left-1/3 w-px bg-white/35" />
                  <div className="absolute inset-y-0 left-2/3 w-px bg-white/35" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/35" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/35" />
                </div>
                <div className="pointer-events-none absolute inset-3 rounded-lg ring-1 ring-white/40" />
              </div>
              <p className="text-muted-foreground mt-2 text-center text-xs">
                この構図で解析します。気になる場合は「構図を再調整」してください。
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                disabled={busy}
              >
                別の写真を選ぶ
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCropped(null)}
                disabled={busy}
              >
                構図を再調整
              </Button>
              <Button type="button" onClick={goNext} disabled={busy}>
                次へ進む
              </Button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-destructive text-center text-sm leading-relaxed">
            {error}
          </p>
        )}

      </CardContent>
    </Card>
  );
}
