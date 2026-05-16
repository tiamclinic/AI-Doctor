import {
  type DiagnosisRecord,
  DiagnosisRecordSchema,
  type PhotoPolicy,
} from "@/lib/diagnoses/types";

function resolvePhotoPolicy(): PhotoPolicy {
  return process.env.PHOTO_POLICY === "thumbnail" ? "thumbnail" : "none";
}

export function buildDiagnosisRecord(
  input: Omit<DiagnosisRecord, "createdAt" | "photoPolicy"> & {
    createdAt?: string;
    photoPolicy?: PhotoPolicy;
  },
): DiagnosisRecord {
  const record: DiagnosisRecord = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    photoPolicy: input.photoPolicy ?? resolvePhotoPolicy(),
  };
  return DiagnosisRecordSchema.parse(record);
}
