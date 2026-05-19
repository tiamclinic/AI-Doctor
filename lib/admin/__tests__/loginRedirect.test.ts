import { describe, expect, it } from "vitest";

import {
  DEFAULT_POST_LOGIN_PATH,
  isAllowedLoginRedirectPath,
  resolvePostLoginPath,
} from "@/lib/admin/loginRedirect";

describe("loginRedirect", () => {
  it("allows clinic and admin paths", () => {
    expect(isAllowedLoginRedirectPath("/")).toBe(true);
    expect(isAllowedLoginRedirectPath("/diagnose")).toBe(true);
    expect(isAllowedLoginRedirectPath("/result/abc123")).toBe(true);
    expect(isAllowedLoginRedirectPath("/admin/diagnoses/abc")).toBe(true);
    expect(isAllowedLoginRedirectPath("/admin/doctor-content")).toBe(true);
    expect(isAllowedLoginRedirectPath("/staff")).toBe(true);
  });

  it("rejects open redirects and login loop", () => {
    expect(isAllowedLoginRedirectPath("//evil.com")).toBe(false);
    expect(isAllowedLoginRedirectPath("https://evil.com")).toBe(false);
    expect(isAllowedLoginRedirectPath("/admin/login")).toBe(false);
    expect(isAllowedLoginRedirectPath("/../etc/passwd")).toBe(false);
    expect(isAllowedLoginRedirectPath("/terms")).toBe(false);
  });

  it("resolvePostLoginPath uses next when valid", () => {
    expect(resolvePostLoginPath("/diagnose")).toBe("/diagnose");
    expect(resolvePostLoginPath("/admin/doctor-content")).toBe(
      "/admin/doctor-content",
    );
  });

  it("resolvePostLoginPath falls back to home", () => {
    expect(resolvePostLoginPath(null)).toBe(DEFAULT_POST_LOGIN_PATH);
    expect(resolvePostLoginPath("https://evil.com")).toBe(DEFAULT_POST_LOGIN_PATH);
  });
});
