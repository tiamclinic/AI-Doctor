# 08. SNS シェア

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-08                                |
| 関連要件   | F-08                                |
| 依存       | T-06                                |
| 優先度     | 中                                  |
| 見積       | 1 日                                |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

結果画面・シェアカードを SNS で共有しやすくする導線を整備する。X / LINE は Web Intent、Instagram は画像ダウンロード経由でストーリーズ投稿を案内する。

## ゴール / 受け入れ基準

- [ ] 結果画面に「X で共有」「LINE で共有」「画像をダウンロード」ボタンが並ぶ
- [ ] X 共有: シェアカード画像 + 結果ページ URL + 既定ハッシュタグでツイートが起動
- [ ] LINE 共有: LINE Social Plugin で結果ページ URL を共有
- [ ] Instagram: 画像ダウンロード後、ストーリーズ手動投稿の案内文を表示
- [ ] 結果ページの OGP 画像が SNS で正しく展開される

## 設計メモ

### 配置

```
components/share/
  ShareButtons.tsx
  CopyLinkButton.tsx
lib/share/
  shareUrls.ts       X / LINE の Web Intent URL 生成
```

### URL 生成例

```ts
// X (Twitter)
const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pageUrl)}&hashtags=TIAMビューティー診断,TIAMAI`;

// LINE
const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`;
```

### Instagram

- Instagram には公式 Web 共有 API がないため、画像 DL → ストーリーズ手動投稿のフローを案内する
- iOS の場合 `<a download>` が効かない場合があるため、`navigator.share`（Web Share API Level 2）でフォールバック

### ハッシュタグ

- 既定: `#TIAMビューティー診断` `#TIAMAI`
- 文言は短くキャッチー、結果値（`スコア 86.4 でした！`）を自動挿入

## TODO

- [ ] `lib/share/shareUrls.ts` で X / LINE の URL 生成関数を実装
- [ ] `components/share/ShareButtons.tsx` を実装（横並び、アイコン付き）
- [ ] `components/share/CopyLinkButton.tsx` を実装（クリップボードコピー）
- [ ] 結果画面に `ShareButtons` を配置
- [ ] Instagram 用にダウンロード + ガイド文（ストーリーズ投稿手順）を表示
- [ ] `navigator.share` が使える環境では優先する
- [ ] ハッシュタグ・既定文言の文言案を作成（マーケ確認）
- [ ] OGP 画像（T-06）が Twitter Card / LINE で展開されることを確認
- [ ] 共有 URL 短縮（必要なら Phase 2）

## リファレンス

- 要件定義書 §4.8 F-08
