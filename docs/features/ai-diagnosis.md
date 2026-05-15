# AI 診断文生成（F-04）

スコアを `gpt-4o-mini` に投げて TIAM トーンの診断テキストを得る機能です。
API 仕様は [`api/diagnose.md`](../api/diagnose.md) を参照。ここでは「なぜこの設計か」を中心に書きます。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`app/api/diagnose/route.ts`](../../app/api/diagnose/route.ts) | Route Handler |
| [`lib/diagnosis/openai.ts`](../../lib/diagnosis/openai.ts) | OpenAI 呼び出し + 後処理 + リトライ |
| [`lib/diagnosis/types.ts`](../../lib/diagnosis/types.ts) | Zod スキーマ |
| [`lib/diagnosis/client.ts`](../../lib/diagnosis/client.ts) | クライアント側 fetch ラッパ |
| [`lib/prompt/diagnosisPrompt.ts`](../../lib/prompt/diagnosisPrompt.ts) | system プロンプト + few-shot |
| [`lib/prompt/forbiddenWords.ts`](../../lib/prompt/forbiddenWords.ts) | 禁止フレーズ / 施術名辞書 / 医療表現置換 / マスク |
| [`components/DiagnosisText.tsx`](../../components/DiagnosisText.tsx) | 表示コンポーネント |

## モデル選定

`gpt-4o-mini` を採用。理由:

- コストが極めて安く、JSON Schema strict が安定
- 速度（1〜5 秒）でユーザーがじっと待てるレンジ
- 日本語表現の TIAM トーン再現は few-shot で十分追随

`gpt-4o` / `gpt-4.1` 系は文章のニュアンスが豊かになる一方、料金 ×20 のオーダーになるため MVP では採用しない。

## プロンプト戦略

[`lib/prompt/diagnosisPrompt.ts`](../../lib/prompt/diagnosisPrompt.ts):

1. **System プロンプト**: TIAM 顧問アナリストの人格・トーン・法令配慮・禁止フレーズ・出力スキーマを定義
2. **Few-shot 2 件**: 「点数高め」「点数中程度」の架空例で TIAM らしい敬体・具体性・余白感を学習させる
3. **User メッセージ**: 実際のスコア値を `formatScoreInput()` で整形

### 出力スキーマ（strict）

[`RESPONSE_JSON_SCHEMA`](../../lib/diagnosis/openai.ts) で固定:

```json
{
  "overallComment": "string",        // 100-150 字相当
  "strengths":      ["string", "string", "string"],
  "improvements":   ["string", "string"],
  "recommendedCare":["string", "string", "string"],
  "tiamMessage":    "string"
}
```

`additionalProperties: false` + `minItems`/`maxItems` の固定で形を厳密化。

## 後処理パイプライン

1. **JSON.parse** → `DiagnoseResponseSchema.parse()`（Zod 二重チェック）
2. **`replaceMedicalTerms()`** で医療系表現を置換（例: 「治療」→「ケア」、「改善されます」→「整いやすくなります」）
3. **`scanForbidden()`** で残存違反を検出（GPT 頻出フレーズ・最上級・`MEDICAL_PROCEDURE_TERMS` の施術名など）
4. 検出されたら **1 回だけリトライ**: 直前の出力を assistant メッセージとして渡し、`buildRetryMessage()` で書き直しを指示
5. 2 回目も違反、またはリトライ API 失敗時: **`maskDiagnoseResponse`** で施術語を中立語へ置換し、残存ヒットの除去と長さ補正のうえで返却
6. 成功レスポンスに **`x-diagnose-guardrail: clean | retried | masked`**（サーバー／ログ用）

## TIAM トーン

[`SYSTEM_PROMPT`](../../lib/prompt/diagnosisPrompt.ts) より:

> 高級サロン／クリニックの顧問が手紙を書くイメージ。静謐で、品位があり、過度にポジティブでない。
> 形容詞は控えめに、必ず具体的な指標名とスコア値を引いて記述する。
> 文末は「〜です。」「〜ます。」で揃え、断定的に書く。

「素晴らしい」「いかがでしょうか」のような曖昧なポジティブを避けるのが TIAM トーンの肝。
これを守るために forbiddenWords でハードガードしている。

## 法令配慮

- **薬機法**: 「治療」「改善されます」を許さない。リプレース辞書に追加するときは順序に注意（前の置換が後ろの対象を作らないように）
- **景表法**: 「最も美しい」「No.1」「業界一」など根拠なき最上級表現を禁止
- **施術名禁止**: ヒアルロン酸・ボトックス・HIFU 等の固有施術・機器名は出力に含めない（辞書＋マスク）

詳細は [guides/legal-compliance](../guides/legal-compliance.md)。

## エラーハンドリング

| 条件 | 振る舞い |
| --- | --- |
| `OPENAI_API_KEY` 未設定 | 503 `service_unavailable` |
| Zod 検証失敗 | 400 `invalid_request` |
| OpenAI 429 | 429 `rate_limited` |
| OpenAI 5xx | 502 `upstream_error` |
| JSON 解析失敗 | 500 `unknown`（例外メッセージ込み） |

## 既知の制約

- `gpt-4o-mini` は同じ入力でも揺らぐ。再現性が必要ならスコアを丸めるレンジを広げる、または `seed` を使う（OpenAI SDK 6 では一部のモデルで利用可）
- 多言語化は未対応（`locale: "ja"` 固定）
