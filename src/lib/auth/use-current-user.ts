"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CurrentUserState = {
  hasUser: boolean;
  email: string | null;
  isLoading: boolean;
};

export function useCurrentUser() {
  const [state, setState] = useState<CurrentUserState>({
    hasUser: false,
    email: null,
    isLoading: true
  });

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function loadCurrentUser() {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!mounted) return;

      setState({
        hasUser: Boolean(session?.user),
        email: session?.user?.email ?? null,
        isLoading: false
      });
    }

    void loadCurrentUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({
        hasUser: Boolean(session?.user),
        email: session?.user?.email ?? null,
        isLoading: false
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      isAuthenticated: state.hasUser
    }),
    [state]
  );
}
