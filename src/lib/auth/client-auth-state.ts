export function hasLocalAuthState() {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem("qimeide_auth_email"));
}

export function getLocalAuthEmail() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("qimeide_auth_email");
}
