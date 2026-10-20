/**
 * Where the website's forms send their data: the stand survey (stand.html) and the
 * early-access waitlist on the landing page.
 *
 * Paste the "Web app" URL of the Google Apps Script in stand-setup/google-apps-script.js
 * (it ends in /exec). While this is empty, answers are only kept in the browser they were given in.
 */
export const FORMS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxVRBOZK1IQSQL5nuw4ES6o95uYu8DGBz6wLeXK28XMTKVgguoinLsES7cKqRFiqdW6/exec"; // Google Sheet "Bite AIM" (sebaoperti@gmail.com)

/**
 * Sends one form entry. Returns true when the server accepted it.
 * The body goes as plain text: Google Apps Script cannot answer the CORS pre-flight a JSON content type would trigger.
 */
export async function postForm(payload: Record<string, unknown>): Promise<boolean> {
  if (!FORMS_ENDPOINT) return false;
  try {
    const res = await fetch(FORMS_ENDPOINT, { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({ ok: true }));
    return data.ok !== false;
  } catch {
    return false;
  }
}
