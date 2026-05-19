"use client";

import * as React from "react";

import { fetchDiagnosesList } from "@/lib/admin/diagnoses/client";
import { getAdminIdToken } from "@/lib/admin/firebaseClient";
import type { DiagnosisListItem } from "@/lib/diagnoses/types";

export type DiagnosesListState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      items: DiagnosisListItem[];
      nextCursor: string | null;
      hasMore: boolean;
    }
  | { status: "error"; message: string };

const INITIAL_LIMIT = 30;
const LOAD_MORE_LIMIT = 50;

export function useDiagnosesList() {
  const [state, setState] = React.useState<DiagnosesListState>({
    status: "idle",
  });
  const [loadingMore, setLoadingMore] = React.useState(false);

  const load = React.useCallback(async (append: boolean, cursor?: string | null) => {
    setState((prev) => {
      if (append && prev.status === "ready") return prev;
      if (!append && prev.status === "ready") return prev;
      return { status: "loading" };
    });

    const token = await getAdminIdToken();
    if (!token) {
      setState({
        status: "error",
        message: "ログインセッションがありません。再ログインしてください。",
      });
      return;
    }

    const result = await fetchDiagnosesList(token, {
      limit: append ? LOAD_MORE_LIMIT : INITIAL_LIMIT,
      cursor: append ? cursor : undefined,
    });

    if (!result.ok) {
      setState({
        status: "error",
        message: result.error.message,
      });
      return;
    }

    setState((prev) => {
      const merged =
        append && prev.status === "ready"
          ? [...prev.items, ...result.data.items]
          : result.data.items;
      return {
        status: "ready",
        items: merged,
        nextCursor: result.data.nextCursor,
        hasMore: result.data.nextCursor !== null,
      };
    });
  }, []);

  const refresh = React.useCallback(() => {
    void load(false);
  }, [load]);

  const loadMore = React.useCallback(async () => {
    if (state.status !== "ready" || !state.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await load(true, state.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [state, loadingMore, load]);

  const isInitialLoading = state.status === "loading" || state.status === "idle";

  React.useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void load(false);
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [load]);

  return { state, refresh, loadMore, loadingMore, isInitialLoading };
}
