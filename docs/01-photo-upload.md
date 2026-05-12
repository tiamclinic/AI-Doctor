# 01. 写真アップロード機能

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-01                                |
| 関連要件   | F-01                                |
| 依存       | T-00                                |
| 優先度     | 高                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

ユーザーが端末から顔写真をアップロードする UI を実装する。ドラッグ＆ドロップ、ファイル選択、スマホでの撮影に対応し、HEIC は JPEG に変換してプレビューする。

## ゴール / 受け入れ基準

- [x] トップページに大きなアップロードエリアがあり、クリック／ドラッグ＆ドロップでファイル選択できる
- [x] スマートフォンの場合は「撮影する／写真を選ぶ」を分けて提示（`<input capture>` 利用）
- [x] JPEG / PNG / HEIC / WebP をサポート、10 MB 超は弾く
- [x] HEIC は自動で JPEG に変換してプレビューできる
- [x] アップロード後にプレビューが表示され、「やり直す」「次へ進む」ボタンが出る
- [x] 規約同意モーダル未承認なら次へ進めない

## 設計メモ

### 配置

- `app/page.tsx`: ランディング。`DiagnoseEntry`（同意 → アップロード）を配置
- `components/DiagnoseEntry.tsx`: 同意状態は `useSyncExternalStore` + `sessionStorage`（`lib/consent.ts`）
- `components/PhotoUploader.tsx`: ドラッグ＆ドロップ・撮影／ギャラリー・プレビュー
- `lib/image/heicToJpeg.ts`: HEIC → JPEG（`heic2any` を **動的 import** し SSR で `window` 参照を回避）
- `lib/image/validate.ts` / `readDataUrl.ts`: バリデーションと Data URL 化
- `lib/store/diagnosis-store.ts`: Zustand で `File` と Data URL を保持 → `/diagnose` へ

### コンポーネント API

```ts
type PhotoUploaderProps = {
  onSelect: (file: File, dataUrl: string) => void;
  maxSizeMB?: number; // default 10
};
```

### 受け渡し

選択した `File` と `dataUrl` を Zustand など軽量 store もしくは React Context で `/diagnose` ページに渡す（クライアント完結。サーバーには送信しない）。

## TODO

- [x] `components/PhotoUploader.tsx` を作成（ドラッグ＆ドロップ + クリック選択）
- [x] スマホ用に `<input type="file" accept="image/*" capture="user">` を分岐表示
- [x] `lib/image/validate.ts` で MIME と容量チェック、エラーメッセージを定義
- [x] HEIC 変換用ライブラリの選定・導入（`heic2any`）
- [x] `lib/image/heicToJpeg.ts` を実装（動的 import で SSR 安全、HEIC のみ JPEG に変換）
- [x] プレビュー UI を実装（4:5 アスペクト＋三分割ガイド）
- [x] 「やり直す」「次へ進む」ボタンを実装
- [x] 規約同意（`sessionStorage` + `useSyncExternalStore`）と連携し、未同意なら次へ進めない
- [x] Zustand（`lib/store/diagnosis-store.ts`）で写真を保持し `/diagnose` に引き渡し
- [x] エラーハンドリング（容量超過 / 形式不正 / HEIC 変換失敗）
- [ ] スマホ実機で表示と挙動を確認（iOS Safari / Android Chrome）（リリース前 QA）

## リファレンス

- 要件定義書 §4.1 F-01
