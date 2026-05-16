"use client";

import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useStaffSession } from "@/hooks/useStaffSession";

type DoctorEditCtaProps = {
  resultId: string;
  hasPublishedNote: boolean;
};

export function DoctorEditCta({ resultId, hasPublishedNote }: DoctorEditCtaProps) {
  const router = useRouter();
  const { isStaff, isLoading } = useStaffSession();

  if (isLoading || !isStaff) {
    return null;
  }

  const label = hasPublishedNote ? "ドクター所見を編集" : "ドクター所見を追記";

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="doctor-edit-cta border-tiam-gold/50 bg-tiam-gold/15 text-tiam-primary hover:bg-tiam-gold/25 shrink-0 gap-1.5 border shadow-none"
      onClick={() => router.push(`/admin/diagnoses/${resultId}`)}
    >
      <PenLine className="size-3.5" aria-hidden />
      {label}
    </Button>
  );
}
