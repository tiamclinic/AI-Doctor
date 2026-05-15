"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import {
  getClientAuth,
  isFirebaseAuthConfigured,
  subscribeAuth,
  userHasAdminClaim,
} from "@/lib/admin/firebaseClient";

type AdminGuardProps = {
  children: React.ReactNode;
};

type GuardState = "loading" | "authorized" | "unauthorized";

function resolveInitialState(): GuardState {
  return isFirebaseAuthConfigured() ? "loading" : "unauthorized";
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [state, setState] = React.useState<GuardState>(resolveInitialState);

  React.useEffect(() => {
    if (!isFirebaseAuthConfigured()) {
      router.replace("/admin/login");
      return;
    }

    const auth = getClientAuth();
    let cancelled = false;

    const check = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (!cancelled) {
          setState("unauthorized");
          router.replace("/admin/login");
        }
        return;
      }
      const isAdmin = await userHasAdminClaim(user);
      if (cancelled) return;
      if (isAdmin) {
        setState("authorized");
      } else {
        setState("unauthorized");
        router.replace("/admin/login?error=not_admin");
      }
    };

    const unsub = subscribeAuth(() => {
      void check();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [router]);

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
