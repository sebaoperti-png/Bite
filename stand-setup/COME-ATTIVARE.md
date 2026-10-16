# Bite at AIM: how to set up the stand

## What's in this folder
- `bite-poster-A1.pdf`: **A1 (59×84 cm)** brand poster to hang behind the stand: “BlaBlaCar shares a ride. Bite shares a table.” Its small QR code opens the website (not the survey).
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
Without this step, answers stay only on the device where they were given (you can still export them as CSV).

1. Go to sheets.google.com and create a new sheet called **"Bite AIM"**.
2. Menu **Extensions → Apps Script**.
3. Delete everything there, paste the contents of `google-apps-script.js`, and save (💾).
4. Click **Deploy → New deployment**:
   - type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** and authorise. Google will show a "not verified" warning: click *Advanced → Go to …*. It's your own script.
6. Copy the URL ending in **/exec**.
7. Paste it into `src/shared/forms.ts` → `export const FORMS_ENDPOINT = "…/exec";` (or send it to me and I'll do it).

The "Survey" tab will receive the survey answers; the "Waitlist" tab will receive the landing page "Keep me updated" sign-ups.

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
- Email is **optional** and only saved if the person ticks "Keep me updated on Bite's news".
- The results screen **never** shows emails.
- When you start sending newsletters, use a tool with **double opt-in** (e.g. Brevo or Mailchimp): in Germany it's standard practice for marketing emails.
- Check that the privacy policy (`legal.html#privacy`) mentions the newsletter and the survey.

## 5. After the fair
Send me the link to the Sheet (or the CSV) and I'll produce the statistics for the deck: how many people, what % would join a dinner, the average price they'd pay, the most-wanted cuisines.
