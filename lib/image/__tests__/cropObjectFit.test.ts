import { describe, expect, it } from "vitest";

import { ASPECT_FOR_TESTS, pickCropObjectFit } from "@/lib/image/cropObjectFit";

describe("pickCropObjectFit", () => {
  const aspect = ASPECT_FOR_TESTS;

  it("16:9 など横長は vertical-cover（高さを満たし内側余白枠を出さない）", () => {
    expect(pickCropObjectFit(1920, 1080, aspect)).toBe("vertical-cover");
  });

  it("クロップ枠より縦長なら horizontal-cover（幅基準・比率維持）", () => {
    expect(pickCropObjectFit(600, 1000, aspect)).toBe("horizontal-cover");
  });

  it("不正な寸法は vertical-cover にフォールバック", () => {
    expect(pickCropObjectFit(0, 1080, aspect)).toBe("vertical-cover");
  });
});
