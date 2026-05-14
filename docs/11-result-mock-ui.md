# 11. 結果画面モック準拠 UI（総合評価 + パーツ分析 + 総評）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-11                                |
| 関連要件   | requirements.md §4.5 / §4.9         |
| 依存       | T-05                                |
| 優先度     | 高                                  |
| 見積       | 3〜5 日                             |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

依頼者から共有された「黄金比診断結果」モック（ヒーロー帯にスコア＋顔写真、横長のメトリクスバー、パーツ別カード、総評＋メッセージ）に合わせて、結果画面 `app/result/[id]/page.tsx` の情報階層を再設計する。**院方コンテンツ（T-13/T-15）の差し込みポイント**を構造として用意しておくことが本チケットのもう一つの目的。

MVP の機能（ランドマーク重ね合わせ、AI 理想顔、シェアカード、SNS、リンクコピー）は維持する。本チケットは UI 構造の刷新であり、API 拡張は伴わない。

## ゴール / 受け入れ基準

- [x] 結果画面が次の 4 セクション構造になっている
  1. **ヒーロー帯**（写真 + ランドマーク + `ScoreCircle` 総合スコア + 1 行サマリー）
  2. **6 大指標バー**（指標名・小数 1 桁・横バー・理想値ヒント）— `ScoreRadar` と併存可
  3. **パーツ分析カードグリッド**（目 / 鼻 / 口 / 輪郭 / 左右対称性の最低 5 枚）
  4. **総評ブロック**（既存 `DiagnosisText` を再配置 + AI と院方の出典ラベル明示）
- [x] パーツカード 1 枚に **見出し / スコア（任意）/ AI 由来の参考短文 / `<DoctorPartSlot>` 差し込み枠 / 脚注** の入る器が用意されている（差し込みは T-15 で接続。本チケットでは空表示でも可）
- [x] スマホ（375px 〜）で縦スクロール 1 カラム、`sm:` 以上でカード 2 カラムが崩れない
- [x] TIAM カラートークン（`text-tiam-primary` / `text-tiam-gold` / `border-tiam-gold/60`）に揃っている
- [x] 既存の AI 理想顔・シェアカード・SNS シェア・再診断ボタンの位置と挙動を回帰させない
- [x] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 配置（追加・変更）

```
app/result/[id]/page.tsx              本チケットで構造を入れ替え済み
components/result/
  ResultHero.tsx                      写真 + 総合スコア + サマリー（既存 ScoreCircle を内包）
  MetricBarList.tsx                   6 指標を横バーで列挙（理想値ヒント表示）
  PartAnalysisGrid.tsx                パーツカードのグリッドコンテナ
  PartAnalysisCard.tsx                パーツカード本体（AI 短文 + ドクター枠 + 脚注）
  ResultSectionHeader.tsx             章見出し（ゴールド下線つき見出し）
lib/result/
  parts.ts                            パーツ ID 定数 + ラベル + AI スコアとのマッピング
  partSummaries.ts                    スコアからルールベースで生成する AI 由来の短文（薬機法配慮）
  __tests__/partSummaries.test.ts     ルール文生成のスナップショット
```

### パーツ ID と既存スコアの対応（暫定）

| `partId`  | UI ラベル | 既存 `MetricKey` との対応（読み取り側で参照） |
| --------- | --------- | --------------------------------------------- |
| `eyes`    | 目        | `eyeSpacing`                                  |
| `nose`    | 鼻        | `noseMouthRatio` の鼻側 + `eLine`             |
| `mouth`   | 口元      | `noseMouthRatio` の口側                       |
| `contour` | 輪郭      | `faceContour` + `verticalThirds`              |
| `symmetry`| 左右対称性 | `horizontalFifths`（暫定。Phase 2 で再定義）  |

> `MetricKey` は `lib/faceAnalysis/goldenRatio.ts` で既に確定（縦三分割 / 横五分割 / 目間 / 鼻口比 / E ライン / 顔輪郭）。本チケットで `MetricKey` を増やさない。

