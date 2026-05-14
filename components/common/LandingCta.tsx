"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

import { ConsentDialog, type ConsentResult } from "@/components/common/ConsentDialog";
import { trackEvent } from "@/lib/analytics/track";
import { notifyConsentChanged } from "@/lib/consent";

type LandingCtaProps = {
  onConsentComplete?: () => void;
};

export function LandingCta({ onConsentComplete }: LandingCtaProps) {
  const [open, setOpen] = React.useState(false);

  const handleConsent = (result: ConsentResult) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "tiam-consent",
        JSON.stringify({
          ...result,
          acceptedAt: new Date().toISOString(),
        }),
      );
      notifyConsentChanged();
      void trackEvent("terms_consent", {
        openai_portrait: result.openAiPortraitAccepted,
      });
    }
    onConsentComplete?.();
  };

  return (
    <>
      <Button size="lg" className="min-w-[200px]" onClick={() => setOpen(true)}>
        診断をはじめる
      </Button>
      <ConsentDialog open={open} onOpenChange={setOpen} onConsent={handleConsent} />
    </>
  );
}
