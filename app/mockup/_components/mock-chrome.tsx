"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { PartAnalysisIcon } from "@/components/result/PartAnalysisIcon";
import { ResultSectionHeader } from "@/components/result/ResultSectionHeader";
import { ScoreCircle } from "@/components/ScoreCircle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PART_LABELS, type PartId } from "@/lib/result/parts";

export const MOCK_RESULT_ID = "mock8dem01";

export function MockClientBanner() {
  return (
    <div className="border-tiam-gold/25 bg-tiam-gold/8 text-tiam-primary border-b px-4 py-2.5 text-center text-[11px] leading-relaxed sm:text-xs">
      <span className="font-heading text-tiam-gold tracking-wide">MOCK</span>
      <span className="mx-2 text-muted-foreground">|</span>
      クライアント確認用の見た目モックです。保存・API・認証はありません（後日削除予定）。
    </div>
  );
}

export function MockResultPageHeader({
  cta,
}: {
  /** 追記前: 編集ボタン / 追記後: 省略可 */
  cta?: "edit" | "none";
}) {
  return (
    <header className="flex flex-col items-center text-center">
      <span className="text-tiam-gold font-heading text-[10px] tracking-[0.3em] uppercase">
        TIAM Beauty AI Report
      </span>
      <div className="mt-2 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
        <h1 className="font-heading text-tiam-primary text-2xl tracking-tight sm:text-3xl">
          黄金比診断結果
        </h1>
        {cta === "edit" ? (
          <Link
            href="/mockup/edit"
            className={cn(
              buttonVariants({ size: "sm" }),
              "border-tiam-gold/50 bg-tiam-gold/15 text-tiam-primary hover:bg-tiam-gold/25 shrink-0 gap-1.5 border shadow-none",
            )}
          >
            <PenLine className="size-3.5" />
            ドクター所見を追記
          </Link>
        ) : null}
      </div>
      <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
        あなたの顔を黄金比に基づいて分析しました。
      </p>
      <p className="text-muted-foreground mt-2 text-[10px]">
        ID: <span className="font-mono">{MOCK_RESULT_ID}</span>
      </p>
      {cta === "edit" ? (
        <p className="text-muted-foreground mt-2 max-w-md text-[10px] leading-relaxed">
          ※本番では、院内スタッフが事前ログイン済みの端末にのみ「ドクター所見を追記」が表示されます。
        </p>
      ) : null}
    </header>
  );
}

export function MockPhotoHero() {
  return (
    <section className="border-border/80 bg-card overflow-hidden rounded-xl border p-4 shadow-sm sm:p-5">
      <div className="border-border bg-muted/40 relative flex aspect-[3/4] max-h-[420px] items-center justify-center overflow-hidden rounded-xl border">
        <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 text-center text-xs">
          <span className="text-tiam-gold font-heading text-[10px] tracking-[0.25em]">
            SAMPLE
          </span>
          来院者写真のプレースホルダー
          <span className="text-[10px] opacity-80">
            （本番ではランドマーク・ガイド線を重ねた静止画）
          </span>
        </div>
      </div>
      <div className="border-border/60 bg-card mt-4 grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 rounded-xl border p-4 text-sm sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-x-4">
        <span className="font-heading text-tiam-gold text-[11px] tracking-[0.2em] whitespace-nowrap">
          顔タイプ
        </span>
        <span className="text-foreground leading-snug">ソフトクラシック寄り</span>
        <span className="font-heading text-tiam-gold text-[11px] tracking-[0.2em] whitespace-nowrap">
          印象
        </span>
        <span className="text-foreground leading-snug">落ち着き ・ 端正</span>
      </div>
    </section>
  );
}

export function MockTotalScoreBlock() {
  return (
    <section className="border-border/80 bg-card flex flex-col items-center gap-3 rounded-xl border p-5 text-center shadow-sm sm:p-6">
      <div className="border-tiam-gold/40 w-full border-b pb-2 text-center">
        <h2 className="font-heading text-tiam-primary text-sm tracking-tight sm:text-base">
          総合評価
        </h2>
      </div>
      <ScoreCircle value={86.4} size={180} />
      <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
        黄金比に近いバランスが取れやすく、全体のまとまりが感じられる帯域です。
      </p>
    </section>
  );
}

