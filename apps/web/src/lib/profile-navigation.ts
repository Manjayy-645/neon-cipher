const storageKey = 'nc.profile-return';
const allowedOrigin = /^\/(map|market|rig|comms|duel|codemaker)(?:[/?#]|$)/;

/** Remember the real entry point without accepting external return URLs. */
export function rememberProfileOrigin(pathname: string | null): void {
  if (!pathname || !allowedOrigin.test(pathname)) return;
  try { sessionStorage.setItem(storageKey, pathname); } catch { /* Storage is optional. */ }
}

export function getProfileReturnPath(): string {
  try {
    const origin = sessionStorage.getItem(storageKey);
    if (origin && allowedOrigin.test(origin)) return origin;
  } catch { /* A direct load always has a local fallback. */ }
  return '/map';
}
