"use client";

import { Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { cropToImageFile, type PixelCrop } from "@/lib/image/cropImage";
import {
  pickCropObjectFit,
  type CropObjectFit,
} from "@/lib/image/cropObjectFit";
import { cn } from "@/lib/utils";

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
 * クロップ枠内の固定ガイド（操作不要）。
 * 頭・顎の横線と顔の中心の縦線のみ（目の高さは個人差が大きく固定表示が誤解を招くため省略）。
 */
const CROP_GUIDE = {
  headTop: 0.13,
  chinTip: 0.75,
  faceCenterX: 0.5,
} as const;

const OPTIONAL_HINTS_STORAGE_KEY = "tiam-photo-crop-optional-hints-dismissed";

type HorizontalGuideKind = "head" | "chin";

function GuideHorizontal({
  topPct,
  label,
  kind,
}: {
  topPct: number;
  label: string;
  kind: HorizontalGuideKind;
}) {
  const lineClass = cn(
    "h-0 flex-1 border-t border-dashed",
    kind === "head" && "border-tiam-rose/90",
    kind === "chin" && "border-emerald-400/75",
  );

  const labelClass = cn(
    "ml-1.5 max-w-[46%] shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-tight shadow-sm backdrop-blur-[2px] sm:max-w-[40%] sm:text-[11px]",
    kind === "head" && "bg-tiam-rose/25 font-medium text-tiam-rose",
    kind === "chin" && "bg-black/30 text-emerald-100/95",
  );

  return (
    <div
      className="pointer-events-none absolute right-0 left-0 flex -translate-y-1/2 items-center"
      style={{ top: `${topPct * 100}%` }}
      aria-hidden
    >
      <div className={lineClass} />
      <span className={labelClass}>{label}</span>
    </div>
  );
}

function GuideFaceCenterVertical({ emphasized }: { emphasized?: boolean }) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 w-0 -translate-x-1/2 border-l border-dashed",
          emphasized ? "border-sky-200" : "border-sky-400/80",
        )}
        style={{ left: `${CROP_GUIDE.faceCenterX * 100}%` }}
        aria-hidden
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-2 left-1/2 max-w-[88%] -translate-x-1/2 rounded px-1.5 py-0.5 text-center text-[10px] leading-tight shadow-sm backdrop-blur-[2px] sm:text-[11px]",
          emphasized
            ? "bg-black/45 font-medium text-sky-100"
            : "bg-black/35 text-sky-100/95",
        )}
        aria-hidden
      >
        顔の中心
      </span>
    </>
  );
}

function CropGuideSample() {
  return (
    <aside
      className="mx-auto w-full max-w-[11rem] lg:mx-0 lg:max-w-none"
      aria-label="顔位置の見本"
    >
      <p className="font-heading text-tiam-primary mb-2 text-sm leading-none">
        見本
      </p>
      <div className="border-border bg-muted/30 relative aspect-[4/5] w-full overflow-hidden rounded-lg border shadow-inner">
        <Image
          src="/images/photo-crop-guide-portrait2.jpg"
          alt="顔位置の見本イラスト"
          fill
          sizes="(min-width: 1024px) 12rem, 11rem"
          className="object-cover object-center"
        />
        <div
          className="pointer-events-none absolute inset-2 z-20 rounded-md ring-1 ring-white/50"
          aria-hidden
        />
      </div>
    </aside>
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
  const [optionalHintsDismissed, setOptionalHintsDismissed] =
    React.useState(false);
  const [detailedHintsOpen, setDetailedHintsOpen] = React.useState(false);
  const [objectFit, setObjectFit] = React.useState<CropObjectFit>("vertical-cover");

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

  const onMediaLoaded = React.useCallback(
    (media: { naturalWidth: number; naturalHeight: number }) => {
      setObjectFit(pickCropObjectFit(media.naturalWidth, media.naturalHeight, ASPECT));
    },
    [],
  );

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
      <div className="mx-auto grid w-full max-w-sm gap-5 lg:max-w-3xl lg:grid-cols-[minmax(0,24rem)_minmax(10rem,12rem)] lg:items-start lg:justify-center">
        <div className="min-w-0">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="photo-cropper-frame border-border bg-muted/30 relative aspect-[4/5] w-full overflow-hidden rounded-xl border shadow-inner">
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
                objectFit={objectFit}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onMediaLoaded={onMediaLoaded}
                classes={{
                  containerClassName: "!bg-transparent",
                  mediaClassName: "select-none !max-w-none !max-h-none",
                }}
                style={{
                  cropAreaStyle: { border: "none" },
                }}
              />
              {/* 構図ガイド：頭・顎（横）＋顔の中心（縦）。目は固定線を出さない */}
              <div
                className="pointer-events-none absolute inset-0 z-10"
                aria-hidden
              >
                <GuideFaceCenterVertical emphasized={detailedHintsOpen} />
                <GuideHorizontal
                  topPct={CROP_GUIDE.headTop}
                  label="頭の先"
                  kind="head"
                />
                <GuideHorizontal
                  topPct={CROP_GUIDE.chinTip}
                  label="顎の先"
                  kind="chin"
                />
              </div>
            </div>
            <p className="text-muted-foreground mt-2 text-center text-xs leading-relaxed">
              ドラッグで位置調整、ピンチまたはスライダーで拡大できます。
              <br />
              <span className="text-foreground/85">
                頭の先・顎の先の横線と顔の中心の縦線は、構図の目安です。
              </span>
              まず輪郭全体（頭頂〜顎・耳の付け根付近）が枠からはみ出さないことを優先してください。線は同時にきっちり合わせる必要はありません。
              <span className="whitespace-nowrap">
                顎や中心だけ合わせて頭や横が切れる
              </span>
              場合はズームを弱めるか位置をずらしてください。
              <br />
              余裕があれば三分割の中央付近に顔が来るとより望ましいですが、輪郭が欠けるなら無理に合わせないでください。
            </p>
            {optionalHintsReady && !optionalHintsDismissed && (
              <details
                className="border-border bg-muted/20 text-muted-foreground mt-3 rounded-lg border px-3 py-2 text-left text-xs leading-relaxed"
                onToggle={(e) => {
                  setDetailedHintsOpen((e.target as HTMLDetailsElement).open);
                }}
              >
                <summary className="cursor-pointer select-none text-foreground/90 font-medium">
                  構図の詳しいヒント（任意）
                </summary>
                <div className="mt-2 space-y-2 pl-0.5">
                  <p>
                    <span className="text-foreground/90">
                      輪郭が収まること
                    </span>
                    を最優先にしてください。輪郭が欠けた状態で解析すると検出が不安定になることがあります。
                  </p>
                  <p>
                    <span className="text-foreground/90">
                      縦線（顔の中心）
                    </span>
                    が鼻〜眉間付近を通ると正面構図として解析しやすくなります。頭頂や耳が切れるなら無理に合わせないでください。
                  </p>
                  <p>
                    目の高さは人によって大きく異なるため、この画面ではガイド線を出していません。解析時はカメラに写った顔からメッシュで推定します。
                  </p>
                  <p>
                    「頭の先」は髪型・角度で写りにくいことがあります。解析では顔メッシュの推定を使い、結果画面のガイドとも目安として揃えています。
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

          <div className="mx-auto mt-4 flex w-full max-w-sm items-center gap-3">
            <ZoomOut
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden
            />
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
            <ZoomIn
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden
            />
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
        </div>

        <CropGuideSample />
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
