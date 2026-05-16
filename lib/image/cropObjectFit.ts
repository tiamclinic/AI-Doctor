/** PhotoCropper の 4:5 クロップ枠（width / height） */
export const ASPECT_FOR_TESTS = 4 / 5;

export type CropObjectFit = "contain" | "horizontal-cover" | "vertical-cover";

/**
 * クロップ枠（4:5）をできるだけ満たす objectFit。
 * 横長（16:9 等）は高さ基準で枠いっぱいにし、内側に余白枠が出ないようにする。
 * 縦長は幅基準。いずれもアスペクト比は維持（横潰れは globals の max-width 解除で防止）。
 */
export function pickCropObjectFit(
  naturalWidth: number,
  naturalHeight: number,
  cropAspect: number = ASPECT_FOR_TESTS,
): CropObjectFit {
  if (naturalWidth <= 0 || naturalHeight <= 0) return "vertical-cover";
  const mediaAspect = naturalWidth / naturalHeight;
  return mediaAspect >= cropAspect ? "vertical-cover" : "horizontal-cover";
}
