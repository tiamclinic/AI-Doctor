# 22. `doctor_notes` API（GET / PUT）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-22                                |
| 関連要件   | requirements.md §4.9.5 / §4.10（F-09）/ §5.2.1 |
| 依存       | T-19                                |
| 優先度     | 高                                  |
| 見積       | 2 日                                |
| 担当       | -                                   |
| ステータス | 完了                                |

## 概要

診断 ID（`resultId`）単位の **個別ノート** を **読み取り・書き込み** する API を実装する。書き込みは `admin` または `staff` カスタムクレームを持つ Firebase Auth ユーザーのみ（v0.3.2 院内ツール運用）。読み取りは結果画面から **無認証で可能**（`resultId` を知っている前提）。

## ゴール / 受け入れ基準

- [x] `GET /api/doctor-notes/{resultId}` が **`status === "published"` のノートを返す**（draft は 404）
- [x] `PUT /api/doctor-notes/{resultId}` が **`admin` または `staff` クレーム必須**で書き込み（`draft` / `published` どちらも）
- [x] PUT は **Zod 検証 + 禁止語スキャン**（`scanForbidden` 系の `scanDoctorNoteForbidden`）を必ず実行
- [x] `published` のとき `publishedAt`、いつでも `updatedAt` / `updatedBy` をサーバー付与（`updatedBy` は ID トークンから抽出した UID/メール）
- [x] `firestore.rules` で **クライアント SDK からの書き込み禁止**、読み取りはオープン（`status` フィルタは API 側で実施）
- [x] 認可失敗は 401（未ログイン）/ 403（クレーム不足）を区別して返す
- [x] エラーレスポンスは T-13 のスキーマ（`DoctorContentError`）を流用しつつ、`missing_token` / `invalid_token` / `insufficient_role` / `draft_only` を拡張
- [x] Vitest（happy path / 認可失敗 / バリデーション / 禁止語ヒット）
- [x] `docs/api/doctor-notes.md` を新規作成
- [x] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### データモデル（Zod）

```ts
// lib/doctor-notes/types.ts
export const DOCTOR_NOTES_COLLECTION = "doctor_notes" as const;

export const DoctorPartNoteSchema = z.object({
  title: z.string().min(1).max(40).optional(),
  body: z.string().min(1).max(800),
  recommendedCare: z.array(z.string().min(1).max(120)).max(5).default([]),
  internalMemo: z.string().max(400).optional(),
});

export const DoctorNoteSchema = z.object({
  resultId: z.string().min(1),
  parts: z.object({
    eyes: DoctorPartNoteSchema,
    nose: DoctorPartNoteSchema,
    mouth: DoctorPartNoteSchema,
    contour: DoctorPartNoteSchema,
    symmetry: DoctorPartNoteSchema,
  }),
  status: z.enum(["draft", "published"]),
  updatedAt: isoDateTime,
  updatedBy: z.string().min(1).max(80),
  publishedAt: isoDateTime.optional(),
});
```

クライアントから送る `PUT` ボディは **メタ部分（updatedAt / updatedBy / publishedAt）を省いた `DoctorNotePublishBody`** を別途定義し、サーバーで付与する（T-13 と同じパターン）。

### エンドポイント

| Method | Path | 認可 | 用途 |
|--------|------|------|------|
| `GET`  | `/api/doctor-notes/:resultId` | 公開（結果画面） | `status: "published"` を返す。未公開時は 404 |
| `PUT`  | `/api/doctor-notes/:resultId` | Bearer + (`admin` ∨ `staff`) | 書き込み（`draft` / `published` 両方） |
| `DELETE` | `/api/doctor-notes/:resultId` | Bearer + (`admin` ∨ `staff`) | 取り下げ（Phase 1.5） |

### レスポンス例

GET 200:
```json
{
  "resultId": "abc123",
  "parts": {
    "eyes": { "body": "...", "recommendedCare": ["..."] },
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

GET 404（未公開・未作成）:
```json
{ "error": "not_found", "message": "公開済みのノートはまだありません。" }
```

PUT 200:
```json
{ "ok": true, "status": "published", "publishedAt": "2026-05-15T09:00:00.000Z" }
```

### 認可

- T-19 で拡張した `verifyAdminFromRequest`（**`admin` または `staff` の OR 判定**）を再利用
- 401 / 403 を区別して返却:
  - 401: ID トークンが無い・無効
  - 403: トークンは有効だがクレーム不足（来院者が結果 URL から直叩きした場合などを想定）
- 内部メモ（`internalMemo`）は **GET レスポンスから常に除去**（`status` に関わらず）し、編集 UI 側のみが取得できる別エンドポイント `GET /api/doctor-notes/:resultId/draft`（admin / staff）を Phase 1.5 で検討
- 失敗ケースのレスポンス例:

```json
// 401
{ "error": "missing_token", "message": "認証トークンがありません。" }
// 403
{ "error": "insufficient_role", "message": "admin または staff 権限が必要です。" }
```

### キャッシュ

- 公開後の表示遅延を抑えるため、GET は **`Cache-Control: public, s-maxage=60, stale-while-revalidate=600`** とする（T-13 より短め）
- 同時に **ETag**（`publishedAt` ベース）も付ける

### Firestore セキュリティルール（追加）

```text
match /doctor_notes/{resultId} {
  allow get: if true;
  allow list: if request.auth != null
              && (request.auth.token.admin == true || request.auth.token.staff == true);
  allow create, update, delete: if false; // API 経由のみ
}
```

## 配置

```
app/api/doctor-notes/
  [resultId]/route.ts                  GET / PUT
lib/doctor-notes/
  types.ts                             Zod
  repository.ts                        Firestore CRUD（server-only）
  scanForbidden.ts                     `scanDoctorContentForbidden` 流用
```

## TODO

- [x] `lib/doctor-notes/types.ts` を実装
- [x] `lib/doctor-notes/repository.ts` を実装（`getPublishedDoctorNote` / `saveDoctorNote`）
- [x] `app/api/doctor-notes/[resultId]/route.ts` を実装（GET / PUT）
- [x] `firestore.rules` 追記（`staff` クレーム対応）
- [x] `lib/admin/notes/client.ts`（クライアント側 GET/PUT。401/403 ハンドリング付き）
- [x] Vitest（認可・禁止語・バリデーション・GET 系）
- [x] `docs/api/doctor-notes.md` 新規作成

## リファレンス

- requirements.md §4.9.5 / §4.10 / §5.2.1
- T-13 既存実装: `lib/doctor/repository.ts` / `lib/doctor/types.ts` / `app/api/doctor-content/route.ts`
- T-14 既存実装: `lib/admin/authGuard.ts` / `lib/admin/scanDoctorContent.ts`
- T-19 で拡張した `verifyAdminFromRequest`（admin / staff OR 判定）
