// 同意状態を管理するためのキー このキーを使って同意状態を管理する
const STORAGE_KEY = "tiam-consent";

export const CONSENT_CHANGED_EVENT = "tiam-consent-changed";
// 同意状態を管理するための型
export type StoredConsent = {
  termsAccepted: boolean; // 規約に同意したかどうか
  openAiPortraitAccepted: boolean; // OpenAI に写真を送信したかどうか
  acceptedAt?: string; // 同意した日時
};
// 同意状態が変更されたことを通知するための関数
export function notifyConsentChanged(): void {
  if (typeof window === "undefined") return; // ブラウザが存在しない場合は何もしない
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT)); // 同意状態が変更されたことを通知
}
// 同意状態を管理するための関数
export function subscribeConsent(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}; // ブラウザが存在しない場合は何もしない
  }
  const handler = () => onStoreChange(); // 同意状態が変更されたことを通知
  window.addEventListener(CONSENT_CHANGED_EVENT, handler); // 同意状態が変更されたことを通知
  window.addEventListener("storage", handler); // 同意状態が変更されたことを通知
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, handler); // 同意状態が変更されたことを通知
    window.removeEventListener("storage", handler); // 同意状態が変更されたことを通知
  };
}

// 同意状態を読み込むための関数
export function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null; // ブラウザが存在しない場合は何もしない
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null; // 同意状態が存在しない場合は何もしない
    const parsed = JSON.parse(raw) as StoredConsent;
    if (typeof parsed.termsAccepted !== "boolean") return null; // 同意状態が存在しない場合は何もしない
    return parsed;
  } catch {
    return null; // 同意状態が存在しない場合は何もしない
  }
}

// 規約に同意しているかどうかを確認するための関数
export function hasTermsConsent(): boolean {
  return readConsent()?.termsAccepted === true;
}

// OpenAI への写真送信に同意しているかどうかを確認するための関数
export function hasOpenAiPortraitConsent(): boolean {
  return readConsent()?.openAiPortraitAccepted === true;
}

// 同意状態を確認するための関数
export function consentSnapshot(): boolean {
  return hasTermsConsent();
}

// 同意状態を確認するための関数
export function consentServerSnapshot(): boolean {
  return false; // 同意状態が存在しない場合は何もしない
}
