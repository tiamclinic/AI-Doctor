# POST /api/share-card

スコアと診断要約を受け取り、Satori（`next/og`）で SNS シェア用の PNG（1080×1920、9:16 縦長）を生成するエンドポイントです。
**顔写真は一切含まれません**。テキストとスコア値のみで構成されます。

- 実装: [`app/api/share-card/route.tsx`](../../app/api/share-card/route.tsx)
- テンプレート: [`lib/share-card/template.tsx`](../../lib/share-card/template.tsx)
- フォントローダ: [`lib/share-card/fonts.ts`](../../lib/share-card/fonts.ts)
- 関連機能: [features/share-card](../features/share-card.md)

## 出力サイズ / フォーマット

- 1080 × 1920 PNG（Instagram Story / TikTok 互換）
- レスポンスは `image/png`（`ImageResponse` 直接返却）
- `Cache-Control: public, max-age=0, must-revalidate`
- `Content-Disposition: inline; filename="tiam-share-card.png"`

## リクエスト

```http
POST /api/share-card
Content-Type: application/json
```

```ts
type ShareCardRequest = {
  totalScore: number;            // 0–100
  scores: {
    verticalThirds: number;
    horizontalFifths: number;
    eyeSpacing: number;
    noseMouthRatio: number;
    eLine: number;
    faceContour: number;
  };
  topStrength?: string;          // 1–80 文字（任意）
  tiamMessage?: string;          // 1–80 文字（任意）
};
```

Zod スキーマは [`lib/share-card/types.ts`](../../lib/share-card/types.ts) の `ShareCardRequestSchema`。

## レスポンス

- **200 OK**: `Content-Type: image/png` のバイナリ
- **400** / **500**: JSON エラー

```ts
type ShareCardError = {
  error: "invalid_request" | "render_failed";
  message: string;
  details?: unknown;             // 400 の場合 Zod の flatten() 結果
};
```

## フォント

Satori は SVG `<text>` をサポートしないため、テンプレート中のすべての文字をフォントサブセットとして埋め込む必要があります。

[`lib/share-card/template.tsx`](../../lib/share-card/template.tsx) の `STATIC_TEMPLATE_TEXT` にテンプレ固定文字列を集約しており、`collectGlyphs()` が動的テキストと結合して Google Fonts API からサブセット取得します。

利用フォント:

- Noto Sans JP 400 / 700（本文）
- Cormorant Garamond 500（見出し / 数値）

> ⚠️ テンプレートに新しいリテラル文字列を追加する場合は **必ず `STATIC_TEMPLATE_TEXT` に書き写してください**。漏れると `<text> nodes are not currently supported` で 500 になります。

## 呼び出し例（クライアント）

推奨経路は [`lib/share-card/client.ts`](../../lib/share-card/client.ts):

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

## 制限事項

- `maxDuration = 30` 秒（Google Fonts 取得 + Satori レンダリング）
- Edge ランタイム化は技術的には可能だが、現状は `nodejs` 固定
- 設計上「顔写真を含めない」運用ポリシーなので、テンプレートに画像を追加する場合は要件レビュー必須
