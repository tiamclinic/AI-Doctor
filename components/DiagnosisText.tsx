"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { DoctorReportSection } from "@/components/result/DoctorReportSection";
import { AiSourceBadge } from "@/components/result/SourceBadges";
import type { DiagnoseResponse } from "@/lib/diagnosis/types";
import { hasVisibleDoctorReport } from "@/lib/doctor-notes/publicDisplay";
import type { DoctorReportNotePublic } from "@/lib/doctor-notes/types";

type DiagnosisTextProps = {
  result: DiagnoseResponse;
  doctorReport?: DoctorReportNotePublic;
  doctorMeta?: { updatedBy: string; publishedAt: string };
};

export function DiagnosisText({
  result,
  doctorReport,
  doctorMeta,
}: DiagnosisTextProps) {
  const showDoctor =
    doctorReport &&
    doctorMeta &&
    hasVisibleDoctorReport(doctorReport);

  return (
    <article className="border-border/60 bg-card flex flex-col gap-6 rounded-xl border p-6 shadow-sm sm:p-8">
      <header className="text-muted-foreground flex flex-col gap-1 text-xs tracking-wide">
        <div className="flex items-center gap-2">
          <Sparkles className="text-tiam-gold size-3.5 shrink-0" />
          <span>TIAM AI 診断レポート</span>
        </div>
        <p className="text-[10px] leading-relaxed">
          {showDoctor
            ? "TIAM AI の文章と、当院医師の追記をセクションごとに併記して表示します。"
            : "TIAM AI により生成された文章です。"}
        </p>
      </header>

      <ReportSection title="総評">
        <AiBlock>
          <p>{result.overallComment}</p>
        </AiBlock>
        {showDoctor && doctorReport.overallComment?.trim() ? (
          <DoctorReportSection
            updatedBy={doctorMeta.updatedBy}
            publishedAt={doctorMeta.publishedAt}
            showByline={false}
          >
            <p>{doctorReport.overallComment.trim()}</p>
          </DoctorReportSection>
        ) : null}
      </ReportSection>

      <ReportSection title="あなたの強み">
        <AiBlock>
          <BulletList items={result.strengths} />
        </AiBlock>
        {showDoctor && doctorReport.strengths.length > 0 ? (
          <DoctorReportSection
            updatedBy={doctorMeta.updatedBy}
            publishedAt={doctorMeta.publishedAt}
            showByline={false}
          >
            <BulletList items={doctorReport.strengths} />
          </DoctorReportSection>
        ) : null}
      </ReportSection>

      <ReportSection title="注意点">
        <AiBlock>
          <BulletList items={result.improvements} />
        </AiBlock>
        {showDoctor && doctorReport.improvements.length > 0 ? (
          <DoctorReportSection
            updatedBy={doctorMeta.updatedBy}
            publishedAt={doctorMeta.publishedAt}
            showByline={false}
          >
            <BulletList items={doctorReport.improvements} />
          </DoctorReportSection>
        ) : null}
      </ReportSection>

      <ReportSection title="推奨ケア">
        <AiBlock>
          <BulletList items={result.recommendedCare} />
        </AiBlock>
        {showDoctor && doctorReport.recommendedCare.length > 0 ? (
          <DoctorReportSection
            updatedBy={doctorMeta.updatedBy}
            publishedAt={doctorMeta.publishedAt}
            showByline={false}
          >
            <BulletList items={doctorReport.recommendedCare} />
          </DoctorReportSection>
        ) : null}
      </ReportSection>

      <footer className="border-border/60 border-t pt-4">
        <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
          TIAM メッセージ
        </h3>
        <AiBlock>
          <p className="font-heading text-tiam-primary text-sm leading-relaxed">
            {result.tiamMessage}
          </p>
        </AiBlock>
        {showDoctor && doctorReport.closingMessage?.trim() ? (
          <DoctorReportSection
            updatedBy={doctorMeta.updatedBy}
            publishedAt={doctorMeta.publishedAt}
          >
            <p className="font-heading text-tiam-primary text-sm leading-relaxed">
              {doctorReport.closingMessage.trim()}
            </p>
          </DoctorReportSection>
        ) : null}
        <p className="text-muted-foreground mt-4 text-[10px] tracking-wide">
          ※ 美容バランスの傾向を読み解く参考情報であり、医療診断ではありません。
        </p>
      </footer>
    </article>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="font-heading text-tiam-primary text-sm tracking-tight">
        {title}
      </h3>
      {children}
    </section>
  );
}

function AiBlock({ children }: { children: ReactNode }) {
  return (
    <section className="mt-2" aria-label="AI 由来コメント">
      <AiSourceBadge />
      <div className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li
          key={`${item}-${i}`}
          className="text-foreground border-tiam-gold/60 border-l-2 pl-3 text-sm leading-relaxed"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
