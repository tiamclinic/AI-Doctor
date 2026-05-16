# Diagnoses API（T-19）

Firestore コレクション `diagnoses/{resultId}` に、AI 診断完了時のメタデータ（スコア・生値・診断テキスト）を保存・取得する。

## `POST /api/diagnoses`

来院者フローから呼び出し、**認証なし**で保存する（ボディの Zod 検証のみ）。書き込みはサーバー側 Firebase Admin SDK 経由。

### リクエスト

`Content-Type: application/json`

```json
{
  "resultId": "nanoid で採番した ID",
  "scoreResult": {
    "totalScore": 86.4,
    "scores": { "...MetricKey": 90.0 },
    "rawValues": { "...RawMetrics" }
  },
  "diagnosisText": {
    "overallComment": "...",
    "strengths": ["...", "...", "..."],
    "improvements": ["...", "..."],
    "recommendedCare": ["...", "...", "..."],
    "tiamMessage": "..."
  }
}
```

### レスポンス

- `200` — `{ "ok": true, "resultId": "..." }`
- `400` — `{ "error": "invalid_request", "message": "..." }`
- `500` / `503` — `{ "error": "persist_failed", "message": "..." }`（Firebase 未設定時は 503）

### サーバー付与フィールド

- `createdAt` — ISO 8601
- `photoPolicy` — 環境変数 `PHOTO_POLICY` が `thumbnail` のとき `thumbnail`、それ以外は `none`

---

## `GET /api/diagnoses`

スタッフ向け一覧。**Bearer ID トークン**必須。カスタムクレーム **`admin` または `staff`** のいずれかが `true` のユーザのみ。

### クエリ

| パラメータ | 既定 | 説明 |
|------------|------|------|
| `limit`    | 30   | 1〜100 |

### レスポンス

- `200` — `{ "items": DiagnosisRecord[] }`（`createdAt` 降順）
- `401` / `403` — 認可エラー
- `503` — Firebase 未設定

---

## `GET /api/diagnoses/{resultId}`

診断 1 件の取得。**認証なし**（`resultId` を知っている前提）。

- `200` — `DiagnosisRecord`
- `404` — `{ "error": "not_found", "message": "..." }`

---

## `PATCH /api/diagnoses/{resultId}`

`patientLabel` の後付け。**Bearer + `admin` または `staff`**。

### リクエスト

```json
{
  "patientLabel": "カルテ番号など"
}
```

空文字 `""` で `patientLabel` を削除（Firestore フィールド削除）。

### レスポンス

- `200` — `{ "ok": true }`
- `400` / `401` / `403` / `404` / `500`

---

## 関連コード

- 型・Zod: `lib/diagnoses/types.ts`
- レコード構築: `lib/diagnoses/buildRecord.ts`（`repository` から再エクスポート）
- リポジトリ: `lib/diagnoses/repository.ts`
- クライアント保存: `lib/diagnoses/client.ts` の `persistDiagnosis`
- 認可: `lib/admin/authGuard.ts` の `verifyStaffOrAdminFromRequest`
- Firestore ルール: `firestore.rules` の `match /diagnoses/{resultId}`
