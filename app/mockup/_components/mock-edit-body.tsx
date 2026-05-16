"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, FileText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PART_IDS, PART_LABELS, type PartId } from "@/lib/result/parts";

import { MOCK_RESULT_ID, MockClientBanner } from "./mock-chrome";

const SAMPLE_BODY: Record<PartId, string> = {
  eyes:
    "正面光で見たときの左右差は軽微です。眉頭〜眉尾のボリューム配分を整えると、さらに視線の抜けがよく見えます。（モック用サンプル文）",
  nose: "鼻柱のシャドウがやや強めです。ハイライトは鼻筋中央に絞ると縦ラインがすっきり見えます。",
  mouth:
    "口角がわずかに下がり気味に見えるため、リップは内側に血色を足すと明るい印象に寄せやすいです。",
  contour:
    "顎下のラインはシャープ寄りです。首〜顎の境目に陰影を入れると輪郭が引き締まって見えます。",
  symmetry:
    "笑顔時の口角の高さにわずかな差があります。表情筋のクセなので、無理に左右同一にはせず自然な笑顔を優先してください。",
};

const SAMPLE_AI_OVERALL =
  "全体的に黄金比に近いバランスが取れており、目元と輪郭の印象が穏やかで清潔感のある傾向です。（AI 生成・参照用）";

const SAMPLE_DOCTOR_OVERALL =
  "カウンセリング所見として、正面からのバランスは良好です。日常のケアでは目元と口元の血色感を意識していただくと、AI 総評とも整合した印象に寄せやすいです。";

const SAMPLE_MEMO =
  "院内共有用メモ（患者には表示されません）。カウンセリング時に触れたポイントなど。";

const inputClass =
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

function MockField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {hint ? <p className="text-muted-foreground text-[10px] leading-relaxed">{hint}</p> : null}
      {children}
    </div>
  );
}

function MockSummaryEditTab() {
  return (
    <div className="flex flex-col gap-5">
      <div className="border-border/60 bg-muted/25 rounded-lg border p-4">
        <p className="text-tiam-primary text-xs font-medium">AI の総評（参照のみ）</p>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{SAMPLE_AI_OVERALL}</p>
        <p className="text-muted-foreground mt-2 text-[10px]">
          編集画面では AI 文を上書きせず、その下に医師追記を載せるイメージです。
        </p>
      </div>

      <MockField label="ドクター総評" hint="結果画面「総評」セクションの直下に表示">
        <textarea
          readOnly
          className={`${inputClass} min-h-[120px] resize-y`}
          defaultValue={SAMPLE_DOCTOR_OVERALL}
        />
      </MockField>

      <MockField label="あなたの強み（医師追記・最大3件）" hint="1行に1件。空行は無視する想定">
        <textarea
          readOnly
          className={`${inputClass} min-h-[88px]`}
          defaultValue={
            "正面から見た目元の開きが安定しており、清潔感のある印象です。\n輪郭ラインに無理のない立体感があり、年齢感を抑えやすいタイプです。"
          }
        />
      </MockField>

      <MockField label="注意点（医師追記・最大2件）">
        <textarea
          readOnly
          className={`${inputClass} min-h-[64px]`}
          defaultValue="笑顔時の口角の高さにわずかな差があるため、表情のクセを意識したケアをおすすめします。"
        />
      </MockField>

      <MockField label="推奨ケア（医師追記・最大3件）">
        <textarea
          readOnly
          className={`${inputClass} min-h-[72px]`}
          defaultValue={
            "来院時にお伝えしたホームケアを 2 週間続けて様子を見てください。\n次回来院時に光の当たり方を再確認します。"
          }
        />
      </MockField>

      <MockField label="締めのメッセージ" hint="TIAM メッセージの下に医師からの一文として表示">
        <textarea
          readOnly
          className={`${inputClass} min-h-[72px]`}
          defaultValue="ご不明点はスタッフまでお気軽にお声がけください。TIAM ビューティーラボ一同。"
        />
      </MockField>

      <MockField label="総評まわりの院内メモ（結果画面には出ません）">
        <textarea
          readOnly
          className={`${inputClass} min-h-[64px] bg-muted/30`}
          defaultValue="次回予約時にホームケアの継続を確認。写真は正面のみで十分。"
        />
      </MockField>
    </div>
  );
}

