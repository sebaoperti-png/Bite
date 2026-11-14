// Cover photos from Unsplash (unsplash.com/developers): the host searches for their dish and picks a photo when
// they have none of their own. The search goes through Bite's Edge Function "bite-ai" (tasks "photos" and
// "photo_used"), so Unsplash's Access Key stays on the server, as Unsplash asks. Unsplash's rules, which this
// follows: photos are shown from Unsplash's own servers (hotlinked), the photographer is credited with links to
// their profile and to Unsplash, and picking a photo is reported to Unsplash's download endpoint.
// Live only (it needs an account); the demo keeps its sample photos.
import { getLang } from "../shared/i18n";
import { IS_LIVE, supabase } from "../shared/supabase";

export interface PhotoCredit { name: string; username: string; link: string }
export interface StockPhoto { id: string; thumb: string; url: string; alt: string; credit: PhotoCredit; download: string }

const UTM = "utm_source=bite&utm_medium=referral";
export const unsplashReady = () => IS_LIVE;
export const isUnsplash = (url: string) => /^https:\/\/images\.unsplash\.com\//.test(url);
export const creditLink = (c: PhotoCredit) => `${c.link}?${UTM}`;
export const UNSPLASH_LINK = `https://unsplash.com/?${UTM}`;

/** food photos for a dish name ("Lasagne", "Käsespätzle"…), landscape, safe content */
export async function searchPhotos(query: string, signal?: AbortSignal): Promise<StockPhoto[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase.functions.invoke("bite-ai", { body: { task: "photos", query: query.trim().slice(0, 60), lang: getLang() } });
  if (signal?.aborted) throw new DOMException("aborted", "AbortError");
  if (error || !Array.isArray(data?.photos)) throw new Error("photos unavailable");
  return data.photos.map((p: { id: string; raw: string; alt: string; credit: PhotoCredit; download: string }): StockPhoto => ({
    id: p.id,
    thumb: `${p.raw}&w=320&h=220&fit=crop&auto=format&q=70`,
    url: `${p.raw}&w=1200&h=800&fit=crop&auto=format&q=80`,
    alt: p.alt,
    credit: p.credit,
    download: p.download,
  }));
}

/** tells Unsplash the photo is used (through the Edge Function, never with the key in the browser) */
export function reportUse(p: StockPhoto) {
  if (!p.download) return;
  void supabase.functions.invoke("bite-ai", { body: { task: "photo_used", download: p.download } }).catch(() => {});
}
