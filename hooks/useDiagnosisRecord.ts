"use client";

import * as React from "react";

import type { DiagnosisRecord } from "@/lib/diagnoses/types";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: DiagnosisRecord }
  | { status: "not_found" }
  | { status: "error"; message: string };

/**
 * 結果画面のリロード復元など用。`GET /api/diagnoses/{resultId}` を取得する。
 */
export function useDiagnosisRecord(resultId: string | null) {
  const [state, setState] = React.useState<State>({ status: "idle" });

  const refresh = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!resultId) {
        setState({ status: "idle" });
        return;
      }
      setState({ status: "loading" });
      try {
        const res = await fetch(`/api/diagnoses/${encodeURIComponent(resultId)}`, {
          cache: "no-store",
          signal,
        });
        if (res.status === 404) {
          setState({ status: "not_found" });
          return;
        }
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { message?: string } | null;
          setState({
            status: "error",
            message: j?.message ?? `HTTP ${res.status}`,
          });
          return;
        }
        const data = (await res.json()) as DiagnosisRecord;
        setState({ status: "success", data });
      } catch (e) {
        if (signal?.aborted || (e instanceof DOMException && e.name === "AbortError")) {
          return;
        }
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "取得に失敗しました。",
        });
      }
    },
    [resultId],
  );

  React.useEffect(() => {
    const ac = new AbortController();
    const timer = globalThis.setTimeout(() => {
      void refresh(ac.signal);
    }, 0);
    return () => {
      globalThis.clearTimeout(timer);
      ac.abort();
    };
  }, [refresh]);

  return React.useMemo(() => ({ ...state, refresh }), [state, refresh]);
}
