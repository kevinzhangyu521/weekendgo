"use client";

import { useCurrentUser } from "@/lib/auth/use-current-user";

type Props = {
  text: string;
};

export function AuthActionHint({ text }: Props) {
  const currentUser = useCurrentUser();
  if (currentUser.isLoading || currentUser.isAuthenticated) return null;

  return <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{text}</div>;
}
