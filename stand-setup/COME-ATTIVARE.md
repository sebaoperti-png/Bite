# Bite at AIM: how to set up the stand

## What's in this folder
- `bite-profile-A4-en.pdf` / `bite-profile-A4-de.pdf`: the **one-page profile** for the A4 holder on the table (who I am + what Bite is, set as a menu, with the survey QR). Sources: `profile-A4.html` / `profile-A4-de.html`.
- `bite-sign-A2-en.pdf` / `bite-sign-A2-de.pdf`: **A2 sign** for the front of the table: logo, "food is better shared", name and contact. No QR on purpose (it's read from a distance). Source: `poster-A2.html` (`?lang=de`).
- `google-apps-script.js`: the script that saves the answers into a Google Sheet.
- `img/qr-site.svg`: QR to the website, used on the A4 profile (the survey QR is `public/stand/qr-stand.svg`).

## Stand pages
| Page | What it's for |
|---|---|
| `stand.html?kiosk` | Survey on the **tablet** at the stand: it resets itself for the next visitor |
| `stand.html?screen` | **Live results** on a TV/laptop behind the stand |
| `stand.html?ref=aim-qr` | Survey from the **phone** (this is where the QR code points) |

Hidden admin panel: **tap the Bite logo 5 times quickly**. There you can see how many answers you have, send the pending ones, export a CSV, and switch kiosk mode on and off.

---

## 1. The Google Sheet (connected on 2026-10-20)
The answers go to the sheet **"Bite AIM"** in sebaoperti@gmail.com's Drive. Its Apps Script (Extensions → Apps Script) holds `google-apps-script.js`, published as a Web app (execute as Me, access Anyone); the /exec URL is in `src/shared/forms.ts` → `FORMS_ENDPOINT`.

- To change the script **without changing the URL**: paste the new code, save, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. (A *new deployment* would create a new URL.)
- `setup()` (run once from the editor) schedules the nightly cleanup and copies the print PDFs into the Drive folder *Bite Startup*.

Tabs: "Survey" (questionnaire answers), "Waitlist" (landing "Save me a seat").

### Newsletter and interviews (GDPR / UWG)
- Emails are only stored if the person ticks a consent box: **interview** (15-minute chat) and/or **newsletter**.
- Newsletter uses **double opt-in**: the script emails a confirmation link from your Gmail; only rows with `newsletterStatus = confirmed` may receive news. Every email carries an unsubscribe link.
- Unconfirmed newsletter sign-ups are removed after 30 days by `cleanup()` (runs every night).
- Interview emails: delete them once the interview is done, at the latest after 12 months.
- The full privacy text is at `legal.html#survey` (EN + DE).

## 2. Put it online (needed for the QR code)
The QR code points to `https://sebaoperti-png.github.io/Bite/stand.html`, so before the fair the site must be published (push to `main`). After publishing, scan the QR with your phone and fill in a test survey: it should appear in the Sheet.

## 3. On the day of the fair
- [ ] **Tablet** on `…/stand.html?kiosk`:
  - Add it to the home screen (it opens full screen).
  - Turn off auto-lock.
  - Lock it on the page: iPad → *Guided Access*, Android → *Screen pinning*.
- [ ] **TV/laptop** on `…/stand.html?screen`, full screen (F11 / Cmd+Ctrl+F). It refreshes by itself every 15 seconds.
- [ ] A2 sign on the front of the table, A4 profile in the holder, spare A4 profiles to hand out.
- [ ] **A bowl of sweets** 🍬 (the incentive printed on every screen).
- [ ] Power bank / charger for the tablet.
- [ ] Do one test survey from the tablet and one from your phone, check they arrive in the Sheet, then delete the test rows.
- [ ] End of the day: admin panel → **Export CSV** as a backup.

If the fair Wi-Fi drops, carry on: the tablet keeps the answers and sends them as soon as it's back online (the admin panel shows how many are pending).

## 4. Privacy (important in Germany)
- Email is **optional** and only saved together with a consent (interview and/or newsletter), with the consent text version.
- The results screen **never** shows emails.
- Newsletter: double opt-in is built in (see step 1). When the list grows, move confirmed contacts to a newsletter tool (e.g. Brevo) and keep the confirmation dates.
- After the fair, clear the tablet (admin panel) once everything is uploaded.

## 5. After the fair
Send me the link to the Sheet (or the CSV) and I'll produce the statistics for the deck: how many people, what % would join a dinner, the average price they'd pay, the biggest everyday pains, and the list of people who agreed to a follow-up interview.
