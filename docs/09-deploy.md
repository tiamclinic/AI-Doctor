# 09. Firebase デプロイ

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-09                                |
| 関連要件   | -（運用要件）                       |
| 依存       | T-01〜T-08                          |
| 優先度     | 高                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | コード準備完了 / コンソール設定はユーザー作業 |

## 概要

Next.js 16（App Router / Route Handlers / sharp / Satori）を **Firebase App Hosting** にデプロイする。OpenAI 等のサーバーシークレットは **Cloud Secret Manager** に登録し、`apphosting.yaml` から参照する。

## ゴール / 受け入れ基準

- [x] `apphosting.yaml` / `firebase.json` / `.firebaserc` がリポジトリに存在する
- [x] `app/api/health` がヘルスチェック用に追加されている
- [x] OGP `metadataBase` が `NEXT_PUBLIC_APP_URL` 経由で切り替わる
- [ ] Firebase プロジェクト `ai-doctor-5681b` が Blaze プランに切替済み
- [ ] `OPENAI_API_KEY` が Cloud Secret Manager に登録されている
- [ ] 本番 URL でランディング → 写真クロップ → 診断 → 結果まで一連が動作する
- [ ] HTTPS で配信されている（App Hosting 標準）
- [ ] OpenAI 月額上限（$20〜$50）と Firebase 予算アラートが設定されている

## 構成

| ファイル | 役割 |
|---|---|
| `apphosting.yaml` | App Hosting backend 設定（CPU/メモリ/環境変数/Secret 参照） |
| `firebase.json` | CLI で `firebase deploy` を行う場合の backend 宣言 |
| `.firebaserc` | デフォルトプロジェクトを `ai-doctor-5681b` に設定 |
| `app/api/health/route.ts` | App Hosting / 監視向け軽量 health endpoint |
| `app/layout.tsx` | `metadataBase` を `NEXT_PUBLIC_APP_URL` から取得 |
| `package.json` | `engines.node: ">=20 <23"` を明示 |

## デプロイ手順（ユーザー作業）

### Step 1. Firebase Console で Blaze プランに切替

1. <https://console.firebase.google.com/project/ai-doctor-5681b/overview?purchaseBillingPlan=metered> を開く
2. **「Blaze プラン → プランを選択」** → 支払い情報を登録
3. Google Cloud Console > **請求 > 予算とアラート** から予算アラートを追加（推奨：**$5 / $10 / $20** の 3 段階）

### Step 2. OpenAI 側の保険

OpenAI ダッシュボード > **Settings > Limits** で **Monthly budget: $30** など上限を設定しておく。

### Step 3. Firebase CLI ログイン

**重要:** CLI にログインしている Google アカウントは、**App Hosting を作った Firebase プロジェクトのメンバーと同じ**にする。別アカウント（例: 個人の `smilelink000@gmail.com`）のまま `--project ai-doctor-5681b` を指定すると、`Invalid project selection` や Secret Manager の **403** になる。

```bash
# 現在ログイン中のアカウントを確認
npx -y firebase-tools@latest login:list

# App Hosting が publicrelations@tiamclinicpr.com 側のプロジェクトなら、
# 一度ログアウトしてから、そのアカウントで再ログインする
npx -y firebase-tools@latest logout
npx -y firebase-tools@latest login

# このアカウントで見えるプロジェクト一覧（ai-doctor-5681b が出るか確認）
npx -y firebase-tools@latest projects:list

npx -y firebase-tools@latest use ai-doctor-5681b
# => Active Project: ai-doctor-5681b になっていれば OK
```

**別案（両方のアカウントを使いたい場合）:** `publicrelations@tiamclinicpr.com` で Google Cloud Console の IAM に `smilelink000@gmail.com` を **編集者** などで追加すると、`smilelink000` のまま CLI が使える。

### Step 4. Cloud Secret Manager に OpenAI API キーを登録

> **⚠️ ここはターミナルで直接実行してください。**
> API キーの実値を AI チャットや commit log に絶対に貼らないでください。

```bash
# プロンプトで API キー入力 → Cloud Secret Manager に保存される
npx -y firebase-tools@latest apphosting:secrets:set OPENAI_API_KEY \
  --project ai-doctor-5681b

# Cloud Run サービスアカウントに secret 参照権限を付与
npx -y firebase-tools@latest apphosting:secrets:grantaccess OPENAI_API_KEY \
  --backend at-doctor \
  --project ai-doctor-5681b
```

### Step 5. App Hosting backend の作成 + GitHub 連携

**A) Firebase Console から作成する（推奨：CI/CD 即時有効）**

