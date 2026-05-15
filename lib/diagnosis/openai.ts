// OpenAI を呼び出して診断文を生成するための関数
import "server-only";

import {
  DiagnoseResponseSchema, // 診断レスポンスの型
  type DiagnoseRequest,
  type DiagnoseResponse, // 診断レスポンスの型
} from "@/lib/diagnosis/types";
import { getOpenAi } from "@/lib/openai/client";
import {
  buildDiagnosisMessages, // 診断プロンプトを構築するための関数
  buildRetryMessage,
} from "@/lib/prompt/diagnosisPrompt"; // 診断プロンプトを構築するための関数
import {
  maskDiagnoseResponse,
  replaceMedicalTerms,
  scanForbidden,
} from "@/lib/prompt/forbiddenWords";

const MODEL = "gpt-4o-mini"; // モデル

const RESPONSE_JSON_SCHEMA = {
  name: "tiam_diagnosis", // スキーマ名
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false, // 余分なプロパティを許可しない
    properties: {
      overallComment: { type: "string" }, // 総合コメント
      strengths: {
        type: "array", // 強み
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
      },
      improvements: {
        type: "array", // 改善点
        items: { type: "string" },
        minItems: 2,
        maxItems: 2,
      },
      recommendedCare: {
        type: "array", // 推奨ケア
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
      },
      tiamMessage: { type: "string" }, // TIAM メッセージ
    },
    required: [
      "overallComment", // 総合コメント
      "strengths", // 強み
      "improvements", // 改善点
      "recommendedCare", // 推奨ケア
      "tiamMessage", // TIAM メッセージ
    ],
  },
} as const;

function postprocess(json: DiagnoseResponse): DiagnoseResponse { // 診断レスポンスを後処理  医療表現を置換
  return {
    overallComment: replaceMedicalTerms(json.overallComment), // 総合コメントを医療表現を置換
    strengths: json.strengths.map(replaceMedicalTerms), // 強みを医療表現を置換
    improvements: json.improvements.map(replaceMedicalTerms), // 改善点を医療表現を置換
    recommendedCare: json.recommendedCare.map(replaceMedicalTerms), // 推奨ケアを医療表現を置換
    tiamMessage: replaceMedicalTerms(json.tiamMessage), // TIAM メッセージを医療表現を置換
  };
}

function flattenForScan(json: DiagnoseResponse): string {
  return [
    json.overallComment,
    ...json.strengths,
    ...json.improvements,
    ...json.recommendedCare,
    json.tiamMessage,
  ].join("\n");
}

const FILL_SENTENCE =
  "美容バランスの傾向を読み解く参考としてご覧ください。";

function padToMin(s: string, min: number, max: number): string {
  let t = s.trim();
  while (t.length < min) {
    t = t + FILL_SENTENCE;
  }
  return t.length > max ? t.slice(0, max) : t;
}

function redactHitsInDiagnosis(
  json: DiagnoseResponse,
  hits: string[],
): DiagnoseResponse {
  const uniq = [...new Set(hits)].filter(Boolean);
  const fix = (s: string) => {
    let t = s;
    for (const h of uniq) {
      t = t.split(h).join("");
    }
    return t.replace(/\s{2,}/g, " ").trim();
  };
  return {
    overallComment: fix(json.overallComment),
    strengths: json.strengths.map(fix),
    improvements: json.improvements.map(fix),
    recommendedCare: json.recommendedCare.map(fix),
    tiamMessage: fix(json.tiamMessage),
  };
}

function coerceDiagnosisShape(json: DiagnoseResponse): DiagnoseResponse {
  return {
    overallComment: padToMin(json.overallComment, 30, 300),
    strengths: json.strengths.map((s) => padToMin(s, 8, 120)),
    improvements: json.improvements.map((s) => padToMin(s, 8, 120)),
    recommendedCare: json.recommendedCare.map((s) => padToMin(s, 8, 120)),
    tiamMessage: padToMin(json.tiamMessage, 10, 120),
  };
}

/** 施術語マスク＋残存ヒットの除去＋スキーマ整合 */
function applyCompliancePipeline(postprocessed: DiagnoseResponse): DiagnoseResponse {
  let out = maskDiagnoseResponse(postprocessed);
  out = postprocess(out);
  for (let i = 0; i < 8; i++) {
    const scan = scanForbidden(flattenForScan(out));
    if (scan.ok) break;
    out = redactHitsInDiagnosis(out, scan.hits);
    out = postprocess(out);
  }
  return DiagnoseResponseSchema.parse(coerceDiagnosisShape(out));
}

export type DiagnoseGuardrailState = "clean" | "retried" | "masked";

async function callOnce(
  messages: ReturnType<typeof buildDiagnosisMessages>,
): Promise<DiagnoseResponse> {
  const client = getOpenAi(); // OpenAI クライアントを取得

  const completion = await client.chat.completions.create({
    model: MODEL, // モデルを指定
    temperature: 0.7, // 温度を指定
    messages, // メッセージを指定
    response_format: {
      type: "json_schema",
      json_schema: RESPONSE_JSON_SCHEMA, // スキーマを指定  strict を適用
    },
  });

  const content = completion.choices[0]?.message?.content; // レスポンスの内容を取得
  if (!content) {
    throw new Error("OpenAI レスポンスに content が含まれていません。"); // エラーを投げる
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content); // JSON をパース
  } catch {
    throw new Error("OpenAI レスポンスが JSON として解析できませんでした。"); // エラーを投げる JSON として解析できない場合
  }

  return DiagnoseResponseSchema.parse(parsed); // 診断レスポンスをパース
}

export async function generateDiagnosis(
  input: DiagnoseRequest,
): Promise<{ response: DiagnoseResponse; guardrail: DiagnoseGuardrailState }> {
  const baseMessages = buildDiagnosisMessages(input);

  const first = await callOnce(baseMessages);
  const firstProcessed = postprocess(first);
  const scan1 = scanForbidden(flattenForScan(firstProcessed));
  if (scan1.ok) {
    return { response: firstProcessed, guardrail: "clean" };
  }

  const retryMessages = [
    ...baseMessages,
    {
      role: "assistant" as const,
      content: JSON.stringify(first),
    },
    buildRetryMessage(scan1.hits),
  ];

  try {
    const second = await callOnce(retryMessages);
    const secondProcessed = postprocess(second);
    const scan2 = scanForbidden(flattenForScan(secondProcessed));
    if (scan2.ok) {
      return { response: secondProcessed, guardrail: "retried" };
    }
    return {
      response: applyCompliancePipeline(secondProcessed),
      guardrail: "masked",
    };
  } catch {
    return {
      response: applyCompliancePipeline(firstProcessed),
      guardrail: "masked",
    };
  }
}
