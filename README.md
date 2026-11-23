# Web.Works

Source and published build of **web.works**: free registry and DNS tools, a no-login domain Desk, a daily domain & web brief that rebuilds itself, and lead, sponsorship, support, contest and hiring funnels. Static HTML, CSS and plain JavaScript, hosted free on GitHub Pages from the `main` branch.

## How it stays fresh

`.github/workflows/refresh.yml` runs every 6 hours (and on every push that changes `scripts/`, `src/` or `data/sources.json`):

1. `scripts/update.py` pulls headlines (RSS/JSON), new YouTube uploads, the IANA root zone list and the IANA RDAP bootstrap file into `data/`. A failing source is skipped and logged in `data/status.json`; old items are kept so pages never go empty.
2. `scripts/build.py` rebuilds every page: home, news wire, videos, a new dated daily brief (`/brief/YYYY-MM-DD/`), guides, glossary, sitemap, RSS feed.
3. The workflow commits the result; GitHub Pages republishes.

Run it manually any time from **Actions → Refresh site content → Run workflow**.

## Layout

| Path | What |
|---|---|
| `src/pages/*.html` | Page bodies with a JSON meta header |
| `src/guides/*.md` | Long-form guides |
| `src/content.json` | Tools list, glossary, daily tips, contest themes, name parts |
| `data/sources.json` | News feeds and YouTube channels (edit to add/remove) |
| `assets/` | CSS, JS (tools run in the browser), images |
| `assets/js/config.js` | Encoded form inbox, optional payment links, contest prize text |
| `scripts/` | `update.py`, `build.py`, `encode_inbox.py` |
| `docs/RESEARCH.md` | Audit of the old site and the 45-site benchmark study |

Local build: `pip install feedparser markdown && python scripts/update.py && python scripts/build.py`, then serve the folder with any static server.

## One-time setup

1. **GitHub Pages:** Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
2. **Custom domain:** Settings → Pages → Custom domain → `web.works`, then at the DNS host point the apex to GitHub Pages (A records 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and `www` as a CNAME to `webworksa1.github.io`. Tick *Enforce HTTPS* once the certificate is issued.
3. **Forms:** all forms post through FormSubmit to the inbox encoded in `assets/js/config.js`. The first submission triggers a one-time activation email from FormSubmit; click *Activate* and every later submission is delivered. To change the inbox: `python scripts/encode_inbox.py "new-address"` and paste the output into `config.js`.
4. **AdSense:** the Auto ads script is in the `<head>` of every page and `ads.txt` is at the root. Add the site in AdSense, and turn on the Google-certified consent message under *Privacy & messaging* for EEA/UK/Swiss visitors.
5. **Payments (optional):** paste PayPal, Stripe, Ko-fi or Buy Me a Coffee links into `config.js` → `payments` to show pay buttons on `/support/`. Until then, pledges arrive by form and you reply with a payment link.

## Trademark and copyright

“Web.Works” is used only as the name of this website and its domain, always written with the dot. The site is not affiliated with any company, product or trademark named “WebWorks” or “Web Works”. Original content and code © Web.Works. Headlines and videos belong to their publishers and creators and link to the originals. See `/disclaimer/`.
