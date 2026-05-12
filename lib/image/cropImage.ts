// react-easy-crop の onCropComplete から得られる pixelCrop（ピクセル単位の矩形）と
// 元画像 dataUrl からクロップ後の Blob + dataUrl を作る。
// この時点では「ユーザーが選んだ構図」を確定して保存することが目的なので、サーバー側の
// 正規化（sharp）に頼らず、ここで一度 JPEG として書き出しておく。

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CroppedImage = {
  file: File;
  dataUrl: string;
};

const loadHtmlImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像を読み込めませんでした"));
    img.src = src;
  });

const MAX_LONG_SIDE = 1600; // 解析にも生成にも十分な解像度

export async function cropToImageFile(
  sourceDataUrl: string,
  pixelCrop: PixelCrop,
  fileName: string,
  mime: "image/jpeg" | "image/png" = "image/jpeg",
): Promise<CroppedImage> {
  const image = await loadHtmlImage(sourceDataUrl);

  // 長辺が大きすぎると base64 サイズで API リクエストが太るので 1600px 上限に抑える
  const longSide = Math.max(pixelCrop.width, pixelCrop.height);
  const scale = longSide > MAX_LONG_SIDE ? MAX_LONG_SIDE / longSide : 1;
  const outW = Math.round(pixelCrop.width * scale);
  const outH = Math.round(pixelCrop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できませんでした");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("クロップ画像の出力に失敗しました"))),
      mime,
      0.92,
    );
  });

  const ext = mime === "image/png" ? "png" : "jpg";
  const outName = fileName.replace(/\.[^.]+$/, "") + `-cropped.${ext}`;
  const file = new File([blob], outName, { type: mime, lastModified: Date.now() });
  const dataUrl = canvas.toDataURL(mime, 0.92);

  return { file, dataUrl };
}