export function MockMetricStripes() {
  const rows = [
    { label: "縦三分割", v: 88 },
    { label: "横五分割", v: 84 },
    { label: "目の位置（縦）", v: 91 },
    { label: "左右対称性", v: 79 },
  ];
  return (
    <section className="border-border/80 bg-card rounded-xl border p-5 shadow-sm sm:p-6">
      <div className="border-tiam-gold/40 mb-4 border-b pb-2">
        <h2 className="font-heading text-tiam-primary text-sm tracking-tight">
          指標バランス（抜粋）
        </h2>
        <p className="text-muted-foreground mt-1 text-[11px]">
          モックのため一部のみ表示しています。
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-foreground">{r.label}</span>
              <span className="text-tiam-gold font-heading tabular-nums">
                {r.v.toFixed(1)}
              </span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-tiam-gold/80 h-full rounded-full"
                style={{ width: `${r.v}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AiBadge() {
  return (
    <div className="inline-flex w-fit items-center rounded border border-tiam-gold/40 bg-tiam-gold/10 px-2 py-0.5">
      <span className="text-tiam-primary text-[10px] font-medium tracking-wide">
        TIAM AI
      </span>
    </div>
  );
}

function DoctorBadge() {
  return (
    <div className="inline-flex w-fit items-center rounded border border-tiam-rose/45 bg-tiam-rose/12 px-2 py-0.5">
      <span className="text-tiam-primary text-[10px] font-medium tracking-wide">
        当院医師より
      </span>
    </div>
  );
}

type MockPartCardProps = {
  partId: PartId;
  score: number;
  aiSummary: string;
  doctor?: {
    body: string;
    care: string[];
    byline: string;
  };
};

export function MockPartCard({ partId, score, aiSummary, doctor }: MockPartCardProps) {
  const title = PART_LABELS[partId];
  return (
    <article
      data-part-id={partId}
      className="border-border/60 bg-card flex h-full flex-col rounded-xl border p-5 shadow-sm"
    >
      <header className="border-tiam-gold/40 flex items-center gap-3 border-b pb-3">
        <div className="border-tiam-gold/50 bg-tiam-gold/8 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border">
          <PartAnalysisIcon partId={partId} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-tiam-primary text-sm tracking-tight">{title}</h3>
        </div>
        <span className="text-tiam-gold font-heading shrink-0 text-lg tabular-nums tracking-tight">
          {score.toFixed(1)}
        </span>
      </header>

      <section className="mt-3 flex flex-1 flex-col" aria-label="AI 由来コメント">
        <AiBadge />
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{aiSummary}</p>
      </section>

      {doctor ? (
        <section
          className="border-border/60 mt-4 border-t border-dashed pt-3"
          aria-label="当院医師より"
        >
          <DoctorBadge />
          <p className="text-foreground mt-2 text-xs leading-relaxed">{doctor.body}</p>
          {doctor.care.length > 0 ? (
            <ul className="text-muted-foreground mt-2 list-inside list-disc text-[11px] leading-relaxed">
              {doctor.care.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <footer className="text-muted-foreground mt-3 text-[10px] leading-relaxed">
            {doctor.byline}
          </footer>
        </section>
      ) : null}

      <footer className="text-muted-foreground mt-auto pt-3 text-[10px] leading-relaxed">
        ※ 美容バランスの傾向を読み解く参考情報です。
      </footer>
    </article>
  );
}

const MOCK_PARTS_BEFORE: MockPartCardProps[] = [
  {
    partId: "eyes",
    score: 89.2,
    aiSummary:
      "目元周りの比率が整いやすく、全体の印象がまとまりやすい傾向です。アイラインの濃淡で重心を微調整しやすくなります。",
  },
  {
    partId: "nose",
    score: 84.1,
    aiSummary:
      "鼻先から口元にかけてのラインが落ち着きやすく、正面の立ち上がりが整いやすいです。",
  },
  {
    partId: "mouth",
    score: 82.5,
    aiSummary:
      "口元の幅と鼻幅のバランスが取りやすく、口元が引き締まって見えやすいです。",
  },
  {
    partId: "contour",
    score: 87.0,
    aiSummary:
      "輪郭の縦横比が黄金比に近く、顔立ちに立体感が出やすい傾向です。",
  },
  {
    partId: "symmetry",
    score: 78.4,
    aiSummary:
      "左右差はごくわずかで、表情の均整が取りやすいタイプです。",
  },
];

const MOCK_DOCTOR_SNIPPETS: Record<
  PartId,
  { body: string; care: string[]; byline: string }
> = {
  eyes: {
    body: "正面光で見たときの左右差は軽微です。眉頭〜眉尾のボリューム配分を整えると、さらに視線の抜けがよく見えます。",
    care: ["眉下の陰影をやわらかく", "マスカラは根元中心"],
    byline: "記入: 院長 例山 ／ 公開: 2026-05-16 14:20",
  },
  nose: {
    body: "鼻柱のシャドウがやや強めです。ハイライトは鼻筋中央に絞ると縦ラインがすっきり見えます。",
    care: ["ハイライトは細めに"],
    byline: "記入: 院長 例山 ／ 公開: 2026-05-16 14:20",
  },
  mouth: {
    body: "口角がわずかに下がり気味に見えるため、リップは内側に血色を足すと明るい印象に寄せやすいです。",
    care: ["ティントは中央厚め"],
    byline: "記入: 院長 例山 ／ 公開: 2026-05-16 14:20",
  },
  contour: {
    body: "顎下のラインはシャープ寄りです。首〜顎の境目に陰影を入れると輪郭が引き締まって見えます。",
    care: [],
    byline: "記入: 院長 例山 ／ 公開: 2026-05-16 14:20",
  },
  symmetry: {
    body: "笑顔時の口角の高さにわずかな差があります。表情筋のクセなので、無理に左右同一にはせず自然な笑顔を優先してください。",
    care: [],
    byline: "記入: 院長 例山 ／ 公開: 2026-05-16 14:20",
  },
};

export function MockPartGridBefore() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MOCK_PARTS_BEFORE.map((p) => (
        <MockPartCard key={p.partId} {...p} />
      ))}
    </div>
  );
}

export function MockPartGridAfter() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MOCK_PARTS_BEFORE.map((p) => (
        <MockPartCard
          key={p.partId}
          {...p}
          doctor={MOCK_DOCTOR_SNIPPETS[p.partId]}
        />
      ))}
    </div>
  );
}

export function MockPartsSectionHeader() {
  return (
    <ResultSectionHeader
      title="パーツごとの詳細分析"
      subtitle="各部位の傾向を TIAM AI のルールベース短文で要約しています。当院医師の所見は公開済みの場合に併記されます。"
    />
  );
}

const MOCK_AI_REPORT = {
  overallComment:
    "全体的に黄金比に近いバランスが取れており、目元と輪郭の印象が穏やかで清潔感のある傾向です。鼻先から顎にかけての縦ラインがすっきり見え、正面からの立ち上がりが整いやすいタイプです。",
  strengths: [
    "目元の開きと位置が整い、視線の抜けがよい傾向です。",
    "鼻先から顎へのラインがすっきりして見えます。",
    "口元の左右差が小さく、表情の均整が取れています。",
  ],
  improvements: [
    "顔の下半分のボリューム感を少し抑えると、より洗練された印象になります。",
    "輪郭の角をやわらかく見せると、柔らかい印象に寄せられます。",
  ],
  recommendedCare: [
    "眉の形を少し整えると目元の印象が引き締まります。",
    "リップの血色を整えると口元の明るさが増します。",
    "首筋のストレッチで表情筋の緊張をほぐすと自然な笑顔になりやすいです。",
  ],
  tiamMessage:
    "黄金比のバランスを意識した日々のケアで、自分らしい美しさを楽しんでください。",
};

const MOCK_DOCTOR_REPORT = {
  overallComment:
    "カウンセリング所見として、正面からのバランスは良好です。日常のケアでは目元と口元の血色感を意識していただくと、AI 総評とも整合した印象に寄せやすいです。",
  strengths: [
    "正面から見た目元の開きが安定しており、清潔感のある印象です。",
    "輪郭ラインに無理のない立体感があり、年齢感を抑えやすいタイプです。",
  ],
  improvements: [
    "笑顔時の口角の高さにわずかな差があるため、表情のクセを意識したケアをおすすめします。",
  ],
  recommendedCare: [
    "来院時にお伝えしたホームケアを 2 週間続けて様子を見てください。",
    "次回来院時に光の当たり方を再確認します。",
  ],
  closingMessage:
    "ご不明点はスタッフまでお気軽にお声がけください。TIAM ビューティーラボ一同。",
  byline: "記入: 院長 例山 ／ 公開: 2026-05-16 14:20",
};

function ReportAiBlock({ children }: { children: ReactNode }) {
  return (
    <div>
      <AiBadge />
      <div className="text-muted-foreground mt-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function ReportDoctorBlock({
  children,
  showByline,
}: {
  children: ReactNode;
  showByline?: boolean;
}) {
  return (
    <div className="border-border/60 mt-4 border-t border-dashed pt-4" aria-label="当院医師より">
      <DoctorBadge />
      <div>
        <div className="text-foreground mt-2 text-sm leading-relaxed">{children}</div>
      </div>
      {showByline ? (
        <footer className="text-muted-foreground mt-3 text-[10px] leading-relaxed">
          {MOCK_DOCTOR_REPORT.byline}
        </footer>
      ) : null}
    </div>
  );
}

function MockReportList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="text-foreground border-tiam-gold/60 border-l-2 pl-3 text-sm leading-relaxed"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function MockDiagnosisReportCard({ withDoctorNote }: { withDoctorNote: boolean }) {
  return (
    <article className="border-border/60 bg-card flex flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
      <header className="text-muted-foreground flex flex-col gap-1 text-xs tracking-wide">
        <span className="text-tiam-primary text-[11px] font-medium">診断レポート</span>
        <p className="text-[10px] leading-relaxed">
          {withDoctorNote
            ? "TIAM AI の文章と、当院医師の追記を縦に併記して表示します。"
            : "TIAM AI の文章のみ。医師追記は公開後に下へ併記されます。"}
        </p>
      </header>

      <section>
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">総評</h3>
        <ReportAiBlock>
          <p>{MOCK_AI_REPORT.overallComment}</p>
        </ReportAiBlock>
        {withDoctorNote ? (
          <ReportDoctorBlock>
            <p>{MOCK_DOCTOR_REPORT.overallComment}</p>
          </ReportDoctorBlock>
        ) : null}
      </section>

      <section>
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">あなたの強み</h3>
        <ReportAiBlock>
          <MockReportList items={MOCK_AI_REPORT.strengths} />
        </ReportAiBlock>
        {withDoctorNote ? (
          <ReportDoctorBlock>
            <MockReportList items={MOCK_DOCTOR_REPORT.strengths} />
          </ReportDoctorBlock>
        ) : null}
      </section>

      <section>
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">注意点</h3>
        <ReportAiBlock>
          <MockReportList items={MOCK_AI_REPORT.improvements} />
        </ReportAiBlock>
        {withDoctorNote ? (
          <ReportDoctorBlock>
            <MockReportList items={MOCK_DOCTOR_REPORT.improvements} />
          </ReportDoctorBlock>
        ) : null}
      </section>

      <section>
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">推奨ケア</h3>
        <ReportAiBlock>
          <MockReportList items={MOCK_AI_REPORT.recommendedCare} />
        </ReportAiBlock>
        {withDoctorNote ? (
          <ReportDoctorBlock>
            <MockReportList items={MOCK_DOCTOR_REPORT.recommendedCare} />
          </ReportDoctorBlock>
        ) : null}
      </section>

      <footer className="border-border/60 border-t pt-4">
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">TIAM メッセージ</h3>
        <ReportAiBlock>
          <p className="font-heading text-tiam-primary text-sm leading-relaxed">
            {MOCK_AI_REPORT.tiamMessage}
          </p>
        </ReportAiBlock>
        {withDoctorNote ? (
          <ReportDoctorBlock showByline>
            <p className="font-heading text-tiam-primary text-sm leading-relaxed">
              {MOCK_DOCTOR_REPORT.closingMessage}
            </p>
          </ReportDoctorBlock>
        ) : null}
        <p className="text-muted-foreground mt-4 text-[10px] tracking-wide">
          ※ 美容バランスの傾向を読み解く参考情報であり、医療診断ではありません。
        </p>
      </footer>
    </article>
  );
}

export function MockDiagnosisSection({
  withDoctorNote = false,
}: {
  withDoctorNote?: boolean;
}) {
  return (
    <section>
      <ResultSectionHeader
        title="総評・詳細レポート"
        subtitle={
          withDoctorNote
            ? "AI 生成文と当院医師の追記を、セクションごとに併記して表示します。"
            : "OpenAI により生成された文章です（医師追記前）。"
        }
      />
      <MockDiagnosisReportCard withDoctorNote={withDoctorNote} />
    </section>
  );
}

export function MockLegalFooter() {
  return (
    <footer className="text-muted-foreground text-center text-[10px] leading-relaxed">
      ※ 本診断は美容バランスの傾向を示す参考情報であり、医療診断ではありません。
      <br />
      薬機法・景表法に配慮した表現のイメージです（確定文は別途法務確認）。
      <br />© TIAM Beauty Lab
    </footer>
  );
}
