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
- `src/landing/sections/*.tsx`: one file per landing section (Nav, Hero, Savings, Laptop, Services, SousChef, BecomeAHost, Safety, Footer…).
  Styles are inline `style={{…}}` objects; responsive rules for mobile are in `src/landing/landing.css`
  (classes `r-grid-3`, `r-h-62`, `r-pad-96`, … collapse grids and shrink headings under 820px).
- `src/app/App.tsx`: screens and navigation (browser back button works; the app opens straight on Home).
- `src/app/data.ts`: demo meals (`MEALS`, dates always relative to today), search filters and `euro()` (€4 in English, 4 € in German).
- `src/app/store.tsx`: demo data layer saved in localStorage (account, bookings, chats, saved meals, published listings, profile). Profile → Settings → "Reset demo data" restores it.
- Profile page: `src/app/components/ProfileDashboard.tsx`, set like a restaurant table ("Reserved for" place card whose plate holds a spinning disc: profile photo on one side, initial on the other (photo stored as `profile.photo`, picker + `Avatar` in `components/Avatar.tsx`, helpers in `src/app/image.ts`) + trust sticker, next meal as a reservation ticket, Bite Passport stamps, badges, "Your tab so far" receipt, account options as a menu list; styles in `src/app/styles/profile.css`). Its numbers start from a demo history and grow with bookings, published meals and guests.
- `src/app/components/*Screen.tsx`: one file per screen (Home with Messages/Profile tabs, Listings, Detail, Checkout, Chat, Auth, CookProfile, StartHostingFlow). `Sheet.tsx` = bottom sheet on phone / dialog on desktop, `DesktopTopBar.tsx` = desktop nav.
- `src/legal/sections/LegalPage.tsx`: all legal text.
- `public/`: images, icons and `bite.webmanifest` (copied as they are). Reference them with `asset("landing/photo-1.jpg")`.
- `public/app/img/`: all app photos, stored locally so the demo works offline (no external image URLs in the app).
- `public/og-image.jpg`: 1200×630 link preview used by `index.html` and `bite.html`.
- Hero cards: the 60-second survey card on top and the "Save me a seat" stay-updated card behind it (tabs swap them; `#waitlist` brings the seat card forward), both in `src/landing/sections/LandingSeatCard.tsx`; the old bottom "Follow Bite's journey" section was removed.
- `src/shared/forms.ts`: `FORMS_ENDPOINT`, the Google Apps Script URL that receives the landing "stay updated" form and the stand survey. Connected (2026-10-20) to the Google Sheet "Bite AIM" in sebaoperti@gmail.com's Drive (tabs "Survey" and "Waitlist"); the script is `stand-setup/google-apps-script.js` (`@OnlyCurrentDoc`, answers stored as text). To change the script keep the same URL: Apps Script → Deploy → Manage deployments → edit → New version. The survey's order number (№ 001…) is the visitor's place across all answers in the Sheet. Script + setup guide + printable poster in `stand-setup/`.
- Pricing: guests pay the host's contribution + a 12% bite service fee (`SERVICE_FEE` in `src/app/data.ts`), matching the pitch deck.
- Search by place + radius (like Kleinanzeigen): `src/app/geo.ts` (approximate coordinates of the demo neighbourhoods, city centres, German postcodes by their first two digits, distance), `SearchCriteria.radius` / `origin` + `matchesCriteria` / `mealDistance` in `data.ts`, the "Where?" picker in `components/LocationPicker.tsx` (city or PLZ, "Use my location", Whole city / +2…+50 km). Cards show the distance; listings can sort by "Nearest".
- App URL options: `bite.html?reset` clears all demo data, `bite.html?host` opens the hosting flow.
- "Ask Bite" assistant on the landing page: `src/landing/sections/LandingAssistant.tsx`, logic in `src/shared/assistant.ts` (rule-based, runs in the browser, no API key — swap `answer()` for a real model behind a server later).
- Hosting flow AI helpers: `src/app/descriptionWriter.ts` (description drafts) and `src/app/costing.ts` (receipt OCR with tesseract.js, grocery estimate, BlaBlaCar-style price cap). OCR downloads its German language data from a CDN the first time it runs.
- "Four ways to eat": animated SVG scenes in `src/landing/sections/ServiceScenes.tsx` (animations `.sc-*` in landing.css).
- Landing intro animation (the logo "b" gets bitten) plays once per browser session: `src/landing/sections/LandingIntro.tsx`; add `?intro` to replay it. The wordmark itself (logo "b" + "ite") is `src/landing/sections/LogoWord.tsx`, shared with the app transition and the footer.
- Languages: English + German. `src/shared/i18n.ts` (`t("English text", { vars })`, `dateLabel`, `dec`, `useLang`), German texts in `src/shared/i18n-de.ts` (landing), `i18n-de-app.ts` (app) and `i18n-de-meals.ts` (demo meals), keyed by the English text. EN/DE switch: `src/shared/LangSwitch.tsx` (landing nav, app top bar, mobile app header, app Settings). The choice is saved in localStorage (`bite_lang`) and shared by landing and app; `?lang=de` / `?lang=en` force it. In dev, `window.__i18nMissing` lists German texts still missing. The legal page and the stand survey are not part of this (the survey has its own DE/EN).
- `src/shared/fonts.css`: Inter + Instrument Serif fonts (self-hosted).

