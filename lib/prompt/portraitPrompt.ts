// gpt-image-1 の images.edit 用プロンプト。
// 元写真のアイデンティティ（性別・年齢・髪・肌・衣装）を保ったまま、
// 黄金比に近づく "参考イメージ" を生成する。医療的変形は禁止し、
// メイク／ヘア／ライティング調整による微差として表現する。

import type { MetricKey } from "@/lib/faceAnalysis/goldenRatio";

// 指示は「ごく僅か (very subtly)」を強調し、西洋的なコントゥアリングを連想させる
// 言葉（contour, shading, sculpt）はできる限り避け、Japanese editorial の語彙で書く。
const METRIC_INSTRUCTION: Record<MetricKey, string> = {
  verticalThirds:
    "very subtly balance the top, middle, and bottom thirds of the face toward a 1:1:1 ratio using only soft front hair framing and slight chin highlight — no jaw reshaping",
  horizontalFifths:
    "softly even out the horizontal proportions across the face mainly through gentle hairstyle volume and a faint side-cheek blush — avoid heavy western-style contouring",
  eyeSpacing:
    "make the spacing between the eyes feel closer to one eye-width using softer brow placement and a hint of cool highlight on the nose root — strictly do not move, enlarge, or reshape the eyes",
  noseMouthRatio:
    "balance the visual nose-to-mouth width ratio toward 1:1.618 using a slightly defined lip outline in a sheer pink tone — no nose shadow sculpting, no nose narrowing",
  eLine:
    "guide upper and lower lip presence to feel aligned with the E-line via subtle lip tinting and a faint chin highlight — do not push the chin forward",
  faceContour:
    "refine the perceived face length-to-width balance toward 1:1.46 through hair volume on the sides and minimal cheekbone highlight — never slim the face shape itself",
};

const METRIC_LABEL_EN: Record<MetricKey, string> = {
  verticalThirds: "vertical thirds",
  horizontalFifths: "horizontal fifths",
  eyeSpacing: "eye spacing",
  noseMouthRatio: "nose-to-mouth ratio",
  eLine: "E-line alignment",
  faceContour: "face contour ratio",
};

// 改善対象とする指標を「低い順 + 最大3つ」で選ぶ。
function pickFocusMetrics(
  scores: Record<MetricKey, number>,
  max = 3,
): MetricKey[] {
  return (Object.keys(scores) as MetricKey[])
    .sort((a, b) => scores[a] - scores[b])
    .slice(0, max);
}

const SYSTEM_LIKE_PREFIX = [
  "You are a beauty visual director for the premium Japanese salon brand TIAM.",
  "Generate a refined reference portrait that nudges the original face closer to the classical golden ratio,",
  "tuned to Japanese aesthetics: quiet elegance, transparency, restraint, and clean modern beauty.",
  "This image is purely a beauty-balance reference — never medical, surgical, or dermatological retouching.",
].join(" ");

// 日本人の美容感覚に合わせて、寒色 × 透明感 × ナチュラルメイクのトーンに寄せる。
// 暖色グロー（オレンジ / ゴールド / ハリウッド調）は明示的に禁止する。
const STYLE_INSTRUCTIONS = [
  "Japanese editorial salon photography in a clean, contemporary style — think Tokyo high-end beauty magazine, not Hollywood glamour.",
  "Lighting: soft, cool diffused daylight from a large north-facing softbox. Even, low-contrast illumination with gentle highlights.",
  "Background: smooth, neutral cool-gray or pale blue-gray studio backdrop (around #D9DDE2 to #C8CED5). No warm beige, no cream, no amber.",
  "Color grading: cool to neutral white balance. Slightly desaturated, transparent palette. No warm orange, no champagne gold tint, no rose-gold cinematic glow.",
  "Skin: porcelain-like translucency with natural pores preserved. Avoid heavy retouching, dewy oil sheen, or tan tones.",
  "Makeup: soft natural Japanese editorial makeup. Sheer pink-beige or muted rose lip, never deep red or coral. Subtle cool-toned eye shadow, no smoky or bronze tones, no heavy contouring or thick eyeliner.",
  "Keep the photograph photorealistic and quietly elegant. Absolutely no painterly, illustrative, or anime styles.",
].join(" ");

const SAFETY_INSTRUCTIONS = [
  "Preserve the subject's identity very strictly: same person, same gender, same age range, East Asian Japanese ethnicity, same hairstyle, same hair color, same eye shape and color, same natural skin tone and undertone, same jewelry, same clothing, same framing, same pose, same head tilt.",
  "Do not slim the face structurally, do not change bone structure, do not reshape the jawline or chin, do not enlarge or reposition the eyes, do not lift the nose bridge, and do not retouch skin texture aggressively.",
  "Do not change the subject's perceived ethnicity, age, or gender. Do not make the subject look mixed-race or Western.",
  "The result must obviously be the same person from a close friend's perspective — only subtle makeup, hair styling, and lighting adjustments are allowed.",
].join(" ");

export type BuildPortraitPromptArgs = {
  scores: Record<MetricKey, number>;
  totalScore?: number;
};

export type BuildPortraitPromptResult = {
  prompt: string;
  summary: string; // ログ・UI 表示用の短い要約
  focusMetrics: MetricKey[];
};

export function buildPortraitPrompt({
  scores,
  totalScore,
}: BuildPortraitPromptArgs): BuildPortraitPromptResult {
  const focus = pickFocusMetrics(scores, 3);

  const focusInstructions = focus
    .map((k, i) => `${i + 1}) ${METRIC_INSTRUCTION[k]}`)
    .join(" ");

  const prompt = [
    SYSTEM_LIKE_PREFIX,
    "Take the provided photo and produce a reference portrait where the following gentle adjustments are visible:",
    focusInstructions,
    "All other facial proportions should remain faithful to the original input.",
    SAFETY_INSTRUCTIONS,
    STYLE_INSTRUCTIONS,
    "Output a single photorealistic head-and-shoulders portrait.",
  ].join(" ");

  const focusLabels = focus.map((k) => METRIC_LABEL_EN[k]).join(", ");
  const summary = totalScore
    ? `TIAM ideal portrait — focus: ${focusLabels} (total ${totalScore.toFixed(1)})`
    : `TIAM ideal portrait — focus: ${focusLabels}`;

  return { prompt, summary, focusMetrics: focus };
}
