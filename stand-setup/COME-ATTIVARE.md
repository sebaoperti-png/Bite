# Bite at AIM: how to set up the stand

## What's in this folder
- `bite-poster-A1.pdf`: **A1 (59×84 cm)** brand poster to hang behind the stand: “BlaBlaCar shares a ride. Bite shares a table.” Its small QR code opens the website (not the survey).
- `bite-poster-A1-name.pdf`: **A1** simple poster: logo, the site headline, your name and email.
- `bite-steckbrief-A4.pdf`: A4 sheet for the table (who you are + what Bite is + survey QR).
- `bite-flyers-A6.pdf`: 4 A6 hand-out flyers per A4 sheet (QR to the landing page).
- `bite-poster-A4.pdf`: A4 poster with QR code, for the table (print it in colour).
- `bite-qr-cards-A4.pdf`: 4 QR cards per sheet, to cut out and leave on the table.
- `google-apps-script.js`: the script that saves the answers into a Google Sheet.
- `poster-A1.html` / `poster.html` / `cards.html` + `img/`: the poster and card sources (needed only to change them).

## Stand pages
| Page | What it's for |
|---|---|
| `stand.html?kiosk` | Survey on the **tablet** at the stand: it resets itself for the next visitor |
| `stand.html?screen` | **Live results** on a TV/laptop behind the stand |
| `stand.html?ref=aim-qr` | Survey from the **phone** (this is where the QR code points) |

Hidden admin panel: **tap the Bite logo 5 times quickly**. There you can see how many answers you have, send the pending ones, export a CSV, and switch kiosk mode on and off.

---

## 1. Connect the Google Sheet (5 minutes, once)
The sheet already exists: **"Bite – Survey & Newsletter (AIM 2026)"** in the Drive folder *Bite Startup*. Its **Setup** tab repeats these steps in Italian.

1. In the sheet: **Extensions → Apps Script**.
2. Delete everything there, paste the contents of `google-apps-script.js` (raw link: https://raw.githubusercontent.com/sebaoperti-png/Bite/main/stand-setup/google-apps-script.js) and save (💾).
3. Pick the function **setup** at the top and click **Run**. Authorise (Google shows "not verified": *Advanced → Go to …*; it's your own script). It creates the nightly cleanup and saves the print PDFs into *Bite Startup*.
4. **Deploy → New deployment** → type **Web app**, execute as **Me**, access **Anyone** → Deploy.
5. Copy the URL ending in **/exec** into `src/shared/forms.ts` → `FORMS_ENDPOINT` (or send it to Claude).

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
- [ ] A1 poster hung up, A4 poster and QR cards on the table.
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
