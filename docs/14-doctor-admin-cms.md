# 14. ドクター向け管理画面（パーツ別編集 CMS）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-14                                |
| 関連要件   | requirements.md §1.5 / §4.9.2 / §5.3 |
| 依存       | T-13                                |
| 優先度     | 中〜高                              |
| 見積       | 3〜4 日                             |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

医師がパーツ別文面（`eyes` / `nose` / `mouth` / `contour` / `symmetry`）を **ブラウザから編集・公開できる管理画面**を実装する。MVP は **同一の Next.js アプリ内**に `/admin/doctor-content` として置く。

認証は **Firebase Authentication（メール＋パスワード）＋ admin カスタムクレーム**で最小限。**プレビュー → 公開**の 2 段階を必須にし、公開時のみ `doctor_contents/default` を更新する。

## ゴール / 受け入れ基準

- [ ] `/admin/login` でメール＋パスワードログインができる
- [ ] **`admin` カスタムクレームが付いたユーザだけ** `/admin/doctor-content` にアクセスできる
- [ ] パーツ別タブ（目 / 鼻 / 口 / 輪郭 / 左右対称性）でテキストエリア編集できる
- [ ] 文字数カウンタ（最大 800 字）と禁止語警告（`scanForbidden` 流用）が表示される
- [ ] **「プレビュー」ボタンで実際の結果画面のパーツカード見た目を確認できる**（モックスコアで合成）
- [ ] **「公開」ボタンで Firestore `doctor_contents/default` を更新**し、`publishedAt` と `updatedAt`/`updatedBy` が記録される
- [ ] 公開操作は **CSRF/再認証なしの直リンクで叩けない**（API 側でも ID トークン検証 + admin クレーム検証）
- [ ] `/admin/*` は **`noindex` メタ**＋検索除外
- [ ] `npm run lint` / `npm run build` がクリーン

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

## TODO

- [ ] Firebase Auth を有効化（メール＋パスワード）
- [ ] `firebase` Web SDK を依存に追加（クライアント側、`NEXT_PUBLIC_FIREBASE_*` env を整える）
- [ ] `lib/admin/firebaseClient.ts` を実装（シングルトン initApp）
- [ ] `lib/admin/authGuard.ts` を実装（`verifyAdminFromIdToken(req)` を export）
- [ ] `app/admin/layout.tsx` を実装（`<meta name="robots" content="noindex" />`、未ログインなら `/admin/login` へ）
- [ ] `app/admin/login/page.tsx` を実装（メール＋パスワード、エラー時のメッセージ）
- [ ] `app/admin/doctor-content/page.tsx` を実装（タブ + 編集 + プレビュー + 公開）
- [ ] `components/admin/DoctorContentEditor.tsx` を実装（文字数カウンタ + 禁止語警告）
- [ ] `components/admin/DoctorContentPreview.tsx` を実装（T-11 のカードを再利用）
- [ ] `app/api/doctor-content/route.ts` に PUT を追加（admin 検証 + Zod + Firestore 書き込み）
- [ ] `scripts/admin/grantAdmin.ts` を実装し、`docs/14-doctor-admin-cms.md` 末尾に運用手順を追記
- [ ] `firestore.rules` を再確認し、書き込みが admin クレーム必須になっているか E2E で確認
- [ ] `docs/api/doctor-content.md` に PUT 仕様を追記
- [ ] `npm run lint` / `npm run build` を通す
- [ ] 動作確認：ログイン → 編集 → プレビュー → 公開 → 結果画面（T-15 待ち）に反映するシナリオを手動確認

## リファレンス

- requirements.md §1.5, §4.9.2, §5.3
- Firebase Auth: https://firebase.google.com/docs/auth
- Firebase Admin verifyIdToken: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- T-13: `docs/13-doctor-content-model-api.md`
