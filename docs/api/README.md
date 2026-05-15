# API リファレンス

Next.js 16 App Router の Route Handler として実装された API エンドポイント一覧です。
すべて同一オリジン（`NEXT_PUBLIC_APP_URL`）から呼び出すことを想定しています。

## エンドポイント一覧

| メソッド | パス | 用途 | 認証 | ドキュメント |
| --- | --- | --- | --- | --- |
| `POST` | `/api/diagnose` | TIAM 指標スコアから AI 診断文を生成 | なし | [diagnose.md](./diagnose.md) |
| `POST` | `/api/generate-portrait` | 写真とスコアから理想顔イメージを生成 | 同意 + レート制限 | [generate-portrait.md](./generate-portrait.md) |
| `POST` | `/api/share-card` | スコア／要約から SNS 用 PNG を生成 | なし | [share-card.md](./share-card.md) |
| `GET`  | `/api/health` | App Hosting / 監視用ヘルスチェック | なし | [health.md](./health.md) |
| `GET`  | `/api/doctor-content` | 院方パーツ別コメント（Firestore） | なし | [doctor-content.md](./doctor-content.md) |

## 共通仕様

### ランタイム

全エンドポイントで `runtime = "nodejs"` を指定しています。Edge ランタイム
への移行は OpenAI SDK と `sharp`（画像正規化）の制約のため現状不可。

### リクエスト形式

- メソッドは原則 `POST`。`Content-Type: application/json`
- バリデーションは [Zod](https://zod.dev/) スキーマで実施（`lib/*/types.ts`）
- 認証は MVP 時点では未実装。本番運用前にレート制限／IP 集計などの強化が必要

### レスポンス形式

成功時:

```json
{ /* エンドポイント固有のレスポンス */ }
```

失敗時（共通形式）:

```json
{
  "error": "エラーコード（snake_case）",
  "message": "ユーザー向け日本語メッセージ"
}
```

### エラーコード（共通）

| ステータス | error | 意味 |
| --- | --- | --- |
| 400 | `invalid_request` | JSON 解析不可 / バリデーション違反 |
| 429 | `rate_limited` | OpenAI 側または自前のレート制限に到達 |
| 502 | `upstream_error` | OpenAI が 5xx を返した |
| 503 | `service_unavailable` / `openai_not_configured` | `OPENAI_API_KEY` 未設定 |
| 504 | `timeout` | OpenAI 呼び出しがタイムアウト |
| 500 | `unknown` | 想定外のエラー |

### 呼び出しサンプル（クライアント）

```ts
// lib/diagnosis/client.ts などの fetch ラッパが推奨経路
const res = await fetch("/api/diagnose", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ totalScore, scores, locale: "ja" }),
});
```

クライアント側のラッパは以下を参照:

- `lib/diagnosis/client.ts` — `requestDiagnosis()`
- `lib/portrait/client.ts` — `requestIdealPortrait()`
- `lib/share-card/client.ts` — `requestShareCard()` / `triggerDownload()`
