# Maksim Alekseev — portfolio

Motion designer and 3D/VFX artist. Static one-page site: Home → Works → single case, hash routing (`#/`, `#/works`, `#/work/<id>`).

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

| Path | What |
|---|---|
| `index.html` | The whole site: styles, content data (`WORKS`, `SVC`, `EXP`, `FAQ`, `CONTACTS`) and scripts |
| `assets/w*.webm` | Full-quality case videos (VP9 + Opus, ≤14 MB each), loaded on Play |
| `assets/v*.mp4` | Small H.264 fallback for browsers without WebM |
| `assets/h*.webp` | Full-quality case posters |
| `assets/p*.webm / .mp4` | 5 s silent preview loops for hover and autoplay |
| `assets/c*.webp` | Covers · `assets/f*-1…4.webp` — full-quality frames for the case page and lightbox |
| `assets/reel.*` | Showreel 2026, 1080p, cut from the original renders |
| `worker.js`, `wrangler.jsonc` | Cloudflare Worker that adds HTTP Range support to videos (needed for seeking) |
| `og.png`, `favicon.ico`, `icon-*.png`, `apple-touch-icon.png`, `site.webmanifest` | Share image and MA monogram icons |

## Languages

EN (default), PL, UA, RU. The site picks the visitor's browser language on first visit, the header switch overrides it (saved in `localStorage` as `pf-lang`). Interface strings live in `D` in `index.html`; content fields in `WORKS`, `SVC`, `FAQ` etc. are `{en, pl, uk, ru}` objects.

## To update

- Content lives in the `WORKS` array in `index.html`: title, category, tools, format, texts (`ov`, `brief`, `sol`, `res`).
- Case videos are WebM masters encoded from the original renders; list previews stay small 5 s loops for speed. To regenerate a preview:
  ```bash
  ffmpeg -ss <start> -t 5 -i original.mp4 -an -c:v libx264 -crf 24 -movflags +faststart assets/pXX.mp4
  ffmpeg -ss <start> -t 5 -i original.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 36 assets/pXX.webm
  ```

## Deploy

Live on Cloudflare Workers (static assets): https://my-portfolio.maksim-alekseev-1995.workers.dev — every push to `main` redeploys via `npx wrangler deploy`. `wrangler.jsonc` runs `worker.js` first for `/assets/*` so videos answer Range requests with 206 — without it seeking breaks until the whole file has downloaded. `.assetsignore` keeps `.git` and other non-site files out of the upload (Workers reject any asset over 25 MiB, and the git pack is larger).

## Rules

- **Mobile header and iOS Safari.** On phones the fixed header must have an opaque background in the page colour and `pointer-events: auto`. Safari (iOS 26) tints the area under the status bar from the fixed element it finds at the top edge by hit-testing; with `pointer-events: none` it skips the header and the page shows through while scrolling.
