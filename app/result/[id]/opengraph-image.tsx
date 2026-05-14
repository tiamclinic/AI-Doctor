import { ImageResponse } from "next/og";

import { loadGoogleFont } from "@/lib/share-card/fonts";

export const runtime = "nodejs";
export const alt = "TIAM Beauty AI 美容バランス診断";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** opengraph-image 用に描画する文字（サブセット取得用） */
const GLYPHS =
  "TIAMBeautyLabAI美容バランス診断結果参考情報医療ではありません0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZID:…";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const safeId = id.length > 24 ? `${id.slice(0, 24)}…` : id;

  const [notoRegular, notoBold] = await Promise.all([
    loadGoogleFont({ family: "Noto Sans JP", weight: 400, text: GLYPHS }),
    loadGoogleFont({ family: "Noto Sans JP", weight: 700, text: GLYPHS }),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(165deg, #0B0B0B 0%, #151515 55%, #1a1510 100%)",
          color: "#FAFAFA",
          fontFamily: '"Noto Sans JP", sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          TIAM Beauty AI
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 38,
            fontWeight: 700,
            color: "#C9A96E",
          }}
        >
          美容バランス診断
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 22,
            color: "#b8b8b8",
            maxWidth: 900,
            textAlign: "center",
            lineHeight: 1.45,
          }}
        >
          参考情報（医療診断ではありません）
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 16,
            color: "#6a6a6a",
            fontFamily: "monospace",
          }}
        >
          ID: {safeId}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: notoRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Noto Sans JP",
          data: notoBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
