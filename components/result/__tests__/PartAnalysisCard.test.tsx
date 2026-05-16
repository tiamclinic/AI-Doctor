// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DoctorPartBlock } from "@/components/result/DoctorPartBlock";
import { PartAnalysisCard } from "@/components/result/PartAnalysisCard";

describe("PartAnalysisCard", () => {
  it("医師ブロックなしのとき AI セクションのみ", () => {
    render(
      <PartAnalysisCard
        partId="eyes"
        title="目"
        score={88}
        aiSummary="AI コメント"
      />,
    );
    expect(screen.getByLabelText("AI 由来コメント")).toBeTruthy();
    expect(screen.queryByLabelText("当院医師より")).toBeNull();
  });

  it("医師ブロックありのとき aria-label が付く", () => {
    render(
      <PartAnalysisCard
        partId="eyes"
        title="目"
        score={88}
        aiSummary="AI コメント"
        doctorBlock={
          <DoctorPartBlock
            part={{ body: "医師所見", recommendedCare: [] }}
            updatedBy="院長"
            publishedAt="2026-05-16T05:00:00.000Z"
          />
        }
      />,
    );
    expect(screen.getByLabelText("当院医師より")).toBeTruthy();
    expect(screen.getByText("医師所見")).toBeTruthy();
  });
});