## Design tools (installed 2026-10-19)
- Skills in `.claude/skills/`: `transitions-dev` (35 ready CSS transitions), `transitions-polish` (motion tokens / timing review), `transitions-ui-generation` ("AI is generating this UI" reveal). From github.com/Jakubantalik/transitions.dev.
- `.mcp.json`: OriginKit (animated components; needs an OriginKit sign-in the first time) and 21st.dev (component library; reads the key from the `API_KEY_21ST` environment variable, free key at 21st.dev/mcp).
- npm `thinking-orbs`: the dotted orb while something "thinks": Ask Bite, the hosting flow's description writer and receipt reading, the checkout button.
- `src/lib/ui-generation.js/.css` (copied from the `transitions-ui-generation` skill, colours tuned for Bite): the hosting flow's review card draws itself like an AI is building it.
- `src/shared/Motion.tsx` + `src/shared/motion.css` (recipes from the `transitions-dev` skill): `LikeHeart` (save buttons), `SpinningText` (odometer prices: checkout total, landing savings bubbles), `SuccessCheck` ("Your table is booked!" in the checkout), `Tilt` (3D hover tilt: hero cards).
- App motion: phone screens push like a native app and desktop pages fade with a light blur (`App.tsx`), a pill slides between tabs in the bottom bar and the desktop top bar.
- Not installed, used on demand: Beautiful UI (shadcn registry `https://beautifului.dev/r/registry.json`, components for AI interfaces) and Aceternity UI (ui.aceternity.com, effects). Adapt their components to our inline-style / Tailwind setup rather than running `shadcn init`.
- "For cooks" chapter opening: animated kitchen in `src/landing/sections/CookingScene.tsx` (styles `.ck-*`).

