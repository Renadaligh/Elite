/** Thin client for the Cloudflare Pages Functions API (/api/*). `key` = admin password, only for admin calls. */
export async function api<T>(path: string, init: RequestInit & { key?: string } = {}): Promise<T> {
  const { key, headers, ...rest } = init;
  const res = await fetch(`/api${path}`, {
    ...rest,
    ...(key ? { cache: 'no-store' as const } : {}), // admin screens always read fresh data (public lists are cached for a short while)
    headers: { ...(rest.body ? { 'content-type': 'application/json' } : {}), ...(key ? { authorization: `Bearer ${key}` } : {}), ...headers },
  });
  if (!res.ok) {
    const err = new Error(String(res.status)) as Error & { detail?: string };
    try { const j = (await res.json()) as { detail?: string; error?: string };
      err.detail = j.detail ?? j.error; } catch { /* no body */ }
    throw err;
  }
  return (await res.json()) as T;
}
