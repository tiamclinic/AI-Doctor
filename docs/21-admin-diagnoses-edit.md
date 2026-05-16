# 21. 管理画面: 診断個別ノート編集（`/admin/diagnoses/{resultId}`）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-21                                |
| 関連要件   | requirements.md §4.9.5 / §4.9.6 / §4.10（F-09）/ §5.2.1 |
| 依存       | T-19, T-22（T-20 は副フローの入口で必須ではない）|
| 優先度     | 高                                  |
| 見積       | 4〜5 日                             |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

医師・院スタッフが **1 件の診断（`resultId`）** を開き、AI スコア・パーツ分析・診断テキストを **参照しながら** パーツ別に個別ノートを記入・公開する画面を実装する。T-14 の `/admin/doctor-content` 編集 UI（タブ・カウンタ・禁止語警告・プレビュー）を **構造的に流用** するが、対象が単一テンプレから **診断 ID 単位の個別ノート** に変わる点が決定的に異なる。

要件 v0.3.2 における **接客中の主要 UX のゴール画面**。結果画面（T-15）の「ドクター所見を追記」CTA から **追加ログインなし**で本画面に到達し、書き込み API は **`admin` または `staff` クレーム必須**で保護する。

## ゴール / 受け入れ基準

- [ ] `/admin/diagnoses/{resultId}` で診断 1 件のスコア・診断テキスト・サムネイル（あれば）を参照表示
- [ ] パーツ別タブ（目 / 鼻 / 口元 / 輪郭 / 左右対称性）で `body` / `recommendedCare` / `internalMemo` を編集
- [ ] 文字数カウンタ（最大 800 字 / `internalMemo` は 400 字）と禁止語警告（既存 `scanForbidden`）
- [ ] `patientLabel` の入力フィールド（任意・後付け）。`PATCH /api/diagnoses/{resultId}` で保存
- [ ] 「プレビュー」… 結果画面のパーツカードと同じレイアウトで合成表示（実スコア + 入力中ノート）
- [ ] 「下書き保存」… `PUT /api/doctor-notes/{resultId}` を `status: "draft"` で送る
- [ ] 「反映（公開）」… `status: "published"` + `publishedAt` を付けて送信。サーバー側で再度禁止語検証
- [ ] 「公開取り消し」… `status: "draft"` に戻す（来院者の結果画面から消える）
- [ ] 反映直後、結果画面 `/result/{resultId}?refresh=1` へ戻る導線を表示（接客中フローのループ）
- [ ] **`admin` または `staff` クレーム保持者のみアクセス可**。クレームなしは `/result/{resultId}` または `/admin/login` へリダイレクト
- [ ] **API 側でも常に Bearer ID トークン + `admin`/`staff` クレームを検証**（クライアントガードを迂回した直叩きを拒否）
- [ ] セッション失効中に保存 → 401 が返ったら、結果画面または `/admin/login` に誘導するエラー UI を表示
- [ ] 編集中に未保存変更がある状態で離脱しようとした場合の `beforeunload` 警告
- [ ] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 配置

```
app/admin/diagnoses/[resultId]/
  page.tsx                          編集ページ（"use client" + AdminGuard）
components/admin/diagnoses/
  DiagnosisReferencePanel.tsx       左カラム: AI スコア・パーツ分析・診断テキスト（読み取り専用）
  DoctorNoteEditor.tsx              右カラム: タブ + テキスト + カウンタ + 禁止語
  DoctorNotePreview.tsx             プレビュー（PartAnalysisCard を流用）
  PatientLabelField.tsx             カルテ識別子の編集
lib/admin/notes/
  client.ts                         PUT/PATCH の呼び出し
```

### 左カラム（読み取り専用）

- `DiagnosisRecord` から:
  - 総合スコア（円形プログレス）
  - メトリクスバー（既存 `MetricBarList` を流用）
  - パーツ別スコア（`getPartDisplayScore`）
  - AI 診断テキスト（総評・強み・改善・推奨ケア）
  - `photoPolicy === "thumbnail"` ならサムネイル表示

### 右カラム（編集）

- 既存 `components/admin/DoctorContentEditor.tsx` をベースに `DoctorNoteEditor` を新規作成
  - 差分: `recommendedCare`（最大 5 件の箇条書き）と `internalMemo`（来院者非公開）を追加
  - 共通テンプレ層は使わないため「テンプレからコピー」機能は **持たない**

### 状態管理

- ローカルステート（`useState`）で十分。`useEffect` で fetch 取得 → state 反映
- 未保存変更ありで離脱しようとした場合の `beforeunload` 警告

### 認可

- クライアント側: `AdminGuard`（または T-15 の `useStaffSession`）で **`admin` または `staff` クレーム保持者**のみ通す
- サーバー側: T-22（`PUT /api/doctor-notes/{resultId}`）と T-19（`PATCH /api/diagnoses/{resultId}`）で **Bearer + クレーム検証**を必須化
- 未認証 / クレーム不足のアクセスは:
  - 直アクセス: `/admin/login` にリダイレクト（`?next=/admin/diagnoses/{resultId}` でログイン後復帰）
  - 結果画面 CTA からの遷移直後にセッション失効: `/result/{resultId}` に戻し、トーストで再ログインを促す
- v0.3.2 で「結果画面 → 編集画面」の遷移は追加ログインを要求しないが、これは **同一セッション継続前提**であり、認可が緩いわけではない

### プレビュー

- 既存 `PartAnalysisCard`（T-11）に `aiSummary`（`getPartSummary` のリアル値）+ 個別ノートを差し込む
- 公開後の見た目を可能な限り再現する（バッジ「当院医師より（{記入者名} / {日時}）」も合成）

## TODO

- [ ] 型: `lib/doctor-notes/types.ts`（`DoctorNote` / `DoctorPartNote` の Zod スキーマ。T-22 と共有）
- [ ] `app/admin/diagnoses/[resultId]/page.tsx`（`AdminGuard` を staff 対応に拡張して使用）
- [ ] `components/admin/diagnoses/*` 4 つ
- [ ] `lib/admin/notes/client.ts`（PUT / PATCH。401 時はリダイレクト誘導）
- [ ] 編集ロード時の `useDiagnosisRecord` + `useDoctorNote` フック
- [ ] 反映成功時に `router.push('/result/{resultId}?refresh=1')` を呼び、結果画面 CTA からの戻り経路を成立させる
- [ ] 既存 `DoctorContentEditor` のロジック分離（再利用部分を hook 化）
- [ ] Vitest（フォームバリデーション / 禁止語 / プレビュー出力 / admin・staff・無認証の認可）
- [ ] `docs/api/doctor-notes.md` をリンク
- [ ] スクリーンショットを `docs/14-doctor-admin-cms.md` の置き換え用に追加

## リファレンス

- requirements.md §4.9.5 / §4.9.6 / §5.2.1
- T-14 `/admin/doctor-content` 既存 UI（流用元）
- T-11 `PartAnalysisCard`（プレビュー流用）
- T-15 結果画面 CTA（編集画面の入口）
- T-19 / T-22 の API（admin / staff の OR 認可）
