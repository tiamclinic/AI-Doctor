"use client";

import * as React from "react";

import {
  createEmptyDoctorNotePublishBody,
  doctorNoteToPublishBody,
} from "@/lib/admin/notes/emptyDraft";
import { fetchDoctorNoteForEdit } from "@/lib/admin/notes/client";
import { getAdminIdToken } from "@/lib/admin/firebaseClient";
import type { DoctorNotePublishBody } from "@/lib/doctor-notes/types";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; draft: DoctorNotePublishBody; published: boolean }
  | { status: "error"; message: string };

export function useDoctorNoteForEdit(resultId: string | null) {
  const [state, setState] = React.useState<State>({ status: "idle" });

  const reload = React.useCallback(async () => {
    if (!resultId) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    const token = await getAdminIdToken();
    if (!token) {
      setState({ status: "error", message: "ログインセッションがありません。" });
      return;
    }
    const result = await fetchDoctorNoteForEdit(token, resultId);
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        setState({
          status: "error",
          message: result.error.message,
        });
        return;
      }
      setState({ status: "error", message: result.error.message });
      return;
    }
    if (result.data === null) {
      setState({
        status: "ready",
        draft: createEmptyDoctorNotePublishBody(),
        published: false,
      });
      return;
    }
    setState({
      status: "ready",
      draft: doctorNoteToPublishBody(result.data),
      published: result.data.status === "published",
    });
  }, [resultId]);

  React.useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void reload();
    }, 0);
    return () => globalThis.clearTimeout(timer);
  }, [reload]);

  return React.useMemo(() => ({ ...state, reload }), [state, reload]);
}
