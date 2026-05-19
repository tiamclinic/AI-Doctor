import {
  formatPrintDateTime,
  getClinicDisplayName,
  PRINT_REPORT_TITLE,
} from "@/lib/result/print";

type PrintHeaderProps = {
  resultId: string;
  /** 未指定時はクライアント描画時点の日時（SSR では固定しない） */
  printedAt?: Date;
};

export function PrintHeader({ resultId, printedAt }: PrintHeaderProps) {
  const clinicName = getClinicDisplayName();
  const when = printedAt ?? new Date();

  return (
    <header
      className="print-report-header hidden print:block"
      aria-hidden
    >
      <p className="print-report-header-title font-heading">{PRINT_REPORT_TITLE}</p>
      <p className="print-report-header-clinic">{clinicName}</p>
      <p className="print-report-header-meta">
        <span>結果 ID: {resultId}</span>
        <span className="print-report-header-sep" aria-hidden>
          ·
        </span>
        <span>{formatPrintDateTime(when)}</span>
      </p>
    </header>
  );
}
