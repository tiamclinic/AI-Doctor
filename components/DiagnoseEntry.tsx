"use client";

import * as React from "react";

import { LandingCta } from "@/components/common/LandingCta";
import { PhotoUploader } from "@/components/PhotoUploader";
import {
  consentServerSnapshot,
  consentSnapshot,
  notifyConsentChanged,
  subscribeConsent,
} from "@/lib/consent";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";

export function DiagnoseEntry() {
  const setPhoto = useDiagnosisStore((s) => s.setPhoto);
  const clearPhoto = useDiagnosisStore((s) => s.clearPhoto);

  const consented = React.useSyncExternalStore(
    subscribeConsent,
    consentSnapshot,
    consentServerSnapshot,
  );

  const handleSelect = React.useCallback(
    (file: File, dataUrl: string) => {
      setPhoto(file, dataUrl);
    },
    [setPhoto],
  );

  const revokeConsent = React.useCallback(() => {
    clearPhoto();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("tiam-consent");
      notifyConsentChanged();
    }
  }, [clearPhoto]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-10">
      {!consented ? (
        <LandingCta />
      ) : (
        <PhotoUploader onSelect={handleSelect} />
      )}
      {consented && (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 transition-colors hover:underline"
          onClick={revokeConsent}
        >
          同意をやり直して最初から
        </button>
      )}
    </div>
  );
}
