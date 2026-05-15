# 法令コンプライアンス（薬機法 / 景表法）

本サービスは「医療診断ではなく美容バランスの傾向を提示する」体験です。
**薬機法**（医薬品医療機器等法）と**景品表示法**（不当景品類及び不当表示防止法）を意識した実装ガードを敷いています。

## 守るべきライン

### 薬機法

| NG | OK | 備考 |
| --- | --- | --- |
| 治療する / 治す | ケアで整える | 医療効果を断定しない |
| 改善されます | 整いやすくなります | 効果保証を避ける |
| 医療効果 | 美容バランスの傾向 | 効能効果を謳わない |
| 疾患 / 症状 | 傾向 | 疾病訴求と取られない |

### 景表法

| NG | OK | 備考 |
| --- | --- | --- |
| 最も美しい / No.1 / 業界一 | （使わない） | 根拠なき最上級表現の禁止 |
| 完全無欠 / 絶対に | （婉曲表現） | 過度な断定の禁止 |

## 自動ガードの仕組み

### 1. 禁止フレーズ辞書

[`lib/prompt/forbiddenWords.ts`](../../lib/prompt/forbiddenWords.ts) に以下を集約:

- `FORBIDDEN_PHRASES`: GPT 頻出のぼかし表現（「いかがでしょうか」「素晴らしい」など）
- `SUPERLATIVE_PHRASES`: 最上級表現（「最も美しい」「No.1」など）
- `MEDICAL_PROCEDURE_TERMS`: 美容医療の施術・機器・薬剤名（AI 出力禁止・初版リスト）
- `MEDICAL_TERM_REPLACEMENTS`: 医療系断定表現の置換ルール（順序依存）

### 2. プロンプトでの明示

[`lib/prompt/diagnosisPrompt.ts`](../../lib/prompt/diagnosisPrompt.ts) の system プロンプトで:

- TIAM トーンの定義
- 法令配慮（薬機法 / 景表法）
- 禁止フレーズ一覧をそのまま埋め込み

### 3. 後処理パイプライン（`/api/diagnose`）

[`lib/diagnosis/openai.ts`](../../lib/diagnosis/openai.ts) の `generateDiagnosis()`:

```
OpenAI 応答
  ↓ replaceMedicalTerms()  ← 医療表現を強制置換
  ↓ scanForbidden()        ← 禁止フレーズ・最上級・施術名を検出
  ↓ 検出されたら 1 回だけリトライ（違反語を列挙し JSON を書き直し指示）
  ↓ 2 回目も違反、またはリトライ API 失敗時
      maskDiagnoseResponse → replaceMedicalTerms を再適用
      → なお残るヒットを文字列から除去 → 長さを Zod 最小に合わせて補正
  ↓ レスポンスヘッダ x-diagnose-guardrail: clean | retried | masked
```

これによって LLM のゆらぎで禁止表現や施術名が出ても、**返却前に除去・マスクされる**ことを目指しています（最終リストはリーガル確認前提）。

### 4. UI 表記

結果画面の最下部・シェアカードのフッタ・OGP に必ず以下を出す:

> ※ 美容バランスの傾向を読み解く参考情報であり、医療診断ではありません。

該当箇所:

- [`app/result/[id]/page.tsx`](../../app/result/[id]/page.tsx) フッタ
- [`lib/share-card/template.tsx`](../../lib/share-card/template.tsx) `STATIC_TEMPLATE_TEXT`
- [`app/layout.tsx`](../../app/layout.tsx) `metadata.description`

これらを削るときは要件レビュー必須。

## 新しい文言を追加するときのチェックリスト

- [ ] 「治療」「改善」「医療効果」など医療効果を断定する表現を含まないか
- [ ] 「最も」「No.1」「業界一」「完全」など最上級表現を含まないか
- [ ] 含む場合は `MEDICAL_TERM_REPLACEMENTS` に置換ルールを追加したか
- [ ] 含む場合は `FORBIDDEN_PHRASES` / `SUPERLATIVE_PHRASES` の追加で検出可能にしたか
- [ ] 「これは医療診断ではありません」相当の注意書きが UI から到達できるか

## プロンプト変更時の留意

- system プロンプトに新しい指示を加える場合、TIAM トーン（敬体・断定・控えめ）を崩していないか
- few-shot を増やすときは法令配慮の例を入れる（強い言葉を使わないサンプル）
- `temperature` を上げると揺らぎが増え、禁止フレーズが出やすくなる（現在 `0.7`）

## 第三者監修について

法務監修は MVP リリース前に外部弁護士レビューを通している前提です。文言テンプレ・利用規約・プライバシーポリシーは [`docs/requirements.md`](../requirements.md) の §10 / §11 に最終版が紐づきます。大幅変更時は再監修を依頼してください。
