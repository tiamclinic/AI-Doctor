# 環境変数

## 一覧

| キー | 用途 | クライアント露出 | 開発（`.env.local`） | 本番（`apphosting.yaml` + Secret Manager） |
| --- | --- | --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI 認証 | ❌ Server only | 直接記載 | Secret Manager（`projects/<number>/secrets/OPENAI_API_KEY`） |
| `OPENAI_ORG_ID` | OpenAI 組織切替 | ❌ Server only | 任意 | 必要時のみ Secret 化 |
| `NEXT_PUBLIC_APP_URL` | OGP / シェアリンク先 | ✅ クライアントに含まれる | `http://localhost:3000` | App Hosting ドメイン |

## なぜ `OPENAI_API_KEY` を `NEXT_PUBLIC_` にしないか

`NEXT_PUBLIC_` プレフィックスは **クライアントバンドルに値が埋め込まれます**。OpenAI キーが流出すると無制限の課金が発生します。
本プロジェクトの OpenAI 呼び出しはすべて Route Handler（`app/api/**/route.ts`）経由とし、Server Components / Route Handler だけが `process.env.OPENAI_API_KEY` を参照します。

## 開発環境（`.env.local`）

```bash
cp .env.local.example .env.local
```

中身の例:

```env
OPENAI_API_KEY=sk-xxxx
# OPENAI_ORG_ID=org-xxxx   # 必要なら
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.local` は `.gitignore` に入っており、コミットされません。

## 本番環境（Firebase App Hosting）

[`apphosting.yaml`](../../apphosting.yaml) で 2 種類の方法を使い分けています:

### 1. プレーン値（公開しても問題ないもの）

```yaml
env:
  - variable: NEXT_PUBLIC_APP_URL
    value: https://at-doctor--ai-doctor-5681b.us-east4.hosted.app
    availability:
      - BUILD
      - RUNTIME
```

### 2. Secret Manager 参照

```yaml
env:
  - variable: OPENAI_API_KEY
    secret: projects/88086403893/secrets/OPENAI_API_KEY
    availability:
      - RUNTIME
```

> ⚠️ `secret:` の値は **プロジェクト番号を含む完全パス**（`projects/<number>/secrets/<name>`）を推奨。短い名前だと App Hosting の preparer が稀に解決に失敗します。プロジェクト番号は Firebase Console > プロジェクトの設定 > 全般 から確認可能。

### Secret の登録手順

```bash
# 1. Secret を登録（プロンプトで値を入力）
npx -y firebase-tools@latest apphosting:secrets:set OPENAI_API_KEY

# 2. App Hosting backend にアクセス権を付与
npx -y firebase-tools@latest apphosting:secrets:grantaccess OPENAI_API_KEY \
  --backend at-doctor
```

これでも preparer が失敗する場合は IAM Policy を手動付与する必要があります。詳細は [deployment](./deployment.md)。

## `availability` の使い分け

- `BUILD`: `next build` 時に必要。例: `NEXT_PUBLIC_APP_URL` は OGP 生成で参照
- `RUNTIME`: SSR / Route Handler 実行時に必要。例: `OPENAI_API_KEY`

Secret はビルド時に露出させたくないため、原則 `RUNTIME` のみにします。

## 環境ごとの確認方法

```bash
# 開発: dev サーバー起動時のログで OPENAI_API_KEY 関連エラーがないか
npm run dev

# 本番: ヘルスチェックは常に 200 を返す。OpenAI を実際に叩いて確認
curl -X POST https://<your-app>/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"totalScore":80,"scores":{"verticalThirds":80,"horizontalFifths":80,"eyeSpacing":80,"noseMouthRatio":80,"eLine":80,"faceContour":80}}'
```

`503 service_unavailable` が返るなら `OPENAI_API_KEY` 未設定 / 参照失敗です。
