"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import {
  getClientAuth,
  isFirebaseAuthConfigured,
  subscribeAuth,
  userHasStaffOrAdminClaim,
} from "@/lib/admin/firebaseClient";

type StaffOrAdminGuardProps = {
  children: React.ReactNode;
  /** 未認証時のログイン後復帰先（例: `/admin/diagnoses/xxx`） */
  loginNext?: string;
};

type GuardState = "loading" | "authorized" | "unauthorized";

function resolveInitialState(): GuardState {
  return isFirebaseAuthConfigured() ? "loading" : "unauthorized";
}

export function StaffOrAdminGuard({ children, loginNext }: StaffOrAdminGuardProps) {
  const router = useRouter();
  const [state, setState] = React.useState<GuardState>(resolveInitialState);

  React.useEffect(() => {
    if (!isFirebaseAuthConfigured()) {
      router.replace("/staff");
      return;
    }

    const auth = getClientAuth();
    let cancelled = false;

    const check = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (!cancelled) {
          setState("unauthorized");
          const next = loginNext
            ? `?next=${encodeURIComponent(loginNext)}`
            : "";
          router.replace(`/staff${next}`);
        }
        return;
      }
      const allowed = await userHasStaffOrAdminClaim(user);
      if (cancelled) return;
      if (allowed) {
        setState("authorized");
      } else {
        setState("unauthorized");
        router.replace("/staff?error=not_staff_or_admin");
      }
    };

    const unsub = subscribeAuth(() => {
      void check();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [router, loginNext]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">認証を確認しています…</p>
      </div>
    );
  }

  if (state === "unauthorized") {
    return null;
  }

  return <>{children}</>;
}
