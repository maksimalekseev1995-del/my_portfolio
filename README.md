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
| `assets/reel.*` | Draft showreel cut from the works |

## To update

- Content lives in the `WORKS` array in `index.html`: title, category, tools, format, texts (`ov`, `brief`, `sol`, `res`).
- Case videos are WebM masters encoded from the original renders; list previews stay small 5 s loops for speed. To regenerate a preview:
  ```bash
  ffmpeg -ss <start> -t 5 -i original.mp4 -an -c:v libx264 -crf 24 -movflags +faststart assets/pXX.mp4
  ffmpeg -ss <start> -t 5 -i original.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 36 assets/pXX.webm
  ```

## Deploy

Works on GitHub Pages as is: Settings → Pages → Deploy from branch → `main` / root.
