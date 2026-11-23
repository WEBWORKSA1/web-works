#!/usr/bin/env python3
"""Build Web.Works into static HTML at the repository root (GitHub Pages, main branch).

Sources:
  src/pages/*.html     page bodies, each starting with <!--meta {json} -->
  src/guides/*.md      long-form guides with a JSON header block
  src/content.json     tools, glossary, tips, contest themes, name parts
  data/*.json          refreshed by scripts/update.py

Run:  python scripts/build.py
"""
import datetime as dt
import hashlib
import html
import json
import random
import re
import shutil
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DATA = ROOT / "data"
SITE = "https://web.works"
NAME = "Web.Works"
NOW = dt.datetime.now(dt.timezone.utc)
TODAY = NOW.date()
ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>'
CONTACT_BAR = "https://web.works/contact"
GENERATED = []  # (path, priority, changefreq)

E = html.escape


def load(name, default):
    p = DATA / name
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return default


CONTENT = json.loads((SRC / "content.json").read_text(encoding="utf-8"))
NEWS = load("news.json", {"items": [], "updated": ""})
VIDEOS = load("videos.json", {"items": [], "updated": ""})
TLDS = load("tlds.json", {"items": [], "count": 0, "version": ""})
TLD_CHANGES = load("tld-changes.json", {"log": []})
STATUS = load("status.json", {})
CATS = {"domains": "Domains", "web": "Web & SEO", "security": "Security", "business": "Startups & AI"}

NAV = [("tools/", "Tools"), ("desk/", "Desk"), ("brief/", "Daily brief"), ("news/", "News"), ("videos/", "Videos"), ("learn/", "Learn"), ("services/", "Services"), ("pricing/", "Pricing")]


def asset_v():
    h = hashlib.sha1()
    for p in sorted((ROOT / "assets").rglob("*")):
        if p.is_file() and p.suffix in (".css", ".js"):
            h.update(p.read_bytes())
    return h.hexdigest()[:8]


V = asset_v()


def fmt_date(iso, long=False):
    try:
        d = dt.datetime.fromisoformat(iso)
    except Exception:  # noqa: BLE001
        return ""
    return d.strftime("%A, %B %-d, %Y" if long else "%b %-d, %Y")


# ------------------------------------------------------------------ layout
def layout(path, title, description, body, scripts=(), nav=None, jsonld=None, noindex=False,
           og_type="website", crumbs=None, head_extra=""):
    depth = len([p for p in path.strip("/").split("/") if p])
    base = "../" * depth or "./"
    canonical = SITE + "/" + path
    full_title = title if title.endswith(NAME) else f"{title} | {NAME}"
    cur = ' aria-current="page"'
    nav_html = "".join(
        f'<a href="{base}{href}"{cur if nav == href else ""}>{E(label)}</a>' for href, label in NAV
    )
    ld = [{
        "@context": "https://schema.org", "@type": "Organization", "name": NAME, "url": SITE + "/",
        "logo": SITE + "/assets/img/icon-512.png"
    }]
    if crumbs:
        items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}]
        for i, (label, href) in enumerate(crumbs, start=2):
            items.append({"@type": "ListItem", "position": i, "name": label, "item": SITE + "/" + href})
        ld.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items})
    if jsonld:
        ld.extend(jsonld if isinstance(jsonld, list) else [jsonld])
    script_tags = "".join(f'<script src="{base}assets/js/{s}?v={V}" defer></script>' for s in scripts)
    robots = '<meta name="robots" content="noindex, follow">' if noindex else '<meta name="robots" content="index, follow, max-image-preview:large">'
    updated = STATUS.get("run_at", NOW.isoformat(timespec="seconds"))
    body = body.replace("{{base}}", base)
    doc = f"""<!doctype html>
<html lang="en" data-base="{base}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(full_title)}</title>
<meta name="description" content="{E(description)}">
{robots}
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2335e8">
<link rel="icon" href="{base}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{base}assets/img/apple-touch-icon.png">
<link rel="manifest" href="{base}manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="{NAME} daily brief" href="{base}feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{base}assets/css/site.css?v={V}">
{ADSENSE}
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
{head_extra}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="wrap"><a href="{CONTACT_BAR}">Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership</a></div></div>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="{base}" aria-label="{NAME} home">web<i aria-hidden="true"></i>works</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">{nav_html}<a class="btn" href="{base}get-started/">Start a project</a></nav>
  </div>
</header>
<main id="main">
{body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="logo" href="{base}">web<i aria-hidden="true"></i>works</a>
        <p style="margin-top:.75rem">Free registry and DNS tools, a no-login domain desk, and a daily brief on the business of domains and websites. Human help when you need a name bought, protected or built on.</p>
        <a class="btn btn-sun btn-small" href="{base}get-started/">Start a project</a>
      </div>
      <div><h4>Tools</h4><ul>
        <li><a href="{base}tools/domain-lookup/">Domain lookup</a></li>
        <li><a href="{base}tools/dns-lookup/">DNS lookup</a></li>
        <li><a href="{base}tools/domain-health/">Domain health check</a></li>
        <li><a href="{base}tools/lookalike-finder/">Lookalike finder</a></li>
        <li><a href="{base}tools/name-generator/">Name generator</a></li>
        <li><a href="{base}tools/">All tools</a></li></ul></div>
      <div><h4>Read &amp; watch</h4><ul>
        <li><a href="{base}brief/">Daily brief</a></li>
        <li><a href="{base}news/">News wire</a></li>
        <li><a href="{base}videos/">Videos</a></li>
        <li><a href="{base}learn/">Guides</a></li>
        <li><a href="{base}glossary/">Glossary</a></li></ul></div>
      <div><h4>Work with us</h4><ul>
        <li><a href="{base}services/">Services</a></li>
        <li><a href="{base}advertise/">Advertise &amp; sponsor</a></li>
        <li><a href="{base}contests/">Naming contest</a></li>
        <li><a href="{base}support/">Support the project</a></li>
        <li><a href="{base}careers/">Careers &amp; talent</a></li></ul></div>
      <div><h4>Company</h4><ul>
        <li><a href="{base}about/">About</a></li>
        <li><a href="{base}contact/">Contact</a></li>
        <li><a href="{base}privacy/">Privacy policy</a></li>
        <li><a href="{base}terms/">Terms of use</a></li>
        <li><a href="{base}cookies/">Cookie policy</a></li>
        <li><a href="{base}disclaimer/">Trademark &amp; copyright</a></li></ul></div>
    </div>
    <div class="foot-legal">
      <div>© <span data-year>{TODAY.year}</span> {NAME}. Original text, tools and design © {NAME}. All rights reserved.</div>
      <div>{NAME} is an independent website and is not affiliated with, endorsed by or connected to any company, product or trademark named “WebWorks” or “Web Works”. Third-party names and marks belong to their owners. <a href="{base}disclaimer/">Full disclosure</a>.</div>
      <div>Headlines and videos link to their original publishers. Registry data: IANA and registry RDAP services. DNS: Google Public DNS and Cloudflare. Content refreshed <time datetime="{updated}">{fmt_date(updated)}</time>.</div>
    </div>
  </div>
</footer>
<script src="{base}assets/js/config.js?v={V}"></script>
<script src="{base}assets/js/site.js?v={V}"></script>
{script_tags}
</body>
</html>
"""
    out = ROOT / path / "index.html" if path else ROOT / "index.html"
    if path.endswith(".html"):
        out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding="utf-8")
    return out


