# 09. Firebase デプロイ

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-09                                |
| 関連要件   | -（運用要件）                       |
| 依存       | T-01〜T-08                          |
| 優先度     | 高                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

Next.js 16（SSR + Route Handlers）を Firebase App Hosting にデプロイする。OpenAI 等のサーバーシークレットは Firebase の環境変数管理に登録する。

## ゴール / 受け入れ基準

- [ ] 本番 URL でランディング → 診断 → 結果まで一連が動作する
- [ ] OpenAI API キーが Firebase の Secret として安全に保管されている
- [ ] HTTPS で配信されている（Firebase 標準）
- [ ] OGP 画像（シェアカード）が SNS から取得できる
- [ ] CI/CD（GitHub → Firebase 自動デプロイ）が設定されている

## 設計メモ

### ホスティング選択

- **Firebase App Hosting** を採用（Next.js SSR / Route Handlers をフルサポート）
- 静的のみで足りる範囲（ランディング）は CDN キャッシュが効く
- Functions ベースのレガシー Hosting + SSR より新しい App Hosting を推奨

### 環境変数（Firebase Secret）

| キー                  | 設定先          |
| --------------------- | --------------- |
| `OPENAI_API_KEY`      | Secret          |
| `OPENAI_ORG_ID`       | Secret          |
| `NEXT_PUBLIC_APP_URL` | Public 環境変数 |

### CI/CD

- GitHub の `main` push で自動ビルド・デプロイ
- PR ごとにプレビューチャネル（オプション）

### コスト

- OpenAI 月額上限を $50 に設定（OpenAI ダッシュボードで設定）
- Firebase 課金アラートを設定

## TODO

- [ ] Firebase プロジェクトを作成（プロジェクト ID 命名規約に沿う）
- [ ] Firebase CLI をローカルにインストール `npm i -g firebase-tools`
- [ ] `firebase login` 後 `firebase init apphosting`（または App Hosting バックエンド作成）
- [ ] `apphosting.yaml` を作成し、ランタイム / ビルド設定を記載
- [ ] Firebase Secret に `OPENAI_API_KEY` `OPENAI_ORG_ID` を登録
- [ ] `NEXT_PUBLIC_APP_URL` を本番 URL に設定
- [ ] GitHub リポジトリと App Hosting バックエンドを連携
- [ ] `main` への push で自動デプロイされることを確認
- [ ] 本番 URL でフルフローの動作確認
- [ ] OGP 画像が Twitter Card Validator / Facebook Debugger で正しく表示されることを確認
- [ ] OpenAI 月額上限・Firebase 予算アラートを設定
- [ ] カスタムドメイン設定（任意、ブランド URL 利用時）

## リファレンス

- 要件定義書 §8 運用要件
- Firebase App Hosting: https://firebase.google.com/docs/app-hosting
