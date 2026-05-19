# 20. 管理画面: 診断一覧（`/admin/diagnoses`）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-20                                |
| 関連要件   | requirements.md §4.9.5 副フロー / §4.9.6 / §4.10（F-09） |
| 依存       | T-19                                |
| 優先度     | 中（接客中フローでは必須ではないが、後日記入の保険導線として高）|
| 見積       | 2〜3 日                             |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

要件 v0.3.2 では **接客中の主要 UX は結果画面 → CTA → 編集画面**（T-15 / T-21）であり、本一覧画面は **後日記入・取りこぼし対応の副フロー（US-09）** に位置付けられる。

医師・院スタッフ（`admin` または `staff` クレーム保持者）が **過去の診断一覧を閲覧** し、目的の `resultId` を選択して個別編集画面（T-21）へ遷移できる管理画面を実装する。`/admin/login`・認証基盤は T-14 の資産（`AdminGuard`、`grant:admin` スクリプト）を **`staff` クレーム対応に拡張**して流用する。

## ゴール / 受け入れ基準

- [ ] `/admin/diagnoses` に **直近 30 件（既定）** の診断が表示される
- [ ] 一覧項目: 診断日時 / 総合スコア / `patientLabel`（未設定なら ID 末尾 6 桁）/ 記入状況バッジ（未記入 / 下書き / 公開）
- [ ] 行をクリックすると `/admin/diagnoses/{resultId}`（T-21）へ遷移
- [ ] 簡易フィルタ: 「未記入のみ」「下書きあり」「公開済み」
- [ ] ページング または「もっと読み込む」（最低限 50 件追加できる）
- [ ] 写真ポリシーが `thumbnail` のときはサムネイル列も表示（`none` のときは行アイコンのみ）
- [ ] **`admin` または `staff` クレーム保持者**にアクセス許可（クレームなしは `/admin/login` へリダイレクト）
- [ ] 未公開ノートが多い場合に備え、初期表示でデフォルトソートを「未記入優先」または「新しい順」から選べる
- [ ] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 配置

```
app/admin/diagnoses/
  page.tsx                      一覧ページ（"use client"）
components/admin/diagnoses/
  DiagnosisRow.tsx              1 行
  DiagnosisListFilters.tsx      フィルタ
  StatusBadge.tsx               未記入/下書き/公開
```

### データ取得

- `GET /api/diagnoses?limit=30&cursor=<createdAt>` （T-19 で実装）
  - 同時に各 `resultId` に対応する `doctor_notes/{resultId}` の `status` を結合して返す
  - もしくは個別 `GET /api/doctor-notes/{resultId}` を行単位で叩く（実装容易だが N+1 になり得るので一覧 API 側で JOIN を推奨）

### バッジ仕様

| status | 表示 | 色 |
|--------|------|----|
| なし | 「未記入」 | グレー |
| `draft` | 「下書き」 | アンバー |
| `published` | 「公開」 | エメラルド |

### UI 補助

- 既存トークン: shadcn `Table`（必要なら追加）、`Button`、`Input`
- 既存配色: `tiam-gold` / `tiam-rose`
- ヘッダ: ログアウト・トップへ戻る（T-14 と同様）
- noindex: `/admin/*` 共通レイアウト（T-14 流用）

### v0.3.2 における位置づけ

- 主要動線（接客中の追記）は **結果画面の CTA → T-21**（T-15 で実装）
- 本画面は以下のケース向け:
  - 接客中に書ききれず、後日まとめて記入する（US-09）
  - 患者から戻ってきた時間に過去診断を見直す
  - 公開済みノートを編集し直す
- そのため、UI は **「未記入を優先表示してすぐ拾える」**ことを重視する

## TODO

- [ ] `app/admin/diagnoses/page.tsx` を実装（`AdminGuard` で囲む。クレーム判定を staff 対応に拡張）
- [ ] `components/admin/diagnoses/*` を実装
- [ ] `GET /api/diagnoses` の JOIN 戦略を決め、サーバー側で `doctor_notes` の status を埋め込む
- [ ] フィルタ・ページング・デフォルトソート（未記入優先）
- [ ] noindex メタ（`/admin/*` の共通レイアウトに引き続き付与）
- [ ] Vitest（UI スナップショット最低限。admin / staff / 無認証の表示制御）
- [ ] `docs/api/diagnoses.md` の一覧パラメータを追記

## リファレンス

- requirements.md §4.9.5 副フロー / §4.9.6
- T-14 の `AdminGuard` / Firebase Auth セットアップ（staff クレーム対応に拡張）
- T-19 の `/api/diagnoses` API（admin / staff の OR 認可）