def head(title, lede, crumbs=None, base="{{base}}"):
    bc = ""
    if crumbs:
        parts = [f'<a href="{base}">Home</a>'] + [f'<a href="{base}{h}">{E(l)}</a>' for l, h in crumbs[:-1]] + [E(crumbs[-1][0])]
        bc = '<nav class="breadcrumbs" aria-label="Breadcrumb">' + " / ".join(parts) + "</nav>"
    return f'<section class="page-head"><div class="wrap">{bc}<h1>{E(title)}</h1><p class="lede">{lede}</p></div></section>'


# ------------------------------------------------------------------ fragments
def news_list(items, limit=8, show_cat=False, with_summary=True):
    if not items:
        return '<div class="empty">Headlines load on the next refresh.</div>'
    out = ['<ul class="feed">']
    for it in items[:limit]:
        cat = f'{CATS.get(it["cat"], it["cat"])}: ' if show_cat else ""
        summ = f'<p>{E(it["summary"])}</p>' if with_summary and it.get("summary") else ""
        out.append(
            f'<li data-cat="{E(it["cat"])}"><a class="t" href="{E(it["link"])}" rel="noopener nofollow" target="_blank">{E(it["title"])}</a>'
            f'<div class="meta">{E(cat)}{E(it["source"])}, <time datetime="{E(it["date"])}" data-ago>{fmt_date(it["date"])}</time></div>{summ}</li>'
        )
    out.append("</ul>")
    return "".join(out)


def video_card(v):
    return (
        f'<div class="video"><button class="yt" type="button" data-id="{E(v["id"])}" aria-label="Play: {E(v["title"])}" '
        f'style="background-image:url(https://i.ytimg.com/vi/{E(v["id"])}/hqdefault.jpg)"></button>'
        f'<h3>{E(v["title"])}</h3><div class="meta">{E(v["channel"])}, <time datetime="{E(v["date"])}" data-ago>{fmt_date(v["date"])}</time></div></div>'
    )


def videos_grid(items, limit=6, cols=3):
    if not items:
        return '<div class="empty">Videos load on the next refresh.</div>'
    return f'<div class="grid grid-{cols}">' + "".join(video_card(v) for v in items[:limit]) + "</div>"


