# 17. 来院者限定アクセス（URL 周知範囲の技術的裏付け）

| 項目       | 内容                                |
| ---------- | ----------------------------------- |
| チケットID | T-17                                |
| 関連要件   | requirements.md §1.5 / §5.x         |
| 依存       | T-13, T-14                          |
| 優先度     | 中（運用開始のための前提）          |
| 見積       | 3〜4 日                             |
| 担当       | -                                   |
| ステータス | 未着手                              |

## 概要

依頼者の方針として、本アプリは **クリニック来院者だけが診断を受けられる**ことが前提（requirements.md §1.5）。URL の周知範囲を運用で絞ることが第一線だが、**技術側でも最低限の裏付けを入れる**。MVP では「**院内発行のアクセスコード方式**」を採用し、コードがない場合は `/diagnose` に到達できないようにする。

## ゴール / 受け入れ基準

- [ ] **アクセスコード**（ランダム文字列）を持つユーザだけが `/diagnose` 以降に進める
- [ ] コードは **管理画面（T-14 と同じ Admin）で発行・無効化できる**
- [ ] コード未入力で `/diagnose` / `/result/[id]` / `/api/diagnose` / `/api/generate-portrait` / `/api/share-card` / `/api/doctor-content` を叩くと **403** が返る
- [ ] **未来検索エンジン回避**: `/`（ランディング）以外に `<meta name="robots" content="noindex,nofollow">` を付与し、`/robots.txt` で `/diagnose` 以降を `Disallow`
- [ ] アクセスコード入力フォームは `/access` ページに設置し、認証成功で **HttpOnly Cookie**（`tiam_access`、署名付き、7 日有効）を設定
- [ ] **使い回し防止**: 1 コードに発行上限（例: 50 回 / 30 日）を設け、上限超過で 403
- [ ] レート制限（IP × 10 リクエスト / 5 分）も実装
- [ ] `apphosting.yaml` で `ACCESS_CODE_SECRET` を Secret Manager 経由で渡す
- [ ] `npm run lint` / `npm run build` がクリーン

## 設計メモ

### 採用案：HMAC 署名付きアクセスコード + Cookie

- 院内で配るのは **見やすい短いコード**（例: `TIAM-3X8K-92Q`）
- サーバー側で `accessCodes/{code}` Firestore に **有効期限・残回数**を持たせる
- 入力された code が有効なら、**サーバーで HMAC 署名した Cookie** を発行
- `middleware.ts`（Next.js）で全リクエストの Cookie 署名を検証

### 配置

```
app/access/page.tsx               コード入力フォーム
app/api/access/route.ts           POST: コード検証 + Cookie 発行
middleware.ts                     Next.js middleware（Cookie 検証 + 403）
lib/access/
  codeStore.ts                    Firestore コレクション操作（admin SDK）
  cookie.ts                       HMAC 署名 / 検証ヘルパ（`createHmac` + base64url）
  types.ts                        Zod スキーマ
app/admin/access-codes/page.tsx   コード発行・無効化（管理画面）
```

### Firestore スキーマ（`accessCodes/{code}`）

```ts
{
  code: string;            // ドキュメント ID と同じ
  label: string;           // メモ（例: "11月配布分", "○○受付"）
  active: boolean;         // 無効化フラグ
  expiresAt: string;       // ISO8601
  usageLimit: number;      // 例: 50
  usageCount: number;      // インクリメント
  createdAt: string;
  createdBy: string;
}
```

### Cookie 仕様

```
Name:     tiam_access
Value:    base64url(JSON.stringify({ code, exp })) + "." + base64url(HMAC-SHA256)
HttpOnly: true
Secure:   true
SameSite: Lax
Path:     /
Max-Age:  60 * 60 * 24 * 7
```

### `middleware.ts` の挙動

```text
incoming request
  ├ /(_next|favicon|robots.txt|assets|api/health|access|api/access) → そのまま許可
  ├ それ以外
  │   ├ Cookie あり & 署名 OK & exp 未来 → next()
  │   └ 上記以外 → /access?redirect=<path> へ 307
  └ /api/*（health 除く）は HTML リダイレクトの代わりに 403 JSON
```

### `/access` フロー

```
1. ユーザがコードを入力 → POST /api/access { code }
2. サーバー:
   - rate-limit を確認
   - Firestore で code 取得 / active / expiresAt / usageLimit 検証
   - usageCount を 1 増やす（Firestore transaction）
   - HMAC 署名 Cookie を Set-Cookie で返す
3. クライアントは元のページにリダイレクト
```

### 管理画面（T-14 拡張）

- `/admin/access-codes` で **コード一覧 / 新規発行 / 無効化 / 残回数表示**
- 発行時は `nanoid(12)` で生成し、`TIAM-XXXX-XXXX` 形式の表示用文字列に整形

### robots / noindex

- `app/diagnose/page.tsx` 等で `export const metadata = { robots: { index: false, follow: false } }`
- `public/robots.txt` を新規追加:
  ```
  User-agent: *
  Disallow: /diagnose
  Disallow: /result
  Disallow: /admin
  Disallow: /access
  ```

### 環境変数

| Key                   | 用途                          | クライアント露出 |
| --------------------- | ----------------------------- | ---------------- |
| `ACCESS_CODE_SECRET`  | Cookie 署名用 HMAC キー       | No               |
| `ACCESS_COOKIE_NAME`  | デフォルト `tiam_access`      | No               |

## TODO

- [ ] `lib/access/cookie.ts` を実装（HMAC-SHA256、Node.js `crypto.createHmac`）
- [ ] `lib/access/codeStore.ts` を実装（Firestore transaction で `usageCount` を増やす）
- [ ] `lib/access/types.ts` を実装（Zod スキーマ）
- [ ] `app/api/access/route.ts` を実装（POST、レート制限、Cookie 発行）
- [ ] `app/access/page.tsx` を実装（コード入力フォーム + リダイレクトクエリ対応）
- [ ] `middleware.ts` を実装（保護ルーティング、API は 403 JSON）
- [ ] `app/admin/access-codes/page.tsx` を実装（一覧 / 発行 / 無効化）
- [ ] `app/api/access-codes/route.ts` を実装（admin 限定の CRUD）
- [ ] `public/robots.txt` を追加、各保護ページに `metadata.robots = { index: false, follow: false }`
- [ ] `apphosting.yaml` に `ACCESS_CODE_SECRET` を Secret Manager 参照で追加し、`docs/09-deploy.md` に手順を追記
- [ ] `firestore.rules` を更新（`accessCodes/{code}` の read は admin、write は admin のみ）
- [ ] レート制限（5 分 10 回 / IP）を `lib/access/rateLimit.ts` に実装（既存 `lib/portrait/rateLimit.ts` を参考に）
- [ ] E2E に近い手動 QA: code なしで `/diagnose` → `/access` に飛ぶ・正しい code → `/diagnose` で動作・期限切れ → 再度 `/access` へ
- [ ] `npm run lint` / `npm run build` を通す

## 将来の拡張（メモ）

- 来院前事前予約のフローと連携し、予約 ID をワンタイムコード化
- カスタムドメイン + 院内 Wi-Fi の IP allowlist（Cloud Armor）併用
- Firebase Auth でメール認証＋一度きりの招待リンクに切り替え

## リファレンス

- requirements.md §1.5
- Next.js middleware: `node_modules/next/dist/docs/`（プロジェクト同梱版を参照）
- Firestore transactions