### AI 由来の短文（薬機法配慮）

- `lib/result/partSummaries.ts` で **`(scoreResult: ScoreResult, partId) => string`** を定義し、**OpenAI を呼ばない決定論文**を返す（例: 90 点以上「左右の比率が黄金比に近く整っています」/ 80 点台「全体のバランスが滑らかに見える傾向です」）。
- 文末は「整える」「整いやすい」など T-04 の `replaceMedicalTerms` と整合する語彙のみ使用。**`scanForbidden()` を通したテストを必須**にする。

### `<DoctorPartSlot>` 差し込み枠

- 本チケットの段階では `null` / `undefined` を受けると **何も描画しない**プロップを持つだけでよい。
- T-15 でこのスロットに `DoctorPartCard`（院方データ）を流し込む。

### レイアウト（疑似ワイヤ）

```
┌─────────────────────────────────────────────┐
│ ResultHero  ───────────  ScoreCircle 92    │
│ (顔写真 + ランドマーク)  TIAM バランス指数  │
├─────────────────────────────────────────────┤
│ MetricBarList                              │
│  縦三分割 ▮▮▮▮▮▮▮▮▯▯ 86.4  理想 1:1:1      │
│  横五分割 ▮▮▮▮▮▮▮▮▮▯ 91.2  理想 1.0        │
│   …                                        │
├─────────────────────────────────────────────┤
│ PartAnalysisGrid                            │
│ ┌─目─┐ ┌─鼻─┐ ┌─口─┐                       │
│ └────┘ └────┘ └────┘                       │
│ ┌─輪郭─┐ ┌─対称性─┐                        │
│ └──────┘ └────────┘                        │
├─────────────────────────────────────────────┤
│ 総評（DiagnosisText 再配置）+ 出典ラベル    │
└─────────────────────────────────────────────┘
```

## TODO

- [x] モック画像の保管先を [docs/assets/README.md](../assets/README.md) に案内（PNG は任意）
- [x] `lib/result/parts.ts` に `PART_IDS` と `PartId` 型を定義
- [x] `lib/result/partSummaries.ts` を実装（スコア帯×partId のテンプレート、`scanForbidden` を通す）
- [x] `components/result/ResultSectionHeader.tsx` を実装（ゴールドの細線下線つき見出し）
- [x] `components/result/ResultHero.tsx` を実装（既存 `FaceLandmarkOverlay` と `ScoreCircle` を内包）
- [x] `components/result/MetricBarList.tsx` を実装（バー幅 = score%、理想値ヒントを脇に小さく）
- [x] `components/result/PartAnalysisCard.tsx` を実装（`doctorSlot` で院方枠）
- [x] `components/result/PartAnalysisGrid.tsx` を実装（`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`）
- [x] `app/result/[id]/page.tsx` を上記コンポーネントで組み直し、シェアカード・SNS・理想顔・再診断 CTA の位置調整
- [x] `partSummaries.test.ts` で 5 パーツ × 3 スコア帯の出力を確認、禁止語ヒットなし
- [x] `npm run lint` / `npm run build` を通す
- [ ] 旧レイアウトとの差分スクリーンショットを `docs/assets/` に添付（任意）

## 実装メモ（完了時）

- `DiagnosisText` ヘッダに「出典: TIAM 独自 AI …」を追記し、T-15 の院方併記と区別しやすくした。
- `PartAnalysisCard` は `doctorSlot` が未指定のとき院方用ボーダー枠を出さない（T-15 で接続）。
- ヒーロー 1 行サマリーは `getHeroSummaryLine(totalScore)`。

## リファレンス

- requirements.md §4.5, §4.9
- モック保管: [docs/assets/README.md](../assets/README.md)
- 既存: `app/result/[id]/page.tsx`, `components/ScoreCircle.tsx`, `components/ScoreRadar.tsx`, `components/DiagnosisText.tsx`
