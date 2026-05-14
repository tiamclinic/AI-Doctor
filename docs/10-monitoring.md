# T-10 モニタリング・運用

## Firebase Analytics（Web）

本番・検証環境で **Firebase Console > Analytics > DebugView / イベント** を確認する。

### 必要な環境変数（すべて `NEXT_PUBLIC_`・クライアント公開可）

| 変数 | 例 | 用途 |
| ---- | --- | ---- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | AIza… | Web アプリ識別 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `proj.firebaseapp.com` | Auth ドメイン（Analytics 初期化に必要） |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `ai-doctor-5681b` | プロジェクト ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `proj.appspot.com` | 未使用でも初期化用に推奨 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 数値文字列 | FCM 用（初期化に必要） |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:…:web:…` | アプリ ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-XXXX` | **Analytics 必須** |

未設定の場合、SDK は初期化されず **イベントは送出されない**（ローカル開発のデフォルト）。

### 実装済みイベント名

| イベント名 | タイミング | 主なパラメータ |
| ---------- | ---------- | -------------- |
| `terms_consent` | 利用規約・PP 同意完了 | `openai_portrait` (boolean) |
| `upload` | クロップ確定（解析用画像確定） | `mime`, `size_kb` |
| `face_detected` | MediaPipe で顔検出成功 | `landmark_count`, `duration_ms` |
| `diagnosis_completed` | `/api/diagnose` 成功 | `total_score`, `duration_ms` |
| `share_clicked` | X / LINE / Instagram 導線 / シェアカード PNG DL / リンクコピー | `channel`（`x` `line` `instagram` `share_card_png` `copy_link`） |
| `share_card_generated` | シェアカード PNG がブラウザ上で生成完了 | `result_id` |
| `portrait_generated` | 理想顔 API 成功 | `duration_ms` |
| `client_error` | 未捕捉 `error` / `unhandledrejection` | `message`, `source`, `lineno` |

カスタム定義のディメンションとして `channel` 等を Console 側で登録するとレポートしやすい。

## Crashlytics について

Firebase **Crashlytics はモバイル（iOS/Android）向けが主**であり、Next.js Web 単体では公式サポートが限定的です。本プロジェクトでは次の二段構えとする。

1. **クライアント**: `client_error` イベントで GA4 に軽量ログ（`AnalyticsProvider`）。
2. **推奨（Phase 2）**: [Sentry](https://docs.sentry.io/platforms/javascript/guides/nextjs/) 等でスタックトレース付きのエラー収集。

## OpenAI

- ダッシュボードで **利用量・上限（hard cap）** を確認する。
- 429 が多発する場合は請求・上限設定を再確認（T-04 チケットの運用メモ参照）。

## OGP / SNS デバッグ

- X: [Card Validator](https://cards-dev.twitter.com/validator)
- Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- LINE: 実機トークプレビューで要確認

## ローカルで DebugView を見る

1. Chrome 拡張「Google Analytics Debugger」を有効化、または `?debug_mode=true` を付与してアクセス（GA4 のデバッグ手順に従う）。
2. Firebase Console > Analytics > DebugView でイベントを確認。
