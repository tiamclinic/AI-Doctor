# 15. 結果画面 v0.3.2（個別ノート併用表示 + ドクター追記 CTA）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-15                                |
| 関連要件   | requirements.md §4.9.3 / §4.9.6 / §5.2.1 / §5.3 |
| 依存       | T-11, T-19, T-21, T-22              |
| 優先度     | 高                                  |
| 見積       | 3〜4 日                             |
| 担当       | -                                   |
| ステータス | 完了                                |

> **再定義の経緯（2026-05-16）**: 旧版の T-15 は T-13（`/api/doctor-content` 共通テンプレ）から `body` を流し込む設計だったが、要件 v0.3.1 で個別ノート 1 本化、v0.3.2 で院内ツール運用（スタッフ事前ログイン + 結果画面からの追記 CTA）が確定したため、本チケットを **「結果画面 v0.3.2 化」** として再定義する。共通テンプレ層への依存はすべて撤去する（撤去そのものは T-23）。

## 概要

結果画面 `/result/[id]` を **個別ノート（`doctor_notes/{resultId}`）と AI 由来コメントの併用表示**に対応させる。同時に **スタッフ事前ログイン済みのブラウザ**でのみ表示される **「ドクター所見を追記」CTA** を実装し、`/admin/diagnoses/{resultId}` 編集画面へ追加ログインなしで遷移できるようにする。

## ゴール / 受け入れ基準

- [ ] 結果ページ初期表示時に `GET /api/doctor-notes/{resultId}` を取得し、各パーツカードに対応する `body` / `recommendedCare` を流し込む
- [ ] 各パーツカード内で **AI 由来ブロック / 医師由来ブロック**が縦に分かれて表示される（バッジ・色・区切り線で識別可能）
  - AI 由来: バッジ `TIAM AI`（ゴールド）
  - 医師由来: バッジ `当院医師より`（ローズゴールド）＋ 記入者名 / 公開日時
- [ ] 個別ノートが空 / 未公開（404）の場合、そのカードは **AI セクションのみ**を描画する（共通テンプレへのフォールバックは行わない）
- [ ] 共通免責文（薬機法・景表法配慮の定型注意書き）は **コード or 環境変数** で持つ静的文言として、結果画面ヘッダ／フッタに常時表示する
- [ ] 共通テンプレ層（`useDoctorContent` / `/api/doctor-content`）への参照を結果画面・関連コンポーネントから撤去する（実体削除は T-23）
- [ ] 結果画面ヘッダ部に **「ドクター所見を追記」ボタン**を配置し、以下条件で表示制御する
  - 表示: クライアントで Firebase Auth セッション有効、かつ `admin` または `staff` カスタムクレームを保持
  - 非表示: 未ログイン、`admin` / `staff` クレーム不所持、または Firebase Auth が未設定の環境
- [ ] CTA クリック時、`/admin/diagnoses/{resultId}` へ **追加ログイン要求なし**で遷移する
- [ ] 編集 → 反映後に結果画面に戻ったとき、**個別ノートを再取得**して即座に併用表示が更新される（クエリパラメータ `?refresh=1` 等で SWR キャッシュをバイパス）
- [ ] 印刷時（`@media print`）でも AI / 医師の視覚分離が崩れない（CTA は印刷時非表示）
- [ ] アクセシビリティ: AI / 医師の section 要素に `aria-label` を付ける
- [ ] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 配置（追加・変更）

```
components/result/
  PartAnalysisCard.tsx              既存（T-11）。医師ブロックを内側にレンダリング
  DoctorPartBlock.tsx               新規。バッジ + 本文 + 推奨ケア + 出典フッタ（記入者・日時）
  DoctorEditCta.tsx                 新規。ヘッダ右肩の追記ボタン（クレーム判定で出し分け）
hooks/
  useDoctorNote.ts                  /api/doctor-notes/{resultId} をキャッシュ込みで取得
  useStaffSession.ts                Firebase Auth + custom claims を購読（admin / staff）
app/result/[id]/page.tsx            useDoctorNote / useStaffSession を呼んで合成
```

### `useDoctorNote` の挙動

- 初回マウントで `fetch('/api/doctor-notes/{resultId}', { cache: 'force-cache' })`
- 戻り値: `{ data, error, isLoading, refresh }`
- 404（未公開・未作成）は `data: null` で正常返却し、エラーとして扱わない
- `refresh()` を編集画面から戻ってきた直後に呼んでキャッシュバイパス再フェッチ

### `useStaffSession` の挙動

- `firebase/auth` の `onIdTokenChanged` を購読
- ID トークンを取得 → `getIdTokenResult()` で `claims.admin === true || claims.staff === true` を判定
- 戻り値: `{ user, claims, isStaff, isLoading }`
- Firebase Auth が未設定（`isFirebaseAuthConfigured() === false`）の環境では常に `isStaff: false`
- 既存 `components/admin/AdminGuard.tsx` のロジックを **hook 化して再利用**する（重複実装しない）

### CTA（`DoctorEditCta`）

