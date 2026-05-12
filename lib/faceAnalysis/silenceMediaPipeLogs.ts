// MediaPipe Tasks Vision (FaceLandmarker) は WASM 内部の C++ ロガー（GLOG / TFLite）
// から stderr / stdout に初期化メッセージを書き出す。Emscripten 既定では
// stderr → console.warn / console.error、stdout → console.log に転送されるため、
// Next.js dev の `browserToTerminal` で「エラー」のように見えてしまう。
//
// 機能上は問題ないため、既知の無害な初期化ログだけを限定的に抑制する。
// ただし `console.*` を恒久的にラップすると、Next.js dev が内部で出力する
// RSC プリフェッチ失敗などのメッセージのソース位置が常にこのファイルに
// 張り付いてしまう（スタックの最上段がラッパーになるため）。
// そのため `silenceMediaPipeLogs()` は restore 関数を返し、呼び出し側が
// MediaPipe 初期化スコープを抜けたタイミングで必ず原状回復する設計とする。

const NOISY_PATTERNS: RegExp[] = [
  // GLOG 形式の警告/情報行 (例: "W0512 02:13:57.023000 ... face_landmarker_graph.cc:180]")
  /^[WIE]\d{4}\s+\d{2}:\d{2}:\d{2}.*\.(cc|h):\d+\]/,
  // TFLite が CPU XNNPACK delegate を作成したとき
  /^INFO:\s*Created TensorFlow Lite XNNPACK delegate/i,
  // FaceBlendshapesGraph の acceleration 既定通知
  /face_landmarker_graph\.cc:\d+\]/,
  // OpenGL エラー検査が無効である旨の通知
  /gl_context\.cc:\d+\]/,
];

function isMediaPipeNoise(args: unknown[]): boolean {
  if (args.length === 0) return false;
  const first = args[0];
  if (typeof first !== "string") return false;
  return NOISY_PATTERNS.some((p) => p.test(first));
}

type ConsoleKey = "log" | "info" | "warn" | "error";

const TARGET_KEYS: readonly ConsoleKey[] = ["log", "info", "warn", "error"];

const NOOP = (): void => {};

// 多重呼び出し時はカウンタで保護し、最後の restore が呼ばれた時点でのみ原状回復する。
let activeCount = 0;
let activeRestores: Array<() => void> | null = null;

export function silenceMediaPipeLogs(): () => void {
  if (typeof window === "undefined") return NOOP;

  activeCount += 1;

  if (!activeRestores) {
    const restores: Array<() => void> = [];

    for (const key of TARGET_KEYS) {
      const original = console[key];
      const wrapped = ((...args: unknown[]) => {
        if (isMediaPipeNoise(args)) return;
        return Reflect.apply(original, console, args);
      }) as (typeof console)[ConsoleKey];

      console[key] = wrapped;
      restores.push(() => {
        // 第三者がさらに上書きしている場合は触らない（安全側）。
        if (console[key] === wrapped) {
          console[key] = original;
        }
      });
    }

    activeRestores = restores;
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeCount -= 1;
    if (activeCount <= 0 && activeRestores) {
      for (const fn of activeRestores) fn();
      activeRestores = null;
      activeCount = 0;
    }
  };
}
