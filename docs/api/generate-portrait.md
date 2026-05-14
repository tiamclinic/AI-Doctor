# POST /api/generate-portrait

ユーザーの顔写真とスコアを受け取り、`gpt-image-1` で「黄金比に近づけた理想顔の参考画像」を生成するエンドポイントです。
**写真がブラウザの外に出る唯一の経路**であり、明示的なユーザー同意（`consent: true`）が必須です。

- 実装: [`app/api/generate-portrait/route.ts`](../../app/api/generate-portrait/route.ts)
- 画像呼び出し: [`lib/openai/images.ts`](../../lib/openai/images.ts)
- 画像正規化: [`lib/portrait/normalize.ts`](../../lib/portrait/normalize.ts)
- プロンプト: [`lib/prompt/portraitPrompt.ts`](../../lib/prompt/portraitPrompt.ts)
- レート制限: [`lib/portrait/rateLimit.ts`](../../lib/portrait/rateLimit.ts)
- 関連機能: [features/ideal-portrait](../features/ideal-portrait.md)

## モデル / コスト

- モデル: `gpt-image-1`（Images API `images.edit`）
- `input_fidelity: "high"`（本人性をなるべく保つ）
- `size: 1024x1024`
- `maxDuration = 60` 秒。実時間は 20–40 秒のことが多い
- 1 件あたりの目安: gpt-image-1 の Images Edit 料金に準拠（数 ¢〜十数 ¢）

## リクエスト

```http
POST /api/generate-portrait
Content-Type: application/json
```

```ts
type PortraitRequest = {
  imageBase64: string;           // data URL もしくは base64 文字列（< ~10MB）
  scores: {
    verticalThirds: number;      // 0–100
    horizontalFifths: number;
    eyeSpacing: number;
    noseMouthRatio: number;
    eLine: number;
    faceContour: number;
  };
  consent: true;                 // 必ず true。false / undefined は 400 で拒否
};
```

Zod スキーマは [`lib/portrait/types.ts`](../../lib/portrait/types.ts) の `PortraitRequestSchema`。

## レスポンス（200 OK）

```ts
type PortraitResponse = {
  imageBase64: string;           // 生 base64（"data:" プレフィックスなし、PNG）
  promptSummary: string;         // ログ・UI 表示用の短い要約
  durationMs: number;            // OpenAI 呼び出しの実時間（ms）
};
```

クライアントでは `data:image/png;base64,${imageBase64}` で `<img src>` に直接埋め込めます。

## エラー

| Status | error | 説明 |
| --- | --- | --- |
| 400 | `invalid_request` | JSON 解析不可 / バリデーション違反 |
| 400 | `consent_required` | `consent` が `true` でない |
| 400 | `image_decode_failed` | base64 デコード or sharp の正規化に失敗 |
| 429 | `rate_limited` | IP 単位レート制限到達。`retryAfterSec` 付き |
| 503 | `openai_not_configured` | `OPENAI_API_KEY` 未設定 |
| 502 | `upstream_error` | OpenAI が 5xx |
| 504 | `timeout` | 60 秒を超えた |
| 500 | `unknown` | 想定外の例外 |

`rate_limited` のレスポンス例:

```json
{
  "error": "rate_limited",
  "message": "本日の理想顔生成回数の上限に達しました。約 12 時間後に再度お試しください。",
  "retryAfterSec": 43200
}
```

## サーバー側の挙動

### レート制限（MVP）

[`lib/portrait/rateLimit.ts`](../../lib/portrait/rateLimit.ts) で IP ごとに `count` を保持する超軽量実装。

- 本番 (`NODE_ENV=production`): 1 IP あたり 1 日 **5 回**
- 開発: 1 日 **30 回**
- プロセスメモリの `Map`。複数インスタンスでは独立カウンタとなるため、本格運用時は Firestore / Upstash 等へ置き換える前提

IP は `x-forwarded-for` → `x-real-ip` → `"unknown"` の順で取得。

### 画像正規化（重要）

OpenAI Images API は入力画像のモードに非常に厳しく、グレースケール／16bit／CMYK／palette PNG／EXIF Orientation 残存などで `invalid_image_file` を返します。

このため、[`lib/portrait/normalize.ts`](../../lib/portrait/normalize.ts) で必ず以下のパイプラインを通します:

1. `sharp().rotate()` — EXIF Orientation を実ピクセルに反映
2. `resize(1024, 1024, cover)` — 1024×1024 にクロップ
3. `flatten({ background: white })` — alpha を白背景で除去
4. `toColorspace("srgb")` — sRGB 8bit RGB に正規化
5. `jpeg({ quality: 92, mozjpeg: true })` — JPEG として出力

JPEG を選ぶ理由は 8bit / palette なし / alpha なしを保証でき、OpenAI 側の検査を通りやすいから。

### プロンプト戦略

[`lib/prompt/portraitPrompt.ts`](../../lib/prompt/portraitPrompt.ts) の `buildPortraitPrompt()`:

- 6 指標のうち **スコアが低い順に最大 3 つ** を選び、それぞれに対応する微調整指示を組み立てる
- アイデンティティ（性別・年齢・髪・肌・東アジア系の特徴・服装・姿勢）を強く保つ "very subtly" な調整に限定
- 西洋的なコントゥアリング・ハリウッド調のグローを明示的に禁止し、東京エディトリアル系の透明感トーンに寄せる
- 医療・整形的な変形は文章で明確に禁止

## 呼び出し例

推奨経路は [`lib/portrait/client.ts`](../../lib/portrait/client.ts) の `requestIdealPortrait()`:

```ts
import { requestIdealPortrait } from "@/lib/portrait/client";

const res = await requestIdealPortrait(photoDataUrl, scoreResult);
if (res.ok) {
  const src = `data:image/png;base64,${res.data.imageBase64}`;
} else if (res.error.error === "rate_limited") {
  // res.error.retryAfterSec で再試行可能タイミングを通知
}
```
