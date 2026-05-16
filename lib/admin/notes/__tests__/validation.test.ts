import { describe, expect, it } from "vitest";

import { createEmptyDoctorNotePublishBody } from "@/lib/admin/notes/emptyDraft";
import { validateDoctorNoteDraft } from "@/lib/admin/notes/validation";

describe("validateDoctorNoteDraft", () => {
  it("空の下書きは保存のみ可・公開は不可", () => {
    const draft = createEmptyDoctorNotePublishBody();
    const v = validateDoctorNoteDraft(draft);
    expect(v.canSaveDraft).toBe(true);
    expect(v.canPublish).toBe(false);
  });

  it("総評に内容があれば公開可", () => {
    const draft = createEmptyDoctorNotePublishBody();
    draft.report = {
      ...draft.report!,
      overallComment: "カウンセリング所見です。",
    };
    const v = validateDoctorNoteDraft(draft);
    expect(v.canPublish).toBe(true);
  });
});
