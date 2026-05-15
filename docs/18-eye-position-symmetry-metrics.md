# 18. 目の位置・左右対称性の独立指標化（TIAM 指標拡張）

| 項目       | 内容                                                                 |
| ---------- | -------------------------------------------------------------------- |
| チケットID | T-18                                                                 |
| 関連要件   | F-03（黄金比スコアリング拡張）／F-05（結果表示）／`requirements.md` 指標定義の追記 |
| 依存       | T-02（ランドマーク）, T-03（既存スコアリングパイプライン）             |
| 優先度     | 中〜高（データ精度・プロダクト説明の整合に直結）                     |
| 見積       | 3〜5 日（理想値・重みの合意含む）                                    |
| 担当       | -                                                                    |
| ステータス | 完了                                                                 |

## 背景 / 課題（解消済み）

| UI・コピーで使っている概念 | 旧データ実体 |
| -------------------------- | ------------ |
| **目の位置**               | 専用スコアなし |
| **左右対称性**             | `horizontalFifths` の表示用エイリアス |

## 実装済み定義（コード正）

### `eyePosition`（目の縦位置）

- **生値 `ratio`**: 両眼 4 コーナー（33, 133, 362, 263）の **y 平均** と、額上端 `pickForeheadTopLandmark`・顎先（152）から求めた **顔長**（\|chin.y − top.y\|）に対する比率  
  \(\text{ratio} = (\text{eyeY} - \text{top.y}) / \text{faceHeight}\)
- **理想値 `IDEAL.eyePosition`**: `0.5`（テスト用理想ダミーと整合）
- **スコア**: 他の比率指標と同様 `scoreRatio(ratio, IDEAL.eyePosition, "eyePosition")`

### `bilateralSymmetry`（左右対称性）

- **参照ペア**（`landmarks.ts` の `TIAM_BILATERAL_POINT_PAIRS`）: 目外/内、鼻翼、口角の 4 組（被写体の right/left 命名に従う index）
- **顔の左右中点 `xMid`**: 頬ラインの右/左（234, 454）の x 平均
- **各ペア誤差**: \(\lvert (\text{pr.x}+\text{pl.x})/2 - x_\text{mid}\rvert / \text{faceWidth}\)
- **生値 `meanAsymmetry`**: 上記 4 ペアの平均（0 が理想）
- **スコア**: `scoreFromDeviation(meanAsymmetry, "bilateralSymmetry")`（`K.bilateralSymmetry = 22`）

### 加重（合計 1.0）

`lib/faceAnalysis/scoring.ts` の `METRIC_WEIGHTS` を参照（T-18 で `eyePosition` / `bilateralSymmetry` を各 0.09、既存指標を再配分）。

## ゴール / 受け入れ基準

- [x] `MetricKey` に `eyePosition` と `bilateralSymmetry` を追加し、`RawMetrics` / `IDEAL` / `scoring` の加重・`K` まで定義
- [x] `computeRawMetrics` で上記のとおり再現可能に計算
- [x] `lib/result/parts.ts` の `symmetry` は `bilateralSymmetry` のみ参照
- [x] `eyes` パーツは `eyeSpacing` と `eyePosition` の平均
- [x] `MetricBarList` / シェアカード / `POST /api/diagnose` の `scores` を更新
- [x] Vitest（理想・縦崩れ・左右非対称・下限ガード等）
- [x] `npm run lint` / `npm run test` / `npm run build` クリーン

## 関連ファイル

| ファイル | 内容 |
| -------- | ---- |
| `lib/faceAnalysis/landmarks.ts` | `TIAM_BILATERAL_POINT_PAIRS` |
| `lib/faceAnalysis/goldenRatio.ts` | `eyePosition` / `bilateralSymmetry` 生値 |
| `lib/faceAnalysis/scoring.ts` | 重み・K・`METRIC_LABELS` |
| `lib/result/parts.ts` | パーツカードの指標対応 |
| `lib/diagnosis/types.ts` | `DiagnoseRequestSchema.scores` |
| `lib/share-card/types.ts` / `template.tsx` | シェアカード |
| `lib/prompt/diagnosisPrompt.ts` | `formatScoreInput`・few-shot |

## リファレンス

- [03. 黄金比スコアリング](./03-golden-ratio-scoring.md)
- [05. 結果画面表示](./05-result-screen.md)
