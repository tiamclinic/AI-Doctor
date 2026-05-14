# TIAM Beauty AI ドキュメント

TIAM Beauty AI 診断 Web アプリの開発者向けドキュメントです。
新しくジョインした開発者・将来の自分が「このプロジェクトの全体像」と「変更を加えるための入口」を最短で掴むことを目的に整理しています。

## このドキュメントの読み方

| 立場 | まず読むべき |
| --- | --- |
| プロジェクトに初めて触れる | [architecture/overview](./architecture/overview.md) → [guides/getting-started](./guides/getting-started.md) |
| API を呼びたい / 仕様を確認したい | [api/README](./api/README.md) |
| 特定機能の挙動を変えたい | [features/README](./features/README.md) |
| ローカルで動かしたい / デプロイしたい | [guides/getting-started](./guides/getting-started.md) / [guides/deployment](./guides/deployment.md) |
| 仕様の決定根拠を知りたい | [requirements.md](./requirements.md)（親要件定義） |
| MVP 開発当時のタスク履歴 | [INDEX.md](./INDEX.md)（チケット一覧） |

## ディレクトリ構成

```
docs/
├── README.md            このファイル（全体エントリポイント）
├── requirements.md      親要件定義書（プロダクト仕様の最終決定根拠）
├── INDEX.md             MVP 開発時のチケット一覧（00–10）
├── api/                 公開 API（Route Handler）リファレンス
├── architecture/        システム設計・データフロー・技術選定
├── features/            機能単位の挙動・実装方針
└── guides/              開発／運用の How-to
```

## 各カテゴリの概要

### [api/](./api/README.md)

Next.js App Router の Route Handler として実装された 4 つのエンドポイントの
リクエスト／レスポンス／エラーコード／呼び出しサンプル。フロントエンドや
外部クライアントから呼び出すときの一次情報。

### [architecture/](./architecture/README.md)

「写真はブラウザの外に基本出さない」「OpenAI へ送るのは数値のみ」など、
このプロジェクトを成立させているプライバシー不変条件・データフロー・
技術スタックの選定理由をまとめている。

### [features/](./features/README.md)

写真アップロード／顔ランドマーク検出／黄金比スコアリング／AI 診断文／
AI 理想顔／シェアカード／同意フローといった機能の「何をしているか」と
「なぜそうしたか」。コードへのリンク付き。

### [guides/](./guides/README.md)

ローカル開発・環境変数・テスト・デプロイ・トラブルシュート・コーディング
規約・薬機法 / 景表法 対応など、手を動かす前に確認したい運用ノウハウ。

## 補助ドキュメント（既存）

- [`requirements.md`](./requirements.md): プロダクト全体の要件定義（機能・非機能・受け入れ基準）
- [`INDEX.md`](./INDEX.md): MVP 開発時のチケット 00–10。各機能ごとの TODO 履歴
- `00-project-setup.md` 〜 `10-qa-release.md`: 各チケットの作業ログ。歴史的経緯を追うときに参照
