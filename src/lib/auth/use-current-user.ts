"use client";

import { useEffect, useMemo, useState } from "react";

export type CurrentUserState = {
  hasUser: boolean;
  email: string | null;
  hasSupabaseAuthCookie: boolean;
  isLoading: boolean;
};

type DebugCurrentUserResponse = {
  hasUser?: boolean;
  email?: string | null;
  hasSupabaseAuthCookie?: boolean;
};

export function useCurrentUser() {
  const [state, setState] = useState<CurrentUserState>({
    hasUser: false,
    email: null,
    hasSupabaseAuthCookie: false,
    isLoading: true
  });

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/debug-current-user", {
          cache: "no-store",
          credentials: "include"
        });
        const data = (await response.json()) as DebugCurrentUserResponse;
        if (!mounted) return;

        setState({
          hasUser: Boolean(data.hasUser),
          email: data.email ?? null,
          hasSupabaseAuthCookie: Boolean(data.hasSupabaseAuthCookie),
          isLoading: false
        });
      } catch {
        if (!mounted) return;
        setState({
          hasUser: false,
          email: null,
          hasSupabaseAuthCookie: false,
          isLoading: false
        });
      }
    }

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      isAuthenticated: state.hasUser && state.hasSupabaseAuthCookie
    }),
    [state]
  );
}
