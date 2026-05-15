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
    let cancelled = false;

    void fetchDoctorContent(ac.signal).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setContent(result.data);
        setError(null);
      } else if (result.status !== 304) {
        setContent(null);
        setError(result.error.message);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  return { content, loading, error };
}
