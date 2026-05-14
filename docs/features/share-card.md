# SNS シェアカード（F-06）

スコアと診断要約を Satori で 1080×1920 PNG に焼き込み、Instagram Story / TikTok 向けの縦長カードを書き出す機能です。**顔写真は含めません**。

API 仕様は [`api/share-card.md`](../api/share-card.md) を参照。ここではテンプレ設計の要点を書きます。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`app/api/share-card/route.tsx`](../../app/api/share-card/route.tsx) | Route Handler / フォント取得 / `ImageResponse` |
| [`lib/share-card/template.tsx`](../../lib/share-card/template.tsx) | JSX テンプレートと文字集約 |
| [`lib/share-card/fonts.ts`](../../lib/share-card/fonts.ts) | Google Fonts API サブセット取得 |
| [`lib/share-card/types.ts`](../../lib/share-card/types.ts) | Zod スキーマ |
| [`lib/share-card/client.ts`](../../lib/share-card/client.ts) | クライアント fetch + ダウンロード起動 |
| [`components/ShareCardButton.tsx`](../../components/ShareCardButton.tsx) | 結果画面のボタン |

## 構成（縦長 1080×1920）

```
┌────────────────────┐ ← gold 細ライン
│       TIAM         │
│ BEAUTY AI REPORT   │
│                    │
│   ╭──────────╮     │
│   │ 86.4 / 100│    │ ← Score Circle
│   ╰──────────╯     │
│                    │
│   ⬢ 6 大指標レーダー │
│                    │
│   topStrength      │ ← 任意（強み 1 件）
│   tiamMessage      │ ← 任意（締めの一言）
│                    │
│ ※ 医療診断ではありません│
│  © TIAM Beauty Lab │
└────────────────────┘
```

## Satori の制約と対策

Satori（`next/og`）は SVG `<text>` を**サポートしません**。テンプレ内で使う文字は予めフォントサブセットとしてロードする必要があります。

[`template.tsx`](../../lib/share-card/template.tsx) の `STATIC_TEMPLATE_TEXT` にすべてのリテラル文字列を集約しており、`collectGlyphs(data)` が動的テキスト（`topStrength` / `tiamMessage`）と結合します。

> ⚠️ **テンプレに新しい文字列を追加するときは必ず `STATIC_TEMPLATE_TEXT` にも追記すること**。漏れると本番で「`<text> nodes are not currently supported`」エラーが出て 500 になります。

## フォント

- **Noto Sans JP** 400 / 700: 本文
- **Cormorant Garamond** 500: ロゴ・数値・見出し

`lib/share-card/fonts.ts` の `loadGoogleFont` が Google Fonts API に `text=<glyphs>` を投げてサブセットを取得します。Satori のレンダリング時に `fonts` 配列で割り当て。

## クライアントからの利用

```ts
import {
  buildShareCardRequest,
  requestShareCard,
  triggerDownload,
} from "@/lib/share-card/client";

const payload = buildShareCardRequest(scoreResult, diagnosisText);
const res = await requestShareCard(payload);
if (res.ok) {
  triggerDownload(res.blob, `tiam-${resultId}.png`);
}
```

- `buildShareCardRequest()` が `topStrength` を 80 文字、`tiamMessage` を 60 文字でトランケート
- `triggerDownload()` は `<a download>` を動的生成してクリックさせる（一部ブラウザのために `URL.revokeObjectURL` を 1 秒遅延）

## デザイントークン

[`template.tsx`](../../lib/share-card/template.tsx) の `COLOR` で集約:

```ts
{
  bg:        "#0B0B0B",                       // TIAM ベース黒
  surface:   "#141414",
  primary:   "#FAFAFA",
  gold:      "#C9A96E",                       // champagne gold
  goldSoft:  "rgba(201, 169, 110, 0.18)",
  muted:     "rgba(250, 250, 250, 0.55)",
  border:    "rgba(250, 250, 250, 0.12)",
}
```

`app/globals.css` の CSS 変数と意図的に同じ値（ブランド一致のため）。

## 制限事項

- レイアウトは固定。レスポンシブ性は不要（SNS の表示比率は 9:16 固定）
- 写真を含める拡張は **要件レビュー必須**（プライバシーポリシー変更が伴う）
- フォント取得が Google Fonts に依存。ネットワーク障害時は 500 を返す
