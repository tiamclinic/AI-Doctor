# 16. 診断レポート印刷 / PDF 出力

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-16                                |
| 関連要件   | requirements.md §4.9.3              |
| 依存       | T-11, T-15                          |
| 優先度     | 中                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

院内カウンセリングで紙 or PDF を渡せるよう、**結果画面を A4 縦 1〜2 ページに収まる形で印刷**できるようにする。MVP は `window.print()` ＋ `@media print` 専用 CSS で実装し、PDF は **ブラウザの「PDF として保存」**で代用する。サーバー側 PDF レンダリングは Phase 2。

## ゴール / 受け入れ基準

- [x] 結果画面右上に **「印刷する」ボタン**（`<PrintButton />`）が表示される
- [x] クリックすると `window.print()` が呼ばれ、印刷ダイアログが開く
- [x] **A4 縦（210mm × 297mm）** で 1 ページ目に「ヘッダ + ヒーロー + 指標バー」、2 ページ目に「パーツ分析 + 総評 + 院方コメント + 免責」を配置
- [x] AI バッジ / 院方バッジが印刷でも判別可能（モノクロ印刷を想定して **形状でも区別**：AI = 細枠、院方 = 二重枠）
- [x] **ヘッダー固定**: 各印刷ページに `TIAM 美容バランスレポート` ＋ クリニック名 ＋ 結果 ID ＋ 日時
- [x] **フッター固定**: ページ番号（`1 / 2` 形式）＋ 免責 1 行
- [x] SNS シェア／再診断 CTA など **画面用 UI は印刷時に非表示**（`print:hidden`）
- [x] 写真はオーバーレイ込みで印刷される（Canvas → `<img>` への自動差し替えは不要）
- [x] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 配置

```
components/result/
  PrintButton.tsx               「印刷する」ボタン（aria-label 付き）
  PrintHeader.tsx               印刷専用のヘッダ（タイトル + クリニック + 日付 + 結果 ID）
  PrintFooter.tsx               印刷専用のフッタ（ページ番号 + 免責）
app/result/[id]/page.tsx        Print* を最上部 / 最下部に挿入
app/globals.css                 @media print セクションを追加
```

### `@media print` CSS の指針

```css
@page {
  size: A4 portrait;
  margin: 14mm 12mm 14mm 12mm;
}

@media print {
  html, body { background: #fff !important; color: #0B0B0B !important; }

  .print\:hidden { display: none !important; }

  .part-card {
    break-inside: avoid;
  }

  .result-hero { break-after: page; }

  .part-card .badge.ai     { border: 1px solid #0B0B0B; }
  .part-card .badge.doctor { border: 1px double #0B0B0B; }  /* モノクロでも判別可能 */

  /* Canvas は印刷時に CSS で非表示にすると消えるので、img 要素として残す前提のレイアウト */
}
```

### Tailwind の `print:` バリアント運用

- Tailwind v4 で `print:hidden` / `print:block` / `print:break-after-page` が利用できる
- ヘッダ / フッタ専用要素は通常時に `hidden` + `print:block`
- SNS / 再診断 CTA / 共有カードボタンは `print:hidden`

### ページ分割の目安

```text
A4 縦、290mm 印字幅
┌─────────────────────────────┐
│ PrintHeader (高さ ~15mm)    │
├─────────────────────────────┤
│ ResultHero (約 80mm)        │
│ MetricBarList (約 70mm)     │
│ === break-after-page ===    │
├─────────────────────────────┤
│ PartAnalysisGrid (約 130mm) │
│ DiagnosisText  (約 60mm)    │
│ Doctor disclaimer (約 20mm) │
├─────────────────────────────┤
│ PrintFooter (高さ ~10mm)    │
└─────────────────────────────┘
```

> **正確な高さは実機で要調整**。Chrome の「印刷プレビュー」で 100% 倍率と「背景のグラフィック」ON の指示書きも UI 上に注釈表示する。

### PDF 出力（暫定）

- MVP は **ブラウザ機能（送信先 → PDF として保存）**
- Phase 2: `@react-pdf/renderer` または `puppeteer` を Cloud Run 経由でサーバー出力
  - その場合は `app/api/report/route.ts` を追加し、PDF をストリームで返す設計

## TODO

- [x] `components/result/PrintButton.tsx` を実装（クリックで `window.print()`）
- [x] `components/result/PrintHeader.tsx` を実装（`print:block hidden` で印刷時のみ表示）
- [x] `components/result/PrintFooter.tsx` を実装（同上、ページ番号は CSS counter `counter(page)` を使用）
- [x] `app/globals.css` に `@page` と `@media print` を追加
- [x] 既存の SNS シェア / 再診断 / シェアカードボタンに `print:hidden` を付与
- [x] `app/result/[id]/page.tsx` に `<PrintButton />` と `<PrintHeader />` / `<PrintFooter />` を配置
- [x] パーツカードに `break-inside: avoid` を効かせる（`.part-card` クラス追加）
- [ ] **手動 QA**: Chrome / Safari / iOS Safari で印刷プレビューを撮り、`docs/assets/print-preview-*.png` に格納
- [ ] **手動 QA**: モノクロ印刷時に AI / 院方バッジが判別できることを確認
- [x] 本ドキュメント末尾に「ブラウザ別の癖」を追記
- [x] `npm run lint` / `npm run build` を通す

## ブラウザ別の癖（手動 QA 用）

| ブラウザ | 注意点 |
|----------|--------|
| **Chrome** | 「背景のグラフィック」を ON にしないとバッジの色・写真オーバーレイが薄くなる。倍率は 100% 推奨。ブラウザ標準のヘッダ／フッタ（URL・日付）は **OFF** にするとアプリ側の `PrintHeader` / `PrintFooter` と重複しない。 |
| **Safari（macOS）** | 余白が広めになりがち。レイアウトが 2 ページに収まらない場合は倍率を 95% 程度に調整。 |
| **iOS Safari** | 共有シート →「プリント」から PDF 保存可能。画面用 CTA は非表示になるが、プレビューで改ページ位置を必ず確認。 |

クリニック名は `NEXT_PUBLIC_CLINIC_NAME`（未設定時は `TIAM Beauty Lab`）で変更可能。

## リファレンス

- requirements.md §4.9.3
- MDN `@page`: https://developer.mozilla.org/ja/docs/Web/CSS/@page
- Tailwind `print:` バリアント
