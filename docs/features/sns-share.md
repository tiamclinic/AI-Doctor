# SNS シェア導線（F-08）

シェアカード PNG をユーザーが Instagram Story / X / TikTok に投稿しやすい形に導く機能です。
**MVP では「PNG ダウンロード + Web Share API」が中心**で、各 SNS への直接投稿は OS / アプリ側に委ねています。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`components/ShareCardButton.tsx`](../../components/ShareCardButton.tsx) | ボタン UI / PNG 取得 / ダウンロード起動 |
| [`lib/share-card/client.ts`](../../lib/share-card/client.ts) | `requestShareCard()` / `triggerDownload()` |

## 体験フロー

1. 結果画面の `ShareCardButton` を押す
2. 内部的に `POST /api/share-card` を呼んで PNG を Blob で取得
3. デバイスに応じて:
   - **モバイル + Web Share API 利用可能**: `navigator.share({ files: [pngFile] })` でネイティブ共有シート
   - **それ以外**: `<a download>` 経由でローカル保存。ユーザー自身が SNS アプリに添付

## 設計判断

- **直接投稿（Instagram Graph API 連携など）は MVP では避ける**: OAuth / アプリ承認のオーバーヘッドが大きい
- **Web Share API はモバイル前提**: デスクトップでは多くのブラウザが files 共有未対応のため、ダウンロードフォールバック
- **シェアテキスト**: 自動付与しない（ユーザーが各 SNS で自由に書ける方が体験が良い）

## トラッキング

MVP では未実装。将来的に「シェアボタンが押された」「実際に外部アプリへ渡された」イベントを取りたい場合、ボタン押下時に PostHog / GA4 などへ送る形を想定。

## 将来拡張

- OGP メタタグ最適化（`/result/[id]` の動的 OGP）
- ハッシュタグ / メンションのテンプレ提供（コピー支援）
- 投稿後の戻り導線（ユーザー履歴 / コンテスト連動）

## 関連

- カード生成: [features/share-card](./share-card.md)
- API: [api/share-card.md](../api/share-card.md)
