// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PrintButton } from "@/components/result/PrintButton";

describe("PrintButton", () => {
  it("クリックで window.print を呼ぶ", () => {
    const printMock = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<PrintButton />);
    fireEvent.click(screen.getByRole("button", { name: "診断レポートを印刷する" }));

    expect(printMock).toHaveBeenCalledTimes(1);
    printMock.mockRestore();
  });
});
