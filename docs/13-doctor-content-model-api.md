# 13. ドクター記述コンテンツ（データモデル＆読み取り API）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-13                                |
| 関連要件   | requirements.md §1.5 / §4.9.2       |
| 依存       | T-11                                |
| 優先度     | 高                                  |
| 見積       | 2〜3 日                             |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

医師（クリニック）が **パーツ別（目 / 鼻 / 口 / 輪郭 / 左右対称性）に編集できる文面**を保管し、結果画面で読み出すための **データモデル / ストレージ / 読み取り API** を整える。MVP は **クリニック 1 拠点 = ドキュメント 1 本**で運用し、Phase 2 でテナント別に拡張できる構造にしておく。

書き込み UI は **T-14** に分離。本チケットは **読み取り側（クライアントが結果画面で取得する）と、最小限の永続化**に責務を限定する。

## ゴール / 受け入れ基準

- [ ] 保管方式が **Firestore（`doctor_contents/default`）** に決定し、`apphosting.yaml` / セキュリティルール初版が用意されている
- [ ] `lib/doctor/types.ts` に `DoctorContent` の Zod スキーマと TypeScript 型が定義されている
- [ ] `lib/doctor/repository.ts`（サーバー専用 / `import "server-only"`）が **`getDoctorContent(tenantId = "default")`** を提供する
- [ ] `GET /api/doctor-content` が **ETag + Cache-Control: s-maxage=300, stale-while-revalidate=86400** で返す
- [ ] **シード JSON**（`scripts/seed/doctor-content.seed.json`）と、それを Firestore に流す **`scripts/seed/doctorContent.ts`** が用意されている
- [ ] 結果画面（T-15 で利用）から `fetch('/api/doctor-content')` で取得し、JSON が型どおりに通る
- [ ] `firestore.rules` で **読み出しはオープン / 書き込みは admin カスタムクレームのみ**
- [ ] `npm run lint` / `npm run build` がクリーン

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

- [ ] Firebase コンソールで Firestore を有効化（リージョン: `asia-northeast1`）
- [ ] `firebase-admin` を依存に追加（サーバー専用）
- [ ] `lib/doctor/types.ts` に Zod スキーマと `PART_IDS` を実装
- [ ] `lib/doctor/repository.ts` を実装（`getDoctorContent` のみ。`firebase-admin` の初期化はシングルトン）
- [ ] `lib/doctor/client.ts` を実装（ブラウザ用 `getDoctorContent()` フェッチヘルパ）
- [ ] `app/api/doctor-content/route.ts` を実装（GET、ETag、`Cache-Control`、`runtime = "nodejs"`）
- [ ] `scripts/seed/doctor-content.seed.json` を作成
- [ ] `scripts/seed/doctorContent.ts` を作成（`npm run seed:doctor` で実行できるよう `package.json` にスクリプト追加）
- [ ] `firestore.rules` を作成し、`firebase deploy --only firestore:rules` の手順を `docs/09-deploy.md` に追記
- [ ] `lib/doctor/__tests__/types.test.ts` を作成（バリデーション 5 ケース以上）
- [ ] `docs/api/doctor-content.md` を新規追加し、リクエスト/レスポンス/キャッシュ仕様を記述
- [ ] `.env.local.example` に Firebase 関連の **クライアント側（PUBLIC）/ サーバー側（SECRET）** の必要キーを追記
- [ ] `npm run lint` / `npm run build` を通す

## リファレンス

- requirements.md §1.5, §4.9.2
- Firebase Admin (Firestore): https://firebase.google.com/docs/firestore/server/quickstart
- Next.js Route Handler: `node_modules/next/dist/docs/`（プロジェクト同梱版を参照）
