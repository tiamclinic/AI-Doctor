"use client";

import { Sparkles } from "lucide-react";

import type { DiagnoseResponse } from "@/lib/diagnosis/types";

export function DiagnosisText({ result }: { result: DiagnoseResponse }) {
  return (
    <article className="border-border/60 bg-card flex flex-col gap-6 rounded-xl border p-6 shadow-sm">
      <header className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide">
        <Sparkles className="text-tiam-gold size-3.5" />
        TIAM AI 診断レポート
      </header>

      <section>
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
          総評
        </h3>
        <p className="text-foreground mt-2 text-sm leading-relaxed">
          {result.overallComment}
        </p>
      </section>

      <Section title="あなたの強み" items={result.strengths} />
      <Section title="注意点" items={result.improvements} />
      <Section title="推奨ケア" items={result.recommendedCare} />

      <footer className="border-border/60 border-t pt-4">
        <p className="font-heading text-tiam-primary text-sm leading-relaxed">
          {result.tiamMessage}
        </p>
        <p className="text-muted-foreground mt-2 text-[10px] tracking-wide">
          ※ 美容バランスの傾向を読み解く参考情報であり、医療診断ではありません。
        </p>
      </footer>
    </article>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
        {title}
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item, i) => (
          <li
            key={`${title}-${i}`}
            className="text-foreground border-tiam-gold/60 border-l-2 pl-3 text-sm leading-relaxed"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
