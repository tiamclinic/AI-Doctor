"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  MockClientBanner,
  MockDiagnosisSection,
  MockLegalFooter,
  MockMetricStripes,
  MockPartGridAfter,
  MockPartsSectionHeader,
  MockPhotoHero,
  MockResultPageHeader,
  MockTotalScoreBlock,
} from "../_components/mock-chrome";

export default function MockupResultAfterPage() {
  return (
    <>
      <MockClientBanner />
      <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
        <div className="flex w-full max-w-5xl flex-col gap-8">
          <div className="flex flex-col items-center gap-2">
            <span className="border-tiam-rose/40 bg-tiam-rose/10 text-tiam-primary inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-medium tracking-wide">
              反映後プレビュー
            </span>
            <MockResultPageHeader cta="none" />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
            <MockPhotoHero />
            <div className="flex flex-col gap-6">
              <MockTotalScoreBlock />
              <MockMetricStripes />
            </div>
          </div>

          <section>
            <MockPartsSectionHeader />
            <MockPartGridAfter />
          </section>

          <MockDiagnosisSection withDoctorNote />

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/mockup/result"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              追記前の結果へ戻る
            </Link>
            <Link href="/mockup" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              モック一覧へ
            </Link>
          </div>

          <MockLegalFooter />
        </div>
      </main>
    </>
  );
}
