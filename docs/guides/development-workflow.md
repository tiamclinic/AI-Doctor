# 開発ワークフロー

## ブランチ戦略

`main` を中心にしたシンプルなトピックブランチ運用:

```
main
 ├── feat/<short-name>
 ├── fix/<short-name>
 └── chore/<short-name>
```

- 直接 `main` にコミットしない（小規模修正でも PR を作る）
- 長期ブランチは作らない（マージコンフリクトを抑える）

## 日々の流れ

```bash
# 1. main を最新に
git switch main && git pull

# 2. トピックブランチ作成
git switch -c feat/landing-cta-copy

# 3. 開発
npm run dev

# 4. 自動テスト
npm test
npm run lint
npm run build  # 重い変更時のみ

# 5. コミット
git add <files>
git commit -m "feat(landing): tighten CTA copy"

# 6. push & PR
git push -u origin feat/landing-cta-copy
gh pr create
```

## PR の粒度

- 1 PR = 1 つの目的。混ぜない
- 体感目安: diff 300 行を超えたら分割を検討
- スクリーンショット / GIF を貼る（UI 変更時）

## レビューのチェックポイント

- 写真をサーバーへ送る経路を増やしていないか
- `consent` チェックを通っているか
- 禁止フレーズを追加していないか / 既存の禁止フレーズに引っかかっていないか
- 環境変数の追加は `.env.local.example` と `apphosting.yaml` の両方で反映されているか
- 新しい文字列を `share-card/template.tsx` に追加した場合 `STATIC_TEMPLATE_TEXT` も更新したか

## マージ後

- Firebase App Hosting が GitHub の `main` push を検知して自動デプロイ
- 失敗時は GitHub Actions / App Hosting コンソールでログ確認
- ロールバックが必要なら `git revert` で前コミットに戻す PR を作る（force push しない）

## 一時的に止めたい変更

- フィーチャーフラグの仕組みは MVP では未導入
- 必要なら一時的にコンポーネントを返り値 `null` に差し替えるなど、コードレベルで対応
- 環境変数による切替を入れる場合は `NEXT_PUBLIC_FEATURE_*` を使う

## ドキュメント更新

コードを変えるとき、関連ドキュメントが古くなっていないか確認:

- API 変更 → `docs/api/<endpoint>.md`
- 機能変更 → `docs/features/<name>.md`
- アーキテクチャ変更 → `docs/architecture/`
- 環境変数追加 → `docs/guides/environment-variables.md` + `.env.local.example`

## リリースノート（任意）

MVP では運用していませんが、必要に応じて `docs/CHANGELOG.md` を新設して [Keep a Changelog](https://keepachangelog.com/) 形式で残すと履歴が追いやすくなります。
