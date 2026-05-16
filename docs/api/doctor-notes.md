# Doctor notes API（T-22）

診断 ID（`resultId`）単位の **個別ノート** を `doctor_notes/{resultId}` に保存する。書き込みは **Firebase ID トークン + `admin` または `staff` クレーム**、公開済みの読み取りは **無認証**（`resultId` を知っている前提）。

## `GET /api/doctor-notes/{resultId}`

### 認可

- **Bearer なし**: 来院者向け（公開済みのみ）
- **Bearer + `admin` / `staff`**: 編集画面向け（下書き含むフルノート、`internalMemo` 含む）

### 挙動

- **無認証**: `status === "published"` のみ **200**。未作成・`draft` は **404**。
- **スタッフ認証あり**: 下書き・公開問わず **200**（`DoctorNote` 全体）。未作成は **404**。
- 公開レスポンスからは **`internalMemo` を除去**（パーツ・`report` とも）。

### キャッシュ

- `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`
- `ETag`: `publishedAt` 由来の弱い ETag（`W/"..."`）
- `If-None-Match` が一致すると **304**

### レスポンス例（200）

```json
{
  "resultId": "abc12345",
  "parts": {
    "eyes": { "body": "...", "recommendedCare": [] },
    "nose": { "body": "..." },
    "mouth": { "body": "..." },
    "contour": { "body": "..." },
    "symmetry": { "body": "..." }
  },
  "status": "published",
  "publishedAt": "2026-05-15T09:00:00.000Z",
  "updatedAt": "2026-05-15T09:00:00.000Z",
  "updatedBy": "doctor@example.com"
}
```

---

## `PUT /api/doctor-notes/{resultId}`

### 認可

`Authorization: Bearer <Firebase ID トークン>` 必須。`admin` または `staff` が `true`。

- **401**: `missing_token` / `invalid_token`
- **403**: `insufficient_role`（クレーム不足）

### リクエスト

`Content-Type: application/json`

- Zod 検証に合格したボディのみ受理。
- 全テキストに **禁止語スキャン**（`scanDoctorNoteForbidden`／院方コンテンツと同系統）。

```json
{
  "parts": {
    "eyes": {
      "title": "任意タイトル",
      "body": "本文（1〜800 文字）",
      "recommendedCare": ["ケア案（120 文字以内）"],
      "internalMemo": "院内メモ（GET では返さない）"
    },
    "nose": { "body": "..." },
    "mouth": { "body": "..." },
    "contour": { "body": "..." },
    "symmetry": { "body": "..." }
  },
  "status": "draft"
}
```

`status` は `"draft"` または `"published"`。

任意で `report`（総評・レポートへの医師追記）:

```json
{
  "report": {
    "overallComment": "ドクター総評…",
    "strengths": ["…"],
    "improvements": ["…"],
    "recommendedCare": ["…"],
    "closingMessage": "締めの一文…",
    "internalMemo": "院内のみ"
  }
}
```

### サーバー付与

- `updatedAt` / `updatedBy`（常に上書き）
- `publishedAt`: `status === "published"` のとき **現在時刻**を付与。`draft` のときはフィールドを保存しない（既存ドキュメントを上書きするため、公開フラグを下げると公開用 GET は 404 になる）。

### レスポンス例（200）

```json
{ "ok": true, "status": "published", "publishedAt": "2026-05-15T09:00:00.000Z" }
```

```json
{ "ok": true, "status": "draft" }
```

### エラー

`DoctorContentError` 形式（T-13 と同一スキーマに `missing_token` / `invalid_token` / `insufficient_role` / `draft_only` を追加）。

- **400**: `invalid_request` / `forbidden_content`（`forbiddenHits` あり得る）
- **503**: Firebase Admin 未設定時（`fetch_failed` / `write_failed`）

---

## クライアント

- `lib/admin/notes/client.ts` — `fetchPublishedDoctorNote` / `putDoctorNote`

## 関連コード

- 型・Zod: `lib/doctor-notes/types.ts`
- リポジトリ: `lib/doctor-notes/repository.ts`
- 禁止語: `lib/doctor-notes/scanForbidden.ts`
- 公開形への変換: `lib/doctor-notes/publicNote.ts`
- ルート: `app/api/doctor-notes/[resultId]/route.ts`
- Firestore ルール: `firestore.rules` の `match /doctor_notes/{resultId}`
