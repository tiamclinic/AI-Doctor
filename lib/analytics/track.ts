import type { Analytics } from "firebase/analytics";

import { getFirebaseWebConfig } from "@/lib/analytics/config";

let analyticsReady: Promise<Analytics | null> | null = null;

/**
 * Firebase Analytics インスタンスを 1 度だけ初期化する。
 * 未設定・非対応ブラウザでは null。
 */
export async function getOrCreateAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsReady) return analyticsReady;

  const config = getFirebaseWebConfig();
  if (!config) {
    analyticsReady = Promise.resolve(null);
    return analyticsReady;
  }

  analyticsReady = (async () => {
    const [{ initializeApp, getApps, getApp }, { getAnalytics, isSupported }] =
      await Promise.all([import("firebase/app"), import("firebase/analytics")]);
    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(config);
      if (!(await isSupported())) return null;
      return getAnalytics(app);
    } catch {
      return null;
    }
  })();

  return analyticsReady;
}

/** 先読み（アプリ表示直後に呼ぶと初回イベントが取りこぼしにくい） */
export function prefetchAnalytics(): void {
  if (typeof window === "undefined") return;
  void getOrCreateAnalytics();
}

/**
 * GA4 カスタムイベント。パラメータは文字列・数値・真偽のみ（未対応型は送らない）。
 * T-10 チケットで定義した主要イベント名: upload, face_detected, diagnosis_completed,
 * share_clicked, portrait_generated
 */
export async function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  const analytics = await getOrCreateAnalytics();
  if (!analytics) return;
  const { logEvent } = await import("firebase/analytics");
  try {
    logEvent(analytics, eventName, params);
  } catch {
    // 計測失敗はユーザー体験に影響させない
  }
}
