# 技術スタック

## フレームワーク / 言語

| 領域 | 採用技術 | バージョン | 備考 |
| --- | --- | --- | --- |
| ランタイム | Node.js | 20.x（< 23） | `package.json` `engines` で固定 |
| フレームワーク | Next.js | 16.2.6 | App Router / RSC 前提 |
| UI | React | 19.2.4 | Server Components 含む |
| 言語 | TypeScript | 5.x | strict mode |
| スタイル | Tailwind CSS | v4（PostCSS プラグイン） | `tailwind.config.js` なし。`app/globals.css` で完結 |
| Lint | ESLint | 9 flat config | `eslint-config-next` |
| テスト | Vitest | 4.x | Node 環境、`__tests__/*.test.ts(x)` |

### Next.js 16 注意点

[`AGENTS.md`](../../AGENTS.md) / [`CLAUDE.md`](../../CLAUDE.md) に明記しているとおり、**Next.js 16 は AI モデルの学習データと挙動が異なる**。コード生成時は `node_modules/next/dist/docs/` を参照すること。

特に変わったもの:

- `params` は `Promise<...>` を返す（`React.use(params)` で受ける）
- フォントは `next/font/google` 経由
- API ルートは `route.ts(x)` / `runtime` / `maxDuration` を明示

## ドメイン依存

| 用途 | ライブラリ | 採用理由 |
| --- | --- | --- |
| 顔ランドマーク検出 | `@mediapipe/tasks-vision` 0.10 | WASM + GPU delegate でブラウザ完結。478 点取得可能 |
| OpenAI 呼び出し | `openai` 6.x | 公式 SDK。Chat Completions / Images Edit |
| 画像正規化（サーバー） | `sharp` | EXIF 反映・色空間変換・JPEG 出力 |
| HEIC 変換（ブラウザ） | `heic2any` | iOS 写真の HEIC をクライアントで JPEG 化 |
| クロップ UI | `react-easy-crop` 5.x | ピンチ／ドラッグ／ホイール対応のクロップ |
| 画像生成 | `next/og` + Satori | Edge / Node 両対応の SVG → PNG レンダラ |
| バリデーション | `zod` 4.x | サーバー入力検証 + 型推論 |
| 状態管理 | `zustand` 5.x | RSC との相性が良い軽量グローバルストア |
| ID 生成 | `nanoid` 5.x | result URL の短縮 ID |
| UI プリミティブ | `@base-ui/react` / `shadcn` | アクセシビリティと TIAM ブランド調整の余地 |
| アイコン | `lucide-react` 1.x | shadcn と相性が良い |
| クラス結合 | `clsx` + `tailwind-merge` + `class-variance-authority` | shadcn 慣習 |

## インフラ

| 用途 | 採用技術 | 備考 |
| --- | --- | --- |
| ホスティング | Firebase App Hosting | GitHub 連動 / Cloud Run 上で SSR |
| シークレット管理 | Google Cloud Secret Manager | `OPENAI_API_KEY` を保管 |
| 監視 | App Hosting ログ / `/api/health` | MVP 時点では Cloud Logging のみ |

設定は [`apphosting.yaml`](../../apphosting.yaml) を参照。デプロイ手順は [guides/deployment](../guides/deployment.md)。

## なぜこれらを選んだか（要点）

- **MediaPipe をクライアント実行する** ことで写真をサーバーに送らない設計を成立させる。MediaPipe は MediaPipe Tasks（Web） / TFLite ベースで GPU delegate が使え、478 点取得できる
- **OpenAI 公式 SDK を使う**: Images API の型定義・Streaming・タイムアウト制御が安定しているため。`fetch` 直叩きは保守性が下がる
- **`sharp` で正規化する**: OpenAI Images API は入力モードに非常に厳しく、EXIF Orientation / palette PNG / グレースケール / 16bit などで弾かれる。事前に sRGB 8bit JPEG 1024 に揃える
- **Zustand を使う**: ストア構造が単純で、Next.js 16 の RSC / SSR と相性が良い。Context API では描画とアクションの分離が冗長になる
- **Satori（next/og）を使う**: Cloud Run 上で安定して動く SVG → PNG。フォントサブセットを Google Fonts API から都度取れる

## 入れていないもの（と理由）

| 入れていない | 理由 |
| --- | --- |
| RDB / Firestore | MVP は結果保存なし。Phase 2 で必要になれば導入 |
| 認証（Firebase Auth など） | ユーザーアカウント概念がない |
| Redis / Upstash | レート制限は MVP のみプロセスメモリで足りる |
| GraphQL | Route Handler の数が少なく、REST/JSON で完結 |
| Sentry / Datadog | Cloud Logging で MVP は十分 |
| Storybook | コンポーネント数が少なく、Tailwind + shadcn でローカル確認可能 |
