# データフローとプライバシー不変条件

このプロジェクトの設計の核は「写真をどこまで、どこに、いつ送るか」です。
ここを揺るがすコード変更は要件レビューが必要になります。

## プライバシー不変条件

> **写真データは、ユーザーが「理想顔生成」を明示同意した場合を除き、ブラウザの外に出ない。**

具体的には:

1. `/api/diagnose` には **スコア（0–100 の 6 数値）と総合スコアのみ** を送る。写真は送らない。
2. `/api/share-card` には **スコアと診断テキストの一部のみ** を送る。写真は送らない。
3. `/api/generate-portrait` は **写真を OpenAI に転送する唯一の経路**。`consent: true` を必須とし、レート制限を課す。

サーバーには写真の永続ストレージは存在しない。

## ステップ別データの流れ

| # | 主体 | 入力 | 処理 | 出力 |
| --- | --- | --- | --- | --- |
| 1 | ブラウザ | File / Blob | `validateImageFile` + `heicToJpegFile`（必要時） | 画像 dataURL |
| 2 | ブラウザ | dataURL | `PhotoCropper` で 4:5 に手動クロップ | クロップ済 dataURL |
| 3 | ブラウザ | クロップ済 dataURL | `detectFaceFromDataUrl` → MediaPipe Face Landmarker | 478 点ランドマーク |
| 4 | ブラウザ | ランドマーク | `computeScore` → 6 指標 → 加重平均 | `ScoreResult` |
| 5 | サーバー | `ScoreResult` | `/api/diagnose` → gpt-4o-mini | `DiagnoseResponse` |
| 6 | ブラウザ | `ScoreResult` + dataURL | `/api/generate-portrait`（任意） | 理想顔 PNG |
| 7 | ブラウザ | `ScoreResult` + 診断テキスト | `/api/share-card`（任意） | シェアカード PNG |
| 8 | ブラウザ | `resultId` | `GET /api/doctor-notes/{resultId}`（公開済みのみ） | 個別医師ノート（パーツ + 総評追記） |
| 9 | ブラウザ（スタッフ） | Firebase Auth セッション | 結果画面 CTA → `/admin/diagnoses/{resultId}` | 追記・公開（T-21） |

ステップ 6 のみ写真が外に出る。それ以外はすべて数値とテキストの送受信のみ（ステップ 8 も `resultId` のみ）。

## サーバーサイドの責務

### `/api/diagnose`

- 入力: スコア（数値のみ）
- OpenAI 呼び出し: `gpt-4o-mini`（JSON Schema strict）
- ガード:
  - 薬機法表現の正規表現置換（治療 → ケアなど）
  - 禁止フレーズ検出時の 1 回リトライ

### `/api/generate-portrait`

- 入力: 写真 base64 + スコア + 同意フラグ
- 検証:
  - `consent === true` でなければ `consent_required` を返す
  - IP ごとのレート制限（本番 5 回 / 日）
- 画像処理: `sharp` で sRGB JPEG 1024×1024 に正規化
- OpenAI 呼び出し: `gpt-image-1` `images.edit`
- 戻り値: base64 PNG（保存はしない）

### `/api/share-card`

- 入力: スコア + 任意の要約テキスト
- 出力: Satori が生成した PNG。サーバーキャッシュはしない

### サーバーに保存しないもの

- 写真の原本 / クロップ画像 / 理想顔 PNG
- 診断テキスト
- ユーザー識別子（MVP ではユーザーアカウントが存在しない）

## クライアント側のデータ保持

| 場所 | 保持データ | 寿命 |
| --- | --- | --- |
| Zustand ストア | 写真 dataURL、検出結果、スコア、診断テキスト、理想顔 | タブが開いている間（リロードで消える） |
| sessionStorage | 同意状態（`tiam-consent`） | タブ閉鎖まで |
| localStorage | なし | — |
| Cookie | なし | — |

詳細は [state-management.md](./state-management.md)。

## 同意フロー

[features/consent-privacy](../features/consent-privacy.md) に詳細を記載。要点:

1. ランディングで利用規約 / プライバシーポリシー同意（sessionStorage に保存）
2. 「AI 理想顔を生成する」ボタン押下時に **追加の同意ダイアログ** を表示し、OpenAI へ写真を送ることを明示
3. 同意は「リセット」ボタンでいつでも撤回可能（撤回時は Zustand ストアもクリア）

## 失敗時の挙動

- ネットワーク失敗・OpenAI レート制限: フロントエンドでエラー表示 + 再試行ボタン
- MediaPipe 検出失敗: `FaceNotDetectedError` を投げ、ユーザーに別写真を促す
- 画像正規化失敗: `image_decode_failed` を返す
- いずれのケースでも **サーバーには写真は残らない**（処理中のメモリ上のみ）
