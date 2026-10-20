# bite

Real food, real people, your neighbourhood. Landing page, web app and legal pages for **bite**.

Live: https://sebaoperti-png.github.io/Bite/ · App: https://sebaoperti-png.github.io/Bite/bite.html

## Stand links (AIM and events)

| What | Link |
|---|---|
| Live kitchen: results screen for a TV/laptop | https://sebaoperti-png.github.io/Bite/stand.html?screen |
| Live kitchen in German | https://sebaoperti-png.github.io/Bite/stand.html?screen&lang=de |
| Survey on the stand tablet (resets for the next visitor) | https://sebaoperti-png.github.io/Bite/stand.html?kiosk |
| Survey from a phone (where the QR code points) | https://sebaoperti-png.github.io/Bite/stand.html?ref=aim-qr |
| Survey & newsletter privacy text | https://sebaoperti-png.github.io/Bite/legal.html#survey |

Setup guide and print files: `stand-setup/`.

## Develop

```bash
npm install
npm run dev     # local preview
npm run build   # production build in dist/
```

Every push to `main` is built and published to GitHub Pages by `.github/workflows/deploy.yml`.
See `CLAUDE.md` for a map of the code.
