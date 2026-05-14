# テスト

## フレームワーク

[Vitest](https://vitest.dev/) を使用。設定は [`vitest.config.ts`](../../vitest.config.ts)。

- 環境: `node`（DOM 依存テストはまだなし）
- パスエイリアス: `@/*` → プロジェクトルート（Next.js と同じ）
- 対象: `**/__tests__/**/*.test.ts(x)`

## コマンド

```bash
npm test         # ワンショット実行（CI 想定）
npm run test:watch  # ファイル監視
```

## どこにテストを置くか

各モジュールの隣に `__tests__/` を作る規約:

```
lib/faceAnalysis/
  goldenRatio.ts
  scoring.ts
  __tests__/
    goldenRatio.test.ts
    dummyLandmarks.ts   ← フィクスチャ
```

## いま存在するテスト

| ファイル | 対象 |
| --- | --- |
| [`lib/faceAnalysis/__tests__/goldenRatio.test.ts`](../../lib/faceAnalysis/__tests__/goldenRatio.test.ts) | 6 指標の生値計算 |
| [`lib/prompt/__tests__/forbiddenWords.test.ts`](../../lib/prompt/__tests__/forbiddenWords.test.ts) | 禁止フレーズ検出と医療表現置換 |

## テストを書くべき場所

優先度高:

- **数値ロジック**: スコア計算、レート制限、画像正規化のヘルパ。回帰しやすいので最優先
- **禁止フレーズ / 法令辞書**: 追加するたびに既存テストで網羅性確認
- **Zod スキーマ**: 重要なバリデーション分岐は最低 1 ケース

優先度低:

- **UI レンダリング**: MVP では時間対効果が低いため未導入。`@testing-library/react` を入れて段階的に
- **OpenAI 呼び出し**: モック化が重い。本物の API を叩く E2E は手動で

## フィクスチャ

- `lib/faceAnalysis/__tests__/dummyLandmarks.ts`: 決定論的なランドマーク列。スコア計算のリグレッションテスト用

## テストパターン

### 純粋関数の例

```ts
import { describe, expect, it } from "vitest";
import { scoreRawMetrics } from "@/lib/faceAnalysis/scoring";
import { dummyRawMetrics } from "./dummyLandmarks";

describe("scoreRawMetrics", () => {
  it("returns 100 for ideal proportions", () => {
    const result = scoreRawMetrics(dummyRawMetrics.ideal);
    expect(result.totalScore).toBeGreaterThan(95);
  });
});
```

### Route Handler のテスト

MVP では未整備。将来書くなら `Request` を直接組み立てて `POST(req)` を呼ぶ:

```ts
import { POST } from "@/app/api/diagnose/route";

const req = new Request("http://localhost/api/diagnose", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ totalScore: 80, scores: {...} }),
});
const res = await POST(req as any);
expect(res.status).toBe(200);
```

OpenAI のモックは `vi.mock("@/lib/openai/client", ...)` で。

## CI

GitHub Actions / Cloud Build などのワークフローは現状未設定。必要なら:

```yaml
- run: npm ci
- run: npm run lint
- run: npm test
- run: npm run build
```

の 4 ステップで十分です。
