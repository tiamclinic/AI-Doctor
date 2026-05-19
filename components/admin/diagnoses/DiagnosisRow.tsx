"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";

import { StatusBadge } from "@/components/admin/diagnoses/StatusBadge";
import {
  diagnosisDisplayLabel,
  formatDiagnosisCreatedAt,
} from "@/lib/diagnoses/listDisplay";
import type { DiagnosisListItem } from "@/lib/diagnoses/types";
import { cn } from "@/lib/utils";

type DiagnosisRowProps = {
  item: DiagnosisListItem;
};

export function DiagnosisRow({ item }: DiagnosisRowProps) {
  const href = `/admin/diagnoses/${item.resultId}`;
  const showThumb =
    item.photoPolicy === "thumbnail" && Boolean(item.thumbnailUrl);

  return (
    <Link
      href={href}
      className={cn(
        "border-border/80 bg-card hover:bg-muted/30 group flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors sm:gap-4 sm:px-4",
      )}
    >
      <div className="bg-muted/40 text-muted-foreground flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        {showThumb && item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            width={48}
            height={48}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <UserRound className="size-5" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-tiam-primary font-medium">
            {diagnosisDisplayLabel(item)}
          </span>
          <StatusBadge status={item.noteStatus} />
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {formatDiagnosisCreatedAt(item.createdAt)}
          <span className="mx-1.5">·</span>
          総合 {item.scoreResult.totalScore.toFixed(1)}
          <span className="mx-1.5 hidden sm:inline">·</span>
          <span className="font-mono hidden sm:inline">{item.resultId}</span>
        </p>
      </div>

      <ChevronRight
        className="text-muted-foreground group-hover:text-tiam-primary size-4 shrink-0 transition-colors"
        aria-hidden
      />
    </Link>
  );
}
