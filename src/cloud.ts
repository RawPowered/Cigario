import type { Cigar, Lot, Review, Store } from './types';

/** Same-origin browser API client. Native secure bearer storage is a separate release gate. */
export type CloudUser = { id: string; email: string };
export type CloudHealth = { service: string; ok: boolean; configured: boolean };

const ROOT = '/api/v1';
let csrfToken: string | null = null;

export async function cloudHealth(): Promise<CloudHealth | null> {
  try {
    const r = await fetch(`${ROOT}/health`, { credentials: 'include', cache: 'no-store' });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('application/json')) return null;
    const value: unknown = await r.json();
    if (!value || typeof value !== 'object') return null;
    const h = value as CloudHealth;
    return h.service === 'cigario-v1' && h.ok ? h : null;
  } catch { return null; }
}
async function csrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const r = await fetch(`${ROOT}/auth/csrf`, { credentials: 'include', cache: 'no-store' });
  if (!r.ok) throw new Error('Unable to establish a secure browser session.');
  const obj = await r.json() as { csrf?: string };
  if (typeof obj.csrf !== 'string' || !obj.csrf) throw new Error('Missing session protection token.');
  csrfToken = obj.csrf;
  return obj.csrf;
}
async function request<T>(path: string, method = 'GET', data?: object): Promise<T> {
  const headers: Record<string,string> = { Accept: 'application/json' };
  if (method !== 'GET') { headers['Content-Type'] = 'application/json'; headers['X-CSRF-Token'] = await csrf(); }
  const r = await fetch(ROOT + path, { method, headers, credentials: 'include', cache: 'no-store', body: data ? JSON.stringify(data) : undefined });
  if (!(r.headers.get('content-type') ?? '').includes('application/json')) throw new Error('Unexpected API response. Check the hosting configuration.');
  const obj = await r.json() as T & { error?: string; csrf?: string };
  if (!r.ok) throw new Error(obj.error ?? `Request failed: ${r.status}`);
  if (obj.csrf) csrfToken = obj.csrf;
  return obj;
}
export async function cloudAccount(): Promise<CloudUser | null> {
  try { return (await request<{ user: CloudUser }>('/auth/me')).user; }
  catch { return null; }
}
export async function cloudLogin(email: string, password: string): Promise<CloudUser> {
  const result = await request<{ user: CloudUser; csrf: string }>('/auth/login','POST',{email,password});
  return result.user;
}
export async function cloudRegister(email: string, password: string): Promise<CloudUser> {
  const result = await request<{ user: CloudUser; csrf: string }>('/auth/register','POST',{email,password});
  return result.user;
}
export async function cloudLogout(): Promise<void> {
  await request('/auth/logout','POST',{});
  csrfToken = null;
}
export async function cloudInventory(): Promise<Store> {
  return request<Store>('/inventory');
}
export async function cloudCatalog(): Promise<Cigar[]> {
  const result = await request<{catalog: Array<Omit<Cigar,'msrpCents'> & {msrpCents: number|null}>}>('/catalog');
  return result.catalog.map(c => ({ ...c, msrpCents: c.msrpCents ?? 0 }));
}
export async function cloudAddLot(lot: Lot, mutationId: string): Promise<void> {
  await request('/lots','POST',{ ...lot, mutationId });
}
export async function cloudConsume(lotId: string, mutationId: string): Promise<void> {
  await request('/events','POST',{lotId,mutationId,kind:'consumed',delta:-1});
}
export async function cloudAddReview(review: Review): Promise<void> {
  await request('/reviews','POST',review);
}
