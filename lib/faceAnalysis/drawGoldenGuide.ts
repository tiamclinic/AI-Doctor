/**
 * 結果画面モック準拠の黄金比ガイド（三分割水平線・補助縦線・ラベル・主要指標数値）を Canvas に描画する。
 * 座標系は FaceLandmarkOverlay と同じ（ctx.scale(dpr) 後の logical サイズ = naturalWidth × naturalHeight）。
 */
import type { RawMetrics } from "@/lib/faceAnalysis/goldenRatio";
import { PHI, pickForeheadTopLandmark, TIAM_LANDMARK_INDEX } from "@/lib/faceAnalysis/landmarks";
import type { Landmark } from "@/lib/faceAnalysis/types";

const requirePoint = (landmarks: Landmark[], index: number): Landmark => {
  const p = landmarks[index];
  if (!p) throw new Error(`Landmark index ${index} out of range (${landmarks.length}).`);
  return p;
};

const toPx =
  (w: number, h: number) =>
  (lm: Landmark): { x: number; y: number } => ({
    x: lm.x * w,
    y: lm.y * h,
  });

/** テキストの可読性のため縁取り風に二重描画 */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  align: CanvasTextAlign,
  fontSize: number,
  baseline: CanvasTextBaseline = "middle",
  fontWeight: "400" | "500" | "600" = "500",
): void {
  ctx.font = `${fontWeight} ${fontSize}px ui-sans-serif, system-ui, "Noto Sans JP", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.lineWidth = Math.max(3, fontSize / 5);
  ctx.strokeStyle = "rgba(11, 11, 11, 0.72)";
  ctx.fillStyle = "rgba(250, 250, 250, 0.98)";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

/** グリッド「間」の比率数値（ゴールド系） */
function drawBandRatio(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  fontSize: number,
): void {
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, "Noto Sans JP", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(3, fontSize / 5);
  ctx.strokeStyle = "rgba(11, 11, 11, 0.78)";
  ctx.fillStyle = "rgba(201, 169, 110, 1)";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

/**
 * @param w naturalWidth
 * @param h naturalHeight
 */
export function drawGoldenRatioGuide(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  landmarks: Landmark[],
  raw: RawMetrics,
): void {
  if (landmarks.length < 468) return;

  ctx.save();

  const px = toPx(w, h);
  const idx = TIAM_LANDMARK_INDEX;

  const topLm = pickForeheadTopLandmark(landmarks);
  const hair = px(topLm);
  const brow = px(requirePoint(landmarks, idx.glabella));
  const nasal = px(requirePoint(landmarks, idx.subnasale));
  const chin = px(requirePoint(landmarks, idx.chin));
  const noseTip = px(requirePoint(landmarks, idx.noseTip));

  const reOuter = requirePoint(landmarks, idx.rightEyeOuter);
  const reInner = requirePoint(landmarks, idx.rightEyeInner);
  const leInner = requirePoint(landmarks, idx.leftEyeInner);
  const leOuter = requirePoint(landmarks, idx.leftEyeOuter);
  const eyeY =
    (((reOuter.y + reInner.y) / 2 + (leOuter.y + leInner.y) / 2) / 2) * h;

  const reMidX = ((reOuter.x + reInner.x) / 2) * w;
  const leMidX = ((leOuter.x + leInner.x) / 2) * w;
  const eyeCenter = { x: (reMidX + leMidX) / 2, y: eyeY };

  const faceR = px(requirePoint(landmarks, idx.faceRight));
  const faceL = px(requirePoint(landmarks, idx.faceLeft));
  const xMin = Math.min(faceR.x, faceL.x);
  const xMax = Math.max(faceR.x, faceL.x);
  const padX = Math.max(4, w * 0.012);
  const xMidFace = (xMin + xMax) / 2;

  const lineW = Math.max(1, w / 520);
  ctx.strokeStyle = "rgba(201, 169, 110, 0.72)";
  ctx.lineWidth = lineW;
  ctx.setLineDash([lineW * 4, lineW * 3]);

  const yLines: { y: number; label: string }[] = [
    { y: hair.y, label: "生え際" },
    { y: brow.y, label: "眉" },
    { y: eyeY, label: "目の位置" },
    { y: nasal.y, label: "鼻の下" },
    { y: chin.y, label: "顎先" },
  ];

  for (const { y } of yLines) {
    ctx.beginPath();
    ctx.moveTo(xMin - padX, y);
    ctx.lineTo(xMax + padX, y);
    ctx.stroke();
  }

  const faceW = xMax - xMin;
  const xThird1 = xMin + faceW / 3;
  const xThird2 = xMin + (faceW * 2) / 3;
  const xCenter = noseTip.x;

  ctx.setLineDash([lineW * 2, lineW * 2]);
  for (const vx of [xThird1, xThird2, xCenter]) {
    ctx.beginPath();
    ctx.moveTo(vx, hair.y - padX);
    ctx.lineTo(vx, chin.y + padX);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 水平 5 線の「間」に、顔の全縦長に対する割合を表示（モック踏襲）
  const ys = [hair.y, brow.y, eyeY, nasal.y, chin.y].sort((a, b) => a - b);
  const totalBand = ys[4]! - ys[0]!;
  const fsBand = Math.max(15, Math.min(26, w / 26));
  if (totalBand > 1) {
    for (let i = 0; i < 4; i++) {
      const y0 = ys[i]!;
      const y1 = ys[i + 1]!;
      const frac = (y1 - y0) / totalBand;
      const midY = (y0 + y1) / 2;
      drawBandRatio(ctx, xMidFace, midY, frac.toFixed(2), fsBand);
    }
  }

  // 左上: 横五分割・目間・鼻口（縦三分割の数値は帯ごとに写真上へ移した）
  const fsTop = Math.max(13, Math.min(19, w / 32));
  const fsTop2 = Math.max(12, fsTop - 1);
  const topLine1 = `横五分割比 ${raw.horizontalFifths.ratio.toFixed(2)}（理想1.0）`;
  const topLine2 = `目間比 ${raw.eyeSpacing.ratio.toFixed(2)}（理想1.0）`;
  const topLine3 = `鼻口比 ${raw.noseMouthRatio.ratio.toFixed(3)}（理想 ${(1 / PHI).toFixed(3)}）`;

  drawLabel(ctx, 8, 8, topLine1, "left", fsTop, "top");
  drawLabel(ctx, 8, 8 + fsTop * 1.25, topLine2, "left", fsTop2, "top");
  drawLabel(ctx, 8, 8 + fsTop * 1.25 + fsTop2 * 1.25, topLine3, "left", fsTop2, "top");

  const fsLabel = Math.max(16, Math.min(26, w / 24));
  const labelX = w - 10;
  for (const { y, label } of yLines) {
    drawLabel(ctx, labelX, y, label, "right", fsLabel, "middle", "600");
  }

  ctx.fillStyle = "rgba(201, 169, 110, 0.95)";
  const dot = Math.max(2.5, w / 220);
  for (const p of [hair, brow, eyeCenter, nasal, chin, noseTip]) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, dot, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
