"use client";

import type { MetricKey } from "@/lib/faceAnalysis/goldenRatio";
import { METRIC_LABELS, type ScoreResult } from "@/lib/faceAnalysis/scoring";

const METRIC_ORDER: MetricKey[] = [
  "verticalThirds",
  "horizontalFifths",
  "eyeSpacing",
  "eyePosition",
  "noseMouthRatio",
  "eLine",
  "faceContour",
  "bilateralSymmetry",
];

type ScoreRadarProps = {
  result: ScoreResult;
  size?: number;
};

const SHORT_LABEL: Record<MetricKey, string> = {
  verticalThirds: "縦三分割",
  horizontalFifths: "横五分割",
  eyeSpacing: "目間",
  eyePosition: "目の縦位置",
  noseMouthRatio: "鼻口比",
  eLine: "Eライン",
  faceContour: "顔輪郭比",
  bilateralSymmetry: "左右対称",
};

export function ScoreRadar({ result, size = 320 }: ScoreRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const labelOffset = 22;
  const n = METRIC_ORDER.length;

  // 各軸の角度（真上から時計回り）
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const point = (i: number, ratio: number) => {
    const a = angle(i);
    return [cx + Math.cos(a) * radius * ratio, cy + Math.sin(a) * radius * ratio];
  };

  // 同心円（背景の目盛り）
  const grids = [0.25, 0.5, 0.75, 1];

  // 同心円（背景の目盛り）
  const polygon = (ratio: number) =>
    METRIC_ORDER.map((_, i) => point(i, ratio).join(",")).join(" ");

  // スコア（0-100）→ 0-1 に
  const scorePolygon = METRIC_ORDER.map((key, i) =>
    point(i, result.scores[key] / 100).join(","),
  ).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="TIAM 指標レーダーチャート"
    >
      {grids.map((g) => (
        <polygon
          key={g}
          points={polygon(g)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={g === 1 ? 1.2 : 0.6}
        />
      ))}

      {METRIC_ORDER.map((_, i) => {
        const [x, y] = point(i, 1);
        return (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth={0.5}
          />
        );
      })}

      <polygon
        points={scorePolygon}
        fill="var(--tiam-gold)"
        fillOpacity={0.18}
        stroke="var(--tiam-gold)"
        strokeWidth={1.5}
      />

      {METRIC_ORDER.map((key, i) => {
        const a = angle(i);
        const x = cx + Math.cos(a) * (radius + labelOffset);
        const y = cy + Math.sin(a) * (radius + labelOffset);
        const anchor =
          Math.abs(Math.cos(a)) < 0.2
            ? "middle"
            : Math.cos(a) > 0
              ? "start"
              : "end";
        return (
          <g key={`label-${key}`}>
            <text
              x={x}
              y={y - 5}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-foreground"
              fontSize={11}
              fontWeight={500}
            >
              {SHORT_LABEL[key]}
            </text>
            <text
              x={x}
              y={y + 9}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-muted-foreground"
              fontSize={10}
              fontWeight={400}
            >
              {result.scores[key].toFixed(1)}
            </text>
          </g>
        );
      })}

      <title>{`TIAM 指標レーダー: ${METRIC_ORDER.map(
        (k) => `${METRIC_LABELS[k]} ${result.scores[k].toFixed(1)}`,
      ).join(" / ")}`}</title>
    </svg>
  );
}
