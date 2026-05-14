# 04. AI 診断文生成 API

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-04                                |
| 関連要件   | F-04                                |
| 依存       | T-03                                |
| 優先度     | 高                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

クライアントで計算したスコアを受け取り、OpenAI `gpt-4o-mini`（JSON モード）で TIAM トーンの診断文を返す API ルートを実装する。GPT 感を消すプロンプト設計が要件の中核。

## ゴール / 受け入れ基準

- [x] `POST /api/diagnose` がスコアを受け取り JSON 形式で診断文を返す（zod 検証）
- [x] 出力 JSON が定義スキーマに沿う（`overallComment` / `strengths` / `improvements` / `recommendedCare` / `tiamMessage`、OpenAI 側で `json_schema strict` を適用）
- [x] 禁止語（GPT 頻出フレーズ・最上級表現）が出力に含まれていない（検出時は 1 度だけリトライ）
- [x] 医療表現（「治療」「改善されます」など）の自動置換（`replaceMedicalTerms`）を実装
- [ ] レスポンスタイム 5 秒以内（90% 以上のリクエスト）— 実測は T-10 QA で確認
- [x] OpenAI API キーがクライアントバンドルに含まれていない（`import "server-only"` + Route Handler）
- [x] エラー時は 500 ではなく構造化エラーを返す（`{ error, message }`、429/502/503 を使い分け）

## 設計メモ

### 配置

```
app/api/diagnose/
  route.ts                          ルートハンドラ（POST、zod 検証、構造化エラー）
lib/prompt/
  diagnosisPrompt.ts                system prompt + few-shot 2件 + リトライプロンプト
  forbiddenWords.ts                 禁止語/最上級/医療表現 置換テーブル
  __tests__/forbiddenWords.test.ts  Vitest テスト
lib/openai/
  client.ts                         サーバー専用 OpenAI クライアント（singleton）
lib/diagnosis/
  types.ts                          zod スキーマ + 共有型（DiagnoseRequest/Response/Error）
  openai.ts                         GPT 呼び出し本体（json_schema strict + リトライ）
  client.ts                         ブラウザ → /api/diagnose のフェッチヘルパ
components/
  DiagnosisText.tsx                 診断レポート表示
```

### リクエスト

```ts
type DiagnoseRequest = {
  totalScore: number;
  scores: Record<MetricKey, number>;
  rawValues?: Record<MetricKey, number | number[]>;
  locale?: "ja"; // MVP は ja のみ
};
```

### レスポンス

```ts
type DiagnoseResponse = {
  overallComment: string;       // 100–150 字
  strengths: string[];          // 3 件
  improvements: string[];       // 2 件
  recommendedCare: string[];    // 3 件
  tiamMessage: string;          // 50 字
};
```

### プロンプト戦略

- 役割: 「TIAM ビューティーラボ顧問アナリスト」固定
- 文体: 敬体・3 行ブロック・断定口調
- 禁止語: 「いかがでしょうか」「〜と言えるでしょう」「素晴らしい」など
- 数値はクライアント計算済みのみを参照（ハルシネーション禁止）
- few-shot を 2〜3 件埋め込み
- JSON Schema を `response_format` で固定

### 後処理

- 禁止語フィルタで違反検出 → 1 回までリトライ（2 回目はそのまま返す）
- 医療表現の自動置換テーブル（例:「治療」→「ケア」）

## TODO

- [x] `openai` + `zod` を依存に追加
- [x] `lib/openai/client.ts` を作成（`import "server-only"`、`OpenAiNotConfiguredError` で鍵未設定を明示）
- [x] `lib/prompt/diagnosisPrompt.ts` を作成（system prompt + few-shot 2 件 + リトライプロンプト）
- [x] `lib/prompt/forbiddenWords.ts` を作成（禁止語・最上級・医療表現置換テーブル）
- [x] `app/api/diagnose/route.ts` を作成（POST、`gpt-4o-mini`、`response_format: json_schema strict`）
- [x] zod でリクエスト/レスポンスを検証
- [x] 禁止語検出時のリトライ（1 回、書き直し指示プロンプト付き）
- [x] 医療表現の自動置換テーブル（`replaceMedicalTerms`）
- [ ] レート制限（IP ベース）→ Phase 2 で本格化（MVP では未実装、デプロイ前に再検討）
- [x] エラーハンドリング（503 service_unavailable / 429 rate_limited / 502 upstream_error / 500 unknown）
- [x] 単体テスト（禁止語・置換テーブル）。OpenAI 呼び出しのモックは現状未実装（Phase 2）
- [x] `.env.local.example` に `OPENAI_API_KEY` を記載済み（T-00 で追加）
- [x] `/diagnose` で「AI 診断文を生成する」CTA を実装、生成中はローディング、結果は `DiagnosisText` で表示

## リファレンス

- requirements.md §4.4 F-04
- OpenAI JSON mode: https://platform.openai.com/docs/guides/structured-outputs
