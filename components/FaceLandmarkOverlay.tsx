"use client";

import * as React from "react";

import type { DetectResult } from "@/lib/faceAnalysis/types";

type FaceLandmarkOverlayProps = {
  dataUrl: string;
  result: DetectResult | null;
  showLandmarks?: boolean;
  className?: string;
};

export function FaceLandmarkOverlay({
  dataUrl,
  result,
  showLandmarks = true,
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

      if (showLandmarks && result?.landmarks) {
        ctx.fillStyle = "rgba(201, 169, 110, 0.9)";
        const dotSize = Math.max(1, img.naturalWidth / 600);
        for (const p of result.landmarks) {
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
  }, [dataUrl, result, showLandmarks]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={
        size
          ? { width: "100%", height: "auto", aspectRatio: `${size.w} / ${size.h}` }
          : { width: "100%", height: "auto" }
      }
      aria-label="顔写真とランドマークのプレビュー"
    />
  );
}
