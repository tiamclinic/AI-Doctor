import type {
  DoctorContent,
  DoctorContentError,
  DoctorContentPublishBody,
  DoctorContentPublishResponse,
} from "@/lib/doctor/types";

export type PublishDoctorContentResult =
  | { ok: true; data: DoctorContentPublishResponse }
  | { ok: false; error: DoctorContentError; status: number };

export async function publishDoctorContent(
  idToken: string,
  body: DoctorContentPublishBody,
): Promise<PublishDoctorContentResult> {
  const res = await fetch("/api/doctor-content", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const parsed = json as DoctorContentError | null;
    if (parsed?.error && parsed.message) {
      return { ok: false, status: res.status, error: parsed };
    }
    return {
      ok: false,
      status: res.status,
      error: {
        error: "write_failed",
        message: `公開に失敗しました（HTTP ${res.status}）。`,
      },
    };
  }

  return {
    ok: true,
    data: json as DoctorContentPublishResponse,
  };
}

export function doctorContentToDraft(
  content: DoctorContent,
): DoctorContentPublishBody {
  return {
    preamble: content.preamble,
    disclaimer: content.disclaimer,
    parts: {
      eyes: {
        title: content.parts.eyes.title,
        body: content.parts.eyes.body,
        tags: content.parts.eyes.tags,
      },
      nose: {
        title: content.parts.nose.title,
        body: content.parts.nose.body,
        tags: content.parts.nose.tags,
      },
      mouth: {
        title: content.parts.mouth.title,
        body: content.parts.mouth.body,
        tags: content.parts.mouth.tags,
      },
      contour: {
        title: content.parts.contour.title,
        body: content.parts.contour.body,
        tags: content.parts.contour.tags,
      },
      symmetry: {
        title: content.parts.symmetry.title,
        body: content.parts.symmetry.body,
        tags: content.parts.symmetry.tags,
      },
    },
  };
}
