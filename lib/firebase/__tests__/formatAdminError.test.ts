import { describe, expect, it } from "vitest";

import { formatFirebaseAdminErrorMessage } from "@/lib/firebase/formatAdminError";

describe("formatFirebaseAdminErrorMessage", () => {
  it("maps invalid_rapt to reauth guidance", () => {
    const msg = formatFirebaseAdminErrorMessage(
      new Error(
        '2 UNKNOWN: Getting metadata from plugin failed with error: {"error":"invalid_grant","error_subtype":"invalid_rapt"}',
      ),
      "fallback",
    );
    expect(msg).toContain("gcloud auth application-default login");
    expect(msg).not.toContain("UNKNOWN");
  });
});
