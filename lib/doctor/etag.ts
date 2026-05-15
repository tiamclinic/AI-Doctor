import { createHash } from "node:crypto";

import type { DoctorContent } from "@/lib/doctor/types";

/** `publishedAt` から弱い ETag を生成（W/ プレフィックス付き） */
export function buildDoctorContentEtag(content: DoctorContent): string {
  const hash = createHash("sha256")
    .update(content.publishedAt)
    .digest("hex")
    .slice(0, 16);
  return `W/"${hash}"`;
}

export function etagMatches(
  ifNoneMatch: string | null,
  etag: string,
): boolean {
  if (!ifNoneMatch) return false;
  const candidates = ifNoneMatch.split(",").map((s) => s.trim());
  return candidates.includes(etag) || candidates.includes("*");
}
