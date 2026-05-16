"use client";

import * as React from "react";

import { useDiagnosisRecord } from "@/hooks/useDiagnosisRecord";
import { buildDiagnosisRecord } from "@/lib/diagnoses/buildRecord";
import type { DiagnosisRecord } from "@/lib/diagnoses/types";
import { useDiagnosisStore } from "@/lib/store/diagnosis-store";

export type DiagnosisRecordForAdminState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      data: DiagnosisRecord;
      /** Firestore 未保存時、同一タブの診断セッションから復元 */
      fromSession: boolean;
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

/**
 * 管理画面編集用。API 未保存・404 のとき、同一タブの Zustand から診断を復元する。
 */
export function useDiagnosisRecordForAdmin(resultId: string | null) {
  const api = useDiagnosisRecord(resultId);
  const storeResultId = useDiagnosisStore((s) => s.resultId);
  const scoreResult = useDiagnosisStore((s) => s.scoreResult);
  const diagnosisText = useDiagnosisStore((s) => s.diagnosisText);

  const sessionRecord = React.useMemo((): DiagnosisRecord | null => {
    if (!resultId || resultId !== storeResultId || !scoreResult || !diagnosisText) {
      return null;
    }
    return buildDiagnosisRecord({
      resultId,
      scoreResult,
      diagnosisText,
    });
  }, [resultId, storeResultId, scoreResult, diagnosisText]);

  const state = React.useMemo((): DiagnosisRecordForAdminState => {
    if (api.status === "success") {
      return { status: "success", data: api.data, fromSession: false };
    }
    if (sessionRecord) {
      if (
        api.status === "not_found" ||
        api.status === "error" ||
        api.status === "loading" ||
        api.status === "idle"
      ) {
        return { status: "success", data: sessionRecord, fromSession: true };
      }
    }
    if (api.status === "loading" || api.status === "idle") {
      return api.status === "idle" ? { status: "idle" } : { status: "loading" };
    }
    return api;
  }, [api, sessionRecord]);

  return React.useMemo(
    () => ({ ...state, refresh: api.refresh }),
    [state, api.refresh],
  );
}
