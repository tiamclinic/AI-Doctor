# 写真アップロード（F-01）

ユーザーが端末の写真ライブラリやカメラから顔写真を選び、4:5 にクロップして次画面へ渡すまでを担当します。
**この時点ではサーバーには一切送信しません**。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`components/PhotoUploader.tsx`](../../components/PhotoUploader.tsx) | 入力 UI / ドラッグ&ドロップ / カメラ起動 |
| [`components/PhotoCropper.tsx`](../../components/PhotoCropper.tsx) | `react-easy-crop` ベースの 4:5 クロップ |
| [`lib/image/validate.ts`](../../lib/image/validate.ts) | MIME / サイズ / HEIC 判定 |
| [`lib/image/heicToJpeg.ts`](../../lib/image/heicToJpeg.ts) | HEIC → JPEG（`heic2any`） |
| [`lib/image/readDataUrl.ts`](../../lib/image/readDataUrl.ts) | `File` → dataURL |
| [`lib/image/cropImage.ts`](../../lib/image/cropImage.ts) | Canvas でクロップを焼き込み |

## 受け入れる形式

- 拡張子: JPEG / PNG / WebP / HEIC / HEIF
- 上限: **10MB**（`PhotoUploader` の `maxSizeMB` で変更可）
- アスペクト比: **4:5 縦長** に強制（次画面の解析 UI と整合）

## 処理フロー

```
[File 選択 / Drop / カメラ]
    ↓
validateImageFile(file, maxBytes)
    ↓ fail → エラー表示
[必要なら heicToJpegFile(file)]
    ↓ fail → エラー表示
readFileAsDataURL(file)
    ↓
[PhotoCropper で 4:5 にクロップ]
    ↓ 確定
useDiagnosisStore.setPhoto(file, dataUrl)
    ↓
router.push("/diagnose")
```

## なぜ 4:5 で固定するか

- MediaPipe の精度を担保するため、構図を一定にする
- 結果画面（写真 + ランドマーク重ね描画）でレイアウトが崩れないようにする
- iPhone 標準カメラの「ポートレート」相当に近く、ユーザーに馴染みがある

## なぜ HEIC を変換するか

- iOS の標準フォーマット（HEIC）はブラウザによってデコードできない
- `heic2any` でクライアント側で JPEG 化することで、MediaPipe にも OpenAI にも安全に渡せる
- 一部の古い HEIC は libheif がデコードに失敗する。その場合は「JPEG に書き出してから再度お試しください」と表示

## ストア書き込みのタイミング

`setPhoto()` は **クロップ確定時** に呼ぶ。クロップ前の生データは保持しない。
これは「次画面に進んだ時点で必ず構図が確定している」状態を保つため。

## 同意との関係

- このコンポーネント自体は同意状態に依存しない（同意なしでも写真は選べる）
- ただし「次へ進む」ボタンが `hasTermsConsent()` を確認し、未同意なら遷移をブロック
- ランディング側の `DiagnoseEntry.tsx` も同意がない間は `LandingCta` を表示して `PhotoUploader` 自体を見せない

## エラー表示

| 状況 | 文言 |
| --- | --- |
| 形式違反 / 容量超過 | `validateImageFile` が返すメッセージ |
| HEIC デコード失敗 | 「この HEIC ファイルはブラウザで変換できませんでした。JPEG に書き出してからお試しください。」 |
| その他読み込み失敗 | エラーオブジェクトの `message` |
