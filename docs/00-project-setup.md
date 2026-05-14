# 00. プロジェクト基盤セットアップ

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-00                                |
| 関連要件   | -（共通基盤）                       |
| 依存       | なし                                |
| 優先度     | 高                                  |
| 見積       | 3 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

Next.js 16 + Tailwind CSS v4 のベースは作成済み。ここではアプリ全体で使う共通基盤（デザイントークン、レイアウト、shadcn/ui、env、共通 UI、規約同意モーダル等）を整備する。

## ゴール / 受け入れ基準

- [x] リポジトリルートで `npm run dev` / `npm run build` / `npm run lint` がエラーなく通る
- [x] TIAM ブランドカラー・フォントが Tailwind / globals.css に反映されている
- [x] shadcn/ui を導入し、`Button` / `Dialog` / `Card` などの基本コンポーネントが使える状態
- [x] `.env.local.example` が用意されている（`OPENAI_API_KEY` などのキー名のみ）
- [x] 共通レイアウト（ヘッダ / フッタ / 背景）がトップで表示される
- [x] 利用規約・プライバシーポリシーへの同意モーダル（雛形）が動作する

## 設計メモ

### ブランドトークン（globals.css）

```css
:root {
  --color-primary: #0B0B0B;
  --color-accent-gold: #C9A96E;
  --color-accent-rose: #D9A6A6;
  --color-bg: #FAFAFA;
}
```

### フォント

- Noto Serif JP / Noto Sans JP: `next/font/google` で読み込み
- Cormorant Garamond / Inter: `next/font/google`

### ディレクトリ追加

```
（リポジトリルート）
  app/
    layout.tsx                共通レイアウト（フォント・メタデータ）
    page.tsx                  ランディング
    (legal)/
      terms/page.tsx
      privacy/page.tsx
  components/
    ui/                       shadcn/ui 自動生成
    layout/Header.tsx
    layout/Footer.tsx
    common/ConsentDialog.tsx  規約同意モーダル
  lib/
    cn.ts                     clsx + tailwind-merge ヘルパ
```

## TODO

- [x] shadcn/ui のセットアップ（`npx shadcn@latest init`、`Button` `Dialog` `Card` `Progress` `Tabs` 追加）
- [x] `next/font` で Noto Serif JP / Noto Sans JP / Cormorant Garamond / Inter を読み込み
- [x] `globals.css` にブランドカラー CSS 変数を定義し、Tailwind v4 のテーマ設定で参照
- [x] `app/layout.tsx` を更新（メタデータ、`lang="ja"`、フォント適用、共通ヘッダ／フッタ）
- [x] `components/layout/Header.tsx` 作成（TIAM ロゴ＋シンプルなナビ）
- [x] `components/layout/Footer.tsx` 作成（規約・プライバシー・コピーライト）
- [x] `components/common/ConsentDialog.tsx` 作成（写真利用と OpenAI 送信の同意チェック）
- [x] `app/(legal)/terms/page.tsx` `app/(legal)/privacy/page.tsx` の雛形作成
- [x] `.env.local.example` を作成し `OPENAI_API_KEY` `OPENAI_ORG_ID` `NEXT_PUBLIC_APP_URL` を記載
- [x] `.gitignore` に `.env.local` が含まれていることを確認（`.env.local.example` は追跡可能に例外追加）
- [x] `lib/cn.ts` 作成（`clsx` + `tailwind-merge`）
- [x] `npm run lint` / `npm run build` がエラーなく通ることを確認

## リファレンス

- requirements.md §6.1 技術スタック / §7 デザイン要件
