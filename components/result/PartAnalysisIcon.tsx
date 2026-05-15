"use client";

import { Eye, FlipHorizontal } from "lucide-react";

import type { PartId } from "@/lib/result/parts";
import { cn } from "@/lib/utils";

const iconWrap = "text-tiam-gold [&_svg]:size-7 [&_svg]:shrink-0";

/** リファレンスに近い線画アイコン（目・左右対称は Lucide、鼻・口・輪郭は軽量 SVG） */
export function PartAnalysisIcon({ partId }: { partId: PartId }) {
  switch (partId) {
    case "eyes":
      return (
        <span className={cn(iconWrap, "[&_svg]:stroke-[1.6]")} aria-hidden>
          <Eye strokeWidth={1.6} />
        </span>
      );
    case "nose":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7 shrink-0 text-tiam-gold"
          aria-hidden
        >
          <path d="M12 4.5v6" />
          <path d="M9.5 14c1.2 1.2 4.8 1.2 6 0" />
          <path d="M10 11.5h4" opacity={0.85} />
        </svg>
      );
    case "mouth":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7 shrink-0 text-tiam-gold"
          aria-hidden
        >
          <path d="M6.5 11.5c2.8-2.2 8.2-2.2 11 0" />
          <path d="M6.5 12.5c2.8 2.4 8.2 2.4 11 0" />
        </svg>
      );
    case "contour":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.65}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-7 shrink-0 text-tiam-gold"
          aria-hidden
        >
          <path d="M5.5 9c0 5.5 3.5 9.5 6.5 9.5s6.5-4 6.5-9.5" />
          <path d="M8 8.5c2.5-1.5 7.5-1.5 10 0" opacity={0.75} />
        </svg>
      );
    case "symmetry":
      return (
        <span className={cn(iconWrap, "[&_svg]:stroke-[1.6]")} aria-hidden>
          <FlipHorizontal strokeWidth={1.6} />
        </span>
      );
    default: {
      const _x: never = partId;
      return _x;
    }
  }
}
