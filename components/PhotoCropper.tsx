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

// 4:5 縦長クロップ。アスペクト比はrequirements.md §F-01 と既存の解析 UI に合わせる。
const ASPECT = 4 / 5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * クロップ枠上端からの割合（0–1）。構図の参考用・操作不要。
 * 下端の線は「顎をこの位置に乗せる」ではなく、顎より下に少し余白が乗る目安（切りすぎ防止）。
 */
const CROP_GUIDE_LINES = {
  forehead: 0.2,
  eyes: 0.37,
  chin: 0.93,
} as const;

const OPTIONAL_HINTS_STORAGE_KEY = "tiam-photo-crop-optional-hints-dismissed";

function GuideLineRow({
  topPct,
  label,
  emphasized,
}: {
  topPct: number;
  label: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute right-0 left-0 flex -translate-y-1/2 items-center"
      style={{ top: `${topPct * 100}%` }}
      aria-hidden
    >
      <div
        className={
          emphasized
            ? "border-tiam-gold/70 h-0 flex-1 border-t border-dashed"
            : "h-0 flex-1 border-t border-dashed border-white/40"
        }
      />
      <span
        className={
          emphasized
            ? "text-tiam-gold ml-1.5 max-w-[42%] shrink-0 rounded bg-black/35 px-1.5 py-0.5 text-[10px] leading-tight font-medium text-white/95 shadow-sm backdrop-blur-[2px] sm:text-[11px]"
            : "ml-1.5 max-w-[42%] shrink-0 rounded bg-black/30 px-1.5 py-0.5 text-[10px] leading-tight text-white/90 shadow-sm backdrop-blur-[2px] sm:text-[11px]"
        }
      >
        {label}
      </span>
    </div>
  );
}

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
  const [optionalHintsReady, setOptionalHintsReady] = React.useState(false);
  const [optionalHintsDismissed, setOptionalHintsDismissed] = React.useState(false);
  const [eyeLineHintOpen, setEyeLineHintOpen] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => {
      let dismissed = false;
      try {
        dismissed =
          window.localStorage.getItem(OPTIONAL_HINTS_STORAGE_KEY) === "1";
      } catch {
        dismissed = false;
      }
      setOptionalHintsDismissed(dismissed);
      setOptionalHintsReady(true);
    });
  }, []);

  const dismissOptionalHints = React.useCallback(() => {
    try {
      window.localStorage.setItem(OPTIONAL_HINTS_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOptionalHintsDismissed(true);
  }, []);

  const restoreOptionalHints = React.useCallback(() => {
    try {
      window.localStorage.removeItem(OPTIONAL_HINTS_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setOptionalHintsDismissed(false);
  }, []);

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
          {/* 構図ガイド（固定・操作不要） */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            aria-hidden
          >
            <GuideLineRow
              topPct={CROP_GUIDE_LINES.forehead}
              label="額上端の目安"
              emphasized={false}
            />
            <GuideLineRow
              topPct={CROP_GUIDE_LINES.eyes}
              label="目の高さ"
              emphasized={eyeLineHintOpen}
            />
            <GuideLineRow
              topPct={CROP_GUIDE_LINES.chin}
              label="顎下の余白目安"
              emphasized={false}
            />
          </div>
          {/* セーフエリア枠 */}
          <div
            className="pointer-events-none absolute inset-3 z-20 rounded-lg ring-1 ring-white/40"
            aria-hidden
          />
        </div>
        <p className="text-muted-foreground mt-2 text-center text-xs leading-relaxed">
          ドラッグで位置調整、ピンチまたはスライダーで拡大できます。
          <br />
          <span className="text-foreground/85">
            まず顔の輪郭全体（頭頂〜顎・耳の付け根付近）が枠からはみ出さない
          </span>
          ことを優先してください。半透明の3本は同時にきっちり合わせるものではありません。
          下端の線は「顎の下に少し余白」が乗る目安で、
          <span className="whitespace-nowrap">顎だけ合わせて頭が切れる</span>
          場合はズームを弱めるか位置をずらしてください。
          <br />
          余裕があれば三分割の中央付近に顔が来るとより望ましいですが、輪郭が欠けるなら無理に合わせないでください。
        </p>
        {optionalHintsReady && !optionalHintsDismissed && (
          <details
            className="border-border bg-muted/20 text-muted-foreground mt-3 rounded-lg border px-3 py-2 text-left text-xs leading-relaxed"
            onToggle={(e) => {
              setEyeLineHintOpen((e.target as HTMLDetailsElement).open);
            }}
          >
            <summary className="cursor-pointer select-none text-foreground/90 font-medium">
              構図の詳しいヒント（任意）
            </summary>
            <div className="mt-2 space-y-2 pl-0.5">
              <p>
                <span className="text-foreground/90">輪郭が収まること</span>
                を最優先にしてください。輪郭が欠けた状態で解析すると検出が不安定になることがあります。
              </p>
              <p>
                <span className="text-foreground/90">目のライン</span>
                を「目の高さ」の線付近に寄せると検出が安定しやすい傾向がありますが、頭頂や横が切れるなら合わせなくて構いません。
              </p>
              <p>
                額の上端は髪型・光の加減で写りにくいことがあります。解析では顔メッシュの推定を使い、結果画面のガイドとも目安として揃えています。
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 transition-colors hover:underline"
                  onClick={dismissOptionalHints}
                >
                  次回からこの枠を表示しない
                </button>
              </div>
            </div>
          </details>
        )}
        {optionalHintsReady && optionalHintsDismissed && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground mx-auto mt-2 block text-center text-xs underline-offset-2 transition-colors hover:underline"
            onClick={restoreOptionalHints}
          >
            構図のヒントを再表示
          </button>
        )}
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
