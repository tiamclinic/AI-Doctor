# デプロイ（Firebase App Hosting）

本プロジェクトは **Firebase App Hosting** を経由して GCP の **Cloud Run** にデプロイされます。GitHub の `main` 押下で自動ビルド・自動デプロイされる構成です。

## アーキテクチャ概要

```
GitHub (main)
   │  push
   ▼
Firebase App Hosting
   │  Cloud Build で next build
   ▼
Cloud Run（SSR / Route Handler 実行）
   │
   ├─ Secret Manager（OPENAI_API_KEY）
   └─ Cloud Logging
```

- バックエンド ID: `at-doctor`
- Firebase プロジェクト: `ai-doctor-5681b`（[`.firebaserc`](../../.firebaserc)）
- リージョン: `us-east4`（App Hosting backend 作成時の選択に従う）

## 主要ファイル

| ファイル | 役割 |
| --- | --- |
| [`apphosting.yaml`](../../apphosting.yaml) | runConfig / env / Secret 参照 |
| [`firebase.json`](../../firebase.json) | App Hosting backend 指定 / ignore |
| [`.firebaserc`](../../.firebaserc) | デフォルトプロジェクト |

## 初回セットアップ

> Firebase CLI に **App Hosting プロジェクトのオーナー権限** を持つアカウントでログインしている必要があります。

### 1. Firebase CLI で App Hosting backend を作成

```bash
npx -y firebase-tools@latest apphosting:backends:create \
  --project ai-doctor-5681b \
  --location us-east4
```

GitHub リポジトリ連動を選び、`main` を deploy branch に指定。

### 2. Secret を登録

```bash
npx -y firebase-tools@latest apphosting:secrets:set OPENAI_API_KEY
# 値の入力プロンプトに従う

npx -y firebase-tools@latest apphosting:secrets:grantaccess OPENAI_API_KEY \
  --backend at-doctor
```

### 3. `apphosting.yaml` に Secret パスを記載

```yaml
env:
  - variable: OPENAI_API_KEY
    secret: projects/<PROJECT_NUMBER>/secrets/OPENAI_API_KEY
    availability:
      - RUNTIME
```

`<PROJECT_NUMBER>` は Firebase Console > プロジェクトの設定 > 全般 の「プロジェクト番号」。

### 4. `NEXT_PUBLIC_APP_URL` を更新

App Hosting backend を作成すると確定する URL（例: `https://at-doctor--ai-doctor-5681b.us-east4.hosted.app`）を `apphosting.yaml` の `NEXT_PUBLIC_APP_URL` に反映。カスタムドメイン適用後はその値に書き換える。

### 5. main にコミット / push

```bash
git add apphosting.yaml
git commit -m "chore(apphosting): wire OPENAI_API_KEY secret"
git push
```

App Hosting が変更を検知してビルドを開始。ビルドログは Firebase Console の App Hosting タブから確認できる。

## 通常デプロイ

`main` への push で自動。手動で再デプロイしたい場合:

```bash
npx -y firebase-tools@latest apphosting:rollouts:create \
  --backend at-doctor \
  --project ai-doctor-5681b
```

## デプロイ後の疎通確認

```bash
# ヘルスチェック
curl https://<your-app>/api/health

# 診断 API（スコアだけ送る）
curl -X POST https://<your-app>/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"totalScore":85.0,"scores":{"verticalThirds":85,"horizontalFifths":85,"eyeSpacing":85,"noseMouthRatio":85,"eLine":85,"faceContour":85}}'
```

`503 service_unavailable` が返るなら `OPENAI_API_KEY` の Secret が読めていない。

## ロールバック

App Hosting は自動でローリングデプロイを行うため、失敗時は前のリビジョンが残り続けます。
明示的に戻したい場合は GitHub 側で revert PR を作る:

```bash
git revert <bad-commit-sha>
git push
```

不本意なコードがすでに main にいるときに無理に force push しないこと（履歴が壊れます）。

## runConfig の意味

[`apphosting.yaml`](../../apphosting.yaml) より:

```yaml
runConfig:
  cpu: 1
  memoryMiB: 1024
  minInstances: 0
  maxInstances: 3
  concurrency: 80
```

- `cpu: 1` / `memoryMiB: 1024`: Next.js 16 + sharp + Satori に必要十分
- `minInstances: 0`: コールドスタート許容（MVP のコスト最優先）
- `maxInstances: 3`: 暴騰防止の上限
- `concurrency: 80`: Cloud Run のデフォルト

本番運用が始まったら `minInstances` を 1 にしてコールドスタートを抑える、`maxInstances` を上げる、といった調整が必要です。

## Secret 関連でハマったときの IAM 手動付与

`apphosting:secrets:grantaccess` がうまく動かない場合、Google Cloud Console > IAM で以下を確認:

- サービスアカウント `service-<PROJECT_NUMBER>@firebase-app-hosting.iam.gserviceaccount.com` に **Secret Manager Secret Accessor** 権限が付与されている
- Secret 自体の Permissions タブに同じサービスアカウントが入っている

詳細は Firebase App Hosting 公式 [Secrets ドキュメント](https://firebase.google.com/docs/app-hosting/configure#secret-parameters) を参照。

## CI を足すなら

GitHub Actions の例:

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

App Hosting 自体がビルドを行うため必須ではないが、PR 段階で lint / test を回したい場合に便利。
