"use client";

import * as React from "react";

import { fetchPublishedDoctorNote } from "@/lib/admin/notes/client";
import type { DoctorNotePublic } from "@/lib/doctor-notes/types";

export type UseDoctorNoteState = {
  data: DoctorNotePublic | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

/**
 * 公開済み個別ノートを取得。404 は `data: null` で正常扱い。
 */
export function useDoctorNote(resultId: string | null): UseDoctorNoteState {
  const [data, setData] = React.useState<DoctorNotePublic | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(Boolean(resultId));
  const etagRef = React.useRef<string | undefined>(undefined);

  const load = React.useCallback(
    async (bypassCache: boolean) => {
      if (!resultId) {
        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchPublishedDoctorNote(resultId, {
          ifNoneMatch: bypassCache ? null : etagRef.current,
          cache: bypassCache ? "no-store" : "force-cache",
        });

        if (result.ok && "notModified" in result && result.notModified) {
          if (result.etag) etagRef.current = result.etag;
          return;
        }

        if (result.ok && "data" in result) {
          setData(result.data);
          etagRef.current = result.etag;
          setError(null);
          return;
        }

        if (!result.ok && result.status === 404) {
          setData(null);
          setError(null);
          return;
        }

        if (!result.ok) {
          setData(null);
          setError(result.error.message);
        }
      } catch (e) {
        setData(null);
        setError(
          e instanceof Error ? e.message : "医師ノートの取得に失敗しました。",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [resultId],
  );

  React.useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void load(false);
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [load]);

  const refresh = React.useCallback(() => load(true), [load]);

  return { data, error, isLoading, refresh };
}
