import { scanDoctorNoteForbidden } from "@/lib/doctor-notes/scanForbidden";
import type { DoctorNotePublishBody } from "@/lib/doctor-notes/types";
import { PART_IDS } from "@/lib/result/parts";

const MAX_BODY = 800;
const MAX_MEMO = 400;
const MAX_REPORT = 800;

function hasMeaningfulContent(body: DoctorNotePublishBody): boolean {
  const partHas = PART_IDS.some((id) => {
    const p = body.parts[id];
    return p.body.trim().length > 1 || p.recommendedCare.length > 0;
  });
  const report = body.report;
  const reportHas =
    !!report &&
    ((report.overallComment?.trim().length ?? 0) > 0 ||
      report.strengths.length > 0 ||
      report.improvements.length > 0 ||
      report.recommendedCare.length > 0 ||
      (report.closingMessage?.trim().length ?? 0) > 0);
  return partHas || reportHas;
}

export function validateDoctorNoteDraft(body: DoctorNotePublishBody): {
  canSaveDraft: boolean;
  canPublish: boolean;
  forbiddenHits: string[];
  overLimit: boolean;
} {
  const forbidden = scanDoctorNoteForbidden(body);
  const overLimit =
    PART_IDS.some((id) => body.parts[id].body.length > MAX_BODY) ||
    PART_IDS.some((id) => (body.parts[id].internalMemo?.length ?? 0) > MAX_MEMO) ||
    (body.report?.overallComment?.length ?? 0) > MAX_REPORT ||
    (body.report?.internalMemo?.length ?? 0) > MAX_MEMO;

  const partBodiesValid = PART_IDS.every((id) => body.parts[id].body.length >= 1);

  return {
    canSaveDraft: forbidden.ok && !overLimit && partBodiesValid,
    canPublish:
      forbidden.ok && !overLimit && partBodiesValid && hasMeaningfulContent(body),
    forbiddenHits: forbidden.hits,
    overLimit,
  };
}