1. <https://console.firebase.google.com/project/ai-doctor-5681b/apphosting> を開く
2. **「Create backend」**
   - **Region**: `us-east4`（既存）/ `asia-northeast1`（東京）/ `us-central1` のいずれか
   - **GitHub repository**: `tiamclinic/AI-Doctor` を選択（初回は GitHub 側で Firebase アプリの installation 承認が必要）
   - **Live branch**: `main`
   - **Root directory**: `/`
   - **Backend ID**: `at-doctor`（`firebase.json` と一致させる）
3. 「Create」を押すと `main` への push をトリガーに自動デプロイが回り始める

**B) CLI から作成する**

```bash
npx -y firebase-tools@latest init apphosting
# 対話：プロジェクト=ai-doctor-5681b, region 選択, backend 名=at-doctor
```

### Step 6. 本番 URL を確定 → `apphosting.yaml` 更新

App Hosting backend ができると、`https://<backend-id>--<project-id>.<region>.hosted.app` の形で URL が払い出される。現在の本番候補 URL:

```
https://at-doctor--ai-doctor-5681b.us-east4.hosted.app
```

カスタムドメインを後で当てる場合は、確定後に `apphosting.yaml` の `NEXT_PUBLIC_APP_URL` を書き換えて再 push する。

### Step 7. デプロイ後チェックリスト

```bash
# ヘルスチェック
curl https://<本番URL>/api/health
# → {"status":"ok",...}

# 一連の動作確認
# 1. ランディングで「同意して進む」 → 写真選択 → クロップ → 「次へ進む」
# 2. /diagnose で MediaPipe 解析 → 「スコアを計算する」→ 「AI 診断文を生成する」
# 3. 自動遷移後、/result/<id> でスコア・レーダー・診断文が表示される
# 4. シェアカードの「シェアカードを生成する」→ PNG プレビュー → ダウンロード
# 5. （任意）AI 理想顔の「AI で理想顔を生成する」→ Original / TIAM ideal 並び表示
```

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `Invalid project selection` / Secret の **403**（`serviceUsageConsumer`） | CLI の Google アカウントがそのプロジェクトの IAM にいない。**App Hosting を作ったアカウントで `firebase login` し直す**か、オーナーに **smilelink000 を編集者で IAM 追加**してもらう |
| Cloud Build で `fah/misconfigured-secret` / `Permission 'secretmanager.versions.get' denied` | Secret `OPENAI_API_KEY` が無いか、バックエンドに権限が無い。`apphosting:secrets:set` で作成し、**必ず** `apphosting:secrets:grantaccess OPENAI_API_KEY --backend at-doctor --project ai-doctor-5681b` を実行。Console の環境変数に平文でキーを入れない（ログに出る） |
| `npm ci` が `package-lock.json` と不整合（`Missing: @emnapi/...`） | ローカルで `npm install` して lock を更新し、`main` に push する（Linux 用 optional 依存が lock に含まれる必要がある） |
| ビルドが古いコミット（例: `19408d4`）のまま | App Hosting が参照する GitHub の `main` に最新コミットが載っているか確認し、`git push` 先の remote がそのリポジトリと一致しているか確認 |
| ビルドが「OPENAI_API_KEY が見つからない」で失敗 | Secret 登録 + grantaccess を再実行。`availability: RUNTIME` だけのため、ビルド時は不要 |
| OpenAI Images API が `invalid_image_file` | サーバー側で `sharp` による正規化済み。`failOn: "none"` も入っているので、別の画像で再現するか確認 |
| シェアカード生成で 500（"font url"系） | Google Fonts API のレスポンス形式変更の可能性。`lib/share-card/fonts.ts` の regex を確認 |
| ヘルスチェックは通るが画面が真っ白 | `NEXT_PUBLIC_APP_URL` の値が間違っている可能性。`apphosting.yaml` の URL を本番 URL に揃える |
| Cold start が辛い | `apphosting.yaml` の `runConfig.minInstances: 1` に上げると常時 1 台暖機（コスト増） |

## OGP / SNS シェア

T-06 で生成するシェアカードは、現状 `POST /api/share-card` でクライアントからダウンロードする形式。SNS シェア（OGP 画像として自動表示）は **T-09 で結果データを永続化（Firestore など）した後、T-08 で `app/result/[id]/opengraph-image.tsx` を追加して対応**する。

## リファレンス

- 要件定義書 §8 運用要件
- Firebase App Hosting: <https://firebase.google.com/docs/app-hosting>
- App Hosting Configuration: <https://firebase.google.com/docs/app-hosting/configure>
- Secret Manager: <https://cloud.google.com/secret-manager>
