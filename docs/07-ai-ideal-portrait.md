# 07. AI 理想顔生成（gpt-image-1）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-07                                |
| 関連要件   | F-07                                |
| 依存       | T-03                                |
| 優先度     | 中                                  |
| 見積       | 3 日                                |
| 担当       | -                                   |
| ステータス | 完了（実生成テストはユーザーの OpenAI クレジットで実施） |

## 概要

ユーザーの顔写真とスコアを基に、OpenAI `gpt-image-1` で「黄金比に最適化された理想顔」を生成する。**写真が外部送信される最初のポイント**であり、明示的な同意を必須とする。

## ゴール / 受け入れ基準

- [x] `POST /api/generate-portrait` で 1024×1024 PNG（base64）を返す
- [x] 同意モーダルで OpenAI 送信に同意した場合のみ呼ばれる（UI ＋ サーバ二重ガード）
- [x] 60 秒で AbortController によりタイムアウトする（504 を返す）
- [x] `input_fidelity: "high"` と「identity を strict に保て」というプロンプトでアイデンティティを維持
- [x] OpenAI API キーは `lib/openai/client.ts` の `server-only` 経由でサーバーにのみ残る
- [x] 生成失敗時は結果画面で他要素（スコア・診断文・シェアカード）に影響しない

## 設計メモ

### 配置（実装後）

```
app/api/generate-portrait/
  route.ts                 同意チェック / レート制限 / Images API 呼び出し
lib/openai/
  images.ts                gpt-image-1 images.edit ラッパー（input_fidelity: "high"）
lib/prompt/
  portraitPrompt.ts        スコア連動の英語プロンプト + identity 保持 + 安全文言
lib/portrait/
  types.ts                 Zod スキーマ（Request/Response/Error）
  rateLimit.ts             IP ベースのメモリ Map 簡易レート制限
  client.ts                クライアント fetch ヘルパ
components/
  IdealPortrait.tsx        結果画面に置く生成 UI（同意確認・ローディング・並べ比較）
```

### リクエスト

```ts
type PortraitRequest = {
  imageBase64: string;     // クライアントから送信
  scores: Record<MetricKey, number>;
  rawValues?: Record<MetricKey, number | number[]>;
  consent: boolean;        // OpenAI 送信同意（必須 true）
  gender?: "female" | "male" | "neutral";
};
```

### レスポンス

```ts
type PortraitResponse = {
  imageUrl: string;        // 生成画像（URL or base64）
  prompt: string;          // 使用プロンプトの要約（ログ用）
};
```

### プロンプト戦略

- 役割: 「TIAM 美容ビジュアルディレクター」
- 元写真の顔 → 黄金比に近づけた美しい顔の参考イメージを生成
- 指示の例:
  - 「縦三分割比をより 1:1:1 に近く」
  - 「鼻幅と口幅を 1:1.618 に整える」
  - 「肌・髪・衣装は元写真の雰囲気を保持」
- 「医療的な変形ではなくメイク／ヘア／ライティング調整による参考イメージである」と明記

### コスト管理

- 1 リクエスト = 数十円。MVP では失敗の自動リトライは行わない
- 同意なしリクエストは 400 で即返却
- IP 単位で 1 日 N 回まで（簡易レート制限）

### UX

- 結果画面では `<Suspense>` 的にスケルトン表示 → 生成完了で差し替え
- 「これはあくまで参考イメージです」キャプションを必ず表示

## TODO

- [x] `lib/openai/images.ts` で `images.edit` ラッパを実装（`gpt-image-1` + `input_fidelity: "high"`）
- [x] `lib/prompt/portraitPrompt.ts` を作成（プロンプトテンプレート + スコアの低い順 3 つにフォーカス）
- [x] `app/api/generate-portrait/route.ts` を作成（POST、`gpt-image-1`、AbortController 60s タイムアウト）
- [x] `consent: true` でないリクエストを 400 (`consent_required`) で弾く
- [x] IP ベースの簡易レート制限（メモリ Map・production 5 件/日、dev 30 件/日）
- [x] レスポンスを **base64** で返す（保存不要、SNS 拡散リスクを最小化）
- [x] 生成失敗時のフォールバック UI を結果画面に実装（エラーメッセージ + リトライ）
- [x] 「あくまで参考イメージ」のキャプションを結果画面に追加（医療的変形ではない旨を明記）
- [x] 同意モーダルに「写真が OpenAI に送信されます」を明記（既存 ConsentDialog で対応済み）
- [x] レスポンスタイムを計測してログに残す（client 側 `console.info`、server 側は durationMs を JSON で返却）
- [ ] 性別推定（簡易）または UI で選択させる → MVP では「identity を strict に保て」というプロンプトで吸収する方針

## 実装メモ（完了時）

- **モデル選定**: OpenAI Node SDK v6.37 が `gpt-image-1` の `images.edit` と `input_fidelity` を正式サポートしている事を確認。`input_fidelity: "high"` で顔のアイデンティティ保持を有効化。
- **プロンプト戦略**: スコアの低い指標を昇順に最大 3 つ抜粋し、各指標を「メイク／ヘア／ライティング調整」で表現する英語フレーズに変換。`Preserve the subject's identity strictly: same gender, age range, ethnicity, hairstyle, hair color, eye color, skin tone, jewelry, clothing, framing, and pose.` を明示。
- **二重同意ガード**: クライアント UI（`hasOpenAiPortraitConsent`）でボタン無効化 + サーバー (`consent: z.literal(true)`) で 400 弾き。
- **タイムアウト**: クライアント fetch にはタイムアウトを設けず、サーバー側で `AbortController(60s)` → 504。Next.js Route Handler の `maxDuration = 60`。
- **コスト管理**: gpt-image-1 + 1024×1024 + `input_fidelity: "high"` ≈ **$0.04 / 枚**。`production` では 5 件/IP/日に制限（メモリ Map）。
- **データフロー**: 画像は base64 でやり取りし、サーバーで一度も `fs.writeFile` しない。
- **既知の課題**: `gpt-image-1` 自体の制約で 1024×1024 のみ。性別・年齢の自動推定は MVP では実施せずプロンプトで吸収。

## リファレンス

- requirements.md §4.7 F-07
- OpenAI Images: https://platform.openai.com/docs/guides/images
