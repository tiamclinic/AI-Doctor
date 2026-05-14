# 顔ランドマーク検出（F-02）

MediaPipe Face Landmarker（Tasks Web）を **ブラウザの WASM** で実行し、478 点のランドマーク座標を得るまでの機能です。
サーバーには写真を送りません。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`lib/faceAnalysis/landmarker.ts`](../../lib/faceAnalysis/landmarker.ts) | WASM 初期化 + シングルトン |
| [`lib/faceAnalysis/detect.ts`](../../lib/faceAnalysis/detect.ts) | dataURL → 478 点 |
| [`lib/faceAnalysis/landmarks.ts`](../../lib/faceAnalysis/landmarks.ts) | TIAM が参照する点の名前付きインデックス |
| [`lib/faceAnalysis/types.ts`](../../lib/faceAnalysis/types.ts) | `Landmark` / `DetectResult` / `FaceNotDetectedError` |
| [`lib/faceAnalysis/silenceMediaPipeLogs.ts`](../../lib/faceAnalysis/silenceMediaPipeLogs.ts) | MediaPipe / TFLite の GLOG 抑制 |
| [`hooks/useFaceLandmarker.ts`](../../hooks/useFaceLandmarker.ts) | React フック（loading / success / error） |
| [`components/FaceLandmarkOverlay.tsx`](../../components/FaceLandmarkOverlay.tsx) | 写真 + 点の重ね描画 |

## アセット配置

- WASM: `public/mediapipe/wasm/`（`scripts/copy-mediapipe-wasm.mjs` が `node_modules` から複製）
- モデル: `public/models/face_landmarker.task`（手動配置）

`postinstall` で WASM コピーが走るので、`npm install` 後に追加作業は不要。ただしモデルファイル（`.task`）はリポジトリに含まれている前提です（無ければ MediaPipe 公式ストレージから取得）。

詳細は [guides/getting-started](../guides/getting-started.md)。

## 初期化

[`getFaceLandmarker()`](../../lib/faceAnalysis/landmarker.ts):

- ブラウザでのみ動作（`typeof window === "undefined"` で例外）
- 1 度だけ初期化して `landmarkerPromise` でキャッシュ
- `delegate: "GPU"` を指定（フォールバックは MediaPipe 任せ）
- 初期化中の GLOG ノイズを `silenceMediaPipeLogs()` で抑制し、終了後に必ず原状回復

## 検出

[`detectFaceFromDataUrl(dataUrl)`](../../lib/faceAnalysis/detect.ts):

1. `Image` に dataURL をロード
2. `landmarker.detect(image)` を呼ぶ（`runningMode: "IMAGE"` / `numFaces: 1`）
3. 顔が複数検出された場合は **bounding box が最大のもの** を採用（`pickLargestFace`）
4. 失敗時は `FaceNotDetectedError` を投げる

戻り値:

```ts
type DetectResult = {
  landmarks: Landmark[];   // 478 点
  imageWidth: number;
  imageHeight: number;
  durationMs: number;
};
```

## TIAM 参照点

[`lib/faceAnalysis/landmarks.ts`](../../lib/faceAnalysis/landmarks.ts) の `TIAM_LANDMARK_INDEX` で、478 点のうち TIAM スコア計算に使う点だけ名前付きにしています。

| 名前 | index | 用途 |
| --- | --- | --- |
| `hairline` | 10 | 額の上端（縦三分割） |
| `glabella` | 9 | 眉間（縦三分割） |
| `subnasale` | 2 | 鼻下（縦三分割） |
| `chin` | 152 | 顎先（縦三分割 / E ライン） |
| `noseTip` | 1 | 鼻先（E ライン） |
| `faceLeft` / `faceRight` | 454 / 234 | 頬骨（顔幅） |
| `rightEyeOuter` / `rightEyeInner` | 33 / 133 | 右目幅 |
| `leftEyeInner` / `leftEyeOuter` | 362 / 263 | 左目幅 |
| `rightAla` / `leftAla` | 49 / 279 | 鼻翼（鼻幅） |
| `rightMouthCorner` / `leftMouthCorner` | 61 / 291 | 口幅 |
| `upperLipTop` / `lowerLipBottom` | 13 / 17 | E ライン用 |

> ⚠️ MediaPipe の "right/left" は被写体本人の左右ではなく **画像上の左右**。座標系は左上原点、x は右に増える。

## React 側の利用

[`useFaceLandmarker()`](../../hooks/useFaceLandmarker.ts) でローディング状態を管理:

```ts
const { status, result, error, detect, reset } = useFaceLandmarker();

React.useEffect(() => {
  if (photoDataUrl) void detect(photoDataUrl).then((r) => r && setDetectResult(r));
}, [photoDataUrl]);
```

- `status`: `"idle" | "loading" | "success" | "error"`
- `detect()` は token ベースのキャンセル機構付き（連続呼び出しに耐える）

## 失敗ハンドリング

- `FaceNotDetectedError`: 「明るい場所で正面から撮影」促し
- その他の例外: 例外メッセージをそのまま表示
- 検出失敗時に WASM が部分初期化されたまま残らないよう、`landmarkerPromise` は失敗時に `null` に戻す

## 性能

- 初期化: 数秒（モデルサイズ依存）
- 検出: 数百 ms 〜 数 ms（GPU delegate の場合）
- `useDiagnosisStore` に `durationMs` が乗るので、デモ画面で「処理時間」を表示できる

## 既知の制約

- iPad / iPhone Safari の古い版で GPU delegate が WebGL を要求するため失敗することがある（CPU フォールバックは自動）
- 横顔・サングラスは検出精度が著しく低下する
