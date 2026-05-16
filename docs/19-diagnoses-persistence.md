# 19. 診断結果の永続化（`diagnoses/{resultId}`）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-19                                |
| 関連要件   | requirements.md §1.5 / §4.9.5 / §4.10（F-09）/ §5.2.1 |
| 依存       | T-04, T-09                          |
| 優先度     | 高                                  |
| 見積       | 3〜4 日                             |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

現状の MVP は **診断結果がブラウザ内のみ**（Zustand + nanoid 由来の `resultId`）で、リロードすると失われる。医師が **接客中・後日**いずれでも個別ノートを記入できるようにするため、**診断完了時に Firestore `diagnoses/{resultId}` に診断メタデータを保存** する。写真本体は **既定で保存しない**（写真ポリシーは院運用で切り替え）。

院内ツール運用（v0.3.2）の前提として、**スタッフ事前ログイン端末**で診断完了 → そのまま結果画面 → 編集画面に遷移する流れの **データ基盤**となるチケット。

## ゴール / 受け入れ基準

- [ ] 既存の診断フロー完了時に、診断メタデータが Firestore `diagnoses/{resultId}` に保存される
- [ ] 保存対象は **スコア・指標・診断テキスト** などの**数値・テキスト**に限定し、**写真原本は保存しない**（既定 `photoPolicy: "none"`）
- [ ] `photoPolicy: "thumbnail"` モード（将来オプション）を **コードと型では用意**しておく（Phase 1.5 で有効化）
- [ ] 結果画面リロード時、`resultId` から **Firestore 経由で診断データを復元**できる（Zustand に乗らない初回訪問も可）
- [ ] `firestore.rules` で **読み取りは `resultId` を知っている者に許可**、書き込みは API 経由のみ
- [ ] `npm run lint` / `npm run build` / 既存テストがクリーン

## 設計メモ

### データモデル

```ts
// lib/diagnoses/types.ts（新規）
export const PHOTO_POLICY = ["none", "thumbnail"] as const;
export type PhotoPolicy = (typeof PHOTO_POLICY)[number];

export type DiagnosisRecord = {
  resultId: string;          // 既存の nanoid(10)
  createdAt: string;         // ISO 8601
  scoreResult: ScoreResult;  // lib/faceAnalysis/scoring.ts
  diagnosisText: DiagnoseResponse; // lib/diagnosis/types.ts
  // 院運用で後付け（任意・T-20/T-21 で書き込み）
  patientLabel?: string;
  patientLabelUpdatedBy?: string;
  patientLabelUpdatedAt?: string;
  // 写真ポリシーが "thumbnail" のときのみ
  thumbnailUrl?: string;
  photoPolicy: PhotoPolicy;  // 保管時点のポリシーを記録（監査用）
};
```

Zod スキーマも同ファイルに用意し、サーバー / クライアント両方で再利用する。

### 保存タイミング

- 既存フロー: `/diagnose` → MediaPipe → scoring → `/api/diagnose`（テキスト生成）
- **追加**: `/api/diagnose` の結果が返った直後にクライアントから `POST /api/diagnoses` を叩き、診断メタデータを保存
- 失敗時: 結果画面は従来どおり Zustand から表示する（医師ノート機能は使えないが UX は壊れない）

### API

| Method | Path | 認可 | 用途 |
|--------|------|------|------|
| `POST` | `/api/diagnoses` | 来院者（無認証・診断 ID と整合性のあるペイロード前提） | 診断レコードの保存 |
| `GET`  | `/api/diagnoses/{resultId}` | 公開（来院者）/ Bearer + admin/staff | 結果画面の復元・管理画面の詳細表示 |
| `GET`  | `/api/diagnoses` | Bearer + admin / staff | 一覧（T-20） |
| `PATCH`| `/api/diagnoses/{resultId}` | Bearer + admin / staff | `patientLabel` などのメタ更新（T-20/T-21） |

