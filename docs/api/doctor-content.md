# GET /api/doctor-content 【廃止済み】

> **T-23（2026-05-19）で本 API は削除されました。**  
> 後継は [doctor-notes.md](./doctor-notes.md)（`GET/PUT /api/doctor-notes/{resultId}`）です。  
> 管理 UI は `/admin/diagnoses` → `/admin/diagnoses/{resultId}` です。

## Firestore `doctor_contents` の手動削除（本番・検証環境）

コードと `firestore.rules` から `doctor_contents` を除去済みです。既存データは手動で削除してください。

```bash
# 1) 退避（任意）
firebase firestore:export gs://<bucket>/legacy/doctor_contents \
  --collection-ids doctor_contents --project ai-doctor-5681b

# 2) 削除
firebase firestore:delete doctor_contents/default \
  --recursive --project ai-doctor-5681b
```

シードスクリプトと JSON は [`legacy/scripts/seed/`](../../legacy/scripts/seed/) に退避しています（`npm run seed:doctor` は廃止）。

---

以下は **履歴** として残します（実装ファイルはリポジトリから削除済み）。

## 旧ストレージ

- Firestore コレクション: `doctor_contents`
- ドキュメント ID: `default`

## 旧リクエスト

```http
GET /api/doctor-content
Accept: application/json
If-None-Match: W/"<etag>"
```

## 移行先

| 旧 | 新 |
|----|-----|
| 共通テンプレ `doctor_contents/default` | 診断単位 `doctor_notes/{resultId}` |
| `/admin/doctor-content` | `/admin/diagnoses`（旧 URL はリダイレクト） |
| `useDoctorContent` | `useDoctorNote` |
