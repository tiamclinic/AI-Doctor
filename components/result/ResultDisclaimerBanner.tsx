import { RESULT_PREAMBLE } from "@/lib/result/disclaimer";

export function ResultDisclaimerBanner() {
  return (
    <p className="border-tiam-gold/25 bg-tiam-gold/8 text-tiam-primary mx-auto mt-4 max-w-2xl rounded-lg border px-4 py-2.5 text-center text-[10px] leading-relaxed sm:text-xs">
      {RESULT_PREAMBLE}
    </p>
  );
}
