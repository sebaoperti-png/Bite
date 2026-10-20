/**
 * Bite — receives the stand survey and the landing-page waitlist into a Google Sheet.
 *
 * Setup (see COME-ATTIVARE.md):
 *   Google Sheet → Extensions → Apps Script → paste this file → Deploy → New deployment →
 *   type "Web app", execute as "Me", who has access "Anyone" → copy the /exec URL into
 *   src/shared/forms.ts (FORMS_ENDPOINT).
 *
 * POST  (from the website)     → appends one row to "Survey" or "Waitlist"
 * GET   ?action=stats          → survey answers WITHOUT emails, for the live results screen
 * GET   ?action=confirm&t=…    → double opt-in: confirms a newsletter sign-up
 * GET   ?action=unsubscribe&t=… → removes someone from the newsletter
 *
 * Newsletter (German law: Art. 6(1)(a) + 7 GDPR, § 7(2) no. 2 UWG): nobody gets news until they
 * click the link in the confirmation email (double opt-in). The sheet keeps when they signed up,
 * when they confirmed and which consent text they saw, so the consent can be proven.
 * Unconfirmed sign-ups older than 30 days are deleted by cleanup() (run it from a daily trigger).
 */

// Leave empty when the script is opened from the Sheet (Extensions → Apps Script).
// For a standalone script, put the spreadsheet id here.
const SHEET_ID = "";

const SURVEY_SHEET = "Survey";
const WAITLIST_SHEET = "Waitlist";
const SURVEY_COLUMNS = [
  "received", "id", "answeredAt", "source", "device", "lang",
  "who", "age", "alone", "pains", "join", "host", "price", "worries",
  "email", "interview", "newsletter", "newsletterStatus", "confirmedAt", "token", "consentVersion",
];
const WAITLIST_COLUMNS = [
  "received", "email", "role", "area", "at", "source", "lang",
  "newsletterStatus", "confirmedAt", "token", "consentVersion",
];
const KEEP_UNCONFIRMED_DAYS = 30;

