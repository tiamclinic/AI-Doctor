# コーディング規約

## 基本方針

- **既存ファイルを優先して編集**。新規ファイルは必要なときだけ
- **AI 生成のコメントを残さない**。何をしているかではなく、なぜそうしているかを書く
- **過度な抽象化を避ける**。3 つ似た行があっても、共通化は実際に 4 つ目が来てから
- **エラーは「実際に起きうる場所」だけで握る**。フレームワーク保証を信じる

## TypeScript

- `strict: true` 前提
- `any` は禁止。やむを得ない場合は `unknown` + 型ガード
- 公開関数のシグネチャには戻り型を書く（推論に頼らない）
- Zod スキーマから `z.infer<typeof Schema>` で型を起こす慣習

## パスエイリアス

`tsconfig.json` で `@/*` → プロジェクトルートを定義済み:

```ts
import { computeScore } from "@/lib/faceAnalysis/scoring";
import { Button } from "@/components/ui/button";
```

相対パス（`../../../lib/...`）は避ける。

## ディレクトリ / ファイル命名

- ディレクトリ・ファイル名は **英語**（日本語禁止）
- React コンポーネント: `PascalCase.tsx`
- それ以外の TS: `camelCase.ts`
- テスト: `__tests__/foo.test.ts`

## Server / Client の分離

- サーバー専用モジュールは先頭で `import "server-only"` を宣言（[`lib/openai/client.ts`](../../lib/openai/client.ts) など）
- クライアントコンポーネントは `"use client"` をファイル先頭に置く
- Route Handler は `app/api/**/route.ts(x)` 配下に固定し、`runtime`/`maxDuration`/`dynamic` を明示

## Route Handler の定型

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 1. JSON parse → 400 invalid_request
  // 2. Zod validation → 400 invalid_request
  // 3. ドメインロジック呼び出し
  // 4. OpenAI / 外部呼び出しのエラーをコード別に変換
}
```

`lib/diagnosis/openai.ts` / `lib/portrait/types.ts` のエラーコード規約に合わせる。

## バリデーション

入力検証はすべて [Zod](https://zod.dev/)。スキーマは `lib/*/types.ts` に集約し、Route Handler でもクライアントでも使い回す。

```ts
const parsed = SomeSchema.safeParse(body);
if (!parsed.success) {
  // 400 invalid_request を返す
}
```

## React

- Hook の入出力は最小化（`signal?: AbortSignal` などキャンセル可能性を考慮）
- Zustand セレクタは細かく購読（無関係なステート変更で再レンダリングしない）
- `useEffect` の依存配列は ESLint exhaustive-deps に従う

## スタイル

- Tailwind v4 を使う。`tailwind.config.js` は無く、`app/globals.css` の CSS 変数とユーティリティで完結
- ブランドカラーは `text-tiam-gold` / `text-tiam-primary` などのカスタムプロパティ経由
- shadcn コンポーネント由来の `Card` / `Button` を優先的に使う

## ESLint

`npm run lint` を PR 前に。設定は [`eslint.config.mjs`](../../eslint.config.mjs)（flat config）。

## 文章

- 文言は **TIAM トーン**（敬体・断定・控えめ）に従う
- 「素晴らしい」「いかがでしょうか」「最も」など禁止フレーズは [`lib/prompt/forbiddenWords.ts`](../../lib/prompt/forbiddenWords.ts) を確認

## コミットメッセージ

Conventional Commits 風（緩め）:

- `feat(scope): ...` — 新機能
- `fix(scope): ...` — バグ修正
- `docs(scope): ...` — ドキュメント
- `chore(scope): ...` — 雑務
- `refactor(scope): ...` — 振る舞いを変えない整理

例: `fix(apphosting): use full Secret Manager path for OPENAI_API_KEY`

## してはいけないこと

- `OPENAI_API_KEY` をクライアントコンポーネント・Edge Runtime で読む
- 写真データを `console.log` する（base64 がログに残る）
- 同意なしで `/api/generate-portrait` を呼ぶ
- 「治療」「改善されます」「最も美しい」などの禁止フレーズをハードコードする
- `tailwind.config.js` を新設する（Tailwind v4 は CSS で完結）
