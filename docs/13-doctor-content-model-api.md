# 13. ドクター記述コンテンツ（データモデル＆読み取り API）【廃止予定】

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-13                                |
| 関連要件   | requirements.md §1.5 / §4.9.2（旧） |
| 依存       | T-11                                |
| 優先度     | 高                                  |
| 見積       | 2〜3 日                             |
| 担当       | -                                   |
| ステータス | **廃止予定**（コード資産は T-19〜T-21 で流用済み） |

> ⚠️ **サンセット注記（2026-05-15 / requirements v0.3.1）**
>
> 本チケットで実装した **クリニック共通テンプレ層**（Firestore `doctor_contents/default` / `GET /api/doctor-content` / 結果画面の `useDoctorContent`）は、**個別ノート 1 本化**の方針により **MVP では使用しない**。
>
> - 後継: 診断 ID 単位の **個別ノート**（[T-22](./22-doctor-notes-api.md) `doctor_notes` API）
> - 編集 UI: [T-21 個別編集画面](./21-admin-diagnoses-edit.md)
> - サンセット作業: [T-23 共通テンプレ層の廃止](./23-deprecate-doctor-content.md)
>
> 本ドキュメントは履歴として残しますが、新規実装では参照しないでください。コード資産（admin 認証・Zod パターン・禁止語スキャナ・パーツタブ UI・プレビュー）は **T-19〜T-21 で個別ノート向けに移植済み**です。

## 概要

医師（クリニック）が **パーツ別（目 / 鼻 / 口 / 輪郭 / 左右対称性）に編集できる文面**を保管し、結果画面で読み出すための **データモデル / ストレージ / 読み取り API** を整える。MVP は **クリニック 1 拠点 = ドキュメント 1 本**で運用し、Phase 2 でテナント別に拡張できる構造にしておく。

書き込み UI は **T-14** に分離。本チケットは **読み取り側（クライアントが結果画面で取得する）と、最小限の永続化**に責務を限定する。

## ゴール / 受け入れ基準

- [x] 保管方式が **Firestore（`doctor_contents/default`）** に決定し、`apphosting.yaml` / セキュリティルール初版が用意されている
- [x] `lib/doctor/types.ts` に `DoctorContent` の Zod スキーマと TypeScript 型が定義されている
- [x] `lib/doctor/repository.ts`（サーバー専用 / `import "server-only"`）が **`getDoctorContent(tenantId = "default")`** を提供する
- [x] `GET /api/doctor-content` が **ETag + Cache-Control: s-maxage=300, stale-while-revalidate=86400** で返す
- [x] **シード JSON**（`scripts/seed/doctor-content.seed.json`）と、それを Firestore に流す **`scripts/seed/doctorContent.ts`** が用意されている
- [x] 結果画面から `fetch('/api/doctor-content')` で取得（開発時はシード JSON フォールバック）
- [x] `firestore.rules` で **読み出しはオープン / 書き込みは admin カスタムクレームのみ**
- [x] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### ストレージ選定

| 選択肢                 | 採否 | 理由                                                        |
| ---------------------- | ---- | ----------------------------------------------------------- |
| 静的 JSON（バンドル）  | △    | デプロイ無しに更新できないため運用厳しい                    |
| Firestore              | **採用** | App Hosting と相性良し、ルールで読み書き分離、後でテナント拡張容易 |
| ヘッドレス CMS（外部） | ×    | 当面オーバースペック、コスト・依存増                        |

### データモデル

```ts
// lib/doctor/types.ts
import { z } from "zod";

export const PART_IDS = ["eyes", "nose", "mouth", "contour", "symmetry"] as const;
export type PartId = (typeof PART_IDS)[number];

export const DoctorPartContentSchema = z.object({
  // 結果画面で見出しに使う任意の上書きラベル
  title: z.string().min(1).max(40).optional(),
  // パーツ別の本文（プレーンテキスト、改行は \n、最大 800 字）
  body: z.string().min(1).max(800),
  // タグ（将来のフィルタ用、MVP では未使用でも保管はする）
  tags: z.array(z.string().min(1).max(20)).max(10).default([]),
  // 最終更新メタ
  updatedAt: z.string().datetime(),
  updatedBy: z.string().min(1).max(80),
});

export const DoctorContentSchema = z.object({
  tenantId: z.literal("default"), // MVP: 単一テナント
  // 共通の冒頭/末尾フッター（任意）
  preamble: z.string().max(400).optional(),
  disclaimer: z.string().max(400).optional(),
  parts: z.object({
    eyes: DoctorPartContentSchema,
    nose: DoctorPartContentSchema,
    mouth: DoctorPartContentSchema,
    contour: DoctorPartContentSchema,
    symmetry: DoctorPartContentSchema,
  }),
  publishedAt: z.string().datetime(),
});

export type DoctorContent = z.infer<typeof DoctorContentSchema>;
```

