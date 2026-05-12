# 06. シェアカード生成（Satori）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-06                                |
| 関連要件   | F-06                                |
| 依存       | T-05                                |
| 優先度     | 高                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 完了（OGP 自動付与は T-08/T-09 で対応） |

## 概要

診断結果を 1 枚にまとめた縦長 PNG（1080×1920）を Satori + `@vercel/og` で生成する。SNS 共有および結果ページの OGP 画像として使用する。

## ゴール / 受け入れ基準

- [x] `POST /api/share-card` が PNG 画像を返す（MVP は写真なしのため OG 用 GET ではなく POST + クライアントダウンロード方式）
- [x] 画像サイズは 1080 × 1920（縦長 9:16）
- [x] レイアウトに崩れがない（フォント・余白・ロゴ位置）
- [x] 結果画面から「カードをダウンロード」できる
- [ ] 結果ページの OGP 画像としてもこのカードが使われる → 結果データを永続化する **T-09 完了後に T-08 で対応**
- [x] フォントは TIAM ブランドガイドに沿う（Noto Sans JP / Cormorant Garamond をサブセット fetch）

## 設計メモ

### 配置（実装後）

```
app/api/share-card/
  route.tsx                Next.js 16 内蔵 next/og の ImageResponse を返す（Node ランタイム）
lib/share-card/
  template.tsx             Satori 用 JSX レイアウト（写真なし）
  fonts.ts                 Google Fonts サブセット取得（テキスト依存・キャッシュ付き）
  types.ts                 Zod スキーマ（ShareCardRequest）
  client.ts                fetch + Blob + ダウンロードヘルパ
components/
  ShareCardButton.tsx      結果画面に置く生成ボタン（プレビュー＋DL）
```

### MVP の API 設計（写真なしのため POST に切替）

- `POST /api/share-card` で `{ totalScore, scores, topStrength?, tiamMessage? }` を JSON で受け取り PNG を返す
- 永続化なしのため GET でも復元できないので、結果画面のストアから直接 POST してダウンロードする方式に変更
- Phase 2（T-09）で Firestore 保存に切替後、`GET /api/share-card?id=xxx` を生やして OGP に組み込む

### レイアウト概要

```
+------------------------+
|     TIAM ロゴ          |
|  Beauty AI Diagnosis   |
|------------------------|
|    [顔サムネ円形]       |
|     86.4 / 100         |
|------------------------|
|  6 指標バー              |
|------------------------|
|  総評 1 行（短く）        |
|------------------------|
|  URL / QR              |
+------------------------+
```

### 注意点

- Satori は CSS の subset しかサポートしない（flex 主体、`background-image` 限定 等）
- フォントは TTF を `fetch` してバッファ渡し
- 写真は base64 でも URL でも可、URL の場合 CORS 注意
- Edge runtime にすると速いが OpenAI 呼び出し系とは別ルートで分離

## TODO

- [x] Next.js 16 内蔵 `next/og` の `ImageResponse` を採用（外部依存ゼロで実装）
- [x] `lib/share-card/template.tsx` を作成（Satori 用 JSX レイアウト・写真なし）
- [x] `lib/share-card/types.ts` を作成（Zod スキーマで POST body 検証）
- [x] `app/api/share-card/route.tsx` を作成し ImageResponse で返却（Node ランタイム）
- [x] `lib/share-card/fonts.ts` で Google Fonts CSS API を叩き、描画文字だけのサブセット ttf/woff を fetch・メモリキャッシュ
- [x] 結果画面に「シェアカードを生成する」ボタンを設置（プレビュー → ダウンロード）
- [ ] 結果ページの `generateMetadata` で `openGraph.images` にこの URL を指定 → **T-08（SNS シェア）/ T-09（永続化）で対応**
- [ ] iOS / Android で OGP 画像が SNS で正しく表示されるか確認（Twitter Card Validator / Facebook Debugger）→ デプロイ後 T-10 で確認
- [ ] レイアウト崩れのテスト（極端に長い名前・短いコメントなど）→ T-10 ポリッシュで網羅

## 実装メモ（完了時）

- **写真なし方針**：MVP では SNS 拡散時のプライバシーを優先し、シェアカードに本人写真を含めない（要件再確認で決定）。
- **フォント取得戦略**：Satori の 500KB バンドル上限と日本語フォントの相性を解決するため、Google Fonts CSS API の `text=` パラメータで「描画する文字だけ」のサブセットフォントを実行時 fetch。Chrome 41 を装う UA で **woff** を返させる（Satori 対応形式）。`Map` で per-process メモリキャッシュ。
- **Satori 制約への対応**：`<text>` 要素未対応のため、レーダーチャートのラベルは SVG ではなく外側 div の `position: absolute + translate(-50%, -50%)` で配置。
- **API レスポンス**：HTTP 200 / `image/png` / 1080×1920 / 約 150KB。Node ランタイムで初回 ~1 秒、サブセットキャッシュヒット時 ~0.3 秒。
- **OGP 未対応の理由**：MVP は結果データを永続化していないため、GET URL から復元できない。T-09 で Firestore 化された後に `app/result/[id]/opengraph-image.tsx` 経由で対応予定。

## リファレンス

- 要件定義書 §4.6 F-06
- Satori: https://github.com/vercel/satori
