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
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-foreground">
          本ページは MVP 向けのドラフトです。公開前に必ず法務レビューを行い、正式な条項に差し替えてください。
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
            本サービスは、写真を用いた美容バランスの傾向に関する参考情報を提供するものであり、医療診断・疾病の告知・効果の保証を行うものではありません。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第3条（禁止事項）</h2>
          <p>
            法令に違反する行為、第三者の権利を侵害する行為、本サービスの運営を妨害する行為、過度な負荷をかける自動化アクセスを禁止します。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第4条（知的財産）</h2>
          <p>
            本サービスに関するプログラム、デザイン、商標、ドキュメント等に関する権利は運営者または正当な権利者に帰属します。利用者は、運営者の事前の書面同意なく複製・改変・頒布してはなりません。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第5条（免責）</h2>
          <p>
            本サービスの利用により生じた損害について、運営者に故意または重過失がある場合を除き、運営者は責任を負わないものとします。参考情報の内容は最新性・完全性を保証しません。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第6条（規約の変更）</h2>
          <p>
            運営者は、必要に応じて本規約を変更できるものとします。変更後に本サービスを利用した場合、変更に同意したものとみなします。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">第7条（準拠法・管轄）</h2>
          <p>
            本規約は日本法に準拠し、本サービスに関する紛争については、運営者の所在地を管轄する裁判所を専属的合意管轄とします（ドラフト：法務確認の上で確定）。
          </p>
        </section>
      </div>
    </main>
  );
}