### 配置

```
lib/doctor/
  types.ts                  Zod スキーマ + 型
  repository.ts             import "server-only" + Firestore Admin SDK
  client.ts                 ブラウザ → /api/doctor-content
  __tests__/types.test.ts   スキーマのバリデーション
app/api/doctor-content/
  route.ts                  GET（ETag, Cache-Control）
scripts/seed/
  doctor-content.seed.json  初期投入用シード
  doctorContent.ts          ts-node で実行する Firestore シーダ
firestore.rules             読み取り公開 / 書き込みは admin
```

### API 仕様（読み取り）

```text
GET /api/doctor-content
  → 200 { tenantId, preamble?, parts: { eyes, nose, mouth, contour, symmetry }, publishedAt, disclaimer? }
  → 304 (If-None-Match 一致時)
  → 500 { error: "fetch_failed", message }
ヘッダ:
  Cache-Control: s-maxage=300, stale-while-revalidate=86400
  ETag: W/"<publishedAt のハッシュ>"
```

クライアントは `useEffect` + `fetch` で取得して結果画面に流す。**結果 ID とは無関係**（クリニック共通文面）なので、ページ単位で fetch して問題ない。

### セキュリティルール（初版）

```text
match /doctor_contents/{tenantId} {
  allow read: if true;                       // 院内向け URL のみで配布される想定
  allow write: if request.auth.token.admin == true;
}
```

> **アクセス制限（T-17）と組み合わせて初めて「院内限定」が完成する**。Firestore 単体では公開扱いになる点を docs に明記。

### シードの最小例

`scripts/seed/doctor-content.seed.json` には **本稼働文ではない**仮データを入れる。本物のコピーは T-14 の CMS で医師が入力する。

```json
{
  "tenantId": "default",
  "preamble": "TIAM 美容バランス所見をもとに、TIAM 顧問医師が補足コメントを記載しています。",
  "parts": {
    "eyes":     { "body": "（医師が後で記入）", "tags": [], "updatedAt": "2026-01-01T00:00:00.000Z", "updatedBy": "seed" },
    "nose":     { "body": "（医師が後で記入）", "tags": [], "updatedAt": "2026-01-01T00:00:00.000Z", "updatedBy": "seed" },
    "mouth":    { "body": "（医師が後で記入）", "tags": [], "updatedAt": "2026-01-01T00:00:00.000Z", "updatedBy": "seed" },
    "contour":  { "body": "（医師が後で記入）", "tags": [], "updatedAt": "2026-01-01T00:00:00.000Z", "updatedBy": "seed" },
    "symmetry": { "body": "（医師が後で記入）", "tags": [], "updatedAt": "2026-01-01T00:00:00.000Z", "updatedBy": "seed" }
  },
  "publishedAt": "2026-01-01T00:00:00.000Z",
  "disclaimer": "本コメントは医療診断ではなく、美容バランスの傾向を読み解く参考情報です。"
}
```

## TODO

- [x] Firebase コンソールで Firestore を有効化（リージョン: `asia-northeast1`）— ユーザー確認済み
- [x] `firebase-admin` を依存に追加（サーバー専用）
- [x] `lib/doctor/types.ts` に Zod スキーマと `PART_IDS` を実装
- [x] `lib/doctor/repository.ts` を実装（`getDoctorContent` のみ。`firebase-admin` の初期化はシングルトン）
- [x] `lib/doctor/client.ts` を実装（ブラウザ用 `fetchDoctorContent()` フェッチヘルパ）
- [x] `app/api/doctor-content/route.ts` を実装（GET、ETag、`Cache-Control`、`runtime = "nodejs"`）
- [x] `scripts/seed/doctor-content.seed.json` を作成
- [x] `scripts/seed/doctorContent.ts` を作成（`npm run seed:doctor`）
- [x] `firestore.rules` を作成し、`docs/09-deploy.md` にデプロイ手順を追記
- [x] `lib/doctor/__tests__/types.test.ts` / `etag.test.ts` を作成
- [x] `docs/api/doctor-content.md` を新規追加
- [x] `.env.local.example` に `FIREBASE_PROJECT_ID` 等を追記
- [x] `npm run lint` / `npm run build` を通す

## リファレンス

- requirements.md §1.5, §4.9.2
- Firebase Admin (Firestore): https://firebase.google.com/docs/firestore/server/quickstart
- Next.js Route Handler: `node_modules/next/dist/docs/`（プロジェクト同梱版を参照）
