import { describe, expect, it } from "vitest";

import { buildDoctorContentEtag, etagMatches } from "@/lib/doctor/etag";
import type { DoctorContent } from "@/lib/doctor/types";

const sample: DoctorContent = {
  tenantId: "default",
  parts: {
    eyes: {
      body: "x",
      tags: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "seed",
    },
    nose: {
      body: "x",
      tags: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "seed",
    },
    mouth: {
      body: "x",
      tags: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "seed",
    },
    contour: {
      body: "x",
      tags: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "seed",
    },
    symmetry: {
      body: "x",
      tags: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
      updatedBy: "seed",
    },
  },
  publishedAt: "2026-05-15T12:00:00.000Z",
};

describe("buildDoctorContentEtag", () => {
  it("同じ publishedAt なら同じ ETag", () => {
    const a = buildDoctorContentEtag(sample);
    const b = buildDoctorContentEtag({ ...sample });
    expect(a).toBe(b);
    expect(a.startsWith('W/"')).toBe(true);
  });

  it("publishedAt が変わると ETag も変わる", () => {
    const a = buildDoctorContentEtag(sample);
    const b = buildDoctorContentEtag({
      ...sample,
      publishedAt: "2026-05-16T00:00:00.000Z",
    });
    expect(a).not.toBe(b);
  });
});

describe("etagMatches", () => {
  it("If-None-Match が一致すれば true", () => {
    const etag = buildDoctorContentEtag(sample);
    expect(etagMatches(etag, etag)).toBe(true);
  });

  it("カンマ区切りの複数値に対応する", () => {
    const etag = buildDoctorContentEtag(sample);
    expect(etagMatches(`"other", ${etag}`, etag)).toBe(true);
  });
});
