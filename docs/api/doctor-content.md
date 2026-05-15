# GET /api/doctor-content

クリニック共通の **院方パーツ別コメント** を Firestore から読み取り、JSON で返すエンドポイントです。
結果 ID とは無関係（テナント `default` 固定の MVP）。

- 実装: [`app/api/doctor-content/route.ts`](../../app/api/doctor-content/route.ts)
- リポジトリ: [`lib/doctor/repository.ts`](../../lib/doctor/repository.ts)
- 型: [`lib/doctor/types.ts`](../../lib/doctor/types.ts)
- クライアント: [`lib/doctor/client.ts`](../../lib/doctor/client.ts)

## ストレージ

- Firestore コレクション: `doctor_contents`
- ドキュメント ID: `default`（MVP 単一テナント）
- セキュリティルール: [`firestore.rules`](../../firestore.rules)（読み取り公開 / 書き込みは `admin` クレームのみ）

> Firestore の読み取りはルール上公開です。院内限定は **T-17** のアクセス制限と組み合わせて完成します。

## リクエスト

```http
GET /api/doctor-content
Accept: application/json
If-None-Match: W/"<etag>"   # 任意
```

## レスポンス（200 OK）

```ts
type DoctorContent = {
  tenantId: "default";
  preamble?: string;
  disclaimer?: string;
  parts: {
    eyes: DoctorPartContent;
    nose: DoctorPartContent;
    mouth: DoctorPartContent;
    contour: DoctorPartContent;
    symmetry: DoctorPartContent;
  };
  publishedAt: string; // ISO 8601
};

type DoctorPartContent = {
  title?: string;
  body: string;
  tags: string[];
  updatedAt: string;
  updatedBy: string;
};
```

### キャッシュヘッダ

| ヘッダ | 値 |
| --- | --- |
| `Cache-Control` | `public, s-maxage=300, stale-while-revalidate=86400` |
| `ETag` | `W/"<publishedAt の SHA-256 先頭 16 桁>"` |

`If-None-Match` が一致する場合は **304 Not Modified**（ボディなし）。

## エラー

| Status | error | 説明 |
| --- | --- | --- |
| 404 | `not_found` | Firestore にドキュメントが無い（本番） |
| 500 | `fetch_failed` | Admin SDK / 設定エラー |

## シード投入

```bash
# 1. Firebase CLI でログイン（未実施なら）
npx -y firebase-tools@latest login

# 2. シード投入（`firebase login` 直後の access token を自動利用）
export FIREBASE_PROJECT_ID=ai-doctor-5681b
npm run seed:doctor
```

サービスアカウントを使う場合:

```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
npm run seed:doctor
```

初回はルールもデプロイ:

```bash
npx -y firebase-tools@latest deploy --only firestore:rules
```

## 開発時のフォールバック

`NODE_ENV=development` かつ Firestore 未設定・未投入のとき、[`scripts/seed/doctor-content.seed.json`](../../scripts/seed/doctor-content.seed.json) を API が読み込みます。

---

# PUT /api/doctor-content

管理画面（T-14）から **院方コンテンツを公開** するエンドポイント。`admin` カスタムクレーム付き Firebase ID トークンが必須。

## リクエスト

```http
PUT /api/doctor-content
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

```ts
type DoctorContentPublishBody = {
  preamble?: string;
  disclaimer?: string;
  parts: {
    eyes: { title?: string; body: string; tags?: string[] };
    nose: { title?: string; body: string; tags?: string[] };
    mouth: { title?: string; body: string; tags?: string[] };
    contour: { title?: string; body: string; tags?: string[] };
    symmetry: { title?: string; body: string; tags?: string[] };
  };
};
```

サーバーが `publishedAt`・各パーツの `updatedAt` / `updatedBy`（メールまたは uid）を付与して Firestore に保存します。

## レスポンス（200 OK）

```json
{ "ok": true, "publishedAt": "2026-05-15T12:00:00.000Z" }
```

## エラー

| Status | error | 説明 |
| --- | --- | --- |
| 401 | `unauthorized` | トークン無し・無効 |
| 403 | `forbidden` | `admin` クレームなし |
| 400 | `invalid_request` | Zod 検証失敗 |
| 400 | `forbidden_content` | 禁止語検出（`forbiddenHits` 配列付き） |
| 500 | `write_failed` | Firestore 書き込み失敗 |

## admin クレーム付与

```bash
export FIREBASE_PROJECT_ID=ai-doctor-5681b
# サービスアカウントまたは ADC が必要
npm run grant:admin -- <firebase-auth-uid>
```

付与後は **再ログイン** して ID トークンを更新してください。
