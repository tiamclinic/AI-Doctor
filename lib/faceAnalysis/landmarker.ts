// 顔ランドマーク検出を行うための関数
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

import { silenceMediaPipeLogs } from "@/lib/faceAnalysis/silenceMediaPipeLogs";

// MediaPipe WASM のディレクトリ
export const MEDIAPIPE_WASM_DIR = "/mediapipe/wasm";
// 顔ランドマーク検出モデルのパス
export const FACE_LANDMARKER_MODEL = "/models/face_landmarker.task";

// 顔ランドマーク検出モデルのPromise
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

// 顔ランドマーク検出モデルを取得するための関数
export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (typeof window === "undefined") { // ブラウザが存在しない場合はエラーを投げる
    throw new Error("FaceLandmarker is only available in the browser.");
  }
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => { // 顔ランドマーク検出モデルを取得するためのPromise
      // MediaPipe / TFLite の GLOG ノイズは初期化フェーズに集中するため、
      // この区間だけ console をラップし、終わったら必ず原状回復する。
      // 常時ラップしてしまうと Next.js dev の RSC プリフェッチ失敗などの
      // メッセージのソース位置がラッパーに張り付き、デバッグを著しく阻害する。
      const restoreLogs = silenceMediaPipeLogs();
      try {
        const start = performance.now();
        const { FilesetResolver, FaceLandmarker } = await import(
          "@mediapipe/tasks-vision"
        );
        const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_DIR); // MediaPipe WASM を取得
        const landmarker = await FaceLandmarker.createFromOptions(fileset, { // 顔ランドマーク検出モデルを作成
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL,
            delegate: "GPU", // GPU デリゲートを使用
          },
          runningMode: "IMAGE",
          numFaces: 1,
          outputFacialTransformationMatrixes: false, // 顔の変換行列を出力しない
          outputFaceBlendshapes: false, // 顔のブレンドシェイプを出力しない
        });
        if (process.env.NODE_ENV !== "production") {
          const elapsed = (performance.now() - start).toFixed(0); // 顔ランドマーク検出モデルを取得するための時間を取得 0.001秒単位で取得
          console.info(`[faceAnalysis] Landmarker initialized in ${elapsed}ms`);
        }
        return landmarker; // 顔ランドマーク検出モデルを返す
      } finally {
        restoreLogs();
      }
    })().catch((err) => {
      landmarkerPromise = null; // 顔ランドマーク検出モデルを null に設定
      throw err; // エラーを投げる
    });
  }
  return landmarkerPromise; // 顔ランドマーク検出モデルを返す
}

// 顔ランドマーク検出モデルを破棄するための関数
export function disposeFaceLandmarker(): void {
  if (!landmarkerPromise) return; // 顔ランドマーク検出モデルが存在しない場合は何もしない
  if (!landmarkerPromise) return;
  void landmarkerPromise.then((l) => { // 顔ランドマーク検出モデルを破棄するためのPromise
    try {
      l.close(); // 顔ランドマーク検出モデルを破棄
    } catch {
      // ignore // エラーを無視
    }
  });
  landmarkerPromise = null; // 顔ランドマーク検出モデルを null に設定
}
// 顔ランドマーク検出モデルを破棄するための関数
