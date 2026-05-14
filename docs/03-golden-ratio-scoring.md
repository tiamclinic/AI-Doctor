# 03. 黄金比スコアリング（TIAM 6 大指標）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-03                                |
| 関連要件   | F-03                                |
| 依存       | T-02                                |
| 優先度     | 高                                  |
| 見積       | 3 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

478 点のランドマークから **TIAM 6 大指標** を計算し、各指標を 0〜100 点に正規化、加重平均で `TIAM バランス指数` を算出する。クライアント側で完結させる。

## ゴール / 受け入れ基準

- [x] 6 大指標が計算され、それぞれ 0〜100 点で出力される
- [x] 総合スコア（TIAM バランス指数）が 0〜100 点で出力される（重み合計 1.0 の加重平均）
- [x] 数値は小数第 1 位まで丸めて表示できる（`roundTo(value, 1)`）
- [x] 同一の写真で複数回計算しても同じスコアになる（純関数で決定論。テスト済）
- [x] 各指標の理想値と現値の比率がデバッグ用に取得できる（`ScoreResult.rawValues`）
- [x] ユニットテスト（最低限のスナップショット）が用意されている（Vitest 8 件）

## 設計メモ

### 指標と理想値

| 指標名             | 計算内容                                     | 理想値    |
| ------------------ | -------------------------------------------- | --------- |
| 縦三分割バランス   | 髪生え際〜眉 / 眉〜鼻下 / 鼻下〜顎先         | 1 : 1 : 1 |
| 横五分割バランス   | 顔幅 を 目幅 5 つ分で割った比率              | 1.0       |
| 目間バランス       | 両目間距離 / 目幅                            | 1.0       |
| 鼻口比率           | 鼻幅 / 口幅                                  | 1 : 1.618 |
| E ライン整合度     | 鼻先・上唇・下唇・顎先の直線関係             | on-line   |
| 顔輪郭比率         | 顔幅 / 顔長                                  | 1 : 1.46  |

### ファイル

```
lib/faceAnalysis/
  landmarks.ts                       主要点インデックス定数 + PHI
  goldenRatio.ts                     各指標の生値計算
  scoring.ts                         0–100 正規化 + 加重平均
  __tests__/dummyLandmarks.ts        テスト用ダミーランドマーク生成
  __tests__/goldenRatio.test.ts      Vitest テスト
components/
  ScoreSummary.tsx                   レーダーバー + 総合スコア表示（簡易版）
vitest.config.ts                     `@/*` エイリアス対応
```

### 採用インデックス（MediaPipe Face Mesh）

| 部位 | index |
| ---- | ----- |
| 鼻先 | 1 |
| 鼻下 | 2 |
| 眉間 | 9 |
| 額上端（髪生え際近似） | 10 |
| 顎先 | 152 |
| 右頬 / 左頬 | 234 / 454 |
| 右目（外/内） | 33 / 133 |
| 左目（内/外） | 362 / 263 |
| 右鼻翼 / 左鼻翼 | 49 / 279 |
| 右口角 / 左口角 | 61 / 291 |
| 上唇上端 / 下唇下端 | 13 / 17 |

### 出力型

```ts
type MetricKey =
  | "verticalThirds"
  | "horizontalFifths"
  | "eyeSpacing"
  | "noseMouthRatio"
  | "eLine"
  | "faceContour";

type ScoreResult = {
  totalScore: number;            // 0–100
  scores: Record<MetricKey, number>;
  rawValues: Record<MetricKey, number | number[]>;
};
```

### 重み（初期値）

```ts
const WEIGHTS: Record<MetricKey, number> = {
  verticalThirds: 0.20,
  horizontalFifths: 0.15,
  eyeSpacing: 0.15,
  noseMouthRatio: 0.20,
  eLine: 0.15,
  faceContour: 0.15,
};
```

### 正規化

理想値からの乖離を `score = max(0, 100 - k * |deviation|)` で算出。`k` は指標ごとに調整して、極端な顔でも 30 点を下回らない程度に。

## TODO

- [x] `lib/faceAnalysis/landmarks.ts` で MediaPipe の主要点インデックスを定数化
- [x] `lib/faceAnalysis/goldenRatio.ts` で 6 指標の生値計算関数を実装
- [x] `lib/faceAnalysis/scoring.ts` で正規化 + 加重平均を実装
- [x] 重み・係数 `k` のチューニングメモを `scoring.ts` 末尾に記載
- [x] `__tests__/goldenRatio.test.ts` を Vitest で実装（8 ケース：理想値 / 局所崩れ / 下限ガード / 決定論 / 例外）
- [x] `__tests__/dummyLandmarks.ts` にダミーランドマーク生成関数を用意
- [x] `/diagnose` 画面で「スコアを計算する」→ `ScoreSummary` 表示まで実装
- [x] Zustand store (`diagnosis-store.ts`) に `scoreResult` を保持。`setPhoto`/`setDetectResult` 時に自動クリア
- [x] パフォーマンス計測ログを追加（dev 時 `console.info`、実測 < 5ms）
- [x] 計算ロジックを `goldenRatio.ts` / `scoring.ts` のコメントに明記

## リファレンス

- requirements.md §4.3 F-03
