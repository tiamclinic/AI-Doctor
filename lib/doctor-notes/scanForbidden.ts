import { scanForbidden } from "@/lib/prompt/forbiddenWords";

import type { DoctorNotePublishBody } from "./types";

export function scanDoctorNoteForbidden(
  body: DoctorNotePublishBody,
): { ok: boolean; hits: string[] } {
  const texts: string[] = [];
  for (const part of Object.values(body.parts)) {
    texts.push(part.body);
    if (part.title) texts.push(part.title);
    if (part.internalMemo) texts.push(part.internalMemo);
    for (const line of part.recommendedCare) {
      texts.push(line);
    }
  }
  if (body.report) {
    if (body.report.overallComment) texts.push(body.report.overallComment);
    if (body.report.closingMessage) texts.push(body.report.closingMessage);
    if (body.report.internalMemo) texts.push(body.report.internalMemo);
    for (const line of [
      ...body.report.strengths,
      ...body.report.improvements,
      ...body.report.recommendedCare,
    ]) {
      texts.push(line);
    }
  }

  const hits = new Set<string>();
  for (const text of texts) {
    const result = scanForbidden(text);
    for (const hit of result.hits) hits.add(hit);
  }

  return { ok: hits.size === 0, hits: [...hits] };
}
