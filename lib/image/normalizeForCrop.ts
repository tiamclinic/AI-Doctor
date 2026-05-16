/**
 * EXIF Orientation をピクセルに焼き込んだ data URL を返す。
 * naturalWidth/Height と表示アスペクトを一致させ、クロッパーの歪みを防ぐ。
 */
export async function normalizeImageForCrop(
  source: Blob | File | string,
): Promise<string> {
  const blob =
    typeof source === "string"
      ? await (await fetch(source)).blob()
      : source;

  const bitmap = await createImageBitmap(blob, {
    imageOrientation: "from-image",
  });

  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D コンテキストを取得できませんでした");
    }
    ctx.drawImage(bitmap, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    bitmap.close();
  }
}
