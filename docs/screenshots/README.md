# Screenshots

## Already captured

| File | What it is |
|---|---|
| `hero.png` | Live emberbook.app landing page (captured via Playwright against the production URL) |
| `stack-foundations.png` | 3-card "Foundations" slide (Supabase + Claude + Claude for UI) — video intro asset |
| `stack-intro.png` | 10-tool stack grid — video intro asset |

## Still needed — drop PNGs here with these filenames and they'll auto-wire in the README

| Filename | Shows | Recommended dims |
|---|---|---|
| `home.png` | Home/log tab with three input cards | 1200×800 |
| `dashboard.png` | Dashboard tab with rings + weekly reflection | 1200×800 |
| `meditation.png` | Meditation setup or running state | 1200×800 |
| `community.png` | Community tab with suggested friends | 1200×800 |

## How to capture

Open **emberbook.app** in a logged-in incognito window, use Chrome's device emulator at ~1200×800, and take a screenshot (Cmd/Ctrl+Shift+P → "Capture screenshot" in DevTools for a clean, chrome-less grab). Optimize through [tinypng.com](https://tinypng.com) before committing.

### Automated capture (Playwright)

See the `capture.mjs` script in the [reach](https://github.com/jmarchese1/drip) repo for the Playwright recipe used to grab `hero.png` and the stack assets. Adapt it with auth cookies to capture in-app screens.
