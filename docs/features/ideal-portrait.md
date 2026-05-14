# AI 理想顔生成（F-07）

`gpt-image-1`（Images Edit）を用いて、ユーザーの写真を保ったまま「黄金比に近づけた参考イメージ」を生成する機能です。
**写真がブラウザの外に出る唯一の経路** であり、本プロダクト最大の体験フックでもあります。

API 仕様は [`api/generate-portrait.md`](../api/generate-portrait.md) を参照。ここでは設計判断を中心に書きます。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`app/api/generate-portrait/route.ts`](../../app/api/generate-portrait/route.ts) | Route Handler |
| [`lib/openai/images.ts`](../../lib/openai/images.ts) | `openai.images.edit` の薄いラッパ |
| [`lib/portrait/normalize.ts`](../../lib/portrait/normalize.ts) | sharp での画像正規化 |
| [`lib/portrait/rateLimit.ts`](../../lib/portrait/rateLimit.ts) | IP 単位レート制限 |
| [`lib/portrait/types.ts`](../../lib/portrait/types.ts) | Zod スキーマ |
| [`lib/portrait/client.ts`](../../lib/portrait/client.ts) | クライアント fetch ラッパ |
| [`lib/prompt/portraitPrompt.ts`](../../lib/prompt/portraitPrompt.ts) | プロンプト構築 |
| [`components/IdealPortrait.tsx`](../../components/IdealPortrait.tsx) | UI |
| [`components/common/ConsentDialog.tsx`](../../components/common/ConsentDialog.tsx) | 写真送信前の同意ダイアログ |

## 体験の流れ

1. 結果画面の「AI 理想顔ジェネレーター」セクションに `IdealPortrait` が出る
2. ボタン押下時、未同意なら `ConsentDialog` で OpenAI へ写真を送ることを明示再同意
3. 同意取得後に `requestIdealPortrait(photoDataUrl, scoreResult)` を呼ぶ
4. 約 20–40 秒で base64 PNG を取得し、`<img src="data:image/png;base64,...">` で表示

## なぜ写真をサーバーに送るのか

- 「理想顔」を作るには元の顔の同一性を `input_fidelity: "high"` で保つ必要がある
- これは Images Edit のリファレンスとして元画像を OpenAI に渡すことを意味する
- 完全クライアント生成は現状のオープンモデルではアイデンティティ保持が貧弱

この体験価値とプライバシーのトレードオフは要件レビューで合意済み。**同意なしに送信しないこと** が守るべき不変条件。

## サーバー側パイプライン

```
[POST /api/generate-portrait]
  ↓ Zod 検証（consent: true 必須）
  ↓ IP レート制限チェック
  ↓ base64 → Buffer
  ↓ normalizeForOpenAi() → sRGB JPEG 1024×1024
  ↓ buildPortraitPrompt() で focus 指標を 3 つ選定
  ↓ openai.images.edit({ model: "gpt-image-1", input_fidelity: "high" })
  ↓ b64_json を取り出して返却
```

詳細は [`api/generate-portrait.md`](../api/generate-portrait.md)。

## プロンプト戦略の要点

[`lib/prompt/portraitPrompt.ts`](../../lib/prompt/portraitPrompt.ts):

- **改善対象は低スコア順に最大 3 つ**: それ以外は触らないよう明示
- **アイデンティティ保持を超強調**: 性別・年齢・東アジア系・髪型・服装・姿勢を変えないと文章で繰り返し書く
- **西洋的なグラマー調を禁止**: ハリウッド調 / 暖色 / 強コントゥアを避け、東京エディトリアル系の寒色透明感に寄せる
- **医療・整形的な変形を禁止**: 骨格を変えない、目を大きくしない、鼻筋を立てない、輪郭を細くしない

これによって「他人になった」ではなく「同じ人がメイク・ライティングで整って見える」という出力に誘導している。

## 画像正規化の必要性

`gpt-image-1` の Images Edit は入力画像のモードに敏感で、以下のいずれかで `invalid_image_file` を返します:

- EXIF Orientation が残っている
- 色空間が grayscale / CMYK / 16bit
- palette PNG
- アルファチャンネル付き

これを `sharp` のパイプラインで一括解消（[`normalize.ts`](../../lib/portrait/normalize.ts)）:

1. `.rotate()` — EXIF Orientation を実ピクセルへ
2. `.resize(1024, 1024, cover)` — 正方形に
3. `.flatten({ background: white })` — alpha を除去
4. `.toColorspace("srgb")` — sRGB 8bit RGB に
5. `.jpeg({ quality: 92, mozjpeg: true })` — JPEG 出力

> JPEG を選ぶのは「palette なし / alpha なし / 8bit」を強制的に保証できるため。PNG だと環境依存で稀に弾かれる。

## レート制限

[`lib/portrait/rateLimit.ts`](../../lib/portrait/rateLimit.ts):

- 本番: **1 IP / 1 日 5 回**
- 開発: 1 IP / 1 日 30 回
- プロセスメモリ Map で実装（MVP 限定）

複数 Cloud Run インスタンスでは独立カウンタになります。本格運用前に Firestore / Upstash 等へ置換予定。

## コストと所要時間

- gpt-image-1 Images Edit は 1 件あたり数 ¢〜十数 ¢
- 実時間 20–40 秒。`maxDuration = 60` で打ち切り
- 連続失敗時のリトライはサーバー側では行わない（クライアントで再試行）

## 失敗時のメッセージ

| エラーコード | UI メッセージ |
| --- | --- |
| `consent_required` | 「OpenAI への写真送信に同意してから生成を開始してください。」 |
| `rate_limited` | 「本日の理想顔生成回数の上限に達しました。約 N 時間後に再度お試しください。」 |
| `timeout` | 「理想顔の生成がタイムアウトしました。少し時間を置いて再度お試しください。」 |
| `image_decode_failed` | 「送信された画像を正規化できませんでした。別の写真でお試しください。」 |