def tools_directory(limit=None):
    rows = CONTENT["tools"][:limit] if limit else CONTENT["tools"]
    return '<div class="directory">' + "".join(
        f'<a href="{{{{base}}}}tools/{t["slug"]}/"><strong>{E(t["name"])}</strong><span>{E(t["desc"])}</span><em>{E(t["tag"])}</em></a>' for t in rows
    ) + "</div>"


def contest_now(d=TODAY):
    themes = CONTENT["contest_themes"]
    t = themes[(d.year * 12 + d.month) % len(themes)]
    first = d.replace(day=1)
    nxt = (first + dt.timedelta(days=32)).replace(day=1)
    deadline = dt.datetime.combine(nxt - dt.timedelta(days=1), dt.time(23, 59), tzinfo=dt.timezone.utc)
    return {"theme": t, "month": first.strftime("%B %Y"), "deadline": deadline.isoformat(), "announce": (nxt + dt.timedelta(days=9)).strftime("%B %-d, %Y")}


def name_ideas(seed, n=8):
    rng = random.Random(seed)
    p = CONTENT["name_parts"]
    out = set()
    while len(out) < n:
        style = rng.choice(["compound", "affix", "invented"])
        if style == "compound":
            w = rng.choice(p["roots"]).capitalize() + rng.choice(p["roots"]).capitalize()
        elif style == "affix":
            w = rng.choice(p["prefixes"]).capitalize() + rng.choice(p["roots"]) if rng.random() < .5 else rng.choice(p["roots"]).capitalize() + rng.choice(p["suffixes"])
        else:
            c, v = "bcdfgklmnprstvz", "aeiou"
            w = (rng.choice(c) + rng.choice(v) + rng.choice(c) + rng.choice(v) + rng.choice("lnrsx")).capitalize()
        if 4 <= len(w) <= 12:
            out.add(w)
    return sorted(out, key=len)


