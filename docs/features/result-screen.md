# 結果画面（F-05）

スコア・診断テキスト・理想顔・シェアカードを 1 画面に集約する `/result/[id]` の機能です。

## 関連コード

| ファイル | 責務 |
| --- | --- |
| [`app/result/[id]/page.tsx`](../../app/result/[id]/page.tsx) | レイアウト + ストア整合性チェック |
| [`components/ScoreCircle.tsx`](../../components/ScoreCircle.tsx) | 総合スコアの円グラフ |
| [`components/ScoreRadar.tsx`](../../components/ScoreRadar.tsx) | 6 指標レーダーチャート |
| [`components/DiagnosisText.tsx`](../../components/DiagnosisText.tsx) | AI 診断テキスト表示 |
| [`components/IdealPortrait.tsx`](../../components/IdealPortrait.tsx) | 理想顔セクション（[features/ideal-portrait](./ideal-portrait.md)） |
| [`components/ShareCardButton.tsx`](../../components/ShareCardButton.tsx) | シェアカード生成ボタン（[features/share-card](./share-card.md)） |
| [`components/FaceLandmarkOverlay.tsx`](../../components/FaceLandmarkOverlay.tsx) | 写真 + ランドマーク重ね描画 |

## レイアウト

1. ヘッダ（TIAM ラベル + 結果 ID）
2. 写真 + 総合スコア（ScoreCircle）
3. レーダーチャート（ScoreRadar）
4. AI 診断テキスト（DiagnosisText）
5. AI 理想顔ジェネレーター
6. SNS シェアカード生成
7. 「別の写真でもう一度診断」ボタン
8. 法令フッタ（「医療診断ではありません」）

## URL と状態の整合性

```ts
const { id } = React.use(params);
const resultId = useDiagnosisStore((s) => s.resultId);
```

`useEffect` で以下を確認し、いずれかが満たせなければ `/` にリダイレクト:

- `resultId` がストアに存在する
- `resultId === id`
- `scoreResult` と `photoDataUrl` が両方ストアに存在する

つまり **「結果画面はストアが揃っている時しか見えない」**。MVP では結果の永続化を行わないため、リロード・別タブで開くと自動的にトップへ戻る挙動になる。

### なぜそうしたか

- 永続化（DB / KV）を持たないため、URL だけで結果を復元する手段がない
- 第三者に URL を共有されても写真や診断文が漏れない（プライバシー / セキュリティ的に安全側）
- 共有はあくまで「シェアカード PNG」を介して行う前提

## 結果 ID

- `nanoid(10)` で生成（[`lib/store/diagnosis-store.ts`](../../lib/store/diagnosis-store.ts) `setScoreResult`）
- スコアが確定した瞬間に発行される
- スコアが変わると `setScoreResult` が呼ばれて新しい id に置き換わる

## UI の規律

- 全セクションを `Card` で囲み、TIAM ブランドの黒 + champagne gold に統一
- 装飾的なエモーションを避け、数値と所見を整然と並べる
- スコアの toFixed(1) を必ず使い、整数値での見え方を排する

## 将来拡張のメモ

- 結果の DB 保存（ユーザー履歴 / 共有可能リンク）
- A/B テスト用の variant フラグ（プロンプト・スコア式の切替）
- 画像最適化（写真は dataURL のまま保持しているのでメモリ重め）
