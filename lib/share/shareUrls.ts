/** SNS 共有用の Web Intent URL を組み立てる（クライアント／サーバー両方で利用可） */

/** X（旧 Twitter）の投稿に付ける既定ハッシュタグ（# は付けない。intent の hashtags 用） */
export const SHARE_HASHTAGS = ["TIAMビューティー診断", "TIAMAI"] as const;

/**
 * 結果ページの絶対 URL（末尾スラッシュなしの base + `/result/{id}`）
 */
export function buildResultPageUrl(
  baseUrlWithoutTrailingSlash: string,
  resultId: string,
): string {
  const base = baseUrlWithoutTrailingSlash.replace(/\/+$/, "");
  return `${base}/result/${resultId}`;
}

/**
 * X の Web Intent URL（画像は URL からは添付できないため、文言 + ページ URL + ハッシュタグ）
 */
export function buildXIntentUrl(options: {
  pageUrl: string;
  /** ツイート本文（URL は別パラメータで付与されるため、本文に URL を重ねない方が見やすい） */
  tweetText: string;
  /** 省略時は SHARE_HASHTAGS */
  hashtags?: readonly string[];
}): string {
  const hashtags = options.hashtags ?? SHARE_HASHTAGS;
  const params = new URLSearchParams();
  params.set("text", options.tweetText);
  params.set("url", options.pageUrl);
  params.set("hashtags", hashtags.join(","));
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * LINE の「LINE で送る」Web プラグイン URL
 */
export function buildLineShareUrl(pageUrl: string): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`;
}

/**
 * 既定のシェア用短文（景表法・薬機法を意識し、断定・医療表現を避ける）
 */
export function buildDefaultShareTweetText(totalScore: number): string {
  return `TIAM の美容バランス指数は ${totalScore} でした。参考の美容バランス傾向です。`;
}
