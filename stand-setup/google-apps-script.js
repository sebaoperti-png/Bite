/** @OnlyCurrentDoc  Limits the script to this one spreadsheet. */
/**
 * Bite — receives the stand survey and the landing-page waitlist into this Google Sheet.
 *
 * Setup (5 minutes, see COME-ATTIVARE.md):
 *   Google Sheet → Extensions → Apps Script → paste this file → Deploy → New deployment →
 *   type "Web app", execute as "Me", who has access "Anyone" → copy the /exec URL into
 *   src/shared/forms.ts (FORMS_ENDPOINT).
 *
 * POST  (from the website)  → appends one row to "Survey" or "Waitlist"
 * GET   ?action=stats       → survey answers WITHOUT emails, for the live results screen
 */

const SURVEY_SHEET = "Survey";
const WAITLIST_SHEET = "Waitlist";

const SURVEY_COLUMNS = [
  "received", "id", "answeredAt", "source", "device", "lang",
  "who", "format", "alone", "join", "price", "host", "cuisines", "worries",
  "email", "updates",
];
const WAITLIST_COLUMNS = ["received", "email", "role", "area", "at", "source"];

function sheet_(name, columns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(columns);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, columns.length).setFontWeight("bold");
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === "waitlist") {
      const sh = sheet_(WAITLIST_SHEET, WAITLIST_COLUMNS);
      sh.appendRow([new Date(), data.email || "", data.role || "", data.area || "", data.at || "", data.source || "landing"]);
      return json_({ ok: true });
    }

    // Survey: skip duplicates (the stand tablet re-sends anything that failed while offline)
    const sh = sheet_(SURVEY_SHEET, SURVEY_COLUMNS);
    const last = sh.getLastRow();
    if (last > 1) {
      const ids = sh.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return r[0]; });
      if (ids.indexOf(data.id) !== -1) return json_({ ok: true, duplicate: true });
    }
    const a = data.answers || {};
    // A leading apostrophe keeps answers like "3-5" or "8-14" as text: otherwise Sheets turns them into dates
    const txt = function (v) { return v ? "'" + v : ""; };
    sh.appendRow([
      new Date(), data.id, data.at, data.source || "", data.device || "", data.lang || "",
      txt(a.who), txt(a.format), txt(a.alone), txt(a.join), txt(a.price), txt(a.host),
      (a.cuisines || []).join(", "), (a.worries || []).join(", "),
      data.email || "", data.updates ? "yes" : "",
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.action !== "stats") return json_({ ok: true, service: "Bite forms" });
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SURVEY_SHEET);
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, rows: [] });
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, SURVEY_COLUMNS.length).getValues();
  const col = function (name) { return SURVEY_COLUMNS.indexOf(name); };
  // Never expose emails: only the anonymous answers go to the results screen
  const rows = values.map(function (r) {
    return {
      at: r[col("answeredAt")], source: r[col("source")],
      who: r[col("who")], format: r[col("format")], alone: r[col("alone")], join: r[col("join")],
      price: r[col("price")], host: r[col("host")],
      cuisines: String(r[col("cuisines")] || "").split(", ").filter(String),
      worries: String(r[col("worries")] || "").split(", ").filter(String),
      contact: !!r[col("email")],
    };
  });
  return json_({ ok: true, rows: rows });
}
