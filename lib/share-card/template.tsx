import * as React from "react";

import { DISPLAYED_METRIC_KEYS } from "@/lib/faceAnalysis/scoring";
import type { ShareCardRequest } from "@/lib/share-card/types";

// 1080×1920 縦長（9:16）。Instagram Story / TikTok 互換。
export const SHARE_CARD_SIZE = { width: 1080, height: 1920 } as const;

// TIAM ブランドカラー（globals.css と一致）
const COLOR = {
  bg: "#0B0B0B",
  surface: "#141414",
  primary: "#FAFAFA",
  gold: "#C9A96E",
  goldSoft: "rgba(201, 169, 110, 0.18)",
  muted: "rgba(250, 250, 250, 0.55)",
  border: "rgba(250, 250, 250, 0.12)",
} as const;

const METRIC_ORDER = DISPLAYED_METRIC_KEYS;

const METRIC_LABEL: Record<(typeof METRIC_ORDER)[number], string> = {
  verticalThirds: "縦三分割",
  horizontalFifths: "横五分割",
  eyeSpacing: "目間",
  eyePosition: "目の縦位置",
  noseMouthRatio: "鼻口比",
  faceContour: "顔輪郭",
  bilateralSymmetry: "左右対称",
  eyeLevelSymmetry: "目の高さ",
  mouthLevelSymmetry: "口角の高さ",
};

// テンプレで描画する全文字列を集約。フォントサブセット生成のために使う。
// ここに含まれない文字を描画すると Satori が <text> ノードへフォールバックし
// 「<text> nodes are not currently supported」エラーで PNG 生成が落ちる。
// そのためテンプレ内のリテラル文字列は漏れなくここへ書き写すこと。
const STATIC_TEMPLATE_TEXT = [
  // ヘッダー
  "TIAM",
  "Beauty AI Diagnosis Report",
  // スコアサークル
  "TIAM バランス指数",
  "/ 100",
  // レーダーチャート見出し
  "TIAM指標バランス",
  // METRIC_LABEL の全項目
  "縦三分割横五分割目間目の縦位置鼻口比顔輪郭左右対称目の高さ口角の高さ",
  // フッター注意書き / コピーライト（句読点・記号も含む）
  "※ 美容バランスの傾向を読み解く参考情報であり、医療診断ではありません。",
  "© TIAM Beauty Lab",
  // 数値表示用（toFixed の結果）
  "0123456789.",
  // 動的テキストの保険として ASCII を一括
  "abcdefghijklmnopqrstuvwxyz",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
].join("");

export function collectGlyphs(data: ShareCardRequest): string {
  return [
    STATIC_TEMPLATE_TEXT,
    data.topStrength ?? "",
    data.tiamMessage ?? "",
  ].join("");
}

type ScoreCircleProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
};

function ScoreArcSvg({ value, size = 460, strokeWidth = 22 }: ScoreCircleProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={COLOR.border}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={COLOR.gold}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </g>
    </svg>
  );
}

type RadarProps = {
  scores: ShareCardRequest["scores"];
  size?: number;
};

// Satori は SVG <text> 未対応のため、チャート部分は SVG、ラベルは div の絶対配置で描く。
function RadarWithLabels({ scores, size = 660 }: RadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.33;
  const labelOffset = 64;
  const n = METRIC_ORDER.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, ratio: number): [number, number] => {
    const a = angle(i);
    return [
      cx + Math.cos(a) * radius * ratio,
      cy + Math.sin(a) * radius * ratio,
    ];
  };
  const polygon = (ratio: number) =>
    METRIC_ORDER.map((_, i) => point(i, ratio).join(",")).join(" ");
  const scorePolygon = METRIC_ORDER.map((key, i) =>
    point(i, scores[key] / 100).join(","),
  ).join(" ");

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <polygon
            key={g}
            points={polygon(g)}
            fill="none"
            stroke={COLOR.border}
            strokeWidth={g === 1 ? 2 : 1}
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
              stroke={COLOR.border}
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={scorePolygon}
          fill={COLOR.goldSoft}
          stroke={COLOR.gold}
          strokeWidth={3}
        />
      </svg>
      {METRIC_ORDER.map((key, i) => {
        const a = angle(i);
        const x = cx + Math.cos(a) * (radius + labelOffset);
        const y = cy + Math.sin(a) * (radius + labelOffset);
        return (
          <div
            key={`label-${key}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 140,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: COLOR.primary,
                lineHeight: 1.2,
              }}
            >
              {METRIC_LABEL[key]}
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: COLOR.gold,
                lineHeight: 1.2,
                marginTop: 4,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              {scores[key].toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ShareCardTemplate({ data }: { data: ShareCardRequest }) {
  const { width, height } = SHARE_CARD_SIZE;
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLOR.bg,
        color: COLOR.primary,
        padding: "80px 72px",
        fontFamily: "'Noto Sans JP', 'Cormorant Garamond', sans-serif",
        position: "relative",
      }}
    >
      {/* 上部の細いゴールドライン（装飾） */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: COLOR.gold,
          display: "flex",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 64,
            letterSpacing: 18,
            color: COLOR.primary,
          }}
        >
          TIAM
        </span>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22,
            letterSpacing: 8,
            color: COLOR.gold,
            textTransform: "uppercase",
          }}
        >
          Beauty AI Diagnosis Report
        </span>
      </div>

      {/* スコアサークル */}
      <div
        style={{
          marginTop: 70,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 460,
            height: 460,
            display: "flex",
          }}
        >
          <ScoreArcSvg value={data.totalScore} size={460} strokeWidth={20} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 18,
                letterSpacing: 2,
                color: COLOR.gold,
                textTransform: "uppercase",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              TIAM バランス指数
            </span>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 168,
                fontWeight: 500,
                lineHeight: 1,
                marginTop: 12,
                color: COLOR.primary,
              }}
            >
              {data.totalScore.toFixed(1)}
            </span>
            <span
              style={{
                fontSize: 22,
                color: COLOR.muted,
                marginTop: 8,
                letterSpacing: 4,
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              / 100
            </span>
          </div>
        </div>
      </div>

      {/* レーダーチャート */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 20,
            letterSpacing: 2,
            color: COLOR.gold,
            textTransform: "uppercase",
            fontFamily: "'Cormorant Garamond', serif",
          }}
        >
          TIAM指標バランス
        </span>
        <div style={{ marginTop: 12, display: "flex" }}>
          <RadarWithLabels scores={data.scores} size={660} />
        </div>
      </div>

      {/* メッセージ */}
      {(data.topStrength || data.tiamMessage) && (
        <div
          style={{
            marginTop: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            padding: "0 40px",
          }}
        >
          {data.topStrength && (
            <span
              style={{
                fontSize: 26,
                color: COLOR.primary,
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              {data.topStrength}
            </span>
          )}
          {data.tiamMessage && (
            <span
              style={{
                fontSize: 22,
                color: COLOR.gold,
                lineHeight: 1.5,
                textAlign: "center",
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              {data.tiamMessage}
            </span>
          )}
        </div>
      )}

      {/* フッタを下に固定 */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 16,
            color: COLOR.muted,
            letterSpacing: 2,
          }}
        >
          ※ 美容バランスの傾向を読み解く参考情報であり、医療診断ではありません。
        </span>
        <span
          style={{
            fontSize: 16,
            color: COLOR.gold,
            letterSpacing: 6,
            fontFamily: "'Cormorant Garamond', serif",
            marginTop: 4,
          }}
        >
          © TIAM Beauty Lab
        </span>
      </div>
    </div>
  );
}
