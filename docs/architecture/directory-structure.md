# ディレクトリ構造

## トップレベル

```
AI-Doctor/
├── app/                      Next.js App Router（ページ + API ルート）
├── components/               React コンポーネント
├── hooks/                    React Hook
├── lib/                      ドメインロジック / 外部 API クライアント
├── public/                   静的アセット（MediaPipe WASM, モデル）
├── scripts/                  ビルド補助スクリプト
├── types/                    .d.ts 型定義
├── docs/                     開発者ドキュメント（このディレクトリ）
├── apphosting.yaml           Firebase App Hosting 設定
├── firebase.json             Firebase CLI 設定
├── CLAUDE.md                 AI コーディングエージェント向け規約
├── AGENTS.md                 Next.js 16 注意書き
└── README.md                 起動方法と Next.js ボイラープレート
```

## `app/`（ルーティング）

```
app/
├── layout.tsx                ルートレイアウト（Header / Footer / フォント）
├── page.tsx                  ランディング（同意 → アップロード）
├── globals.css               Tailwind v4 + ブランドカラー変数
├── diagnose/page.tsx         顔検出 → スコア → 診断テキスト
├── result/[id]/page.tsx      結果画面（理想顔・シェアカード）
├── (legal)/
│   ├── privacy/page.tsx      プライバシーポリシー
│   └── terms/page.tsx        利用規約
└── api/
    ├── diagnose/route.ts     POST /api/diagnose
    ├── generate-portrait/route.ts
    ├── share-card/route.tsx
    └── health/route.ts
```

`(legal)` は Next.js のルートグループ（URL には影響しない）。

## `components/`

```
components/
├── DiagnoseEntry.tsx         同意状態に応じた CTA 切替
├── PhotoUploader.tsx         画像選択 + 検証 + HEIC 変換
├── PhotoCropper.tsx          4:5 クロップ UI
├── FaceLandmarkOverlay.tsx   写真 + ランドマーク点重ね描画
├── ScoreSummary.tsx          6 指標スコア一覧
├── ScoreCircle.tsx           総合スコアの円グラフ
├── ScoreRadar.tsx            6 指標レーダーチャート
├── DiagnosisText.tsx         AI 診断文の表示
├── IdealPortrait.tsx         理想顔生成ボタンとプレビュー
├── ShareCardButton.tsx       SNS シェアカード生成ボタン
├── common/
│   ├── ConsentDialog.tsx     同意ダイアログ
│   └── LandingCta.tsx        ランディング行動喚起
├── layout/
│   ├── Header.tsx
│   └── Footer.tsx
└── ui/                       shadcn/ui 生成プリミティブ
```

## `lib/`（ドメインロジック）

### `lib/faceAnalysis/` — ブラウザでの顔解析

| ファイル | 責務 |
| --- | --- |
| `landmarker.ts` | MediaPipe FaceLandmarker の遅延初期化 |
| `detect.ts` | dataURL → 478 点ランドマーク |
| `landmarks.ts` | TIAM が参照する点のインデックス定義 |
| `goldenRatio.ts` | 6 指標の生値計算（縦三分割、横五分割、目間…） |
| `scoring.ts` | 生値 → 0–100 + 加重平均 |
| `types.ts` | `Landmark`, `DetectResult`, `FaceNotDetectedError` |
| `silenceMediaPipeLogs.ts` | MediaPipe の GLOG 抑制 |
| `__tests__/goldenRatio.test.ts` | スコア計算の Vitest テスト |

### `lib/diagnosis/` — AI 診断文

| ファイル | 責務 |
| --- | --- |
| `types.ts` | Zod スキーマ（Request / Response / Error） |
| `openai.ts` | サーバー側の OpenAI 呼び出し本体 |
| `client.ts` | クライアントの fetch ラッパ |

### `lib/portrait/` — 理想顔生成

| ファイル | 責務 |
| --- | --- |
| `types.ts` | Zod スキーマ |
| `normalize.ts` | sharp での sRGB JPEG 1024 正規化（サーバー） |
| `rateLimit.ts` | IP 単位レート制限（サーバー） |
| `client.ts` | クライアントの fetch ラッパ |

### `lib/share-card/` — SNS シェアカード

| ファイル | 責務 |
| --- | --- |
| `types.ts` | Zod スキーマ |
| `template.tsx` | Satori で描画する JSX テンプレート |
| `fonts.ts` | Google Fonts API からのサブセット取得 |
| `client.ts` | クライアントの fetch + Blob ダウンロード |

### `lib/openai/` — 共通クライアント

| ファイル | 責務 |
| --- | --- |
| `client.ts` | `OpenAI` シングルトン + `OpenAiNotConfiguredError` |
| `images.ts` | `images.edit` ラッパ |

### `lib/prompt/` — プロンプト定義

| ファイル | 責務 |
| --- | --- |
| `diagnosisPrompt.ts` | TIAM トーンの system プロンプト + few-shot |
| `portraitPrompt.ts` | 理想顔生成プロンプト（英語） |
| `forbiddenWords.ts` | 禁止フレーズ / 医療表現置換辞書 |
| `__tests__/forbiddenWords.test.ts` | 置換ロジックのテスト |

### `lib/image/`

| ファイル | 責務 |
| --- | --- |
| `validate.ts` | MIME / 拡張子 / サイズ検証、HEIC 判定 |
| `heicToJpeg.ts` | HEIC → JPEG（クライアント、heic2any） |
| `readDataUrl.ts` | `File` → dataURL |
| `cropImage.ts` | クロップ確定時の Canvas 切り出し |

### `lib/store/`

| ファイル | 責務 |
| --- | --- |
| `diagnosis-store.ts` | Zustand: 写真・検出結果・スコア・診断・理想顔の集約ストア |

### その他

| ファイル | 責務 |
| --- | --- |
| `lib/consent.ts` | 同意状態（sessionStorage） + イベント購読 |
| `lib/fonts.ts` | `next/font` での Web フォント定義 |
| `lib/cn.ts` / `lib/utils.ts` | クラス結合などのヘルパ |

## `hooks/`

| ファイル | 責務 |
| --- | --- |
| `useFaceLandmarker.ts` | 検出のローディング / 成功 / 失敗ステート管理 |

## `public/`

```
public/
├── mediapipe/wasm/           postinstall でコピーされる MediaPipe WASM
├── models/                   face_landmarker.task（モデル本体）
└── *.svg                     ロゴ等
```

`public/mediapipe/wasm/` は `scripts/copy-mediapipe-wasm.mjs` が `node_modules/@mediapipe/tasks-vision/wasm` から複製します。`postinstall` で自動実行。

## パスエイリアス

`tsconfig.json` で `@/* → ./*` を定義しています。

```ts
import { computeScore } from "@/lib/faceAnalysis/scoring";
import { Button } from "@/components/ui/button";
```
