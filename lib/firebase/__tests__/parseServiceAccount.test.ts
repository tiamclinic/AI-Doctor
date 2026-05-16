import { describe, expect, it } from "vitest";

import { parseServiceAccountFromEnv } from "@/lib/firebase/parseServiceAccount";

const VALID = JSON.stringify({
  type: "service_account",
  project_id: "demo",
  client_email: "demo@demo.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
});

describe("parseServiceAccountFromEnv", () => {
  it("有効な JSON をパースする", () => {
    const parsed = parseServiceAccountFromEnv(VALID);
    expect(parsed?.client_email).toBe("demo@demo.iam.gserviceaccount.com");
  });

  it("プレースホルダーは null", () => {
    expect(parseServiceAccountFromEnv('{"type":"service_account",...}')).toBeNull();
  });

  it("不正 JSON は null", () => {
    expect(parseServiceAccountFromEnv("{not json")).toBeNull();
  });
});
