// HEIC を JPEG に変換するための関数
export async function heicToJpegFile(
  file: File,
  quality = 0.92,
): Promise<File> {
  const { default: heic2any } = await import("heic2any"); // heic2any を動的 import

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  const baseName = file.name.replace(/\.(heic|heif)$/i, "");
  const safeName = `${baseName || "photo"}.jpg`;

  return new File([blob], safeName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
