// OpenAI クライアントを取得するための関数
import "server-only";

import OpenAI from "openai";

// OpenAI クライアントを保持する変数
let _client: OpenAI | null = null;
// OpenAI クライアントを取得するためのエラー
export class OpenAiNotConfiguredError extends Error {
  constructor() {
    super(
      "OPENAI_API_KEY が設定されていません。プロジェクトルートの .env.local に OPENAI_API_KEY を追記してから再起動してください。",
    );
    this.name = "OpenAiNotConfiguredError";
  }
}

// OpenAI クライアントを取得するための関数
export function getOpenAi(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY; // OpenAI API キーを取得 
  if (!apiKey) throw new OpenAiNotConfiguredError();

  if (!_client) {
    const organization = process.env.OPENAI_ORG_ID || undefined;
    _client = new OpenAI({
      apiKey,
      organization,
    });
  }
  return _client;
}
