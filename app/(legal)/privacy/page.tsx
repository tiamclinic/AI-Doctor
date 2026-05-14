import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | TIAM Beauty AI",
  description: "TIAM Beauty AI 診断サービスのプライバシーポリシー（ドラフト）",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-tiam-primary mb-8 text-2xl tracking-tight sm:text-3xl">
        プライバシーポリシー（ドラフト）
      </h1>
      <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-foreground">
          本ページは MVP 向けのドラフトです。公開前に必ず法務レビューを行い、正式な文書に差し替えてください。
        </p>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">1. 取得する情報</h2>
          <p>
            診断機能において、ユーザーがアップロードした画像は、原則としてブラウザ内（端末上）で解析されます。診断テキスト生成のため、
            <strong className="text-foreground">数値化されたスコア情報のみ</strong>
            がサーバー経由で外部 AI（OpenAI）に送信される場合があります。
          </p>
          <p>
            「理想顔イメージ」生成に同意した場合に限り、
            <strong className="text-foreground">画像データ</strong>
            が OpenAI に送信されます。未同意の場合、当該送信は行いません。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">2. 利用目的</h2>
          <p>
            取得した情報は、本サービスの提供・品質改善・不正利用の防止・お問い合わせ対応のために利用します。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">3. 第三者提供</h2>
          <p>
            法令に基づく場合を除き、本人の同意なく個人データを第三者に提供しません。OpenAI
            等の外部サービスを利用する場合は、当該事業者のプライバシーポリシーおよび利用規約に従います。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">4. Cookie・解析ツール（任意）</h2>
          <p>
            運営者が Firebase Analytics 等を有効にした場合、利用状況の把握のために Cookie や類似の技術を用いることがあります。
            本番環境で有効化する際は、利用するツールに応じた表示（オプトアウト方法の案内等）を法務確認のうえで追加してください。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">5. 保管期間</h2>
          <p>
            MVP では診断結果のサーバー側永続化は行いません（ブラウザのセッション内に保持）。ログ等の保管期間はインフラ設定に従い、法務確認のうえで別途定めます。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">6. お問い合わせ</h2>
          <p>
            個人情報の取扱いに関するお問い合わせ窓口は、法務確認後にここに連絡先（メールアドレス等）を記載してください。
          </p>
        </section>
      </div>
    </main>
  );
}
