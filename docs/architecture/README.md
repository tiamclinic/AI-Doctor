# アーキテクチャ

TIAM Beauty AI 診断 Web アプリの設計と、その判断根拠をまとめたカテゴリです。

| ドキュメント | 内容 |
| --- | --- |
| [overview.md](./overview.md) | システム全体像。ユーザー画面遷移と裏側の処理 |
| [data-flow.md](./data-flow.md) | 写真／スコア／診断テキスト／理想顔がどう流れるか。**プライバシー不変条件** |
| [directory-structure.md](./directory-structure.md) | ディレクトリ構成と各モジュールの責務 |
| [tech-stack.md](./tech-stack.md) | 使用ライブラリと選定理由 |
| [state-management.md](./state-management.md) | Zustand によるクライアント状態管理 |

## 設計の出発点

要件定義（[../requirements.md](../requirements.md)）から派生した、絶対に外さない設計判断:

1. **写真はブラウザの外に基本出さない** — MediaPipe をクライアント WASM で動かし、サーバーへは数値スコアのみ
2. **理想顔生成だけ例外** — 写真を OpenAI に渡す唯一の経路。明示的同意 + レート制限で守る
3. **医療表現の自動置換 + 禁止フレーズスキャン** — 薬機法 / 景表法対応はサーバー側でハードガード
4. **MVP は単一プロセス** — Cloud Run + 共有ストアなし。レート制限などはプロセスメモリで十分とする
