# 12. AI 診断ガードレール強化（施術名・医療推奨の禁止）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-12                                |
| 関連要件   | requirements.md §4.4 / §4.9.1 / §5.3 |
| 依存       | T-04                                |
| 優先度     | 高                                  |
| 見積       | 1〜2 日                             |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

`POST /api/diagnose` の出力に、**具体的な施術名・医療行為の推奨**が混入しないことを保証する。既存の `FORBIDDEN_PHRASES` / `MEDICAL_TERM_REPLACEMENTS` / `SUPERLATIVE_PHRASES`（`lib/prompt/forbiddenWords.ts`）に **施術カテゴリ辞書**を追加し、システムプロンプトでも明示禁止する。違反検出時はリトライ → 失敗時はその箇所を安全表現に **マスク** して返す。

院方の施術説明はここでは扱わない（T-13〜T-15）。

## ゴール / 受け入れ基準

- [x] `lib/prompt/forbiddenWords.ts` に `MEDICAL_PROCEDURE_TERMS` を追加し、`scanForbidden()` が施術語も検査対象にする
- [x] `lib/prompt/diagnosisPrompt.ts` のシステムプロンプトに「施術名・医療行為の推奨を含めない」ルールを **箇条書きで明記**
- [x] `generateDiagnosis()` で違反検出時は **1 回までリトライ**（既存挙動を踏襲）。2 回目も違反なら **`maskProcedureTerms()`** で該当語を「美容バランスの整え方」相当の中立表現へ置換して返す
- [x] レスポンスヘッダまたはサーバーログに `x-diagnose-guardrail`（`clean` / `retried` / `masked`）を出す（クライアントには公開しない）
- [x] Vitest 追加 5 ケース以上が緑：施術名がそのまま素通りしない／マスクの結果に施術語が残らない／既存の置換が壊れない
- [x] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 禁止辞書の追加

`lib/prompt/forbiddenWords.ts` に下記を追加する。**最終リストは依頼者（医師）とリーガル確認前提**で、本チケットはまず開発側の初版を入れる。

```ts
// 美容医療系の固有施術カテゴリ。AI 出力では使わせない。
export const MEDICAL_PROCEDURE_TERMS: readonly string[] = [
  // 注入系
  "ヒアルロン酸",
  "ボトックス",
  "ボツリヌス",
  "脂肪溶解注射",
  "BNLS",
  "リジュラン",
  "プラセンタ注射",
  // 切開・糸系
  "糸リフト",
  "スレッドリフト",
  "切開",
  "二重整形",
  "鼻整形",
  "顎削り",
  "脂肪吸引",
  "脂肪移植",
  // 機器・施術名
  "HIFU",
  "ハイフ",
  "ピコレーザー",
  "ダーマペン",
  "ポテンツァ",
  "ウルセラ",
  "サーマクール",
  // 一般語の医療文脈
  "美容外科",
  "美容整形",
  "クリニックでの治療",
];
```

`scanForbidden()` の対象配列にこの辞書を追加する。`maskProcedureTerms()` は新規関数で、**完全一致＋前後の助詞も含めて中立表現に差し替える**（例: `「ヒアルロン酸で整える」` → `「美容バランスを整えるケア」`）。実装は単純な置換で良い。

### システムプロンプトの追記（`lib/prompt/diagnosisPrompt.ts`）

`SYSTEM_PROMPT` に下記を追記する（既存の禁止語ルールの直後）。

```
- 具体的な美容医療の施術名・機器名・薬剤名を出力に含めてはなりません。
  例: ヒアルロン酸、ボトックス、HIFU、糸リフト、ピコレーザー、ダーマペン、切開、脂肪吸引 等。
- 「クリニック」「治療」「整形」「手術」「医師」「処置」などの医療現場固有語も避け、
  「美容バランス」「整える」「ケア」「日々の習慣」など中立表現で代替してください。
- 推奨ケアは "セルフケア" の範囲（メイク・スキンケア・髪型・表情・姿勢・生活習慣）に限定します。
```

### リトライ＆マスクの流れ

```text
1) generateDiagnosis(): OpenAI 呼び出し
2) scanForbidden(text)  → hits なら 1 回だけ書き直し指示プロンプトで再生成
3) 2 回目も hits → maskProcedureTerms(text) を全フィールドに適用
4) 最終出力 → DiagnoseResponseSchema.parse() で寸法・形を担保
5) ヘッダ: x-diagnose-guardrail = clean | retried | masked
```

## TODO

- [x] `lib/prompt/forbiddenWords.ts` に `MEDICAL_PROCEDURE_TERMS` を追加
- [x] 同ファイルに `maskProcedureTerms(text: string): string` を実装
- [x] `scanForbidden()` を `MEDICAL_PROCEDURE_TERMS` も含めるよう拡張（既存テストの後方互換に注意）
- [x] `lib/prompt/diagnosisPrompt.ts` のシステムプロンプト本文に施術禁止ルールを追記
- [x] `lib/diagnosis/openai.ts` の生成パイプラインにマスク段階を追加し、`x-diagnose-guardrail` ヘッダを `app/api/diagnose/route.ts` で付与
- [x] `lib/prompt/__tests__/forbiddenWords.test.ts` に施術語ケースを追加
- [x] `lib/prompt/__tests__/maskProcedureTerms.test.ts` を新規作成（5 ケース以上）
- [x] `docs/api/diagnose.md` の「禁止語」節と「ガードレール」節を更新
- [x] `npm run test` / `npm run lint` / `npm run build` を通す

## リファレンス

- requirements.md §4.4, §4.9.1, §5.3
- 既存: `lib/prompt/forbiddenWords.ts`, `lib/prompt/diagnosisPrompt.ts`, `lib/diagnosis/openai.ts`, `app/api/diagnose/route.ts`
