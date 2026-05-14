# 02. 顔ランドマーク検出（MediaPipe）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-02                                |
| 関連要件   | F-02                                |
| 依存       | T-01                                |
| 優先度     | 高                                  |
| 見積       | 3 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

MediaPipe Face Landmarker を使い、ブラウザ内で顔ランドマーク 478 点を検出する。WASM のロードはコストが大きいため遅延ロード／キャッシュを工夫する。

## ゴール / 受け入れ基準

- [x] 写真を渡すと 478 点ランドマーク `(x, y, z)` が取得できる
- [x] 顔が検出できなかった場合は明確なエラー UI が出る（`FaceNotDetectedError` → メッセージ + 「もう一度解析」/「別の写真を選ぶ」）
- [x] 顔が複数検出された場合は最大顔のみを採用する（`pickLargestFace` で bbox 面積最大を採用）
- [x] WASM モデルは `public/models/` から配信され、初回のみロード（モジュールスコープで Promise キャッシュ）
- [ ] iOS Safari / Android Chrome で動作確認済み（リリース前 QA で実機確認）

## 設計メモ

### ライブラリ

- `@mediapipe/tasks-vision`（Face Landmarker）

### 配置

```
lib/faceAnalysis/
  landmarker.ts            Face Landmarker の初期化・キャッシュ（動的 import）
  detect.ts                画像 → ランドマーク 478 点 検出関数
  types.ts                 Landmark / DetectResult / FaceNotDetectedError
public/
  models/face_landmarker.task   MediaPipe モデル（curl で取得）
  mediapipe/wasm/...            WASM 一式（postinstall で自動コピー）
scripts/
  copy-mediapipe-wasm.mjs   node_modules から public/mediapipe/wasm へコピー
hooks/
  useFaceLandmarker.ts     React フック（status / result / error / detect / reset）
components/
  FaceLandmarkOverlay.tsx  Canvas に写真と 478 点を描画
```

### モデル / WASM 配布

- モデル `public/models/face_landmarker.task`: `https://storage.googleapis.com/mediapipe-models/.../face_landmarker.task` から取得（requirements.md §1.2）
- WASM 一式は `node_modules/@mediapipe/tasks-vision/wasm` から `public/mediapipe/wasm/` に `postinstall` で自動コピー
- 合計 ~30 MB のため `public/mediapipe/` は `.gitignore`、必要なら CDN 配布 or App Hosting 静的バケットに移行

### API

```ts
type DetectResult = {
  landmarks: NormalizedLandmark[]; // 478 点
  imageWidth: number;
  imageHeight: number;
};

async function detectFace(image: HTMLImageElement | ImageBitmap): Promise<DetectResult>;
```

### パフォーマンス

- 初期化は 1 度だけ（モジュールスコープでキャッシュ）
- `next/dynamic` で SSR を切ってクライアント専用にする
- 画像は `createImageBitmap` 経由で渡し、リサイズはコンポーネント側で実施

## TODO

- [x] `@mediapipe/tasks-vision` を依存に追加
- [x] `face_landmarker.task` を `public/models/` に配置（モデル URL は MediaPipe 公式 GCS バケット）
- [x] `lib/faceAnalysis/landmarker.ts` で `FilesetResolver.forVisionTasks` + `FaceLandmarker.createFromOptions` を実装（GPU delegate、IMAGE モード、numFaces=1）
- [x] `lib/faceAnalysis/detect.ts` を実装し、最大顔のみを返す
- [x] `lib/faceAnalysis/types.ts` に `Landmark` / `DetectResult` / `FaceNotDetectedError` を定義
- [x] `hooks/useFaceLandmarker.ts` フックを作成（status/result/error/detect/reset、最新リクエスト以外は破棄）
- [x] 顔未検出時のエラーハンドリング（`FaceNotDetectedError`）
- [x] 検出失敗時の UI（撮り直し導線）を `/diagnose` 画面で実装
- [x] WASM 初期化時間の計測（dev 時 `console.info`）と、ローディング UI 表示（「TIAM AI が解析中…」）
- [x] ランドマーク座標を可視化するオーバーレイ（`FaceLandmarkOverlay`、トグル可・既定 ON）
- [ ] iOS / Android 実機で動作確認（リリース前 QA で実施）

## リファレンス

- requirements.md §4.2 F-02
- MediaPipe Face Landmarker: https://developers.google.com/mediapipe/solutions/vision/face_landmarker/web_js
