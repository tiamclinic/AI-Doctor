# 同意・プライバシーフロー

プロダクトの土台です。**写真がブラウザの外に出るのは「ユーザーが OpenAI への送信に明示同意した瞬間」だけ**、という設計を成り立たせる仕組みです。

## 同意の 2 階層

| レベル | 何に対する同意 | 取得タイミング | 保持先 |
| --- | --- | --- | --- |
| Level 1 | 利用規約 + プライバシーポリシー | ランディング初回 | `sessionStorage.tiam-consent.termsAccepted` |
| Level 2 | OpenAI への写真送信（理想顔生成） | 「AI 理想顔を生成」ボタン押下時 | `sessionStorage.tiam-consent.openAiPortraitAccepted` |

Level 1 を取得していなければ写真アップロードに進めません（`PhotoUploader.goNext` で `hasTermsConsent()` を確認）。
Level 2 は **理想顔機能を使うときだけ** 必要。診断テキストやシェアカードには不要。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`lib/consent.ts`](../../lib/consent.ts) | sessionStorage 読み書き / イベント購読 |
| [`components/common/LandingCta.tsx`](../../components/common/LandingCta.tsx) | Level 1 同意取得 |
| [`components/common/ConsentDialog.tsx`](../../components/common/ConsentDialog.tsx) | Level 2 同意取得（汎用ダイアログ） |
| [`components/DiagnoseEntry.tsx`](../../components/DiagnoseEntry.tsx) | 同意状態に応じて CTA / PhotoUploader を出し分け |
| [`app/(legal)/terms/page.tsx`](../../app/(legal)/terms/page.tsx) | 利用規約本文 |
| [`app/(legal)/privacy/page.tsx`](../../app/(legal)/privacy/page.tsx) | プライバシーポリシー本文 |

## sessionStorage を選んだ理由

- **localStorage を使わない**: タブを閉じれば消えるべき情報。長期保持はプライバシー上望ましくない
- **Cookie を使わない**: サーバーへ送る必要がない（クライアント完結）。Cookie バナーの煩雑さも避けられる
- **idle 状態でも誤って残らない**: タブを閉じれば確実にクリアされる

## イベント購読

[`subscribeConsent(onStoreChange)`](../../lib/consent.ts) が以下を購読:

- `window.storage` イベント（別タブで変更されたとき）
- カスタムイベント `"tiam-consent-changed"`（同タブ内の変更）

`useSyncExternalStore(subscribeConsent, consentSnapshot, consentServerSnapshot)` で React に統合し、SSR では常に `false` を返す（[`consentServerSnapshot`](../../lib/consent.ts)）。

## 取り消しフロー

ランディングで「同意をやり直して最初から」リンクを表示しており、押下で:

1. `clearPhoto()` でストアを全クリア
2. `sessionStorage.removeItem("tiam-consent")`
3. `notifyConsentChanged()` で UI に反映

## サーバー側のガード

`/api/generate-portrait` は **`consent: true` を Zod で必須化** しているため、フロントが壊れても写真を OpenAI に送ることはできません。

```ts
consent: z.literal(true, {
  message: "OpenAI への写真送信に同意していません。",
}),
```

`consent` を満たさない場合は 400 `consent_required` を即座に返す。

## 監査ポイント

新規 PR で以下のいずれかが追加されていたら、要件レビューを推奨:

- 写真または個人を特定できるデータをサーバーへ送る fetch 呼び出し
- `sessionStorage` 以外（localStorage / Cookie / IndexedDB）に同意状態を書き込むコード
- `consent` チェックを通らないコードパス
- サーバー側で写真を保存・ログ出力するコード（特に `console.log` で base64 を出力していないか）

## 関連

- データフロー全体: [architecture/data-flow](../architecture/data-flow.md)
- 法令配慮: [guides/legal-compliance](../guides/legal-compliance.md)
