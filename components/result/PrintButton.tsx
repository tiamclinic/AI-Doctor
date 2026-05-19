"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

type PrintButtonProps = {
  className?: string;
};

export function PrintButton({ className }: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      aria-label="診断レポートを印刷する"
      onClick={() => window.print()}
    >
      <Printer className="size-3.5" aria-hidden />
      印刷する
    </Button>
  );
}