- 配置: 結果画面ヘッダ右肩、または「シェア」ボタンの隣（モックの空きスペースに合わせる）
- 表示条件: `isStaff === true` のみ
- ラベル: 「ドクター所見を追記」（既に published ノートがある場合は「ドクター所見を編集」）
- クリック時: `router.push("/admin/diagnoses/{resultId}")`
- 印刷スタイル: `@media print { display: none }`

### バッジと色

| ブロック | バッジ        | テキスト色          | アクセント                      |
| -------- | ------------- | ------------------- | ------------------------------- |
| AI       | `TIAM AI`     | `text-tiam-primary` | `bg-tiam-gold/10` / `border-tiam-gold/40` |
| 医師     | `当院医師より` | `text-tiam-primary` | `bg-tiam-rose/10` / `border-tiam-rose/40` |

### マークアップ規約（HTML）

```html
<article class="part-card">
  <header>目（左右対称性）</header>

  <section aria-label="AI 由来コメント">
    <span class="badge ai">TIAM AI</span>
    <p>左右の比率が黄金比に近く整っています。</p>
  </section>

  <!-- doctor_notes が published のときのみ -->
  <section aria-label="当院医師より">
    <span class="badge doctor">当院医師より</span>
    <p>{note.parts.eyes.body}</p>
    <ul>{recommendedCare.map(...)}</ul>
    <footer>{updatedBy} ／ {publishedAt}</footer>
  </section>
</article>
```

### 共通免責（静的文言）

- v0.3.2 で **コード or 環境変数の静的文言**として扱う（データ依存しない）
- 配置: 結果画面ヘッダ直下のミニバナー、フッタの定型文として常時表示
- 文言キー（例）: `NEXT_PUBLIC_RESULT_DISCLAIMER`, `NEXT_PUBLIC_RESULT_PREAMBLE` など、または `lib/result/disclaimer.ts` で定数管理

### 旧 T-15 仕様との差分（撤去対象）

- `useDoctorContent` フックの利用を結果画面から外す（hook 自体の削除は T-23）
- `DoctorContentNotice` の `preamble` / `disclaimer` 流し込みを廃止し、静的文言に置き換え
- `components/result/PartAnalysisGrid.tsx` の `doctorContent` プロップを撤去（`doctorNote` プロップに差し替え）

### 法的観点

- AI 部分は **医療診断ではない**ことが既に明示済（`DiagnosisText` フッタ）
- 医師部分は **当院医師が当該来院者の AI スコアを見て記述した個別所見**として明示（記入者・日時を必ず併記）
- **両者を区別できない混在 UI は禁止**（共有 PDF/PNG にしても見分けが付く必要）

### CTA を押した後のセッションフォールバック

- 編集画面側（T-21）でクレーム失効を検知した場合は結果画面 / `/admin/login` にリダイレクトするので、本チケットは **CTA 表示時点の判定**のみ責任を持つ
- 万一 CTA 表示後にセッション失効した場合でも、編集画面側のガードで救う

## TODO

- [ ] `hooks/useDoctorNote.ts` を実装（`fetch` + `useState` + 404 ハンドリング + `refresh()`）
- [ ] `hooks/useStaffSession.ts` を実装（`AdminGuard` のロジックを hook に切り出し）
- [ ] `components/result/DoctorPartBlock.tsx` を実装（バッジ・本文・推奨ケア・出典フッタ）
- [ ] `components/result/DoctorEditCta.tsx` を実装（クレーム判定で出し分け）
- [ ] `components/result/PartAnalysisCard.tsx` に `<DoctorPartBlock>` を組み込み、`body` 空のときは描画しない
- [ ] `app/result/[id]/page.tsx` で `useDoctorNote` / `useStaffSession` を呼び、各カードに渡す
- [ ] 静的免責文言を `lib/result/disclaimer.ts` 等に定数化
- [ ] `useDoctorContent` への参照を結果ページ系コンポーネントから外す（実体削除は T-23）
- [ ] `app/globals.css` の `@media print` セクションで AI / 医師ブロックの境界線を維持、CTA を非表示
- [ ] `components/result/__tests__/PartAnalysisCard.test.tsx` を更新（医師 body 空 → 非表示、ある → 表示、aria-label 付与）
- [ ] CTA テスト: スタッフセッションあり → 表示／なし → 非表示
- [ ] 結果ページの目視確認（個別ノート空・公開済み・スタッフ閲覧時 / 来院者閲覧時の 4 ケース）
- [ ] `docs/architecture/data-flow.md` を更新（`/api/doctor-notes` への置き換え、CTA 経由の編集動線）
- [ ] `npm run lint` / `npm run build` を通す

## リファレンス

- requirements.md §4.9.3 / §4.9.6 / §5.2.1 / §5.3
- T-11: `docs/11-result-mock-ui.md`
- T-19: `docs/19-diagnoses-persistence.md`
- T-21: `docs/21-admin-diagnoses-edit.md`
- T-22: `docs/22-doctor-notes-api.md`
- T-23: `docs/23-deprecate-doctor-content.md`（共通テンプレ層撤去）
