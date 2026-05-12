"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export type ConsentResult = {
  termsAccepted: boolean;
  openAiPortraitAccepted: boolean;
};

type ConsentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent?: (result: ConsentResult) => void;
};

export function ConsentDialog({
  open,
  onOpenChange,
  onConsent,
}: ConsentDialogProps) {
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [openAiPortraitAccepted, setOpenAiPortraitAccepted] =
    React.useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTermsAccepted(false);
      setOpenAiPortraitAccepted(false);
    }
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!termsAccepted) return;
    onConsent?.({
      termsAccepted,
      openAiPortraitAccepted,
    });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ご利用の前に</DialogTitle>
          <DialogDescription>
            美容バランスの傾向を把握するための参考情報です。医療診断ではありません。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(v) => setTermsAccepted(v === true)}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="terms" className="text-sm font-medium leading-snug">
                <Link
                  href="/terms"
                  className="text-tiam-gold underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  利用規約
                </Link>
                および
                <Link
                  href="/privacy"
                  className="text-tiam-gold underline-offset-4 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  プライバシーポリシー
                </Link>
                に同意します。
              </Label>
              <p className="text-muted-foreground text-xs leading-relaxed">
                撮影した写真はブラウザ内で解析します（外部送信はしません）。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Checkbox
              id="openai"
              checked={openAiPortraitAccepted}
              onCheckedChange={(v) => setOpenAiPortraitAccepted(v === true)}
            />
            <div className="grid gap-1.5">
              <Label htmlFor="openai" className="text-sm font-medium leading-snug">
                「理想顔イメージ」生成時に、写真が OpenAI に送信されることに同意します。
              </Label>
              <p className="text-muted-foreground text-xs leading-relaxed">
                未チェックの場合でも診断フローは続行できますが、画像生成はスキップされます。
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            キャンセル
          </Button>
          <Button type="button" disabled={!termsAccepted} onClick={handleSubmit}>
            同意して進む
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
