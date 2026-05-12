import "server-only";

import sharp from "sharp";

// OpenAI Images API（特に gpt-image-1 edit）は入力画像のモード（色空間・チャンネル数・
// ビット深度・palette/ICC profile）を厳しくチェックし、グレースケール・16bit・CMYK・
// palette PNG・EXIF Orientation 残存などで "invalid_image_file" を返す事例がある。
//
// このため、サーバーで一度クリーンな sRGB 8bit RGB JPEG（1024×1024）に正規化してから送る。
// JPEG を選択する理由:
//   - 常に 8bit / palette なし / alpha なし（OpenAI の検査を通りやすい）
//   - 画像 API の互換性が PNG より高く、再現エラーが少ない
//   - gpt-image-1 edit は jpg/png/webp すべて受け付ける（公式 SDK 6.37 の型定義で確認）
//
// 4MB 制限・正方形要求にも 1024×1024 + JPEG quality 92 で安全に収まる。

export type NormalizedImage = {
  buffer: Buffer;
  mime: "image/jpeg";
  width: number;
  height: number;
};

export class ImageNormalizationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ImageNormalizationError";
  }
}

const TARGET_SIZE = 1024;

export async function normalizeForOpenAi(
  input: Buffer,
): Promise<NormalizedImage> {
  if (!Buffer.isBuffer(input) || input.byteLength === 0) {
    throw new ImageNormalizationError("空または不正な画像バッファです。");
  }

  // 1) まず metadata だけ取り出して、健全性チェック + dev ログ
  let inputMeta: sharp.Metadata;
  try {
    inputMeta = await sharp(input, { failOn: "none" }).metadata();
  } catch (e) {
    throw new ImageNormalizationError(
      "画像をデコードできませんでした。",
      { cause: e },
    );
  }

  if (!inputMeta.width || !inputMeta.height) {
    throw new ImageNormalizationError(
      "画像の寸法を取得できませんでした。別の写真でお試しください。",
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[normalize] input format=${inputMeta.format} size=${inputMeta.width}x${inputMeta.height} ` +
        `channels=${inputMeta.channels} depth=${inputMeta.depth} space=${inputMeta.space} ` +
        `hasAlpha=${inputMeta.hasAlpha} orientation=${inputMeta.orientation}`,
    );
  }

  // 2) 正規化パイプライン:
  //    - rotate(): EXIF Orientation を実ピクセルに反映してから resize
  //    - resize cover: アスペクト維持で正方形にクロップ
  //    - flatten: alpha があれば白背景に合成して必ず除去（removeAlpha だけだと
  //      grayscale+alpha → grayscale のまま残るので不可）
  //    - toColorspace("srgb"): grayscale/CMYK/16bit を 8bit sRGB（3ch）に正規化
  //    - keepExif/keepIccProfile を呼ばない（既定で metadata は剥がれる）
  //    - jpeg(): 8bit / no-alpha / mozjpeg で最も互換性の高い出力
  let outBuffer: Buffer;
  try {
    outBuffer = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(TARGET_SIZE, TARGET_SIZE, { fit: "cover", position: "centre" })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .toColorspace("srgb")
      .jpeg({
        quality: 92,
        chromaSubsampling: "4:4:4",
        mozjpeg: true,
        progressive: false,
      })
      .toBuffer();
  } catch (e) {
    throw new ImageNormalizationError(
      "画像の正規化処理に失敗しました。別の写真でお試しください。",
      { cause: e },
    );
  }

  // 3) 出力 metadata を検証（壊れた出力で OpenAI に投げないため）
  const outputMeta = await sharp(outBuffer).metadata();

  if (
    outputMeta.format !== "jpeg" ||
    outputMeta.width !== TARGET_SIZE ||
    outputMeta.height !== TARGET_SIZE
  ) {
    throw new ImageNormalizationError(
      `正規化後の画像が想定形式と異なります: format=${outputMeta.format} size=${outputMeta.width}x${outputMeta.height}`,
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[normalize] output format=${outputMeta.format} size=${outputMeta.width}x${outputMeta.height} ` +
        `channels=${outputMeta.channels} depth=${outputMeta.depth} space=${outputMeta.space} ` +
        `bytes=${outBuffer.byteLength}`,
    );
  }

  return {
    buffer: outBuffer,
    mime: "image/jpeg",
    width: TARGET_SIZE,
    height: TARGET_SIZE,
  };
}
