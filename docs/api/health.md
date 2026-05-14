# GET /api/health

App Hosting（Cloud Run）の readiness 判定と外形監視のための軽量ヘルスチェックです。

- 実装: [`app/api/health/route.ts`](../../app/api/health/route.ts)

## リクエスト

```http
GET /api/health
```

認証・DB アクセス・外部 API 呼び出しは一切なし。常に 200 を返します。

## レスポンス（200 OK）

```ts
{
  status: "ok",
  service: "tiam-beauty-ai",
  timestamp: string;  // ISO 8601
}
```

`Cache-Control: no-store` 固定。

## 用途

- **App Hosting / Cloud Run**: ロードバランサの readiness probe
- **外形監視**: UptimeRobot などからの定期チェック
- **デプロイ後の手動疎通**: `curl https://<your-app>/api/health`

## 制限事項

- OpenAI や `OPENAI_API_KEY` の有無は確認しません（このエンドポイントはあくまで「コンテナが生きているか」だけを見る）
- アプリケーション全体の健全性（DB / 外部依存）を見たい場合は別エンドポイントを設計してください
