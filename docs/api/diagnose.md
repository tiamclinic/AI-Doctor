# POST /api/diagnose

TIAM 指標スコア（現状 8 項目）から AI 診断文（JSON）を生成するエンドポイントです。
**写真データは送信しません**。ブラウザで算出したスコアのみが渡ります。

- 実装: [`app/api/diagnose/route.ts`](../../app/api/diagnose/route.ts)
- 生成ロジック: [`lib/diagnosis/openai.ts`](../../lib/diagnosis/openai.ts)
- プロンプト: [`lib/prompt/diagnosisPrompt.ts`](../../lib/prompt/diagnosisPrompt.ts)
- 関連機能: [features/ai-diagnosis](../features/ai-diagnosis.md)

## モデル / コスト

- モデル: `gpt-4o-mini`
- 入出力: JSON Schema strict モード
- `temperature: 0.7`
- 1 件あたりの目安: 概ね < 5 秒、< $0.001

## リクエスト

```http
POST /api/diagnose
Content-Type: application/json
```

```ts
type DiagnoseRequest = {
  totalScore: number;            // 0–100
  scores: {
    verticalThirds: number;      // 0–100  縦三分割バランス
    horizontalFifths: number;    // 0–100  横五分割バランス
    eyeSpacing: number;          // 0–100  目間バランス
    eyePosition: number;         // 0–100  目の位置（縦）
    noseMouthRatio: number;      // 0–100  鼻口比率
    eLine: number;               // 0–100  E ライン整合度
    faceContour: number;         // 0–100  顔輪郭比率
    bilateralSymmetry: number;     // 0–100  左右対称性
  };
  locale?: "ja";                 // default: "ja"
};
```

Zod スキーマは [`lib/diagnosis/types.ts`](../../lib/diagnosis/types.ts) の `DiagnoseRequestSchema`。

## レスポンス（200 OK）

```ts
type DiagnoseResponse = {
  overallComment: string;        // 総評 100–150 字
  strengths: string[];           // 強み 3 件（各 30–60 字）
  improvements: string[];        // 注意点 2 件（各 30–60 字）
  recommendedCare: string[];     // 推奨ケア 3 件（各 30–60 字）
  tiamMessage: string;           // TIAM からの一言（30–50 字）
};
```

### 出力例

```json
{
  "overallComment": "TIAM バランス指数は 86.4 点。縦三分割 88.0、目間 91.0 と顔上半分の構成が安定し…",
  "strengths": ["目間 91.0 が示すとおり…", "鼻口比 90.5 がほぼ黄金比に乗り…", "縦三分割 88.0 で…"],
  "improvements": ["E ライン 80.3 は…", "顔輪郭比 83.6 は…"],
  "recommendedCare": ["前髪は眉と眉の間を…", "口角と頬骨を結ぶラインに…", "鏡を見るときは…"],
  "tiamMessage": "余白を生かした静かな整いが TIAM らしい美しさです。"
}
```

## エラー

| Status | error | 説明 |
| --- | --- | --- |
| 400 | `invalid_request` | JSON 解析不可、または Zod バリデーション違反 |
| 429 | `rate_limited` | OpenAI 側のレート制限に到達 |
| 502 | `upstream_error` | OpenAI が 5xx を返した（リトライ推奨） |
| 503 | `service_unavailable` | `OPENAI_API_KEY` 未設定 |
| 500 | `unknown` | 想定外の例外（dev のみ console.error） |

## サーバー側ガード

1. **JSON Schema strict** で OpenAI 出力フィールドを固定
2. **薬機法フレーズの自動置換**: 「治療」「改善されます」などを「ケア」「整いやすくなります」へ正規表現で置換（[`lib/prompt/forbiddenWords.ts`](../../lib/prompt/forbiddenWords.ts) の `MEDICAL_TERM_REPLACEMENTS`）
3. **禁止語スキャン**（[`scanForbidden`](../../lib/prompt/forbiddenWords.ts)）: GPT 頻出フレーズ、景表法上の最上級語、**美容医療の施術・機器・薬剤名**（`MEDICAL_PROCEDURE_TERMS`）を検出
4. **1 回までリトライ**: 検出時は違反語を列挙して書き直し指示（[`buildRetryMessage`](../../lib/prompt/diagnosisPrompt.ts)）
5. **2 回目も違反時**: `maskProcedureTerms` / `maskDiagnoseResponse` で施術語を「美容バランスの整え方」へ置換し、必要に応じてヒット除去と長さ補正後に返却（[`lib/diagnosis/openai.ts`](../../lib/diagnosis/openai.ts) の `applyCompliancePipeline`）

### レスポンスヘッダ（サーバー／ログ用）

成功時 `200` の JSON 本体は従来どおり `DiagnoseResponse` のみです。ガードの通過経路は次のヘッダで区別できます（クライアント実装で読む必要はありません）。

| ヘッダ | 値 | 意味 |
| --- | --- | --- |
| `x-diagnose-guardrail` | `clean` | 初回生成がスキャンを通過 |
| | `retried` | 1 回リトライ後にスキャンを通過 |
| | `masked` | リトライ失敗または 2 回目も違反のためマスク・補正パイプラインを適用 |

## 呼び出し例（クライアント）

推奨経路は [`lib/diagnosis/client.ts`](../../lib/diagnosis/client.ts) の `requestDiagnosis()`:

```ts
import { requestDiagnosis } from "@/lib/diagnosis/client";

const res = await requestDiagnosis(scoreResult);
if (res.ok) {
  console.log(res.data.overallComment);
} else {
  console.error(res.error.error, res.error.message);
}
```

## 制限事項 / メモ

- `maxDuration = 30`（秒）。OpenAI が遅延するとタイムアウト
- 入力スコアは 0–100 の範囲を超えると 400 を返す
- `locale` は現状 `"ja"` のみ。多言語化する場合はプロンプトと禁止フレーズ辞書も拡張する