## Restaurant design language (2026-10-19)
The whole site reads like an evening at a restaurant. Keep new work in this language:
- Kit in `src/shared/Restaurant.tsx` + `restaurant.css`: `BiteLoader` (the logo "b" on a plate, bitten bite by bite: our loading state, no spinners), `Cloche` (dome that lifts to reveal: meal photos), `Ornament`, `Course` (section label "No. 2 · Starter — why Bite"), `TableSeats` (the table from above: free/booked chairs), `EmptyPlate` (empty states). Also styles for kitchen-ticket toasts (`.tk-*`), chalkboard (`.chalk-dust`, `.chalk-text`, `.chalk-line`), request cards (`.rq-*`), the prep checklist, the "+" menu (`.pm-*`) and switches (`.sw`).
- Materials: menu card (cream paper, Instrument Serif italic) for titles and offers, waiter's order pad for forms, receipt (monospace, zigzag edge) for prices and totals, reservation ticket for dates, chalkboard for the dark sections, stamps for confirmations. Fonts: Instrument Serif italic = the menu's voice, monospace = receipts/tickets, Inter = everything else. No emoji anywhere (drawn SVG icons instead).
- Landing = a dinner in courses, each with one job and no repeats: 1 Aperitivo (hero), 2 Starter (savings: why it's cheaper), 3 Main course · how it works (`LandingLaptop.tsx`, id `how`: three steps as menu lines, then the real app in a laptop that opens on scroll, live `bite.html` in an iframe), 4 Sides (four ways: chalkboard "Today's specials" `.sd-*` + a plate on the pass whose cloche lifts to serve the animated scene from `ServiceScenes.tsx`), 5 Chef's table · for cooks (`LandingSousChef.tsx`, two sections so their animations don't start together: id `cooks` = the kitchen animation `CookingScene` beside the pitch; id `sous-chef` = "Try the sous-chef", which starts only when scrolled to: pick a dish and the guests on an order pad, it writes the description with `descriptionWriter`, reads a supermarket receipt and stamps the fair price per plate with `costing`, while a chef's hat travels along three stations; then the chalkboard close `LandingBecomeAHost.tsx`: hosting as a chalk-drawn recipe `.ht-*`, CTA as a reservation card), 6 House rules (safety: a table set from above, `LandingSafety.tsx` + `.tb-*` in landing.css — each of the four layers lays one thing on it with a handwritten label: glass + "verified" place card, plate, cutlery + napkin, placemat with a lock; at the end a cloche comes down and lifts to reveal the bitten "b", then the safety receipt prints; left: the waiter's slip `.os-*`, right: each layer as a menu page `.mc-*`), the founder's note (`LandingTestimonial.tsx`, `.fn-*`), 7 At your service (contact options as order tickets on a kitchen rail `.rl-*`, FAQ as a menu card "Questions from the table" `.fq-*`), 8 Coffee & the bill (footer ends in a receipt). The price math (groceries ÷ plates) is shown once, in the sous-chef. Nav links carry course numbers and a fork shows scroll progress. Ask Bite is the maître d' (bow tie, reasoning steps, suggestions on a menu card). Cookie banner: "Before you order…" with a bitten biscuit (Reject and Accept stay equally prominent).
- App: a "kitchen check" (BiteLoader + reasoning lines) when the listings open after a search; seats as a table from above on the meal page; host typing orb + streaming replies in chat; checkout with fee tooltip, money ring, drawn checkbox + shake; the first neighbour on a published dinner arrives as a request to accept/decline (`pending` in the store); host "Before your dinner" checklist (`PrepChecklist.tsx`); "+" menu on the phone Home (`PlusMenu.tsx`, pre-picks the event type via sessionStorage `bite_host_service`); desktop dialogs grow from the clicked point (`Sheet.tsx`); "This dish is off the menu" page.
- Phones get their own version of every desktop effect (same impact, made for touch): tilt cards play a 3D wave on view and on tap (`Tilt`), the hero light drifts by itself, the real app sits in a phone that rises with the scroll (`LandingLaptop`, usable), the Safety story is scroll-driven in a one-screen layout with the four layers as bubbles that pop when they lock (tap one to jump there), steam on meal photos rises by itself.
- Stand survey: kiosk "waiting" screen with a breathing orb after 20 s untouched (`stand.html?kiosk`); results screen numbers roll and bars grow.
- Demo data lives under localStorage `bite_demo_v4`; bump the version in `store.tsx` when seed texts change.

## Commands
- Node.js lives in `~/.local/node` (on the PATH via `~/.zprofile`). `npm install` once, then `npm run dev` to preview locally (open the printed URL; the app is at `/bite.html`).
- `npm run build` to check that everything compiles before pushing.

## Conventions
- Brand colours: deep purple `#160a2e`, purple `#6b21d9`, lilac `#9b4aff` / `#b87fff`, light lavender `#f0e9fb`. Landing page background: soft lavender `#f3eefb` (not pure white, easier on the eyes).
- Copy is written in English (UK spelling: neighbourhood); wrap every visible text in `t()` and add its German version. The demo app is set in Frankfurt neighbourhoods, but the site makes no launch-city claims: bite is collecting feedback for now.
- Links from the landing to the app must point to `bite.html` (the landing fades out on those links).
- The app is responsive: phone layout under 768px (`useIsDesktop`), a full-width web layout with a top bar above it. Test both, and keep them feature-equal: anything added to one layout gets its counterpart in the other (e.g. "Cooking this week" is `WeekMenu` on desktop and `MobileWeekMenu` on phones; the phone's "+" menu ↔ the desktop top bar's Start hosting).
- Landing copy is early-stage: no invented user numbers, launch cities, dates or reviews.
