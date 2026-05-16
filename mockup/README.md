# クライアント確認用 UI モック

実装は **`app/mockup/`**（Next.js ルート）にあります。後日削除予定です。

## URL（開発サーバー起動時）

| 画面 | URL |
|------|-----|
| 一覧・導線 | `/mockup` |
| 結果（追記前・編集ボタンあり） | `/mockup/result` |
| 編集（総評＋パーツ別の所見入力 UI） | `/mockup/edit` |
| 結果（反映後・総評・パーツに医師ブロック併記） | `/mockup/result-after` |

- 検索エンジン向け: `app/mockup/layout.tsx` で `robots: noindex` を指定済みです。
