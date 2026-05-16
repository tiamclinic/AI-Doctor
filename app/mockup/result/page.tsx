"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  MockClientBanner,
  MockDiagnosisSection,
  MockLegalFooter,
  MockMetricStripes,
  MockPartGridBefore,
  MockPartsSectionHeader,
  MockPhotoHero,
  MockResultPageHeader,
  MockTotalScoreBlock,
} from "../_components/mock-chrome";

export default function MockupResultBeforePage() {
  return (
    <>
      <MockClientBanner />
      <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
        <div className="flex w-full max-w-5xl flex-col gap-8">
          <MockResultPageHeader cta="edit" />

          <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
            <MockPhotoHero />
            <div className="flex flex-col gap-6">
              <MockTotalScoreBlock />
              <MockMetricStripes />
            </div>
          </div>

          <section>
            <MockPartsSectionHeader />
            <MockPartGridBefore />
          </section>

          <MockDiagnosisSection />

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/mockup"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              モック一覧へ
            </Link>
            <Link href="/mockup/edit" className={cn(buttonVariants({ size: "sm" }))}>
              編集画面へ（導線デモ）
            </Link>
          </div>

          <MockLegalFooter />
        </div>
      </main>
    </>
  );
}
