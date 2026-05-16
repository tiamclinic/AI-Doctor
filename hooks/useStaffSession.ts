"use client";

import type { User } from "firebase/auth";
import * as React from "react";

import {
  getClientAuth,
  isFirebaseAuthConfigured,
  subscribeAuth,
  userHasStaffOrAdminClaim,
} from "@/lib/admin/firebaseClient";

export type StaffSessionState = {
  user: User | null;
  isStaff: boolean;
  isLoading: boolean;
};

/**
 * Firebase Auth + custom claims（admin / staff）を購読する。
 * AdminGuard / StaffOrAdminGuard と同じ判定ロジック。
 */
export function useStaffSession(): StaffSessionState {
  const configured = isFirebaseAuthConfigured();
  const [user, setUser] = React.useState<User | null>(null);
  const [isStaff, setIsStaff] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(configured);

  React.useEffect(() => {
    if (!configured) {
      const timer = globalThis.setTimeout(() => {
        setUser(null);
        setIsStaff(false);
        setIsLoading(false);
      }, 0);
      return () => globalThis.clearTimeout(timer);
    }

    getClientAuth();
    let cancelled = false;

    const check = async (nextUser: User | null) => {
      if (!nextUser) {
        if (!cancelled) {
          setUser(null);
          setIsStaff(false);
          setIsLoading(false);
        }
        return;
      }
      const allowed = await userHasStaffOrAdminClaim(nextUser);
      if (cancelled) return;
      setUser(nextUser);
      setIsStaff(allowed);
      setIsLoading(false);
    };

    const unsub = subscribeAuth((nextUser) => {
      void check(nextUser);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [configured]);

  return { user, isStaff, isLoading };
}
