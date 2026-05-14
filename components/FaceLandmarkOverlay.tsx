"use client";

import * as React from "react";

import { drawGoldenRatioGuide } from "@/lib/faceAnalysis/drawGoldenGuide";
import type { RawMetrics } from "@/lib/faceAnalysis/goldenRatio";
import type { DetectResult } from "@/lib/faceAnalysis/types";

type FaceLandmarkOverlayProps = {
  dataUrl: string;
  result: DetectResult | null;
  showLandmarks?: boolean;
  /** 黄金比ガイド（グリッド・ラベル・比率テキスト）。ON のときは 478 点の全描画は行わない */
  showGoldenGuide?: boolean;
  /** `showGoldenGuide` 用。`computeScore` の `rawValues` を渡す */
  rawMetrics?: RawMetrics | null;
  className?: string;
};

export function FaceLandmarkOverlay({
  dataUrl,
  result,
  showLandmarks = true,
  showGoldenGuide = false,
  rawMetrics = null,
  className,
}: FaceLandmarkOverlayProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [size, setSize] = React.useState<{ w: number; h: number } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = img.naturalWidth * dpr;
      canvas.height = img.naturalHeight * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

      const lm = result?.landmarks;
      const canGuide =
        showGoldenGuide && Boolean(lm && rawMetrics && lm.length >= 468);

      if (canGuide) {
        try {
          drawGoldenRatioGuide(ctx, img.naturalWidth, img.naturalHeight, lm!, rawMetrics!);
        } catch {
          // 座標異常時は写真のみ表示
        }
      } else if (showLandmarks && lm) {
        ctx.fillStyle = "rgba(201, 169, 110, 0.9)";
        const dotSize = Math.max(1, img.naturalWidth / 600);
        for (const p of lm) {
          const px = p.x * img.naturalWidth;
          const py = p.y * img.naturalHeight;
          ctx.beginPath();
          ctx.arc(px, py, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      setSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = dataUrl;
    return () => {
      cancelled = true;
    };
  }, [dataUrl, result, showLandmarks, showGoldenGuide, rawMetrics]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={
        size
          ? { width: "100%", height: "auto", aspectRatio: `${size.w} / ${size.h}` }
          : { width: "100%", height: "auto" }
      }
      aria-label={
        showGoldenGuide
          ? "顔写真と黄金比ガイドのプレビュー"
          : "顔写真とランドマークのプレビュー"
      }
    />
  );
}