# ------------------------------------------------------------------ daily brief
def brief_data(day):
    """Snapshot for one day. Created on the day's first run and refreshed during that day."""
    path = DATA / "briefs" / f"{day.isoformat()}.json"
    if day != TODAY and path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    by_cat = {}
    for c in CATS:
        items = [i for i in NEWS.get("items", []) if i["cat"] == c][:5]
        by_cat[c] = [{k: i[k] for k in ("title", "link", "source", "date")} for i in items]
    doy = day.timetuple().tm_yday
    gl = CONTENT["glossary"]
    tips = CONTENT["tips"]
    tld_items = [t for t in TLDS.get("items", []) if not t["tld"].startswith("xn--")]
    tld = tld_items[(doy * 7 + day.year) % len(tld_items)] if tld_items else None
    vids = VIDEOS.get("items", [])[:2]
    data = {
        "date": day.isoformat(),
        "updated": NOW.isoformat(timespec="seconds"),
        "headlines": by_cat,
        "term": gl[(doy + day.year) % len(gl)],
        "tip": tips[(doy + 3 * day.year) % len(tips)],
        "names": name_ideas(day.isoformat()),
        "tld": tld,
        "root": {"count": TLDS.get("count", 0), "version": TLDS.get("version", ""), "changes": (TLD_CHANGES.get("log") or [])[:1]},
        "videos": [{k: v[k] for k in ("id", "title", "channel", "date")} for v in vids],
        "contest": contest_now(day),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return data


def render_brief(b, prev_day=None, next_day=None):
    day = dt.date.fromisoformat(b["date"])
    parts = []
    nice = day.strftime("%A, %B %-d, %Y")
    parts.append(f'<section class="page-head"><div class="wrap"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="{{{{base}}}}">Home</a> / <a href="{{{{base}}}}brief/">Daily brief</a> / {E(day.isoformat())}</nav>'
                 f'<div class="brief-date">{E(day.strftime("%b %-d"))}</div><h1 style="font-size:var(--step-3);margin-top:.5rem;max-width:32ch">The domain &amp; web brief for {E(nice)}</h1>'
                 f'<p class="lede">What changed in domains, websites and online security today, plus a term, a tip and fresh name ideas. Assembled automatically from {STATUS.get("ok_sources") or "30+"} public sources; last updated <time datetime="{E(b["updated"])}">{fmt_date(b["updated"])}</time>.</p></div></section>')
    parts.append('<section class="section"><div class="wrap split"><div>')
    for c, label in CATS.items():
        items = b["headlines"].get(c) or []
        if not items:
            continue
        parts.append(f'<h2 style="font-size:var(--step-2)">{E(label)}</h2><ul class="feed" style="margin-bottom:2rem">')
        for it in items:
            parts.append(f'<li><a class="t" href="{E(it["link"])}" rel="noopener nofollow" target="_blank">{E(it["title"])}</a><div class="meta">{E(it["source"])}, {fmt_date(it["date"])}</div></li>')
        parts.append("</ul>")
    parts.append("</div><aside>")
    t = b["term"]
    parts.append(f'<div class="panel" style="margin-bottom:1rem"><h3>Term of the day: {E(t["term"])}</h3><p>{E(t["def"])}</p><a href="{{{{base}}}}glossary/#{E(slug(t["term"]))}">More terms in the glossary</a></div>')
    parts.append(f'<div class="panel" style="margin-bottom:1rem"><h3>Tip of the day</h3><p>{E(b["tip"])}</p></div>')
    chips = "".join(f'<a class="chip" href="{{{{base}}}}tools/domain-lookup/?d={E(n.lower())}.com"><span class="dot"></span>{E(n)}.com</a>' for n in b["names"])
    parts.append(f'<div class="panel" style="margin-bottom:1rem"><h3>Name ideas</h3><p class="small muted">Generated for today. Tap one to check it at the registry.</p><div class="chips">{chips}</div></div>')
    if b.get("tld"):
        x = b["tld"]
        mgr = f' run by {E(x["manager"])}' if x.get("manager") else ""
        parts.append(f'<div class="panel" style="margin-bottom:1rem"><h3>Extension of the day: .{E(x["tld"])}</h3><p>A {E(x["type"])} top-level domain{mgr}. Browse all {b["root"]["count"]:,} in the <a href="{{{{base}}}}tools/tld-explorer/?q={E(x["tld"])}">TLD explorer</a>.</p></div>')
    root = b["root"]
    ch = ""
    if root.get("changes"):
        c0 = root["changes"][0]
        ch = f' Latest change ({E(c0["date"])}): added {", ".join("." + a for a in c0["added"]) or "none"}; removed {", ".join("." + r for r in c0["removed"]) or "none"}.'
    parts.append(f'<div class="panel" style="margin-bottom:1rem"><h3>Root zone</h3><p><b class="num">{root["count"]:,}</b> top-level domains in the IANA root zone file ({E(root["version"])}).{ch}</p></div>')
    con = b["contest"]
    parts.append(f'<div class="panel panel-sun"><h3>This month’s naming contest</h3><p><b>{E(con["theme"]["title"])}</b>. {E(con["theme"]["brief"])}</p><a class="btn btn-small" href="{{{{base}}}}contests/">Enter the contest</a></div>')
    parts.append("</aside></div></section>")
    if b.get("videos"):
        parts.append('<section class="section section-mist"><div class="wrap"><div class="section-head"><h2>Watch today</h2><a href="{{base}}videos/">All videos</a></div><div class="grid grid-2">' + "".join(video_card(v) for v in b["videos"]) + "</div></div></section>")
    nav = []
    if prev_day:
        nav.append(f'<a class="btn btn-ghost btn-small" href="{{{{base}}}}brief/{prev_day}/">Previous brief: {prev_day}</a>')
    if next_day:
        nav.append(f'<a class="btn btn-ghost btn-small" href="{{{{base}}}}brief/{next_day}/">Next brief: {next_day}</a>')
    parts.append(f'<section class="section"><div class="wrap cta-band"><div><h2>Need something done about a domain?</h2><p class="muted">Buying, selling, protecting or building on a name: tell us what you need and get a plan back.</p><div class="btn-row">{"".join(nav)}</div></div><a class="btn" href="{{{{base}}}}get-started/">Start a project</a></div></section>')
    return "".join(parts)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# ------------------------------------------------------------------ pages
def read_page(p):
    raw = p.read_text(encoding="utf-8")
    m = re.match(r"\s*<!--meta\s+(\{.*?\})\s*-->\s*", raw, flags=re.S)
    if not m:
        raise SystemExit(f"missing meta block in {p}")
    return json.loads(m.group(1)), raw[m.end():]


def expand(body):
    con = contest_now()
    latest_brief = TODAY.isoformat()
    domains = [i for i in NEWS.get("items", []) if i["cat"] == "domains"]
    rep = {
        "{{news_home}}": news_list(NEWS.get("items", []), 6, show_cat=True, with_summary=False),
        "{{news_domains}}": news_list(domains, 5, with_summary=False),
        "{{videos_home}}": videos_grid(VIDEOS.get("items", []), 3),
        "{{tools_directory}}": tools_directory(),
        "{{tools_directory_short}}": tools_directory(6),
        "{{tld_count}}": f'{TLDS.get("count", 0):,}',
        "{{tool_count}}": str(len(CONTENT["tools"])),
        "{{guide_count}}": str(len(GUIDES)),
        "{{source_count}}": str(STATUS.get("ok_sources", 30)),
        "{{news_count}}": str(len(NEWS.get("items", []))),
        "{{video_count}}": str(len(VIDEOS.get("items", []))),
        "{{glossary_count}}": str(len(CONTENT["glossary"])),
        "{{updated}}": fmt_date(STATUS.get("run_at", NOW.isoformat())),
        "{{updated_iso}}": STATUS.get("run_at", NOW.isoformat()),
        "{{brief_today}}": latest_brief,
        "{{brief_today_long}}": TODAY.strftime("%A, %B %-d"),
        "{{contest_title}}": E(con["theme"]["title"]),
        "{{contest_brief}}": E(con["theme"]["brief"]),
        "{{contest_month}}": E(con["month"]),
        "{{contest_deadline}}": con["deadline"],
        "{{contest_deadline_human}}": fmt_date(con["deadline"]),
        "{{contest_announce}}": E(con["announce"]),
        "{{guides_list}}": guides_list(),
        "{{guides_short}}": guides_list(4),
        "{{year}}": str(TODAY.year),
        "{{sources_list}}": sources_list(),
        "{{names_today}}": "".join(f'<button class="chip" type="button" data-try="{E(n.lower())}.com"><span class="dot"></span>{E(n)}.com</button>' for n in name_ideas(TODAY.isoformat(), 6)),
    }
    for k, v in rep.items():
        body = body.replace(k, v)
    return body


GUIDES = []


def sources_list():
    try:
        src = json.loads((DATA / "sources.json").read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return ""
    ok = {s.get("name"): s.get("ok") for s in STATUS.get("sources", [])}
    rows = []
    seen = set()
    for s in src.get("news", []):
        if s["name"] in seen:
            continue
        seen.add(s["name"])
        host = re.sub(r"^https?://(www\.)?", "", s["url"]).split("/")[0]
        state = "" if ok.get(s["name"], True) else " (temporarily unavailable)"
        rows.append(f'<tr><td>{E(s["name"])}{state}</td><td>{E(CATS.get(s["cat"], s["cat"]))}</td><td>{E(host)}</td></tr>')
    for v in src.get("videos", []):
        rows.append(f'<tr><td>{E(v["name"])}</td><td>Video: {E(v["topic"])}</td><td>youtube.com</td></tr>')
    return '<div class="table-wrap"><table><thead><tr><th>Source</th><th>Topic</th><th>Site</th></tr></thead><tbody>' + "".join(rows) + "</tbody></table></div>"


def load_guides():
    for p in sorted((SRC / "guides").glob("*.md")):
        raw = p.read_text(encoding="utf-8")
        m = re.match(r"\s*```json\s*(\{.*?\})\s*```\s*", raw, flags=re.S)
        meta = json.loads(m.group(1))
        meta["md"] = raw[m.end():]
        meta.setdefault("slug", p.stem)
        GUIDES.append(meta)
    GUIDES.sort(key=lambda g: g.get("order", 99))


def guides_list(limit=None):
    gs = GUIDES[:limit] if limit else GUIDES
    return '<div class="directory">' + "".join(
        f'<a href="{{{{base}}}}learn/{g["slug"]}/"><strong>{E(g["title"])}</strong><span>{E(g["description"])}</span><em>{g["minutes"]} min read</em></a>' for g in gs
    ) + "</div>"


def build_guides():
    md = markdown.Markdown(extensions=["tables", "toc", "sane_lists"], extension_configs={"toc": {"permalink": False}})
    for i, g in enumerate(GUIDES):
        md.reset()
        body_html = md.convert(g["md"])
        body_html = body_html.replace("<table>", '<div class="table-wrap"><table>').replace("</table>", "</table></div>")
        toc = md.toc_tokens
        toc_html = ""
        if toc:
            toc_html = '<nav class="toc" aria-label="On this page"><strong>On this page</strong><ol>' + "".join(f'<li><a href="#{t["id"]}">{E(t["name"])}</a></li>' for t in toc) + "</ol></nav>"
        related = "".join(f'<li><a href="{{{{base}}}}tools/{s}/">{E(next((t["name"] for t in CONTENT["tools"] if t["slug"] == s), s))}</a></li>' for s in g.get("tools", []))
        others = [x for x in GUIDES if x["slug"] != g["slug"]][:4]
        nxt = "".join(f'<li><a href="{{{{base}}}}learn/{x["slug"]}/">{E(x["title"])}</a></li>' for x in others)
        path = f'learn/{g["slug"]}/'
        body = (
            head(g["title"], E(g["description"]), [("Learn", "learn/"), (g["title"], path)])
            + f'<section class="section"><div class="wrap split"><article class="prose"><p class="muted small">{g["minutes"]} min read. Updated {E(fmt_date(g["updated"] + "T00:00:00+00:00"))}.</p>{toc_html}{body_html}'
            + '<div class="panel panel-sun" style="margin-top:2.5rem"><h3>Want this handled for you?</h3><p>Tell us the domain and the outcome you want. You get a written plan and a quote, with no obligation.</p><a class="btn" href="{{base}}get-started/">Start a project</a></div></article>'
            + f'<aside class="aside-sticky"><div class="panel"><h3>Tools for this guide</h3><ul>{related}</ul></div><div class="panel" style="margin-top:1rem"><h3>Keep reading</h3><ul>{nxt}</ul></div></aside></div></section>'
        )
        ld = {"@context": "https://schema.org", "@type": "Article", "headline": g["title"], "description": g["description"],
              "datePublished": g["published"], "dateModified": g["updated"], "author": {"@type": "Organization", "name": NAME},
              "publisher": {"@type": "Organization", "name": NAME, "logo": {"@type": "ImageObject", "url": SITE + "/assets/img/icon-512.png"}},
              "mainEntityOfPage": SITE + "/" + path}
        layout(path, g["title"], g["description"], body, nav="learn/", jsonld=ld, og_type="article", crumbs=[("Learn", "learn/"), (g["title"], path)])
        GENERATED.append((path, "0.7", "monthly"))


def build_static_pages():
    for p in sorted((SRC / "pages").glob("*.html")):
        meta, body = read_page(p)
        for k in ("title", "description", "lede", "h1"):
            if k in meta:
                meta[k] = expand(meta[k]) if k == "lede" else html.unescape(expand(meta[k]))
        path = meta["path"]
        crumbs = [tuple(c) for c in meta.get("crumbs", [])] or None
        if meta.get("head", True) and meta.get("h1"):
            body = head(meta["h1"], meta.get("lede", ""), crumbs) + body
        layout(path, meta["title"], meta["description"], expand(body), scripts=meta.get("scripts", []), nav=meta.get("nav"),
               crumbs=crumbs, noindex=meta.get("noindex", False))
        if not meta.get("noindex"):
            GENERATED.append((path, meta.get("priority", "0.6"), meta.get("freq", "monthly")))


def build_news():
    items = NEWS.get("items", [])
    filt = '<div class="filters" role="toolbar" aria-label="Filter by topic"><button type="button" aria-pressed="true" data-filter="all">All</button>' + "".join(
        f'<button type="button" aria-pressed="false" data-filter="{c}">{E(l)}</button>' for c, l in CATS.items()) + "</div>"
    srch = '<label class="visually-hidden" for="news-q">Search headlines</label><input id="news-q" type="search" placeholder="Search headlines" style="max-width:24rem;margin-bottom:1rem">'
    body = (head("News wire", f"Headlines on domains, websites, search and security from {STATUS.get('ok_sources', 30)} publishers, refreshed every six hours. Each headline links to the original story.", [("News", "news/")])
            + f'<section class="section"><div class="wrap split"><div>{srch}{filt}<div id="news-list">{news_list(items, 160, show_cat=True)}</div></div>'
            + '<aside class="aside-sticky"><div class="panel"><h3>Today in one page</h3><p>The daily brief condenses this wire into the five stories per topic that matter, plus a term, a tip and name ideas.</p><a class="btn btn-small" href="{{base}}brief/">Read the daily brief</a></div>'
            + '<div class="panel" style="margin-top:1rem"><h3>Sponsor the wire</h3><p>One sponsor line at the top of this page and in every daily brief, for a month.</p><a href="{{base}}advertise/">See sponsorship options</a></div>'
            + f'<p class="small muted" style="margin-top:1rem">Last refresh: <time datetime="{E(NEWS.get("updated", ""))}">{fmt_date(NEWS.get("updated", ""))}</time>. Sources are listed on the <a href="{{{{base}}}}about/#sources">About page</a>.</p></aside></div></section>')
    layout("news/", "Domain, web and security news wire", "Fresh headlines on domain names, website building, search engines and online security, gathered from leading publishers every six hours.", body, scripts=["news.js"], nav="news/", crumbs=[("News", "news/")])
    GENERATED.append(("news/", "0.8", "hourly"))


def build_videos():
    items = VIDEOS.get("items", [])
    topics = []
    for v in items:
        if v["topic"] not in topics:
            topics.append(v["topic"])
    filt = '<div class="filters" role="toolbar" aria-label="Filter by topic"><button type="button" aria-pressed="true" data-filter="all">All</button>' + "".join(
        f'<button type="button" aria-pressed="false" data-filter="{E(slug(t))}">{E(t)}</button>' for t in topics) + "</div>"
    cards = "".join(f'<div data-cat="{E(slug(v["topic"]))}">{video_card(v)}</div>' for v in items)
    body = (head("Videos for people who build on the web", "The latest uploads from channels that teach search, web development and site building. New videos appear automatically; videos play from YouTube when you press play.", [("Videos", "videos/")])
            + f'<section class="section"><div class="wrap">{filt}<div class="grid grid-3" id="video-list">{cards or "<div class=empty>Videos load on the next refresh.</div>"}</div>'
            + '<p class="small muted" style="margin-top:2rem">Videos are embedded from YouTube with privacy-enhanced mode and belong to their creators. Want your channel considered? <a href="{{base}}contact/">Suggest it</a>.</p></div></section>')
    layout("videos/", "Videos on SEO, web development and websites", "Fresh videos on search, web development and building websites from leading YouTube channels, updated automatically.", body, scripts=["news.js"], nav="videos/", crumbs=[("Videos", "videos/")])
    GENERATED.append(("videos/", "0.7", "daily"))


def build_briefs():
    brief_data(TODAY)
    files = sorted((DATA / "briefs").glob("*.json"))[-400:]
    days = [f.stem for f in files]
    for i, d in enumerate(days):
        b = json.loads((DATA / "briefs" / f"{d}.json").read_text(encoding="utf-8"))
        path = f"brief/{d}/"
        day = dt.date.fromisoformat(d)
        title = f"Domain & web brief: {day.strftime('%B %-d, %Y')}"
        desc = f"Domain industry, website and security headlines for {day.strftime('%B %-d, %Y')}, plus the term of the day, a practical tip and fresh brandable name ideas."
        ld = {"@context": "https://schema.org", "@type": "NewsArticle", "headline": title, "datePublished": d, "dateModified": b["updated"], "author": {"@type": "Organization", "name": NAME}, "publisher": {"@type": "Organization", "name": NAME}}
        layout(path, title, desc, render_brief(b, days[i - 1] if i else None, days[i + 1] if i + 1 < len(days) else None),
               nav="brief/", jsonld=ld, og_type="article", crumbs=[("Daily brief", "brief/"), (d, path)])
        GENERATED.append((path, "0.6" if d != TODAY.isoformat() else "0.8", "daily" if d == TODAY.isoformat() else "yearly"))
    # index
    today = json.loads((DATA / "briefs" / f"{TODAY.isoformat()}.json").read_text(encoding="utf-8"))
    tops = []
    for c in CATS:
        tops.extend(today["headlines"].get(c, [])[:2])
    archive = "".join(f'<li><a href="{{{{base}}}}brief/{d}/">{E(dt.date.fromisoformat(d).strftime("%A, %B %-d, %Y"))}</a></li>' for d in reversed(days))
    body = (head("The daily brief", "One page each day on what changed in domains, websites and online security. Built automatically every morning (UTC) and refreshed through the day.", [("Daily brief", "brief/")])
            + f'<section class="section"><div class="wrap split"><div><h2>Today: {E(TODAY.strftime("%A, %B %-d"))}</h2><ul class="feed">'
            + "".join(f'<li><a class="t" href="{E(t["link"])}" target="_blank" rel="noopener nofollow">{E(t["title"])}</a><div class="meta">{E(t["source"])}</div></li>' for t in tops)
            + f'</ul><p style="margin-top:1.25rem"><a class="btn" href="{{{{base}}}}brief/{TODAY.isoformat()}/">Read today’s full brief</a></p></div>'
            + f'<aside><div class="panel"><h3>Archive</h3><ul style="max-height:28rem;overflow:auto">{archive}</ul><p class="small muted">Subscribe with any feed reader: <a href="{{{{base}}}}feed.xml">RSS feed</a>.</p></div></aside></div></section>')
    layout("brief/", "Daily domain & web brief", "A daily one-page brief on domain names, websites and online security: top headlines, a term of the day, a tip and fresh name ideas.", body, nav="brief/", crumbs=[("Daily brief", "brief/")])
    GENERATED.append(("brief/", "0.9", "daily"))
    # RSS
    rss_items = []
    for d in reversed(days[-30:]):
        b = json.loads((DATA / "briefs" / f"{d}.json").read_text(encoding="utf-8"))
        day = dt.date.fromisoformat(d)
        heads = "; ".join(h["title"] for c in CATS for h in b["headlines"].get(c, [])[:1])
        rss_items.append(f"<item><title>{E('Domain & web brief: ' + day.strftime('%B %-d, %Y'))}</title><link>{SITE}/brief/{d}/</link><guid>{SITE}/brief/{d}/</guid>"
                         f"<pubDate>{dt.datetime.combine(day, dt.time(6, 0), tzinfo=dt.timezone.utc).strftime('%a, %d %b %Y %H:%M:%S +0000')}</pubDate><description>{E(heads)}</description></item>")
    (ROOT / "feed.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>{NAME} daily brief</title><link>{SITE}/brief/</link><description>Daily domain, web and security brief.</description><language>en</language>{"".join(rss_items)}</channel></rss>\n', encoding="utf-8")


def build_glossary():
    gl = sorted(CONTENT["glossary"], key=lambda x: x["term"].lower())
    letters = sorted({g["term"][0].upper() for g in gl})
    jump = " ".join(f'<a href="#l-{l}">{l}</a>' for l in letters)
    rows, cur = [], ""
    for g in gl:
        L = g["term"][0].upper()
        if L != cur:
            rows.append(f'<h2 id="l-{L}" style="font-size:var(--step-2);margin-top:2rem">{L}</h2>')
            cur = L
        rows.append(f'<div id="{slug(g["term"])}" style="padding:.75rem 0;border-bottom:1px solid var(--line)"><h3 style="margin:0 0 .25rem">{E(g["term"])}</h3><p style="margin:0">{E(g["def"])}</p></div>')
    ld = {"@context": "https://schema.org", "@type": "DefinedTermSet", "name": "Domain and website glossary", "hasDefinedTerm": [{"@type": "DefinedTerm", "name": g["term"], "description": g["def"]} for g in gl]}
    body = head("Domain & website glossary", f"{len(gl)} terms from registries, DNS, the domain aftermarket and website building, explained in plain words.", [("Glossary", "glossary/")]) + f'<section class="section"><div class="wrap narrow"><p class="small">{jump}</p>{"".join(rows)}</div></section>'
    layout("glossary/", "Domain & website glossary", f"Plain-language definitions of {len(gl)} domain, DNS, registry and website terms, from A records to WHOIS.", body, nav="learn/", jsonld=ld, crumbs=[("Glossary", "glossary/")])
    GENERATED.append(("glossary/", "0.6", "monthly"))


def build_learn_index():
    body = head("Guides", "Practical, original guides on finding, buying, protecting and building on domain names. Written for owners, not engineers.", [("Learn", "learn/")]) + \
        f'<section class="section"><div class="wrap">{guides_list()}<div class="panel" style="margin-top:2rem"><h3>Looking for a definition?</h3><p>The <a href="{{{{base}}}}glossary/">glossary</a> covers {len(CONTENT["glossary"])} terms, from A record to WHOIS.</p></div></div></section>'
    layout("learn/", "Guides to domains and websites", "Original guides on domain ownership lookups, buying taken domains, expiry, DNS, email authentication, valuation, naming and brand protection.", body, nav="learn/", crumbs=[("Learn", "learn/")])
    GENERATED.append(("learn/", "0.7", "weekly"))


REDIRECTS = {
    "home/": "", "login/": "desk/", "signup/": "desk/", "password-reset/": "desk/", "passwordreset/": "desk/",
    "dashboard/": "desk/", "domainmonitoring/": "desk/", "domainacquisition/": "desk/#targets", "consultingprojects/": "services/#consulting",
    "brandingprojects/": "services/#branding", "notifications/": "desk/#alerts", "admindashboard/": "", "clientmanagement/": "",
    "domainmanagement/": "desk/", "inquirymanagement/": "contact/", "reports/": "brief/", "notificationmanagement/": "", "servicemanagement/": "services/",
    "monitor/": "desk/", "donate/": "support/", "sponsor/": "advertise/", "partners/": "advertise/", "jobs/": "careers/",
}


def build_redirects():
    for src, dst in REDIRECTS.items():
        depth = len([p for p in src.strip("/").split("/") if p])
        target = ("../" * depth) + dst
        out = ROOT / src / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved | {NAME}</title><meta name="robots" content="noindex">'
                       f'<link rel="canonical" href="{SITE}/{dst}"><meta http-equiv="refresh" content="0; url={target}"></head>'
                       f'<body><p>This page moved. <a href="{target}">Continue to {NAME}</a>.</p></body></html>\n', encoding="utf-8")


def build_404():
    body = ('<section class="console console-small"><div class="wrap"><h1>That page isn’t registered here.</h1><p class="lede">The link may be old or mistyped. Look up a domain instead, or head to the tools.</p>'
            '<form class="console-form" data-lookup="nf-out" role="search"><label class="visually-hidden" for="nf-q">Domain name</label><input id="nf-q" placeholder="example.com" autocomplete="off" spellcheck="false"><button class="btn" type="submit">Look up</button></form>'
            '<div class="console-out" id="nf-out"></div><p class="btn-row" style="margin-top:1.5rem"><a class="btn btn-sun btn-small" href="{{base}}">Home</a><a class="btn btn-sun btn-small" href="{{base}}tools/">Tools</a><a class="btn btn-sun btn-small" href="{{base}}contact/">Contact</a></p></div></section>')
    layout("404.html", "Page not found", "This page could not be found.", body, scripts=["domain.js"], noindex=True,
           head_extra="<script>document.write('<base href=\"'+(/github\\.io$/.test(location.hostname)?'/web-works/':'/')+'\">');</script>")
    # 404 is served at arbitrary depth: rely on <base>, so make links root-relative to it
    p = ROOT / "404.html"
    t = p.read_text(encoding="utf-8").replace('data-base="../"', 'data-base=""').replace('href="../', 'href="').replace('src="../', 'src="')
    p.write_text(t, encoding="utf-8")


def build_sitemap():
    seen, urls = set(), []
    for path, pri, freq in [("", "1.0", "daily")] + GENERATED:
        if path in seen:
            continue
        seen.add(path)
        urls.append(f"<url><loc>{SITE}/{path}</loc><lastmod>{TODAY.isoformat()}</lastmod><changefreq>{freq}</changefreq><priority>{pri}</priority></url>")
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /data/briefs/\n\nSitemap: {SITE}/sitemap.xml\n", encoding="utf-8")


def main():
    load_guides()
    build_static_pages()
    build_guides()
    build_learn_index()
    build_glossary()
    build_news()
    build_videos()
    build_briefs()
    build_redirects()
    build_404()
    build_sitemap()
    (ROOT / ".nojekyll").write_text("", encoding="utf-8")
    print(f"built {len(GENERATED) + 1} indexable pages")


if __name__ == "__main__":
    main()
