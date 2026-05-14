# 08. SNS シェア

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-08                                |
| 関連要件   | F-08                                |
| 依存       | T-06                                |
| 優先度     | 中                                  |
| 見積       | 1 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

結果画面・シェアカードを SNS で共有しやすくする導線を整備する。X / LINE は Web Intent、Instagram は画像ダウンロード（`navigator.share` 優先）＋ストーリーズ手動投稿の案内。

## ゴール / 受け入れ基準

- [x] 結果画面に「X で共有」「LINE で共有」「画像をダウンロード」ボタンが並ぶ
- [x] X 共有: 既定文言 + 結果ページ URL + 既定ハッシュタグでツイートが起動（画像は Web Intent では添付不可のため、シェアカード PNG は別途生成／ダウンロード）
- [x] LINE 共有: LINE Social Plugin で結果ページ URL を共有
- [x] Instagram: シェアカード PNG のダウンロード（共有シート可）＋ストーリーズ手動投稿の案内文を表示
- [x] 結果ページの OGP（`layout` + `opengraph-image`）が SNS クローラ向けに展開される（個人スコアは URL 単体ではサーバに無いため、ブランド＋結果 ID の汎用 OG 画像）

## 実装ファイル

| パス | 役割 |
|------|------|
| `lib/share/shareUrls.ts` | X / LINE の Web Intent URL、結果ページ URL、既定ツイート文 |
| `components/share/ShareButtons.tsx` | X / LINE / Instagram 用ダウンロード＋案内 |
| `components/share/CopyLinkButton.tsx` | 結果ページ URL のクリップボードコピー |
| `app/result/[id]/layout.tsx` | `generateMetadata`（canonical / og / twitter） |
| `app/result/[id]/opengraph-image.tsx` | 1200×630 の動的 OG 画像（Noto Sans JP） |
| `app/result/[id]/page.tsx` | 上記コンポーネントの配置・`sharePageUrl` の組み立て |

## 設計メモ

### URL 生成

- `NEXT_PUBLIC_APP_URL` があれば共有リンクのベースに使用。無い場合は `window.location.origin`（クライアント）。
- X: `https://twitter.com/intent/tweet?...`
- LINE: `https://social-plugins.line.me/lineit/share?url=...`

### ハッシュタグ

- 既定: `TIAMビューティー診断`, `TIAMAI`（intent の `hashtags` 用、先頭 `#` なし）

### Phase 2（任意）

- 共有 URL 短縮、結果データ永続化後のスコア入り動的 OGP

## TODO

- [x] `lib/share/shareUrls.ts` で X / LINE の URL 生成関数を実装
- [x] `components/share/ShareButtons.tsx` を実装（横並び、アイコン付き）
- [x] `components/share/CopyLinkButton.tsx` を実装（クリップボードコピー）
- [x] 結果画面に `ShareButtons` を配置
- [x] Instagram 用にダウンロード + ガイド文（ストーリーズ投稿手順）を表示
- [x] `navigator.share` が使える環境では優先する
- [x] ハッシュタグ・既定文言の文言案（景表法・薬機法を意識した参考表現）
- [x] OGP 画像（動的 `opengraph-image`）が Twitter Card / LINE で展開されることを本番 URL で確認推奨
- [ ] 共有 URL 短縮（必要なら Phase 2）

## リファレンス

- requirements.md §4.8 F-08