function book_() {
  return SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name, columns) {
  const ss = book_();
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean_ = function (v, max) { return String(v == null ? "" : v).slice(0, max || 200); };

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const email = clean_(data.email, 120).trim().toLowerCase();
    const validEmail = EMAIL_RE.test(email);
    const lang = data.lang === "de" ? "de" : "en";

    if (data.type === "waitlist") {
      if (!validEmail || !data.newsletter) return json_({ ok: false, error: "consent and a valid email are required" });
      const sh = sheet_(WAITLIST_SHEET, WAITLIST_COLUMNS);
      const token = Utilities.getUuid();
      sh.appendRow([
        new Date(), email, clean_(data.role, 20), clean_(data.area, 60), clean_(data.at, 40), clean_(data.source, 40), lang,
        "pending", "", token, clean_(data.consentVersion, 40),
      ]);
      sendConfirmation_(email, token, lang);
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
    const list = function (v) { return [].concat(v || []).map(function (x) { return clean_(x, 30); }).join(", "); };
    // A leading apostrophe keeps answers like "3-5", "8-14" or "25-34" as text: otherwise Sheets turns them into dates
    const txt = function (v) { const c = clean_(v, 30); return c ? "'" + c : ""; };
    // An email is only kept together with at least one consent
    const interview = !!data.interview && validEmail;
    const newsletter = !!data.newsletter && validEmail;
    const keepEmail = interview || newsletter;
    const token = newsletter ? Utilities.getUuid() : "";
    sh.appendRow([
      new Date(), clean_(data.id, 40), clean_(data.at, 40), clean_(data.source, 40), clean_(data.device, 10), lang,
      txt(a.who), txt(a.age), txt(a.alone), list(a.pains),
      txt(a.join), txt(a.host), txt(a.price), list(a.worries),
      keepEmail ? email : "", interview ? "yes" : "", newsletter ? "yes" : "",
      newsletter ? "pending" : "", "", token, keepEmail ? clean_(data.consentVersion, 40) : "",
    ]);
    if (newsletter) sendConfirmation_(email, token, lang);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

const COPY = {
  en: {
    subject: "Please confirm: Bite news",
    hello: "Hi!",
    body: "You asked to receive news about Bite, the home-cooked dinner project. Please confirm your email address by clicking the button below. If it wasn't you, just ignore this email and you won't hear from us again.",
    button: "Yes, send me Bite news",
    unsub: "Changed your mind? Unsubscribe here",
    sign: "Sebastiano Operti, founder of Bite",
    confirmedTitle: "You're in!",
    confirmedText: "Thanks for confirming. We'll send you Bite news now and then. Every email has a link to unsubscribe.",
    unsubTitle: "You're unsubscribed",
    unsubText: "You won't receive any more Bite news. Thanks for your interest!",
    badTitle: "Link not valid",
    badText: "This link has expired or was already used. Write to sebaoperti@gmail.com if you need help.",
  },
  de: {
    subject: "Bitte bestätigen: Bite-Neuigkeiten",
    hello: "Hallo!",
    body: "Du möchtest Neuigkeiten über Bite erhalten, das Projekt für selbst gekochte Abendessen. Bitte bestätige deine E-Mail-Adresse mit dem Button unten. Wenn du das nicht warst, ignoriere diese E-Mail einfach – dann hörst du nichts mehr von uns.",
    button: "Ja, schickt mir Bite-Neuigkeiten",
    unsub: "Doch nicht? Hier abmelden",
    sign: "Sebastiano Operti, Gründer von Bite",
    confirmedTitle: "Du bist dabei!",
    confirmedText: "Danke für die Bestätigung. Wir schicken dir ab und zu Neuigkeiten über Bite. Jede E-Mail enthält einen Abmeldelink.",
    unsubTitle: "Du bist abgemeldet",
    unsubText: "Du erhältst keine Bite-Neuigkeiten mehr. Danke für dein Interesse!",
    badTitle: "Link ungültig",
    badText: "Dieser Link ist abgelaufen oder wurde schon benutzt. Schreib an sebaoperti@gmail.com, wenn du Hilfe brauchst.",
  },
};

function sendConfirmation_(email, token, lang) {
  const c = COPY[lang] || COPY.en;
  const base = ScriptApp.getService().getUrl();
  const confirm = base + "?action=confirm&t=" + token;
  const unsub = base + "?action=unsubscribe&t=" + token;
  const html =
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#160a2e;background:#f3eefb;padding:28px;border-radius:16px">' +
    '<div style="font-size:24px;font-weight:900;letter-spacing:-1px">Bite</div>' +
    "<p>" + c.hello + "</p><p>" + c.body + "</p>" +
    '<p style="margin:24px 0"><a href="' + confirm + '" style="background:#6b21d9;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">' + c.button + "</a></p>" +
    "<p>" + c.sign + "</p>" +
    '<p style="font-size:12px;color:#7c6fa0"><a href="' + unsub + '" style="color:#7c6fa0">' + c.unsub + "</a> · " +
    '<a href="https://sebaoperti-png.github.io/Bite/legal.html#survey" style="color:#7c6fa0">Privacy</a></p></div>';
  MailApp.sendEmail({ to: email, subject: c.subject, htmlBody: html, name: "Bite" });
}

// Finds a token in either sheet and sets the newsletter status. Returns the row's language, or "" if not found.
function setStatus_(token, status) {
  if (!token) return "";
  const targets = [[SURVEY_SHEET, SURVEY_COLUMNS], [WAITLIST_SHEET, WAITLIST_COLUMNS]];
  for (let i = 0; i < targets.length; i++) {
    const sh = book_().getSheetByName(targets[i][0]);
    if (!sh || sh.getLastRow() < 2) continue;
    const cols = targets[i][1];
    const tCol = cols.indexOf("token") + 1;
    const tokens = sh.getRange(2, tCol, sh.getLastRow() - 1, 1).getValues();
    for (let r = 0; r < tokens.length; r++) {
      if (tokens[r][0] !== token) continue;
      const row = r + 2;
      const current = sh.getRange(row, cols.indexOf("newsletterStatus") + 1).getValue();
      if (status === "confirmed" && current !== "pending") return "";
      sh.getRange(row, cols.indexOf("newsletterStatus") + 1).setValue(status);
      if (status === "confirmed") sh.getRange(row, cols.indexOf("confirmedAt") + 1).setValue(new Date());
      return sh.getRange(row, cols.indexOf("lang") + 1).getValue() === "de" ? "de" : "en";
    }
  }
  return "";
}

function page_(title, text) {
  const html =
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="margin:0;font-family:Arial,sans-serif;background:#f3eefb;color:#160a2e;display:flex;min-height:100vh;align-items:center;justify-content:center">' +
    '<div style="background:#fff;padding:32px;border-radius:18px;max-width:420px;margin:16px;text-align:center">' +
    '<div style="font-size:28px;font-weight:900;letter-spacing:-1px">Bite</div>' +
    "<h1 style=\"font-family:Georgia,serif;font-weight:400;font-style:italic\">" + title + "</h1><p>" + text + "</p>" +
    '<p><a href="https://sebaoperti-png.github.io/Bite/" style="color:#6b21d9;font-weight:bold">sebaoperti-png.github.io/Bite</a></p></div></body>';
  return HtmlService.createHtmlOutput(html).setTitle("Bite").addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "confirm" || p.action === "unsubscribe") {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const lang = setStatus_(String(p.t || ""), p.action === "confirm" ? "confirmed" : "unsubscribed");
      const c = COPY[lang || "en"];
      if (!lang) return page_(c.badTitle, c.badText);
      return p.action === "confirm" ? page_(c.confirmedTitle, c.confirmedText) : page_(c.unsubTitle, c.unsubText);
    } finally {
      lock.releaseLock();
    }
  }
  if (p.action !== "stats") return json_({ ok: true, service: "Bite forms" });

  const sh = book_().getSheetByName(SURVEY_SHEET);
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, rows: [] });
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, SURVEY_COLUMNS.length).getValues();
  const col = function (name) { return SURVEY_COLUMNS.indexOf(name); };
  // Never expose emails: only the anonymous answers go to the results screen
  const rows = values.map(function (r) {
    return {
      at: r[col("answeredAt")], source: r[col("source")],
      who: r[col("who")], age: r[col("age")], alone: r[col("alone")], join: r[col("join")],
      price: r[col("price")], host: r[col("host")],
      pains: String(r[col("pains")] || "").split(", ").filter(String),
      worries: String(r[col("worries")] || "").split(", ").filter(String),
    };
  });
  return json_({ ok: true, rows: rows });
}