POST は **`resultId` をクライアントが採番** する設計を踏襲（既存 Zustand）するが、**サーバー側で必須フィールドを Zod 検証** し、`createdAt` と `photoPolicy` はサーバーで付与する。

`admin` / `staff` クレームの両方を許可することで、v0.3.2 の院内ツール運用（医師＋スタッフ）に対応する。書き込み API の認可検証は既存の `verifyAdminFromRequest` を **クレームの OR 判定**に拡張する形で再利用する。

### `photoPolicy` の切替

- 環境変数: `PHOTO_POLICY=none | thumbnail`（既定 `none`）
- 将来、管理画面で院ごとに切り替えるオプション枠を `clinic_settings` として用意可能

### 写真保管（thumbnail モード）

- 採用すると Cloud Storage への保存・セキュリティルール・保管期間ポリシーが必要
- Phase 1.5 で別チケット化（このチケットは **インターフェースだけ用意**、実装は `none` のみ）

### Firestore セキュリティルール（追加）

```text
match /diagnoses/{resultId} {
  // 来院者は自分の resultId を知っている前提でアクセス可
  allow get: if true;
  allow list: if request.auth != null
              && (request.auth.token.admin == true || request.auth.token.staff == true);
  allow create, update, delete: if false;       // 書き込みは API 経由のみ
}
```

API ルート側で Admin SDK 経由で書き込みを行う。`staff` クレームの付与運用は §5.2.1 に従い、`scripts/admin/grantAdmin.ts` を `grantStaff.ts` の対称スクリプトとして拡張するか、引数でロール指定できるよう改修する（実装詳細は本チケット外）。

### 削除請求

- 来院者からの削除請求に応えるため、admin 用 `DELETE /api/diagnoses/{resultId}` を Phase 1.5 で追加
- 保管期間ポリシーも合わせて整備

## 配置（追加・変更）

```
app/api/diagnoses/
  route.ts                      POST 一覧 GET（admin）
  [resultId]/route.ts           GET / PATCH（admin）
lib/diagnoses/
  types.ts                      Zod + TypeScript 型
  repository.ts                 Firestore CRUD（server-only）
firestore.rules                 diagnoses 用ルール追記
```

## TODO

- [ ] `lib/diagnoses/types.ts` を実装（Zod + 型）
- [ ] `lib/diagnoses/repository.ts` を実装（`saveDiagnosis` / `getDiagnosis` / `listDiagnoses` / `updateDiagnosisMeta`）
- [ ] `app/api/diagnoses/route.ts` に POST（来院者）と GET 一覧（admin / staff）を実装
- [ ] `app/api/diagnoses/[resultId]/route.ts` に GET / PATCH を実装（PATCH は admin / staff クレーム必須）
- [ ] `lib/admin/authGuard.ts` の `verifyAdminFromRequest` を **`admin` または `staff` クレームの OR 判定**に拡張（既存 admin だけの呼び出し元と互換維持）
- [ ] クライアント側 hook: `useDiagnosisRecord(resultId)` で取得（結果画面のリロード復元）
- [ ] `app/diagnose/...` の既存フロー末尾に `POST /api/diagnoses` を組み込み（失敗しても結果画面は壊さない）
- [ ] `firestore.rules` 更新（`staff` クレームを許可リストに追加）
- [ ] Vitest: types / repository / route ハンドラ（admin・staff・無認証の 3 ケース）
- [ ] `docs/api/diagnoses.md` を新規作成

## リファレンス

- requirements.md §1.5 / §4.9.5 / §4.10 / §5.2.1
- 既存実装: `lib/store/diagnosis-store.ts`, `lib/faceAnalysis/scoring.ts`, `lib/diagnosis/types.ts`
- T-13 の `lib/doctor/repository.ts` を構造的に流用
- T-14 の `lib/admin/authGuard.ts`（クレーム検証を staff 拡張）
