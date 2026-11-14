// Cover photos from Unsplash (unsplash.com/developers): the host searches for their dish and picks a photo when
// they have none of their own. Unsplash's rules, which this follows: photos are shown from Unsplash's own servers
// (hotlinked), the photographer is credited with links to their profile and to Unsplash, and picking a photo is
// reported to Unsplash's download endpoint. The Access Key is public by design (it identifies the app, it is not a
// secret); the Secret Key is never used.
import { getLang } from "../shared/i18n";

export const UNSPLASH_KEY = "";

export interface PhotoCredit { name: string; username: string; link: string }
export interface StockPhoto { id: string; thumb: string; url: string; alt: string; credit: PhotoCredit; download: string }

const UTM = "utm_source=bite&utm_medium=referral";
export const unsplashReady = () => UNSPLASH_KEY.length > 10;
export const isUnsplash = (url: string) => /^https:\/\/images\.unsplash\.com\//.test(url);
export const creditLink = (c: PhotoCredit) => `${c.link}?${UTM}`;
export const UNSPLASH_LINK = `https://unsplash.com/?${UTM}`;

/** food photos for a dish name ("Lasagne", "Käsespätzle"…), landscape, safe content */
export async function searchPhotos(query: string, signal?: AbortSignal): Promise<StockPhoto[]> {
  if (!unsplashReady() || !query.trim()) return [];
  const q = encodeURIComponent(`${query.trim().slice(0, 60)} food`);
  const res = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=12&orientation=landscape&content_filter=high&lang=${getLang()}`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}`, "Accept-Version": "v1" },
    signal,
  });
  if (!res.ok) throw new Error(`unsplash ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data?.results) ? data.results : []).map((p: any): StockPhoto => ({
    id: p.id,
    thumb: `${p.urls.raw}&w=320&h=220&fit=crop&auto=format&q=70`,
    url: `${p.urls.raw}&w=1200&h=800&fit=crop&auto=format&q=80`,
    alt: String(p.alt_description || p.description || query).slice(0, 120),
    credit: { name: String(p.user?.name || p.user?.username || "Unsplash").slice(0, 60), username: String(p.user?.username || "").slice(0, 40), link: String(p.user?.links?.html || "https://unsplash.com").slice(0, 200) },
    download: p.links?.download_location || "",
  }));
}

/** Unsplash asks apps to report when a photo is actually used */
export function reportUse(p: StockPhoto) {
  if (!unsplashReady() || !p.download) return;
  fetch(`${p.download}${p.download.includes("?") ? "&" : "?"}client_id=${UNSPLASH_KEY}`).catch(() => {});
}
