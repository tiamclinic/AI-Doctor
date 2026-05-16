import { createHash } from "node:crypto";

/** `publishedAt` から弱い ETag（W/）を生成 */
export function buildDoctorNoteEtag(publishedAt: string): string {
  const hash = createHash("sha256")
    .update(publishedAt)
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
