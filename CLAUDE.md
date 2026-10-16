# bite website and app

This repo contains the whole bite website: the landing page, the web app and the legal page.
It is built with Vite + React + TypeScript and published on GitHub Pages
(https://sebaoperti-png.github.io/Bite/) automatically on every push to `main`.

## Pages
| URL | Entry HTML | Code |
| --- | --- | --- |
| `/` landing page | `index.html` | `src/landing/` |
| `/bite.html` the app (full screen, installable) | `bite.html` | `src/app/` |
| `/legal.html` terms, privacy, cookies, impressum… | `legal.html` | `src/legal/` |
| `/stand.html` 60-second survey, styled as a waiter's order pad ending in a receipt (`?kiosk` tablet mode, `?screen` live results, `?ref=landing` hides the stand-only sweet) | `stand.html` | `src/stand/` |

## Where things are
- `src/landing/Landing.tsx`: order of the landing sections, cookie banner logic, fade into the app.
- `src/landing/sections/*.tsx`: one file per landing section (Nav, Hero, HowItWorks, Services, Safety, Footer…).
  Styles are inline `style={{…}}` objects; responsive rules for mobile are in `src/landing/landing.css`
  (classes `r-grid-3`, `r-h-62`, `r-pad-96`, … collapse grids and shrink headings under 820px).
- `src/app/App.tsx`: screens and navigation (browser back button works; the app opens straight on Home).
- `src/app/data.ts`: demo meals (`MEALS`, dates always relative to today) and search filters.
- `src/app/store.tsx`: demo data layer saved in localStorage (account, bookings, chats, saved meals, published listings, profile). Profile → Settings → "Reset demo data" restores it.
- Profile page: `src/app/components/ProfileDashboard.tsx`, set like a restaurant table ("Reserved for" place card with plate avatar + trust sticker, next meal as a reservation ticket, Bite Passport stamps, badges, "Your tab so far" receipt, account options as a menu list; styles in `src/app/styles/profile.css`). Its numbers start from a demo history and grow with bookings, published meals and guests.
- `src/app/components/*Screen.tsx`: one file per screen (Home with Messages/Profile tabs, Listings, Detail, Checkout, Chat, Auth, CookProfile, StartHostingFlow). `Sheet.tsx` = bottom sheet on phone / dialog on desktop, `DesktopTopBar.tsx` = desktop nav.
- `src/legal/sections/LegalPage.tsx`: all legal text.
- `public/`: images, icons and `bite.webmanifest` (copied as they are). Reference them with `asset("landing/photo-1.jpg")`.
- `public/app/img/`: all app photos, stored locally so the demo works offline (no external image URLs in the app).
- `public/og-image.jpg`: 1200×630 link preview used by `index.html` and `bite.html`.
- Hero cards: the 60-second survey card on top and the "Save me a seat" stay-updated card behind it (tabs swap them; `#waitlist` brings the seat card forward), both in `src/landing/sections/LandingSeatCard.tsx`; the old bottom "Follow Bite's journey" section was removed.
- `src/shared/forms.ts`: `FORMS_ENDPOINT`, the Google Apps Script URL that receives the landing "stay updated" form and the stand survey (empty = answers only kept in the browser). Script + setup guide + printable poster in `stand-setup/`.
- Pricing: guests pay the host's contribution + a 12% bite service fee (`SERVICE_FEE` in `src/app/data.ts`), matching the pitch deck.
- App URL options: `bite.html?reset` clears all demo data, `bite.html?host` opens the hosting flow.
- "Ask Bite" assistant on the landing page: `src/landing/sections/LandingAssistant.tsx`, logic in `src/shared/assistant.ts` (rule-based, runs in the browser, no API key — swap `answer()` for a real model behind a server later).
- Hosting flow AI helpers: `src/app/descriptionWriter.ts` (description drafts) and `src/app/costing.ts` (receipt OCR with tesseract.js, grocery estimate, BlaBlaCar-style price cap). OCR downloads its German language data from a CDN the first time it runs.
- "Four ways to eat" panels: animated SVG scenes in `src/landing/sections/ServiceScenes.tsx` (animations `.sc-*` in landing.css).
- Landing intro animation (the logo "b" gets bitten) plays once per browser session: `src/landing/sections/LandingIntro.tsx`; add `?intro` to replay it. The wordmark itself (logo "b" + "ite") is `src/landing/sections/LogoWord.tsx`, shared with the app transition and the footer.
- Languages: English + German. `src/shared/i18n.ts` (`t("English text", { vars })`, `dateLabel`, `dec`, `useLang`), German texts in `src/shared/i18n-de.ts` (landing), `i18n-de-app.ts` (app) and `i18n-de-meals.ts` (demo meals), keyed by the English text. EN/DE switch: `src/shared/LangSwitch.tsx` (landing nav, app top bar, mobile app header, app Settings). The choice is saved in localStorage (`bite_lang`) and shared by landing and app; `?lang=de` / `?lang=en` force it. In dev, `window.__i18nMissing` lists German texts still missing. The legal page and the stand survey are not part of this (the survey has its own DE/EN).
- `src/shared/fonts.css`: Inter + Instrument Serif fonts (self-hosted).

## Commands
- `npm install` once, then `npm run dev` to preview locally (open the printed URL; the app is at `/bite.html`).
- `npm run build` to check that everything compiles before pushing.

## Conventions
- Brand colours: deep purple `#160a2e`, purple `#6b21d9`, lilac `#9b4aff` / `#b87fff`, light lavender `#f0e9fb`. Landing page background: soft lavender `#f3eefb` (not pure white, easier on the eyes).
- Copy is written in English (UK spelling: neighbourhood); wrap every visible text in `t()` and add its German version. The demo app is set in Frankfurt neighbourhoods, but the site makes no launch-city claims: bite is collecting feedback for now.
- Links from the landing to the app must point to `bite.html` (the landing fades out on those links).
- The app is responsive: phone layout under 768px (`useIsDesktop`), a full-width web layout with a top bar above it. Test both.
- Landing copy is early-stage: no invented user numbers, launch cities, dates or reviews.
