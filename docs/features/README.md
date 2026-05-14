# 機能ドキュメント

機能単位の挙動・実装方針・関連コードの索引です。
要件の決定根拠は [`../requirements.md`](../requirements.md)、MVP 期間のチケット履歴は [`../INDEX.md`](../INDEX.md) を参照。

| F-ID | 機能 | ドキュメント |
| --- | --- | --- |
| F-01 | 写真アップロード | [photo-upload.md](./photo-upload.md) |
| F-02 | 顔ランドマーク検出 | [face-landmark.md](./face-landmark.md) |
| F-03 | 黄金比スコアリング（TIAM 6 指標） | [golden-ratio-scoring.md](./golden-ratio-scoring.md) |
| F-04 | AI 診断文生成 | [ai-diagnosis.md](./ai-diagnosis.md) |
| F-05 | 結果画面 | [result-screen.md](./result-screen.md) |
| F-06 | SNS シェアカード | [share-card.md](./share-card.md) |
| F-07 | AI 理想顔生成 | [ideal-portrait.md](./ideal-portrait.md) |
| F-08 | SNS シェア導線 | [sns-share.md](./sns-share.md) |
| — | 同意・プライバシーフロー | [consent-privacy.md](./consent-privacy.md) |

## 機能横断のお作法

- **薬機法・景表法配慮**: 文言を追加するときは [`lib/prompt/forbiddenWords.ts`](../../lib/prompt/forbiddenWords.ts) と [guides/legal-compliance](../guides/legal-compliance.md) を必ず確認
- **写真の扱い**: 「送る／保存する」コードを書くときは [architecture/data-flow](../architecture/data-flow.md) のプライバシー不変条件を最初に読む
- **ブランド**: 色／フォント／トーンは [`app/globals.css`](../../app/globals.css) と [`CLAUDE.md`](../../CLAUDE.md) を参照
