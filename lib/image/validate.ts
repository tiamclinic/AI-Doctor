export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function extensionKind(name: string): "heic" | "jpeg" | "png" | "webp" | "other" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "heic";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "jpeg";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return "other";
}

export function isHeicLike(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime === "image/heic" || mime === "image/heif") return true;
  return extensionKind(file.name) === "heic";
}

export function validateImageFile(
  file: File,
  maxBytes: number = MAX_IMAGE_SIZE_BYTES,
):
  | { ok: true }
  | { ok: false; message: string } {
  if (file.size > maxBytes) {
    return {
      ok: false,
      message: "ファイルサイズは10MB以下にしてください。",
    };
  }

  const mime = file.type.toLowerCase();
  const ext = extensionKind(file.name);

  if (mime && ALLOWED_MIMES.has(mime)) {
    return { ok: true };
  }

  if (ext === "heic") {
    return { ok: true };
  }

  if (
    ext === "jpeg" ||
    ext === "png" ||
    ext === "webp"
  ) {
    if (!mime || mime === "application/octet-stream") {
      return { ok: true };
    }
  }

  return {
    ok: false,
    message: "対応形式は JPEG / PNG / WebP / HEIC（HEIF）です。",
  };
}
