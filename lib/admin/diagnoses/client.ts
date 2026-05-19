import {
  DiagnosesListResponseSchema,
  type DiagnosesApiError,
  type DiagnosesListResponse,
} from "@/lib/diagnoses/types";

export type FetchDiagnosesListResult =
  | { ok: true; data: DiagnosesListResponse }
  | { ok: false; status: number; error: DiagnosesApiError };

export async function fetchDiagnosesList(
  idToken: string,
  options?: { limit?: number; cursor?: string | null },
): Promise<FetchDiagnosesListResult> {
  const params = new URLSearchParams();
  if (options?.limit != null) {
    params.set("limit", String(options.limit));
  }
  if (options?.cursor) {
    params.set("cursor", options.cursor);
  }

  const qs = params.toString();
  const res = await fetch(`/api/diagnoses${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const err =
      json &&
      typeof json === "object" &&
      "error" in json &&
      "message" in json
        ? (json as DiagnosesApiError)
        : {
            error: "fetch_failed" as const,
            message: `HTTP ${res.status}: 一覧の取得に失敗しました。`,
          };
    return { ok: false, status: res.status, error: err };
  }

  const parsed = DiagnosesListResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      status: 500,
      error: {
        error: "fetch_failed",
        message: "一覧レスポンスの形式が不正です。",
      },
    };
  }

  return { ok: true, data: parsed.data };
}
