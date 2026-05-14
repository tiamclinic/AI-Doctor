# 10. QA・リーガル・ベータ公開

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-10                                |
| 関連要件   | §5 / §11 受け入れ基準               |
| 依存       | T-09                                |
| 優先度     | 高                                  |
| 見積       | 4 日                                |
| 担当       | -                                   |
| ステータス | 進行中                              |

## 概要

MVP リリース前の品質保証・法令チェック・コピー磨き込み・ベータ公開を行う。受け入れ基準（requirements.md §11）が全て満たされていることを最終確認する。

## 成果物（コード・ドキュメント）

| 成果物 | パス |
| ------ | ---- |
| QA テストケース表 | [10-qa-test-cases.md](./10-qa-test-cases.md) |
| 受け入れ基準マトリクス | [10-acceptance-matrix.md](./10-acceptance-matrix.md) |
| モニタリング手順 | [10-monitoring.md](./10-monitoring.md) |
| ベータフィードバック | [10-beta-feedback.md](./10-beta-feedback.md) |
| 社内リリースノート | [10-release-notes-internal.md](./10-release-notes-internal.md) |
| Firebase Analytics（任意） | `lib/analytics/`、`components/AnalyticsProvider.tsx` |
| 主要イベント計測 | `upload` / `face_detected` / `diagnosis_completed` / `share_clicked` / `portrait_generated` ほか |

## ゴール / 受け入れ基準

- [ ] 受け入れ基準（requirements.md §11）の全項目を満たす → [10-acceptance-matrix.md](./10-acceptance-matrix.md) で証跡管理
- [ ] 利用規約・プライバシーポリシーがリーガルチェック済みで公開されている → **ドラフトは `/terms` `/privacy` に掲載済み。弁護士レビュー後に `[x]`**
- [ ] 薬機法・景表法に抵触する表現が UI / 診断文に含まれていない → コード側ガード + [10-qa-test-cases.md](./10-qa-test-cases.md) D3 + マーケ／法務目視
- [ ] iOS Safari / Android Chrome / PC Chrome で全機能が動作する → QA 表の環境マトリクスで **[x]` 化**
- [x] Firebase Analytics の主要イベントを実装し計測（設定時）→ `trackEvent` 実装済み。未設定時は no-op
- [ ] Crashlytics が動いている → **Web は非推奨のため `client_error` イベント + [10-monitoring.md](./10-monitoring.md) の Sentry 推奨で代替。モバイルアプリ化時に Crashlytics 検討**
- [ ] ベータユーザー 5〜10 名分のフィードバックが得られている → [10-beta-feedback.md](./10-beta-feedback.md) にフォーム URL を記載後、回収

## 設計メモ

### QA チェックリスト（抜粋）

詳細は [10-qa-test-cases.md](./10-qa-test-cases.md)。

- 機能テスト: アップロード形式、顔検出失敗、診断文、シェアカード、X/LINE、理想顔（同意あり/なし）
- 非機能: Lighthouse、60 秒完走、キーボード、コントラスト、OGP

### リーガル

- 利用規約・プライバシーポリシーのドラフト → 弁護士レビュー（必須）
- 写真の取り扱い・OpenAI 送信の明記（PP に追記済み）
- 「治る」「治療」「医療効果」「最も」「No.1」等の最終 grep（運用手順は QA 表 §7）

### モニタリング

- Firebase Analytics: 主要イベント（上表）
- エラー: `client_error`（GA）+ 将来 Sentry
- OpenAI: コスト / 使用量ダッシュボード

### ベータ公開

- 関係者 + 限定公開。フィードバックは Google フォーム等（[10-beta-feedback.md](./10-beta-feedback.md)）

## TODO

- [x] QA テストケース表を作成（Markdown）→ [10-qa-test-cases.md](./10-qa-test-cases.md)
- [x] 受け入れ基準と証跡の対応表 → [10-acceptance-matrix.md](./10-acceptance-matrix.md)
- [ ] iOS Safari / Android Chrome / PC Chrome / PC Safari / Edge で機能・表示確認
- [ ] Lighthouse 計測（LCP / Performance スコア）
- [ ] OGP 表示確認（Twitter Card Validator / Facebook Debugger / LINE 実機）
- [ ] 診断文のサンプル 20 件を生成し、禁止語・医療表現が含まれないか目視確認
- [x] 利用規約・プライバシーポリシーのドラフト（ページ掲載・Analytics 条項追記）
- [ ] 利用規約・プライバシーポリシーの**最終**法務レビュー完了
- [ ] 薬機法・景表法表現チェック（マーケ + 法務）
- [x] Firebase Analytics の主要イベントを実装（任意環境変数で有効化）
- [x] 未捕捉 JS エラーの軽量ログ（`client_error`）
- [ ] Crashlytics 本格導入 **または** Sentry 導入（Web 向け）
- [ ] OpenAI の使用量ダッシュボード確認、上限設定済み確認
- [ ] ベータユーザー 5〜10 名にリンク共有
- [ ] フィードバックフォームを用意し回収（URL を [10-beta-feedback.md](./10-beta-feedback.md) に記載）
- [ ] 致命バグの修正 → 本番反映
- [x] リリースノート（社内向け）テンプレート作成 → [10-release-notes-internal.md](./10-release-notes-internal.md)

## リファレンス

- requirements.md §5 非機能要件 / §11 受け入れ基準
- [10-monitoring.md](./10-monitoring.md)
