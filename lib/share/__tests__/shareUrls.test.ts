import { describe, expect, it } from "vitest";

import {
  buildDefaultShareTweetText,
  buildLineShareUrl,
  buildResultPageUrl,
  buildXIntentUrl,
} from "../shareUrls";

describe("shareUrls", () => {
  it("buildResultPageUrl strips trailing slash on base", () => {
    expect(buildResultPageUrl("https://example.com/", "abc123")).toBe(
      "https://example.com/result/abc123",
    );
    expect(buildResultPageUrl("https://example.com", "abc123")).toBe(
      "https://example.com/result/abc123",
    );
  });

  it("buildXIntentUrl encodes text, url, and hashtags", () => {
    const u = buildXIntentUrl({
      pageUrl: "https://example.com/result/x",
      tweetText: "hello 世界",
      hashtags: ["A", "B"],
    });
    expect(u.startsWith("https://twitter.com/intent/tweet?")).toBe(true);
    expect(u).toContain("%E4%B8%96%E7%95%8C"); // 世界
    expect(u).toContain(encodeURIComponent("https://example.com/result/x"));
    expect(u).toContain("hashtags=A%2CB");
  });

  it("buildLineShareUrl encodes url param", () => {
    expect(buildLineShareUrl("https://a.com/x?y=1")).toBe(
      "https://social-plugins.line.me/lineit/share?url=" +
        encodeURIComponent("https://a.com/x?y=1"),
    );
  });

  it("buildDefaultShareTweetText includes score", () => {
    expect(buildDefaultShareTweetText(86.4)).toContain("86.4");
  });
});
