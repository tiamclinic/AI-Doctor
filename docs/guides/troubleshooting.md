# トラブルシューティング

よくあるエラーと、その対処法。新しい事例が出たら追記してください。

## OpenAI 関連

### 503 `service_unavailable` / `openai_not_configured`

`OPENAI_API_KEY` が読めていない。

- **開発**: `.env.local` を作って `OPENAI_API_KEY=sk-...` を記載。dev サーバーを再起動
- **本番**: `apphosting.yaml` の `secret: projects/<number>/secrets/OPENAI_API_KEY` のパスを確認。`apphosting:secrets:grantaccess` を実行 → [deployment](./deployment.md)

### 429 `rate_limited`

- OpenAI 側のレートに到達 → 数秒待って再試行
- `/api/generate-portrait` の場合は自前のレート制限（本番 1 IP 5 回 / 日）の可能性も。レスポンスの `retryAfterSec` を確認

### 502 `upstream_error`

OpenAI が 5xx を返している。一時的なものが多いため、数分後に再試行。継続するなら OpenAI のステータスページを確認。

### `image_decode_failed` / `invalid_image_file`

- アップロードした画像が極端なフォーマット（CMYK / palette PNG / 16bit）
- 通常は [`lib/portrait/normalize.ts`](../../lib/portrait/normalize.ts) の sharp パイプラインで吸収するが、壊れた HEIC などは正規化前に弾かれる
- ユーザーには「別の写真でお試しください」を促す

## MediaPipe / 顔検出

### 「顔を検出できませんでした」

- 写真がブレている / 暗すぎる
- 横顔 / マスク / サングラス
- 複数人写っている場合は最大の顔を採用するが、極端に小さい顔は検出されないことがある

### MediaPipe の初期化が無限ローディング

- ブラウザコンソールで `[faceAnalysis] Landmarker initialized in ...ms` が出ているか確認
- 出ない場合:
  - `public/mediapipe/wasm/` にファイルがあるか
  - `public/models/face_landmarker.task` があるか
  - `npm install` → `node scripts/copy-mediapipe-wasm.mjs` を試す
- iOS Safari の旧版で GPU delegate が WebGL を要求して失敗するケースがある（CPU フォールバックは MediaPipe 任せ）

### 「`landmarker.detect is not a function`」

WASM がキャッシュされた古いものを参照している。ブラウザのハードリロード（Cmd+Shift+R）+ Next.js の `.next/` ディレクトリ削除で解決することが多い。

```bash
rm -rf .next
npm run dev
```

## 画像アップロード

### HEIC が読めない

- 一部の HEIC（古い iOS / 圧縮特性）は libheif がデコードに失敗
- UI 側で「JPEG に書き出してからお試しください」と案内している

### サイズ超過

- `PhotoUploader` の `maxSizeMB`（既定 10MB）を超えると弾かれる
- 4K HEIC / RAW は大体ここに引っかかる

## シェアカード

### 500 `render_failed` / `<text> nodes are not currently supported`

Satori テンプレに含まれる文字が `STATIC_TEMPLATE_TEXT` にない。
[`lib/share-card/template.tsx`](../../lib/share-card/template.tsx) の `STATIC_TEMPLATE_TEXT` に該当文字列を追加 → 再デプロイ。

### フォント取得失敗

Google Fonts API への通信失敗。Cloud Run のアウトバウンドが制限されていないか確認。

## Next.js / ビルド

### `Cannot find module '@/...'`

`tsconfig.json` の `paths` 設定が壊れているか、ファイルが実際に存在しないか。エイリアスは `@/*` → `./*`。

### Tailwind が効かない

- Tailwind v4 では `tailwind.config.js` を作らない（CSS で完結）
- `app/globals.css` の `@import "tailwindcss";` と `@theme` ブロックが正しいか確認
- `postcss.config.mjs` で `@tailwindcss/postcss` プラグインが有効か

### `next build` が落ちる

- `npm install` を再実行（`postinstall` で WASM がコピーされる）
- `node_modules` を削除して `npm ci`
- それでも解決しないときは `rm -rf .next` 後に再試行

## デプロイ

### App Hosting のビルドが Secret 解決で失敗

- `apphosting.yaml` の `secret:` が **完全パス（projects/<number>/secrets/<name>）** か確認
- `apphosting:secrets:grantaccess` を再実行
- Google Cloud Console > IAM で `service-<PROJECT_NUMBER>@firebase-app-hosting.iam.gserviceaccount.com` に Secret Manager Secret Accessor が付与されているか確認

### 本番で OpenAI 503

- 上記の Secret アクセス問題
- 一度コンテナを再起動（新しいリビジョンを deploy）すると治ることが多い

### `firebase` CLI のログインアカウントが違う

App Hosting プロジェクトのオーナー権限を持つアカウントで `firebase login --reauth` してから再実行。

## 既知の制限

- リロードすると診断結果は失われる（永続化なし）
- `/result/[id]` を別タブ / 他人と共有しても結果は復元できない（プライバシー設計上の意図）
- 写真は数十秒〜の処理中だけメモリにある。プロセスが落ちると消える