/** Deletes newsletter sign-ups that were never confirmed within KEEP_UNCONFIRMED_DAYS (storage limitation, Art. 5 GDPR). */
function cleanup() {
  const limit = Date.now() - KEEP_UNCONFIRMED_DAYS * 864e5;
  const targets = [[SURVEY_SHEET, SURVEY_COLUMNS], [WAITLIST_SHEET, WAITLIST_COLUMNS]];
  targets.forEach(function (tg) {
    const sh = book_().getSheetByName(tg[0]);
    if (!sh || sh.getLastRow() < 2) return;
    const cols = tg[1];
    const values = sh.getRange(2, 1, sh.getLastRow() - 1, cols.length).getValues();
    for (let r = values.length - 1; r >= 0; r--) {
      const row = values[r];
      if (row[cols.indexOf("newsletterStatus")] !== "pending" || new Date(row[0]).getTime() > limit) continue;
      if (tg[0] === WAITLIST_SHEET) { sh.deleteRow(r + 2); continue; }
      // Survey: keep the anonymous answers, drop the newsletter part (and the email if no interview consent)
      const set = function (name, v) { sh.getRange(r + 2, cols.indexOf(name) + 1).setValue(v); };
      set("newsletter", ""); set("newsletterStatus", "expired"); set("token", "");
      if (row[cols.indexOf("interview")] !== "yes") { set("email", ""); set("consentVersion", ""); }
    }
  });
}

/**
 * Run once from the Apps Script editor (select "setup" → Run) after pasting this file:
 * - asks Google for the permissions the script needs,
 * - creates the "Survey" and "Waitlist" tabs,
 * - schedules cleanup() every night,
 * - saves the AIM print files (A4 profile, A2 sign) into the "Bite Startup" Drive folder.
 */
const DRIVE_FOLDER_ID = "1ksvUHrJHJyR0dEPP1F4sh5-z2LR_uyeJ"; // "Bite Startup"
const PRINT_FILES = ["bite-profile-A4-en.pdf", "bite-profile-A4-de.pdf", "bite-sign-A2-en.pdf", "bite-sign-A2-de.pdf"];

function setup() {
  sheet_(SURVEY_SHEET, SURVEY_COLUMNS);
  sheet_(WAITLIST_SHEET, WAITLIST_COLUMNS);
  const hasCleanup = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === "cleanup"; });
  if (!hasCleanup) ScriptApp.newTrigger("cleanup").timeBased().everyDays(1).atHour(3).create();
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  PRINT_FILES.forEach(function (name) {
    const url = "https://raw.githubusercontent.com/sebaoperti-png/Bite/main/stand-setup/" + name;
    const blob = UrlFetchApp.fetch(url).getBlob().setName(name);
    const old = folder.getFilesByName(name);
    while (old.hasNext()) old.next().setTrashed(true);
    folder.createFile(blob);
  });
  Logger.log("Done: tabs ready, nightly cleanup scheduled, print files saved to Drive.");
}
