// 日本語で機能について説明してください。説明はできるだけ簡潔にしてください。 
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
        <p>
          本ページは MVP 向けのプレースホルダです。公開前に必ず法務レビューを行い、正式な文書に差し替えてください。
        </p>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">1. 取得する情報</h2>
          <p>
            診断機能において、ユーザーがアップロードした画像データが端末内で処理される場合があります。一部機能では、ユーザーの同意に基づき第三者サービス（例:
            OpenAI）へ画像が送信されることがあります。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">2. 利用目的</h2>
          <p>
            取得した情報は、本サービスの提供・品質改善・お問い合わせ対応のために利用します。
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-foreground font-medium">3. 第三者提供</h2>
          <p>
            法令に基づく場合を除き、本人の同意なく第三者に個人データを提供しません。外部サービスを利用する場合は、その利用規約およびプライバシーポリシーに従います。
          </p>
        </section>
      </div>
    </main>
  );
}
