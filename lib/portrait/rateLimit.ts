import "server-only";

// MVP 用の超軽量レート制限。プロセスメモリの Map で IP ごとのカウンタを保持する。
// マルチインスタンス本番環境では Cloud Firestore / Upstash 等の共有ストアへ置き換える前提。

type Bucket = {
  count: number;
  resetAt: number; // ms epoch
};

const buckets = new Map<string, Bucket>();

const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_LIMIT_PER_DAY = process.env.NODE_ENV === "production" ? 5 : 30;

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkPortraitRateLimit(
  ip: string,
  limit = DEFAULT_LIMIT_PER_DAY,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + DAY_MS });
    return { ok: true, remaining: Math.max(0, limit - 1) };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: Math.max(0, limit - bucket.count) };
}

// テスト・運用デバッグ用にクリアできるようにしておく
export function _resetPortraitRateLimit(): void {
  buckets.clear();
}
