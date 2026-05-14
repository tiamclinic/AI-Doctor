# 13. ドクター記述コンテンツ（データモデル＆読み取り API）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-13                                |
| 関連要件   | [requirements.md §4.9.2](./requirements.md) |
| 依存       | T-09（本番 Firebase 前提。ローカルは JSON モックでも可） |
| 優先度     | 高                                  |
| 見積       | 3〜5 日                             |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

医師が**裏側で編集する**パーツ別テキスト（目・鼻・口・輪郭・左右対称性等）の**データモデル**と、フロントが取得する**読み取り API**（またはビルド時埋め込み）を定義する。保存先は要件どおり **Firestore / JSON 静的配置 / Headless CMS** のいずれかを ADR で決定する。

## ゴール / 受け入れ基準

- [ ] **スキーマ**（Zod 推奨）: クリニック ID（任意）、パーツ ID、見出し、本文（Markdown またはプレーンテキスト）、任意の脚注、更新日時
- [ ] パーツ ID は初期セット固定（例: `eyes` `nose` `mouth` `contour` `symmetry`）＋将来拡張可能
- [ ] **GET API**（例: `GET /api/clinic-content` または `GET /api/clinic-content/[part]`）で SSR/CSR が取得可能。認証要否は T-17 と連動
- [ ] 本番では Secret/IAM で書き込みは管理画面のみ（読み取りは公開 or 来院者トークンのみ等、方針を決める）
- [ ] 開発用の `fixtures/doctor-content.json` でローカル動作可能

## TODO

- [ ] 保存先オプション比較（Firestore vs JSON vs CMS）を 1 ページ ADR に記録
- [ ] Zod スキーマ + TypeScript 型を `lib/clinic-content/` 等に配置
- [ ] Route Handler 実装 + キャッシュ方針（`revalidate` 等）
- [ ] Firebase Console でのサンプルデータ投入手順を `docs/` に記載
- [ ] エラー時のフォールバック（空表示 + 「院方情報を読み込めませんでした」）

## リファレンス

- [requirements.md](./requirements.md) §4.9.2
