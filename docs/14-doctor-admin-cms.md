# 14. ドクター向け管理画面（パーツ別編集 CMS）【廃止予定】

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-14                                |
| 関連要件   | requirements.md §1.5 / §4.9.2（旧）/ §5.3 |
| 依存       | T-13                                |
| 優先度     | 中〜高                              |
| 見積       | 3〜4 日                             |
| 担当       | -                                   |
| ステータス | **廃止予定**（コード資産は T-21 で流用済み） |

> ⚠️ **サンセット注記（2026-05-15 / requirements v0.3.1）**
>
> 本チケットで実装した `/admin/doctor-content`（クリニック共通テンプレ編集画面）は、**個別ノート 1 本化**の方針により **MVP では使用しない**。
>
> - 後継: [T-20 診断一覧](./20-admin-diagnoses-list.md) → [T-21 個別ノート編集](./21-admin-diagnoses-edit.md)
> - サンセット作業: [T-23 共通テンプレ層の廃止](./23-deprecate-doctor-content.md)
>
> 以下のコード資産は **T-21 で個別ノート編集画面に移植済み**で、引き続き運用されます:
>
> - `/admin/login` メール＋パスワードログイン（Firebase Auth）
> - `admin` カスタムクレーム（`scripts/admin/grantAdmin.ts`）
> - `AdminGuard`（クライアント側ガード）
> - パーツタブ UI / 800 字カウンタ / 禁止語警告 / プレビュー基盤
> - `lib/admin/authGuard.ts`（サーバー側 Bearer + admin 検証）
>
> 本ドキュメントは履歴として残しますが、新規実装では参照しないでください。

## 概要

医師がパーツ別文面（`eyes` / `nose` / `mouth` / `contour` / `symmetry`）を **ブラウザから編集・公開できる管理画面**を実装する。MVP は **同一の Next.js アプリ内**に `/admin/doctor-content` として置く。

認証は **Firebase Authentication（メール＋パスワード）＋ admin カスタムクレーム**で最小限。**プレビュー → 公開**の 2 段階を必須にし、公開時のみ `doctor_contents/default` を更新する。

## ゴール / 受け入れ基準

- [x] `/admin/login` でメール＋パスワードログインができる
- [x] **`admin` カスタムクレームが付いたユーザだけ** `/admin/doctor-content` にアクセスできる
- [x] パーツ別タブ（目 / 鼻 / 口 / 輪郭 / 左右対称性）でテキストエリア編集できる
- [x] 文字数カウンタ（最大 800 字）と禁止語警告（`scanForbidden` 流用）が表示される
- [x] **「プレビュー」ボタンで実際の結果画面のパーツカード見た目を確認できる**（モックスコアで合成）
- [x] **「公開」ボタンで Firestore `doctor_contents/default` を更新**し、`publishedAt` と `updatedAt`/`updatedBy` が記録される
- [x] 公開操作は **CSRF/再認証なしの直リンクで叩けない**（API 側でも ID トークン検証 + admin クレーム検証）
- [x] `/admin/*` は **`noindex` メタ**＋検索除外
- [x] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 配置

```
app/admin/
  layout.tsx                      noindex メタ + Firebase Auth ガード
  login/page.tsx                  メール＋パスワードログイン
  doctor-content/page.tsx         編集画面（タブ式）
components/admin/
  AdminGuard.tsx                  クライアント側のクレーム検査ラッパ
  DoctorContentEditor.tsx         タブ + テキストエリア + 禁止語警告
  DoctorContentPreview.tsx        結果画面のカードを模した最小プレビュー
lib/admin/
  firebaseClient.ts               Firebase Web SDK 初期化（クライアント用）
  authGuard.ts                    `verifyAdminFromIdToken` + middleware ヘルパ
app/api/doctor-content/
  route.ts                        既存 GET に PUT/POST を追加（管理者のみ）
```

### API 仕様（書き込み）

```text
PUT /api/doctor-content
  Headers: Authorization: Bearer <Firebase ID Token>
  Body:    DoctorContentSchema（T-13 で定義）
  → 200 { ok: true, publishedAt }
  → 401 { error: "unauthorized" }      // ID トークン無効
  → 403 { error: "forbidden" }         // admin クレームなし
  → 400 { error: "invalid_request", message }
  → 500 { error: "write_failed", message }
```

サーバー側で必ず次の順に検証:

1. `Authorization` ヘッダから ID トークンを取り出し `firebase-admin.auth().verifyIdToken()`
2. `decoded.admin === true` か確認（無ければ 403）
3. `DoctorContentSchema.parse(body)` で形を検証
4. **`scanForbidden(body.parts.*.body)` を実行し、ヒット時は 400 で詳細を返す**（編集者がそのまま気付けるように）
5. Firestore へ `set({ ...body, publishedAt: new Date().toISOString() })`

### Admin クレームの付与

App Hosting からは付与できないため、**ローカル CLI で初回付与**する手順を docs に残す。

```bash
# scripts/admin/grantAdmin.ts
npx ts-node scripts/admin/grantAdmin.ts <uid>
# 内部で admin.auth().setCustomUserClaims(uid, { admin: true }) を呼ぶ
```

### プレビュー方式

- プレビューは **公開せずに**、`<DoctorContentPreview>` 内で **`PartAnalysisCard`（T-11）を直接レンダリング**して見た目を確認する。
- ダミースコアは `{ totalScore: 86, ... }` をフロントで固定し、AI 文ではなく `lib/result/partSummaries.ts` の文を流用。

### UX 上の注意

- 800 字を超えたら保存ボタンを `disabled` にする
- 禁止語ヒット時は赤バッジ＋ヒット語を脇に出す（保存はブロックしない、警告のみ）
- 公開後 3 秒間 "公開しました（キャッシュ反映まで最大 5 分）" を表示

## 運用手順（初回セットアップ）

1. Firebase Console → Authentication → **メール/パスワード** を有効化
2. `.env.local` に `NEXT_PUBLIC_FIREBASE_*` を設定（`.env.local.example` 参照）
3. 管理用ユーザーを Console で作成（メール＋パスワード）
4. UID をコピーし、ローカルで admin クレーム付与:

```bash
export FIREBASE_PROJECT_ID=ai-doctor-5681b
# いずれか:
#   - `npx firebase-tools@latest login` 済み（推奨・シードと同じ）
#   - FIREBASE_SERVICE_ACCOUNT_KEY を .env.local に設定
#   - gcloud auth application-default login
npm run grant:admin -- <uid>   # < > は付けない（UID だけ）
```

5. `npm run dev` → `http://localhost:3000/admin/login` でログイン
6. `/admin/doctor-content` で編集 → プレビュー → **公開**
7. Firestore `doctor_contents/default` の `publishedAt` / `updatedBy` を確認

> クレーム反映には **一度ログアウトして再ログイン** が必要です。

## TODO（手動確認）

- [ ] Firebase Auth を本番プロジェクトで有効化済みか確認
- [ ] 動作確認：ログイン → 編集 → プレビュー → 公開 → GET API / 結果画面への反映

## リファレンス

- requirements.md §1.5, §4.9.2, §5.3
- Firebase Auth: https://firebase.google.com/docs/auth
- Firebase Admin verifyIdToken: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- T-13: `docs/13-doctor-content-model-api.md`
