# 23. 共通テンプレ層（T-13/T-14）のサンセット

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-23                                |
| 関連要件   | requirements.md §4.9.2（注記） / §4.10（廃止対象） |
| 依存       | T-15（v0.3.2 再定義）, T-21         |
| 優先度     | 中                                  |
| 見積       | 1〜2 日                             |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

要件 0.3.1 で **個別ノート 1 本化**、0.3.2 で **院内ツール運用（スタッフ事前ログイン + 結果画面 CTA）** が確定したため、T-13/T-14 で実装した **クリニック共通テンプレ層**（Firestore `doctor_contents/default`、`/admin/doctor-content`、`/api/doctor-content`）を段階的に廃止する。

コード資産（admin 認証・タブ UI・禁止語スキャナ・プレビュー）は T-15・T-19〜T-22 で個別ノート用に流用済みのため、本チケットでは **共通テンプレ層の本体削除**と関連ドキュメント整理を行う。`/admin/login` や `AdminGuard`・`grant:admin` スクリプトなど、**個別ノート編集に流用するコード資産は残す**。

## ゴール / 受け入れ基準

- [x] 結果画面が `useDoctorContent` / `/api/doctor-content` に依存しないこと（T-15 v0.3.2 完了後）
- [x] `/admin/doctor-content` は `/admin/diagnoses` へリダイレクト。ログイン後リンクは `/admin/diagnoses`
- [x] `app/api/doctor-content/route.ts` 削除
- [x] `scripts/seed/*` を `legacy/scripts/seed/` に退避、`npm run seed:doctor` 削除
- [x] `firestore.rules` から `doctor_contents` 関連ルールを削除
- [ ] 既存 Firestore の `doctor_contents` ドキュメントを削除（手順: `docs/api/doctor-content.md`）
- [x] `docs/api/doctor-content.md` / `docs/13-*.md` / `docs/14-*.md` を **「廃止済み」** に更新
- [x] `package.json` から `seed:doctor` 削除
- [x] **流用継続するコード資産**（`/admin/login`, `authGuard`, `AdminGuard`, `grant:admin`, `PartAnalysisCard`, `lib/doctor-notes/scanForbidden.ts`）を維持
- [x] `npm run lint` / `npm run build` がクリーン（実施時に確認）

## 削除 / 改修対象（コード）

| 区分 | パス |
|------|------|
| 削除 | `app/admin/doctor-content/page.tsx` |
| 削除 | `app/api/doctor-content/route.ts` |
| 削除 | `lib/doctor/client.ts` |
| 削除 | `lib/doctor/repository.ts` |
| 削除 | `lib/doctor/types.ts`（一部の `PartId` 等は `lib/result/parts.ts` を参照に統一） |
| 削除 | `components/result/useDoctorContent.ts`（T-15 後） |
| 削除 | `scripts/seed/doctor-content.seed.json` / `scripts/seed/doctorContent.ts` / `npm run seed:doctor` |
| 削除 | `lib/admin/client.ts` の `publishDoctorContent` / `doctorContentToDraft` |
| 改修 | `components/result/PartAnalysisGrid.tsx` から `doctorContent` プロップを削除（T-15 で個別ノートに置き換え） |
| 改修 | `docs/INDEX.md` の T-13 / T-14 を **廃止済み** に更新 |

> 流用は T-15 / T-19〜T-22 で完了している前提（`scanDoctorContentForbidden` などは個別ノート用に移植済み）。

## 移行ステップ

1. **T-15（v0.3.2 結果画面）完了** → 結果画面が `doctor_notes` のみ参照する
2. **T-21 完了** → `/admin/diagnoses/{resultId}` で個別ノート編集が成立している
3. `/admin/doctor-content` を **301 リダイレクト** で `/admin/diagnoses` に向ける（過渡期）
4. 1 週間運用後、ルート本体・API・Firestore コレクションを削除
5. 既存 `doctor_contents/default` ドキュメントを手動削除（手順書を残す）

### Firestore 削除コマンド例

```bash
# 1) コレクションを退避（任意）
firebase firestore:export gs://<bucket>/legacy/doctor_contents \
  --collection-ids doctor_contents --project ai-doctor-5681b

# 2) 削除
firebase firestore:delete doctor_contents/default \
  --recursive --project ai-doctor-5681b
```

## TODO

- [ ] T-15（v0.3.2）/ T-21 完了を待って削除作業を順次実施
- [ ] ルート・API・hooks を順に削除し、ビルドが通ることを各ステップで確認
- [ ] Firestore のドキュメントを退避 → 削除
- [ ] `firestore.rules` の `doctor_contents` ルール削除 → デプロイ
- [ ] ドキュメント（INDEX / 13 / 14 / api/doctor-content）を「廃止済み」に更新
- [ ] CHANGELOG（後付け）に 0.3.1 / 0.3.2 移行ログを記録

## リファレンス

- requirements.md §4.9.2 注記 / §4.10
- T-13: `docs/13-doctor-content-model-api.md`
- T-14: `docs/14-doctor-admin-cms.md`
- T-15: `docs/15-result-doctor-merged-display.md`（v0.3.2 再定義）
