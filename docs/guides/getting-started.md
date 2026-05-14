# ローカル開発を始める

## 前提

- **Node.js**: `>=20.0.0 <23.0.0`（[package.json](../../package.json) の `engines` で固定）
- **npm**: Node 20 同梱版で OK
- **OS**: macOS / Linux / Windows（WSL2 推奨）
- **OpenAI API キー**: 自分の組織のキーが必要

> Node を切り替える環境がない場合は [`nvm`](https://github.com/nvm-sh/nvm) や `volta` を推奨。

## 1. リポジトリを取得

```bash
git clone <repo-url>
cd AI-Doctor
```

## 2. 依存をインストール

```bash
npm install
```

`postinstall` で `scripts/copy-mediapipe-wasm.mjs` が走り、`node_modules/@mediapipe/tasks-vision/wasm/*` を `public/mediapipe/wasm/` にコピーします。
コピーをスキップしてしまった場合は手動で:

```bash
node scripts/copy-mediapipe-wasm.mjs
```

## 3. MediaPipe モデルを配置

`public/models/face_landmarker.task` が存在することを確認してください。リポジトリに含まれていれば追加作業は不要です。
含まれていない場合は MediaPipe 公式から取得:

```bash
curl -L -o public/models/face_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
```

## 4. 環境変数

`.env.local.example` をコピー:

```bash
cp .env.local.example .env.local
```

`OPENAI_API_KEY` を自分のキーで埋めます。詳細は [environment-variables](./environment-variables.md)。

`NEXT_PUBLIC_APP_URL` は `http://localhost:3000` のままで OK。

## 5. 開発サーバーを起動

```bash
npm run dev
```

`http://localhost:3000` を開いて、ランディング画面が出れば成功です。

## 6. 動作確認

1. 利用規約に同意
2. 顔写真を選択 → 4:5 にクロップ → 「次へ進む」
3. `/diagnose` で 478 点が検出される
4. 「スコアを計算する」 → 「AI 診断文を生成する」 → `/result/[id]` へ遷移
5. 結果画面で「AI 理想顔を生成」が押せる（OpenAI に写真が送られる）
6. 「シェアカードをダウンロード」で PNG がダウンロードされる

## 主要コマンド

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm start            # 本番ビルドの起動
npm run lint         # ESLint
npm test             # Vitest（ワンショット）
npm run test:watch   # Vitest（watch）
```

## トラブルシューティング

- **OpenAI 503**: `.env.local` に `OPENAI_API_KEY` が設定されているか確認 → [troubleshooting](./troubleshooting.md)
- **MediaPipe が起動しない**: `public/mediapipe/wasm/` と `public/models/face_landmarker.task` の存在を確認
- **HEIC 写真でエラー**: 一部の HEIC は libheif がデコード失敗。JPEG / PNG で再試行

その他は [troubleshooting](./troubleshooting.md) を参照。
