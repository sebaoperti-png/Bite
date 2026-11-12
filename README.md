# bite

Real food, real people, your neighbourhood. Landing page, web app and legal pages for **bite**.

Live: https://bitetable.de/ · App: https://bitetable.de/bite.html

## Stand links (AIM and events)

| What | Link |
|---|---|
| Live kitchen: results screen for a TV/laptop | https://bitetable.de/stand.html?screen |
| Live kitchen in German | https://bitetable.de/stand.html?screen&lang=de |
| Survey on the stand tablet (resets for the next visitor) | https://bitetable.de/stand.html?kiosk |
| Survey from a phone (where the QR code points) | https://bitetable.de/stand.html?ref=aim-qr |
| Survey & newsletter privacy text | https://bitetable.de/legal.html#survey |

Setup guide and print files: `stand-setup/`.

## Develop

```bash
npm install
npm run dev     # local preview
npm run build   # production build in dist/
```

Every push to `main` is built and published to GitHub Pages by `.github/workflows/deploy.yml`.
See `CLAUDE.md` for a map of the code.
