"use client";

import * as React from "react";

import { prefetchAnalytics, trackEvent } from "@/lib/analytics/track";

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

/**
 * Firebase Analytics の先読みと、未捕捉エラーの軽量ログ（Crashlytics Web 代替の足場）。
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  React.useEffect(() => {
    prefetchAnalytics();

    const onError = (e: ErrorEvent) => {
      const msg =
        e.message ||
        (e.error instanceof Error ? e.error.message : String(e.error ?? ""));
      void trackEvent("client_error", {
        message: msg.slice(0, 120),
        source: String(e.filename ?? "").slice(0, 120),
        lineno: e.lineno ?? 0,
      });
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason =
        e.reason instanceof Error ? e.reason.message : String(e.reason ?? "");
      void trackEvent("client_error", {
        message: reason.slice(0, 120),
        source: "unhandledrejection",
        lineno: 0,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return <>{children}</>;
}
