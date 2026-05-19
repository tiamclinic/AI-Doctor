# legacy/

T-23 で廃止した **クリニック共通テンプレ層**（T-13/T-14）のシード・テストを保管しています。

- `scripts/seed/` — 旧 `npm run seed:doctor`（実行不可。`lib/doctor/types` は削除済み）
- `lib/doctor/__tests__/` — 旧 ETag / Zod テスト

現行のドクター所見は `doctor_notes` コレクションと `/api/doctor-notes/{resultId}` を使用してください。
