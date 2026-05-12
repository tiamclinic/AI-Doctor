// これは利用規約のページです。利用規約はできるだけ簡潔にしてください。 
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 | TIAM Beauty AI",
  description: "TIAM Beauty AI 診断サービスの利用規約（ドラフト）",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-tiam-primary mb-8 text-2xl tracking-tight sm:text-3xl">
        利用規約（ドラフト）
      </h1>
      <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
        <p>
          本ページは MVP 向けのプレースホルダです。公開前に必ず法務レビューを行い、正式な条項に差し替えてください。
        </p>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第1条（適用）</h2>
          <p>
            本規約は、TIAM Beauty AI（以下「本サービス」）の利用条件を定めるものです。利用者は本規約に同意のうえ本サービスを利用するものとします。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第2条（サービス内容）</h2>
          <p>
            本サービスは、写真を用いた美容バランスの傾向に関する参考情報を提供するものであり、医療診断・治療効果の保証を行うものではありません。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第3条（禁止事項）</h2>
          <p>
            法令に違反する行為、第三者の権利を侵害する行為、本サービスの運営を妨害する行為を禁止します。
          </p>
        </section>
      </div>
    </main>
  );
}
