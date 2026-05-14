# 15. 結果画面への院方コンテンツ併用表示（AI と視覚分離）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-15                                |
| 関連要件   | requirements.md §4.9.3 / §5.3       |
| 依存       | T-11, T-13                          |
| 優先度     | 高                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

T-11 で用意したパーツカードの `DoctorPartSlot` に、**T-13 の `/api/doctor-content` から取得した医師記述**を流し込み、**AI 由来コメントと医師由来コメントを視覚的に明確に分離**して表示する。法的に最重要のチケット。

## ゴール / 受け入れ基準

- [ ] 結果ページ初期表示時に `/api/doctor-content` を SWR 的に取得し、各パーツに対応する `body` を `PartAnalysisCard` に流し込む
- [ ] 各パーツカード内で **AI 由来ブロック / 医師由来ブロック**が縦に分かれて表示される（バッジ・色・区切り線で識別可能）
  - AI 由来: バッジ `TIAM AI`（ゴールド）
  - 医師由来: バッジ `院方コメント`（ローズゴールド）＋ ロゴ or 「TIAM 顧問医師」表記
- [ ] 医師コメント末尾に **共通免責文**（`preamble` / `disclaimer` from `DoctorContent`）が出る
- [ ] 医師コメントが空（`body` 未入力／空文字）の場合、そのカードは AI セクションのみ表示し、医師セクションは描画しない
- [ ] 取得失敗時はカード全体は壊れず、医師セクションだけ非表示 + 上部に控えめなトースト
- [ ] 印刷時（`@media print`）でも AI / 医師の視覚分離が崩れない（T-16 で本格対応するが、本チケットでは破綻させない）
- [ ] アクセシビリティ: AI / 医師の section 要素に `aria-label` を付ける
- [ ] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 配置（追加・変更）

```
components/result/
  PartAnalysisCard.tsx              既存（T-11）。医師ブロックを内側にレンダリング
  DoctorPartBlock.tsx               新規。バッジ + 本文 + 出典フッタ
  DoctorContentNotice.tsx           新規。共通免責バナー（preamble / disclaimer）
hooks/
  useDoctorContent.ts               /api/doctor-content をキャッシュ込みで取得
app/result/[id]/page.tsx            useDoctorContent を呼んで PartAnalysisCard に流す
```

### `useDoctorContent` の挙動

- 初回マウントで `fetch('/api/doctor-content', { cache: 'force-cache' })`
- `If-None-Match` は Next.js 側のフェッチキャッシュが処理
- 5 分間は再フェッチしない（T-13 のキャッシュ仕様と整合）
- 戻り値: `{ data, error, isLoading }`（`useSyncExternalStore` でも可）

### バッジと色

| ブロック | バッジ        | テキスト色          | アクセント                      |
| -------- | ------------- | ------------------- | ------------------------------- |
| AI       | `TIAM AI`     | `text-tiam-primary` | `bg-tiam-gold/10` / `border-tiam-gold/40` |
| 医師     | `院方コメント` | `text-tiam-primary` | `bg-tiam-rose/10` / `border-tiam-rose/40` |

### マークアップ規約（HTML）

```html
<article class="part-card">
  <header>目（左右対称性）</header>

  <section aria-label="AI 由来コメント">
    <span class="badge ai">TIAM AI</span>
    <p>左右の比率が黄金比に近く整っています。</p>
  </section>

  <section aria-label="院方コメント">
    <span class="badge doctor">院方コメント</span>
    <p>{doctor.parts.eyes.body}</p>
    <footer>TIAM 顧問医師</footer>
  </section>
</article>
```

### 共通免責（フッタ位置）

- `preamble` は **総評の上**、`disclaimer` は **総評の下＋シェアブロックの上**に配置
- どちらも最大 400 字（T-13 の制限と一致）

### 法的観点

- AI 部分は **医療診断ではない**ことが既に明示済（`DiagnosisText` フッタ）
- 医師部分は **TIAM 顧問医師が記述した美容バランスについての所見**として明示
- **両者を区別できない混在 UI は禁止**（共有 PDF/PNG にしても見分けが付く必要）

## TODO

- [ ] `hooks/useDoctorContent.ts` を実装（`fetch` + `useState` + エラー処理）
- [ ] `components/result/DoctorPartBlock.tsx` を実装（バッジ・本文・出典）
- [ ] `components/result/DoctorContentNotice.tsx` を実装（preamble / disclaimer 共通バナー）
- [ ] `components/result/PartAnalysisCard.tsx` に `<DoctorPartBlock>` を組み込み、`body` が空のときは描画しない
- [ ] `app/result/[id]/page.tsx` で `useDoctorContent()` を呼び、各カードに `doctorContent.parts[partId]` を渡す
- [ ] `app/globals.css` の `@media print` セクションで AI / 医師ブロックの境界線を維持
- [ ] `components/result/__tests__/PartAnalysisCard.test.tsx` を追加（医師 body 空 → 非表示、ある → 表示、aria-label が付く）
- [ ] 結果ページの目視確認（医師コメント空・ある・取得失敗の 3 ケース）
- [ ] `docs/architecture/data-flow.md` を更新（結果ページのフェッチ経路に `/api/doctor-content` を追加）
- [ ] `npm run lint` / `npm run build` を通す

## リファレンス

- requirements.md §4.9.3, §5.3
- T-11: `docs/11-result-mock-ui.md`
- T-13: `docs/13-doctor-content-model-api.md`
