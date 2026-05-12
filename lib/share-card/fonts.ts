// Google Fonts API から「描画に必要な文字」だけを含むサブセットフォントを取得する。
// Satori は woff2 を扱えないため、TTF/OTF が返るような User-Agent を指定する。
// 取得した ArrayBuffer は per-process でメモリキャッシュしておく。

type LoadFontParams = {
  family: string; // 例: "Noto Sans JP"
  weight: number;
  text: string;
};

// 古いブラウザを名乗ることで woff2 ではなく ttf/otf を返してくれる
const LEGACY_UA =
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36";

const cache = new Map<string, ArrayBuffer>();

const dedupeText = (text: string): string =>
  Array.from(new Set(text.split(""))).join("");

export async function loadGoogleFont({
  family,
  weight,
  text,
}: LoadFontParams): Promise<ArrayBuffer> {
  const subset = dedupeText(text).trim();
  if (!subset) {
    throw new Error("loadGoogleFont: text is empty");
  }
  const cacheKey = `${family}::${weight}::${subset}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const familyParam = family.replace(/ /g, "+");
  const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&text=${encodeURIComponent(
    subset,
  )}&display=swap`;

  const css = await fetch(cssUrl, {
    headers: { "User-Agent": LEGACY_UA },
  }).then((r) => {
    if (!r.ok) throw new Error(`Google Fonts CSS fetch failed: ${r.status}`);
    return r.text();
  });

  // ttf / otf / woff のいずれかが含まれた src url を抽出する。
  // Satori は woff2 を扱えないので、woff2 だけが返ってきた場合は弾く。
  // CSS には複数の @font-face / src 行が含まれ得るため、グローバル検索で総当りする。
  const srcRegex =
    /src:\s*url\((https?:[^)]+)\)(?:\s*format\(['"]([^'"]+)['"]\))?/g;
  let fontUrl: string | null = null;
  let m: RegExpExecArray | null;
  // フォーマット未指定（= 旧 UA で TTF が返るケース）も許容しつつ、
  // 明示的に woff2 と書かれた URL は除外する。
  while ((m = srcRegex.exec(css)) !== null) {
    const url = m[1];
    const format = m[2]?.toLowerCase();
    if (!format || ["truetype", "opentype", "woff"].includes(format)) {
      fontUrl = url;
      break;
    }
  }
  if (!fontUrl) {
    throw new Error(
      `Google Fonts CSS did not contain a usable ttf/otf/woff url (got: ${css
        .slice(0, 200)
        .replace(/\s+/g, " ")})`,
    );
  }

  const buf = await fetch(fontUrl).then((r) => {
    if (!r.ok) throw new Error(`Google Fonts file fetch failed: ${r.status}`);
    return r.arrayBuffer();
  });

  cache.set(cacheKey, buf);
  return buf;
}
