import { RESULT_DISCLAIMER } from "@/lib/result/disclaimer";

export function PrintFooter() {
  return (
    <footer className="print-report-footer hidden print:block" aria-hidden>
      <p className="print-report-footer-disclaimer">{RESULT_DISCLAIMER}</p>
      <p className="print-report-footer-page">
        <span className="print-page-counter" />
      </p>
    </footer>
  );
}
