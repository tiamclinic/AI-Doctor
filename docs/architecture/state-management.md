# 状態管理

## 全体像

| レイヤ | 仕組み | 寿命 |
| --- | --- | --- |
| 診断データ（写真・スコア・診断文・理想顔） | Zustand `useDiagnosisStore` | タブ生存中（リロードで消える） |
| 同意状態（利用規約 / OpenAI 同意） | `sessionStorage` + カスタムイベント | タブ閉鎖まで |
| サーバー側 | なし | リクエストごとに揮発 |

## Zustand ストア

実装: [`lib/store/diagnosis-store.ts`](../../lib/store/diagnosis-store.ts)

### ステート

```ts
type DiagnosisState = {
  resultId: string | null;        // nanoid(10)。/result/[id] への遷移キー
  photoFile: File | null;         // 元画像（クロップ後）
  photoDataUrl: string | null;    // 表示と /api/generate-portrait 入力
  detectResult: DetectResult | null;  // MediaPipe 478 点 + メタ
  scoreResult: ScoreResult | null;    // 6 指標 + 総合スコア
  diagnosisText: DiagnoseResponse | null;  // AI 診断文
  idealPortrait: PortraitResponse | null;  // 理想顔 base64
};
```

### アクション

| アクション | 副作用 |
| --- | --- |
| `setPhoto(file, dataUrl)` | 新しい写真をセット。検出結果以降を全クリア |
| `setDetectResult(r)` | ランドマークをセット。スコア以降をクリア |
| `setScoreResult(r)` | スコアをセット。同時に `resultId` を nanoid で発行 |
| `setDiagnosisText(r)` | 診断文をセット |
| `setIdealPortrait(r)` | 理想顔をセット |
| `clearPhoto()` | すべてリセット |

### 設計思想

- **「下流データ」は「上流データ」が変わった時点で必ず破棄する**: 新しい写真を選んだのに古いスコアが残っているといった不整合を防ぐ
- **`resultId` はスコア確定時に生成**: 結果 URL `/result/[id]` の整合性のため、スコアが揃ったタイミングで一度だけ発行
- **永続化しない**: localStorage には保存しない。タブ閉じれば消える。これがプライバシー要件と一致

### 利用例

```ts
const photoDataUrl = useDiagnosisStore((s) => s.photoDataUrl);
const setPhoto = useDiagnosisStore((s) => s.setPhoto);
```

セレクタ単位で購読することで、関係のないステート変更で再レンダリングが起きないようにする。

## 同意状態

実装: [`lib/consent.ts`](../../lib/consent.ts)

### 保持先 / 形式

- `sessionStorage` キー: `"tiam-consent"`
- 形式:

```ts
type StoredConsent = {
  termsAccepted: boolean;
  openAiPortraitAccepted: boolean;
  acceptedAt?: string;
};
```

### 購読

- `subscribeConsent(onStoreChange)`: `useSyncExternalStore` 用。`storage` イベントとカスタムイベント `"tiam-consent-changed"` を購読
- `consentSnapshot()`: 現在の `termsAccepted` を返す（SSR 時は `false`）
- `notifyConsentChanged()`: 同タブ内の購読者へ変更を通知

### 同意ダイアログのフロー

1. ランディング（`app/page.tsx`） → 同意状態を購読
2. `LandingCta` が同意を取得 → `sessionStorage` 書き込み + `notifyConsentChanged()`
3. 写真選択 → 診断 → スコア表示
4. 「理想顔を生成」ボタンを押すと、`/api/generate-portrait` に `consent: true` を送る前にもう一度同意モーダルが表示される（[features/consent-privacy](../features/consent-privacy.md)）

## サーバー側状態

ない（MVP）。例外:

- `lib/portrait/rateLimit.ts` のプロセスメモリ `Map<ip, Bucket>`
- `lib/openai/client.ts` のシングルトンクライアント

これらは Cloud Run インスタンスごとに独立しており、本格運用時は Firestore / Upstash 等に置き換える前提。
