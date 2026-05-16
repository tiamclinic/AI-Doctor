// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DoctorEditCta } from "@/components/result/DoctorEditCta";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useStaffSession", () => ({
  useStaffSession: vi.fn(),
}));

import { useStaffSession } from "@/hooks/useStaffSession";

describe("DoctorEditCta", () => {
  it("スタッフ未ログインでは非表示", () => {
    vi.mocked(useStaffSession).mockReturnValue({
      user: null,
      isStaff: false,
      isLoading: false,
    });
    const { container } = render(
      <DoctorEditCta resultId="abc12345" hasPublishedNote={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("スタッフログイン時は追記ラベルを表示", () => {
    vi.mocked(useStaffSession).mockReturnValue({
      user: null,
      isStaff: true,
      isLoading: false,
    });
    render(<DoctorEditCta resultId="abc12345" hasPublishedNote={false} />);
    expect(screen.getByRole("button", { name: /ドクター所見を追記/ })).toBeTruthy();
  });

  it("公開済みノートがあるときは編集ラベル", () => {
    vi.mocked(useStaffSession).mockReturnValue({
      user: null,
      isStaff: true,
      isLoading: false,
    });
    render(<DoctorEditCta resultId="abc12345" hasPublishedNote />);
    expect(screen.getByRole("button", { name: /ドクター所見を編集/ })).toBeTruthy();
  });
});
