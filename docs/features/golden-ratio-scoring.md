# 黄金比スコアリング（F-03）

478 点のランドマークから TIAM 独自の 6 指標を計算し、それぞれを 0–100 に正規化したうえで加重平均してバランス指数を得る、本プロダクトのコア機能です。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`lib/faceAnalysis/goldenRatio.ts`](../../lib/faceAnalysis/goldenRatio.ts) | 生値（比率）の計算 |
| [`lib/faceAnalysis/scoring.ts`](../../lib/faceAnalysis/scoring.ts) | 0–100 正規化 + 加重平均 |
| [`lib/faceAnalysis/__tests__/goldenRatio.test.ts`](../../lib/faceAnalysis/__tests__/goldenRatio.test.ts) | Vitest テスト |

## 6 指標

| キー | 指標名 | 理想値 | 採点ロジック |
| --- | --- | --- | --- |
| `verticalThirds` | 縦三分割バランス | 1 : 1 : 1 | 各セクション比率の平均乖離 |
| `horizontalFifths` | 横五分割バランス | 顔幅 = 目幅 × 5 | 比率の相対乖離 |
| `eyeSpacing` | 目間バランス | 目間 = 目幅 | 比率の相対乖離 |
| `noseMouthRatio` | 鼻口比率 | 1 : 1.618（黄金比） | 比率の相対乖離 |
| `eLine` | E ライン整合度 | 鼻先 - 顎先を結ぶ線上 | 上下唇の符号付き距離（顔幅で正規化） |
| `faceContour` | 顔輪郭比率 | 1 : 1.46 | 比率の相対乖離 |

## スコア計算式

```
score = clamp(100 - |deviation| × k × 100, 30, 100)
```

- `deviation` は指標ごとの「理想からの相対乖離」
- `k` は厳しさ係数（[scoring.ts](../../lib/faceAnalysis/scoring.ts) の `K`）
- 下限 30 / 上限 100 でクランプ。極端な顔でも 30 未満には落ちないようにしている

### k の現在値

| Metric | k |
| --- | --- |
| verticalThirds | 2.6 |
| horizontalFifths | 2.2 |
| eyeSpacing | 2.0 |
| noseMouthRatio | 2.4 |
| eLine | 2.0 |
| faceContour | 2.2 |

## 加重平均

```
totalScore = Σ (scoreᵢ × weightᵢ)
```

| Metric | weight |
| --- | --- |
| verticalThirds | 0.20 |
| noseMouthRatio | 0.20 |
| horizontalFifths | 0.15 |
| eyeSpacing | 0.15 |
| eLine | 0.15 |
| faceContour | 0.15 |

体感に直結する `verticalThirds` と `noseMouthRatio` をやや重く取っています（マーケ要望に応じて再チューニング可能）。

## チューニング指針

- スコアが「ほぼ全員 95 以上」になるなら、`k` を上げて厳しくする
- スコアが「ほぼ全員 30」になるなら `k` を下げる
- 数値が滑らかに分布するレンジを `MIN_SCORE` / `MAX_SCORE` で詰める

修正したら `npm test` で `goldenRatio.test.ts` を流して、既存の代表ケースが想定通りか確認。

## なぜ正面写真で E ライン？

E ライン本来は側面プロファイルで定義される指標ですが、正面写真でも近似するため **「鼻先 → 顎先を結ぶ直線」からの上下唇の水平距離** を顔幅で正規化して使っています。完璧ではないが、デモとしては十分に動く近似。

## API への受け渡し

- `/api/diagnose` には **0–100 のスコア値のみ** を送る（写真は送らない）
- スコアの小数点以下 1 桁まで保持（`roundTo(value, 1)`）

## デバッグ用ヘルパ

- `METRIC_LABELS` に日本語ラベル定義あり
- `__tests__/dummyLandmarks.ts` に決定論的なテスト用ランドマーク
- 開発時のスコア確認: `console.info("[scoring] computeScore in ${elapsed}ms")` が `/diagnose` で出力される
