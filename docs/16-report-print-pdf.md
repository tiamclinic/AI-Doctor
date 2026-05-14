# 16. 診断レポート印刷 / PDF 出力

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-16                                |
| 関連要件   | requirements.md §4.9.3              |
| 依存       | T-11, T-15                          |
| 優先度     | 中                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

院内カウンセリングで紙 or PDF を渡せるよう、**結果画面を A4 縦 1〜2 ページに収まる形で印刷**できるようにする。MVP は `window.print()` ＋ `@media print` 専用 CSS で実装し、PDF は **ブラウザの「PDF として保存」**で代用する。サーバー側 PDF レンダリングは Phase 2。

## ゴール / 受け入れ基準

- [ ] 結果画面右上に **「印刷する」ボタン**（`<PrintButton />`）が表示される
- [ ] クリックすると `window.print()` が呼ばれ、印刷ダイアログが開く
- [ ] **A4 縦（210mm × 297mm）** で 1 ページ目に「ヘッダ + ヒーロー + 指標バー」、2 ページ目に「パーツ分析 + 総評 + 院方コメント + 免責」を配置
- [ ] AI バッジ / 院方バッジが印刷でも判別可能（モノクロ印刷を想定して **形状でも区別**：AI = 細枠、院方 = 二重枠）
- [ ] **ヘッダー固定**: 各印刷ページに `TIAM 美容バランスレポート` ＋ クリニック名 ＋ 結果 ID ＋ 日時
- [ ] **フッター固定**: ページ番号（`page 1/2` 等）＋ 免責 1 行
- [ ] SNS シェア／再診断 CTA など **画面用 UI は印刷時に非表示**（`print:hidden`）
- [ ] 写真はオーバーレイ込みで印刷される（Canvas → `<img>` への自動差し替えは不要）
- [ ] `npm run lint` / `npm run build` がクリーン

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

- [ ] `components/result/PrintButton.tsx` を実装（クリックで `window.print()`）
- [ ] `components/result/PrintHeader.tsx` を実装（`print:block hidden` で印刷時のみ表示）
- [ ] `components/result/PrintFooter.tsx` を実装（同上、ページ番号は CSS counter `counter(page)` を使用）
- [ ] `app/globals.css` に `@page` と `@media print` を追加
- [ ] 既存の SNS シェア / 再診断 / シェアカードボタンに `print:hidden` を付与
- [ ] `app/result/[id]/page.tsx` に `<PrintButton />` と `<PrintHeader />` / `<PrintFooter />` を配置
- [ ] パーツカードに `break-inside: avoid` を効かせる（`.part-card` クラス追加）
- [ ] **手動 QA**: Chrome / Safari / iOS Safari で印刷プレビューを撮り、`docs/assets/print-preview-*.png` に格納
- [ ] **手動 QA**: モノクロ印刷時に AI / 院方バッジが判別できることを確認
- [ ] `docs/16-report-print-pdf.md` 末尾に「ブラウザ別の癖」（Safari の余白、Chrome のヘッダ・フッタ自動出力）を追記
- [ ] `npm run lint` / `npm run build` を通す

## リファレンス

- requirements.md §4.9.3
- MDN `@page`: https://developer.mozilla.org/ja/docs/Web/CSS/@page
- Tailwind `print:` バリアント
