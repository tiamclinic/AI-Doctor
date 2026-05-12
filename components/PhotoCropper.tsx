"use client";

import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { cropToImageFile, type PixelCrop } from "@/lib/image/cropImage";

export type PhotoCropperProps = {
  imageDataUrl: string;
  fileName: string;
  onConfirm: (file: File, dataUrl: string) => void;
  onReset: () => void;
  disabled?: boolean;
};

// 4:5 縦長クロップ。アスペクト比は要件定義書 §F-01 と既存の解析 UI に合わせる。
const ASPECT = 4 / 5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function PhotoCropper({
  imageDataUrl,
  fileName,
  onConfirm,
  onReset,
  disabled,
}: PhotoCropperProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pixelsRef = React.useRef<PixelCrop | null>(null);

  const onCropComplete = React.useCallback((_: Area, areaPixels: Area) => {
    pixelsRef.current = {
      x: Math.round(areaPixels.x),
      y: Math.round(areaPixels.y),
      width: Math.round(areaPixels.width),
      height: Math.round(areaPixels.height),
    };
  }, []);

  const resetView = React.useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (!pixelsRef.current) return;
    setBusy(true);
    setError(null);
    try {
      const { file, dataUrl } = await cropToImageFile(
        imageDataUrl,
        pixelsRef.current,
        fileName,
        "image/jpeg",
      );
      onConfirm(file, dataUrl);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "クロップ画像の出力に失敗しました。";
      setError(message);
    } finally {
      setBusy(false);
    }
  }, [imageDataUrl, fileName, onConfirm]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto w-full max-w-sm">
        <div className="border-border bg-muted/30 relative aspect-[4/5] w-full overflow-hidden rounded-xl border shadow-inner">
          <Cropper
            image={imageDataUrl}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            zoomSpeed={0.5}
            restrictPosition
            showGrid
            cropShape="rect"
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            classes={{
              containerClassName: "!bg-transparent",
              mediaClassName: "select-none",
            }}
          />
          {/* セーフエリア枠 */}
          <div
            className="pointer-events-none absolute inset-3 rounded-lg ring-1 ring-white/40"
            aria-hidden
          />
        </div>
        <p className="text-muted-foreground mt-2 text-center text-xs leading-relaxed">
          ドラッグで位置調整、ピンチまたはスライダーで拡大できます。
          <br />
          顔全体が三分割の中央に収まるよう整えてください。
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-sm items-center gap-3">
        <ZoomOut className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <input
          type="range"
          aria-label="ズーム"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="accent-tiam-gold h-1 w-full cursor-pointer"
          disabled={disabled || busy}
        />
        <ZoomIn className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetView}
          disabled={disabled || busy}
          className="text-muted-foreground gap-1 px-2"
          title="位置と拡大率をリセット"
        >
          <RotateCcw className="size-3.5" />
          リセット
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-center text-xs leading-relaxed">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={disabled || busy}
        >
          別の写真を選ぶ
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={disabled || busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              書き出し中…
            </>
          ) : (
            "この構図で進む"
          )}
        </Button>
      </div>
    </div>
  );
}
