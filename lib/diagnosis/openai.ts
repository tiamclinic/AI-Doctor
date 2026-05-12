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
  replaceMedicalTerms,
  scanForbidden, // 禁止フレーズを検出するための関数
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

function flattenForScan(json: DiagnoseResponse): string { // 診断レスポンスを平坦化
  return [
    json.overallComment, // 総合コメントを平坦化
    ...json.strengths, // 強みを平坦化
    ...json.improvements, // 改善点を平坦化
    ...json.recommendedCare, // 推奨ケアを平坦化
    json.tiamMessage, // TIAM メッセージを平坦化
  ].join("\n"); // 改行で結合
}

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
): Promise<DiagnoseResponse> {
  const baseMessages = buildDiagnosisMessages(input); // 診断プロンプトを構築

  const first = await callOnce(baseMessages); // 1 回目の診断レスポンスを取得
  const firstProcessed = postprocess(first); // 診断レスポンスを後処理  医療表現を置換
  const scan1 = scanForbidden(flattenForScan(firstProcessed)); // 禁止フレーズを検出
  if (scan1.ok) return firstProcessed; // 禁止フレーズが含まれていない場合はそのまま返す

  // 1 度だけリトライ：禁止フレーズを伝えて書き直しを依頼する
  const retryMessages = [
    ...baseMessages, // 診断プロンプトを追加
    {
      role: "assistant" as const, // アシスタントのロールを指定
      content: JSON.stringify(first), // 1 回目の診断レスポンスを追加
    },
    buildRetryMessage(scan1.hits), // 禁止フレーズを追加
  ];

  try {
    const second = await callOnce(retryMessages); // 2 回目の診断レスポンスを取得
    const secondProcessed = postprocess(second); // 診断レスポンスを後処理  医療表現を置換  2 回目の診断レスポンスを返す
    return secondProcessed; // 2 回目の診断レスポンスを返す
  } catch {
    // リトライに失敗したら、1 回目の結果（医療表現は置換済み）をそのまま返す
    return firstProcessed; // 1 回目の診断レスポンスを返す
  }
}
