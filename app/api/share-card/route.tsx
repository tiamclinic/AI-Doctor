import { ImageResponse } from "next/og";
import { NextResponse, type NextRequest } from "next/server";

import { loadGoogleFont } from "@/lib/share-card/fonts";
import {
  collectGlyphs,
  SHARE_CARD_SIZE,
  ShareCardTemplate,
} from "@/lib/share-card/template";
import { ShareCardRequestSchema } from "@/lib/share-card/types";

// Edge にすると fetch のレイテンシが下がるが、ImageResponse + Satori は
// Node ランタイムでも問題なく動くので diagnose 系と同じ Node を選ぶ。
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ShareCardRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_request",
        message: "リクエスト形式が正しくありません。",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const text = collectGlyphs(data);

  // フォント取得は失敗しうるので try で包む。JSX 構築は try の外で行う（lint 規約準拠）。
  let notoRegular: ArrayBuffer;
  let notoBold: ArrayBuffer;
  let cormorantRegular: ArrayBuffer;
  try {
    [notoRegular, notoBold, cormorantRegular] = await Promise.all([
      loadGoogleFont({ family: "Noto Sans JP", weight: 400, text }),
      loadGoogleFont({ family: "Noto Sans JP", weight: 700, text }),
      loadGoogleFont({ family: "Cormorant Garamond", weight: 500, text }),
    ]);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "share-card font fetch failed";
    if (process.env.NODE_ENV !== "production") {
      console.error("[/api/share-card] font error", e);
    }
    return NextResponse.json(
      {
        error: "render_failed",
        message: `シェアカード用フォントの取得に失敗しました。${message}`,
      },
      { status: 500 },
    );
  }

  return new ImageResponse(<ShareCardTemplate data={data} />, {
    width: SHARE_CARD_SIZE.width,
    height: SHARE_CARD_SIZE.height,
    fonts: [
      { name: "Noto Sans JP", data: notoRegular, weight: 400, style: "normal" },
      { name: "Noto Sans JP", data: notoBold, weight: 700, style: "normal" },
      {
        name: "Cormorant Garamond",
        data: cormorantRegular,
        weight: 500,
        style: "normal",
      },
    ],
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Disposition": 'inline; filename="tiam-share-card.png"',
    },
  });
}
