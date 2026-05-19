/** 印刷レポートのタイトル（各ページヘッダ） */
export const PRINT_REPORT_TITLE = "TIAM 美容バランスレポート";

/** 印刷ヘッダに表示するクリニック名 */
export function getClinicDisplayName(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CLINIC_NAME?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "TIAM Beauty Lab";
}

/** 印刷ヘッダ用の日時表示 */
export function formatPrintDateTime(date: Date): string {
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