function MockPartEditTab({ partId }: { partId: PartId }) {
  return (
    <div>
      <div className="flex flex-col gap-4">
        <MockField label="タイトル（任意）">
          <input
            type="text"
            readOnly
            className={inputClass}
            defaultValue={partId === "eyes" ? "目元のコメント" : ""}
            placeholder="短い見出し"
          />
        </MockField>
        <MockField label="所見本文" hint="パーツ分析カード内「当院医師より」に表示">
          <textarea
            readOnly
            className={`${inputClass} min-h-[140px] resize-y`}
            defaultValue={SAMPLE_BODY[partId]}
          />
        </MockField>
        <MockField label="推奨ケア（1行ずつ・最大5件）">
          <textarea
            readOnly
            className={`${inputClass} min-h-[72px]`}
            defaultValue={
              partId === "eyes"
                ? "眉下の陰影をやわらかく\nマスカラは根元中心"
                : partId === "nose"
                  ? "ハイライトは細めに"
                  : partId === "mouth"
                    ? "ティントは中央厚め"
                    : ""
            }
          />
        </MockField>
        <MockField label="院内メモ（結果画面には出ません）">
          <textarea
            readOnly
            className={`${inputClass} min-h-[64px] bg-muted/30`}
            defaultValue={SAMPLE_MEMO}
          />
        </MockField>
      </div>
    </div>
  );
}

/** 編集画面の静的レイアウト（入力は閲覧用 readOnly） */
export function MockEditPageBody() {
  return (
    <>
      <MockClientBanner />

      <main className="flex flex-1 flex-col px-4 py-8 sm:py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/mockup/result"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-1.5 text-muted-foreground",
              )}
            >
              <ArrowLeft className="size-3.5" />
              結果画面（追記前）へ
            </Link>
            <span className="text-muted-foreground font-mono text-[10px] sm:text-xs">
              {MOCK_RESULT_ID}
            </span>
          </div>

          <header className="border-tiam-gold/40 border-b pb-4">
            <div className="flex items-center gap-2">
              <Eye className="text-tiam-gold size-4" />
              <h1 className="font-heading text-tiam-primary text-lg tracking-tight sm:text-xl">
                ドクター所見の編集（モック）
              </h1>
            </div>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              本番では <code className="font-mono text-[10px]">/admin/diagnoses/{"{id}"}</code>{" "}
              に相当します。<strong className="text-tiam-primary font-normal">総評・詳細レポート</strong>
              と<strong className="text-tiam-primary font-normal">パーツ別分析</strong>
              の両方に、医師追記を記入できる UI イメージです。
            </p>
          </header>

          <Card className="border-border/80">
            <CardHeader className="border-border/60 space-y-1 border-b px-4 pb-4">
              <p className="text-tiam-primary text-sm font-medium">公開状態（UIイメージ）</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                公開後は結果画面の「総評・詳細レポート」および各パーツカードに「当院医師より」ブロックが表示されます。
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex cursor-default items-center gap-2 text-xs opacity-70">
                  <input type="radio" name="mock-status" className="accent-tiam-gold" disabled />
                  下書き
                </label>
                <label className="flex cursor-default items-center gap-2 text-xs opacity-70">
                  <input
                    type="radio"
                    name="mock-status"
                    className="accent-tiam-gold"
                    defaultChecked
                    disabled
                  />
                  公開（結果に反映）
                </label>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="summary">
                <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                  <TabsTrigger
                    value="summary"
                    className="data-[state=active]:border-tiam-rose/50 data-[state=active]:bg-tiam-rose/12 border-border shrink-0 gap-1 rounded-md border px-2.5 py-1.5 text-xs data-[state=active]:shadow-none"
                  >
                    <FileText className="size-3" />
                    総評・レポート
                  </TabsTrigger>
                  {PART_IDS.map((id) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className="data-[state=active]:border-tiam-gold/60 data-[state=active]:bg-tiam-gold/10 border-border shrink-0 rounded-md border px-2.5 py-1.5 text-xs data-[state=active]:shadow-none"
                    >
                      {PART_LABELS[id]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="summary">
                  <MockSummaryEditTab />
                </TabsContent>

                {PART_IDS.map((id) => (
                  <TabsContent key={id} value={id}>
                    <MockPartEditTab partId={id} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Link href="/mockup/result" className={cn(buttonVariants({ variant: "outline" }))}>
              キャンセル（結果へ）
            </Link>
            <Link href="/mockup/result-after" className={cn(buttonVariants())}>
              保存して「反映後」プレビューへ
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
