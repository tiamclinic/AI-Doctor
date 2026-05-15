import { scanForbidden } from "@/lib/prompt/forbiddenWords";
import type { DoctorContentPublishBody } from "@/lib/doctor/types";

export function scanDoctorContentForbidden(
  body: DoctorContentPublishBody,
): { ok: boolean; hits: string[] } {
  const texts: string[] = [];
  if (body.preamble) texts.push(body.preamble);
  if (body.disclaimer) texts.push(body.disclaimer);
  for (const part of Object.values(body.parts)) {
    texts.push(part.body);
    if (part.title) texts.push(part.title);
  }

  const hits = new Set<string>();
  for (const text of texts) {
    const result = scanForbidden(text);
    for (const hit of result.hits) hits.add(hit);
  }

  return { ok: hits.size === 0, hits: [...hits] };
}
