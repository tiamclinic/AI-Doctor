import {
  DoctorContentErrorSchema,
  DoctorContentSchema,
  type DoctorContent,
  type DoctorContentError,
} from "@/lib/doctor/types";

export type FetchDoctorContentResult =
  | { ok: true; data: DoctorContent }
  | { ok: false; error: DoctorContentError; status: number };

export async function fetchDoctorContent(
  signal?: AbortSignal,
): Promise<FetchDoctorContentResult> {
  const res = await fetch("/api/doctor-content", {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (res.status === 304) {
    return {
      ok: false,
      status: 304,
      error: {
        error: "fetch_failed",
        message: "キャッシュが最新です（If-None-Match）。",
      },
    };
  }

  if (!res.ok) {
    const parsedErr = DoctorContentErrorSchema.safeParse(json);
    return {
      ok: false,
      status: res.status,
      error: parsedErr.success
        ? parsedErr.data
        : {
            error: "fetch_failed",
            message: `HTTP ${res.status}: 院方コンテンツの取得に失敗しました。`,
          },
    };
  }

  const parsed = DoctorContentSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      status: res.status,
      error: {
        error: "fetch_failed",
        message: "院方コンテンツの形式が想定と異なります。",
      },
    };
  }

  return { ok: true, data: parsed.data };
}
