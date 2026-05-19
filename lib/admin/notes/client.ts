import {
  DoctorContentErrorSchema,
  type DoctorContentError,
} from "@/lib/api/errors";
import {
  DoctorNoteSchema,
  type DoctorNote,
  type DoctorNotePublic,
  type DoctorNotePublishBody,
  type DoctorNotePutResponse,
} from "@/lib/doctor-notes/types";

export type FetchPublishedDoctorNoteResult =
  | { ok: true; notModified: true; etag?: string }
  | { ok: true; data: DoctorNotePublic; etag?: string }
  | { ok: false; error: DoctorContentError; status: number };

/**
 * 公開済み個別ノートを取得（無認証）。304 のとき `notModified: true`。
 */
export async function fetchPublishedDoctorNote(
  resultId: string,
  options?: {
    ifNoneMatch?: string | null;
    signal?: AbortSignal;
    cache?: RequestCache;
  },
): Promise<FetchPublishedDoctorNoteResult> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options?.ifNoneMatch) {
    headers["If-None-Match"] = options.ifNoneMatch;
  }
  const res = await fetch(`/api/doctor-notes/${encodeURIComponent(resultId)}`, {
    method: "GET",
    headers,
    signal: options?.signal,
    cache: options?.cache,
  });

  if (res.status === 304) {
    const etag = res.headers.get("etag") ?? undefined;
    return { ok: true, notModified: true, etag };
  }

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const parsedErr = DoctorContentErrorSchema.safeParse(json);
    return {
      ok: false,
      status: res.status,
      error: parsedErr.success
        ? parsedErr.data
        : {
            error: "fetch_failed",
            message: `HTTP ${res.status}: ノートの取得に失敗しました。`,
          },
    };
  }

  return {
    ok: true,
    data: json as DoctorNotePublic,
    etag: res.headers.get("etag") ?? undefined,
  };
}

export type PutDoctorNoteResult =
  | { ok: true; data: DoctorNotePutResponse }
  | { ok: false; error: DoctorContentError; status: number };

export async function putDoctorNote(
  idToken: string,
  resultId: string,
  body: DoctorNotePublishBody,
): Promise<PutDoctorNoteResult> {
  const res = await fetch(`/api/doctor-notes/${encodeURIComponent(resultId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const parsed = DoctorContentErrorSchema.safeParse(json);
    if (parsed.success) {
      return { ok: false, status: res.status, error: parsed.data };
    }
    return {
      ok: false,
      status: res.status,
      error: {
        error: "write_failed",
        message: `保存に失敗しました（HTTP ${res.status}）。`,
      },
    };
  }

  return { ok: true, data: json as DoctorNotePutResponse };
}

export type FetchDoctorNoteForEditResult =
  | { ok: true; data: DoctorNote }
  | { ok: true; data: null; status: 404 }
  | { ok: false; error: DoctorContentError; status: number };

/** 編集画面用: 下書き・公開問わずフルノート（internalMemo 含む） */
export async function fetchDoctorNoteForEdit(
  idToken: string,
  resultId: string,
): Promise<FetchDoctorNoteForEditResult> {
  const res = await fetch(`/api/doctor-notes/${encodeURIComponent(resultId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (res.status === 404) {
    return { ok: true, data: null, status: 404 };
  }

  if (!res.ok) {
    const parsed = DoctorContentErrorSchema.safeParse(json);
    return {
      ok: false,
      status: res.status,
      error: parsed.success
        ? parsed.data
        : {
            error: "fetch_failed",
            message: `HTTP ${res.status}: ノートの取得に失敗しました。`,
          },
    };
  }

  const parsed = DoctorNoteSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      status: res.status,
      error: {
        error: "fetch_failed",
        message: "ノートの形式が想定と異なります。",
      },
    };
  }

  return { ok: true, data: parsed.data };
}

export type PatchPatientLabelResult =
  | { ok: true }
  | { ok: false; error: DoctorContentError; status: number };

export async function patchDiagnosisPatientLabel(
  idToken: string,
  resultId: string,
  patientLabel: string,
): Promise<PatchPatientLabelResult> {
  const res = await fetch(`/api/diagnoses/${encodeURIComponent(resultId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ patientLabel }),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const parsed = DoctorContentErrorSchema.safeParse(json);
    return {
      ok: false,
      status: res.status,
      error: parsed.success
        ? parsed.data
        : {
            error: "write_failed",
            message: `保存に失敗しました（HTTP ${res.status}）。`,
          },
    };
  }

  return { ok: true };
}
