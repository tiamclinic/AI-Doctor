import type { DoctorContentPublishBody } from "@/lib/doctor/types";
import { PART_IDS } from "@/lib/result/parts";

const PLACEHOLDER_BODY = "（記入してください）";

export function createEmptyDoctorDraft(): DoctorContentPublishBody {
  return {
    preamble: "",
    disclaimer: "",
    parts: Object.fromEntries(
      PART_IDS.map((id) => [
        id,
        { body: PLACEHOLDER_BODY, tags: [] as string[] },
      ]),
    ) as DoctorContentPublishBody["parts"],
  };
}
