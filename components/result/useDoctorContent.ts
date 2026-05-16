"use client";

import * as React from "react";

import { fetchDoctorContent } from "@/lib/doctor/client";
import type { DoctorContent } from "@/lib/doctor/types";

export function useDoctorContent() {
  const [content, setContent] = React.useState<DoctorContent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();

    void (async () => {
      try {
        const result = await fetchDoctorContent(ac.signal);
        if (ac.signal.aborted) return;
        if (result.ok) {
          setContent(result.data);
          setError(null);
        } else if (result.status !== 304) {
          setContent(null);
          setError(result.error.message);
        }
        setLoading(false);
      } catch (e) {
        if (ac.signal.aborted || (e instanceof DOMException && e.name === "AbortError")) {
          return;
        }
        setContent(null);
        setError(
          e instanceof Error ? e.message : "院方コンテンツの取得に失敗しました。",
        );
        setLoading(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, []);

  return { content, loading, error };
}
