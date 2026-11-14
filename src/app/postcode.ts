// German postcode → the town(s) it belongs to, from OpenPLZ API (openplzapi.org, free, open data, no key).
// One postcode can cover several villages, so it returns a list. Offline (or if the service is down) it falls
// returns nothing and the host types the town (the map still uses the postcode area, see geocode.ts).

const cache = new Map<string, string[]>();

export const isPostcode = (s: string) => /^\d{5}$/.test(s.trim());

export async function townsForPostcode(code: string, signal?: AbortSignal): Promise<string[]> {
  const plz = code.trim();
  if (!isPostcode(plz)) return [];
  if (cache.has(plz)) return cache.get(plz)!;
  const ctrl = new AbortController();
  const stop = () => ctrl.abort();
  signal?.addEventListener("abort", stop);
  const timer = window.setTimeout(stop, 4000);
  try {
    const res = await fetch(`https://openplzapi.org/de/Localities?postalCode=${plz}&pageSize=20`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const towns = [...new Set((Array.isArray(data) ? data : []).map((l: { name?: string }) => String(l.name ?? "").trim()).filter(Boolean))] as string[];
    cache.set(plz, towns);
    return towns;
  } catch (e) {
    if (signal?.aborted) throw e;
    return [];
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", stop);
  }
}
