#!/usr/bin/env python3
"""Fetch fresh data for Web.Works.

Runs in GitHub Actions on a schedule. Every source is optional: when one
fails, the previous data for it is kept and the failure is recorded in
data/status.json, so the site never goes empty.

Writes:
  data/news.json        headlines grouped by category
  data/videos.json      latest uploads from curated YouTube channels
  data/tlds.json        every top-level domain in the root zone (IANA)
  data/tld-changes.json additions/removals seen between runs
  data/rdap.json        IANA RDAP bootstrap (TLD -> registry RDAP server)
  data/status.json      what happened on the last run
"""
import datetime as dt
import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

import feedparser

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
UA = "Mozilla/5.0 (compatible; WebWorksRefreshBot/1.0; +https://web.works/about/)"
NOW = dt.datetime.now(dt.timezone.utc)
STATUS = {"run_at": NOW.isoformat(timespec="seconds"), "sources": []}


def fetch(url, timeout=25):
    last = None
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 + attempt * 3)
    raise last


def load(name, default):
    p = DATA / name
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            pass
    return default


def save(name, obj):
    (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def clean_text(s, words=32):
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"The post .* appeared first on .*$", "", s).strip()
    parts = s.split(" ")
    if len(parts) > words:
        s = " ".join(parts[:words]).rstrip(",.;:") + "…"
    return s


def to_iso(entry):
    for key in ("published_parsed", "updated_parsed"):
        t = entry.get(key)
        if t:
            return dt.datetime(*t[:6], tzinfo=dt.timezone.utc).isoformat(timespec="seconds")
    return NOW.isoformat(timespec="seconds")


def norm_title(t):
    return re.sub(r"[^a-z0-9]+", "", (t or "").lower())[:80]


# ---------------------------------------------------------------- news
def update_news(sources):
    old = load("news.json", {"items": []})
    items = []
    for src in sources:
        rec = {"kind": "news", "name": src["name"], "url": src["url"], "ok": False, "count": 0}
        try:
            raw = fetch(src["url"])
            got = []
            if src.get("type") == "hn":
                for h in json.loads(raw).get("hits", []):
                    if not h.get("title"):
                        continue
                    link = h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}"
                    got.append({
                        "title": h["title"].strip(),
                        "link": link,
                        "source": "Hacker News",
                        "date": dt.datetime.fromtimestamp(h.get("created_at_i", time.time()), dt.timezone.utc).isoformat(timespec="seconds"),
                        "summary": f"{h.get('points', 0)} points, {h.get('num_comments', 0)} comments on Hacker News.",
                    })
            else:
                feed = feedparser.parse(raw)
                for e in feed.entries[:25]:
                    title = clean_text(e.get("title", ""), 30)
                    title = re.sub(r"\s+via\s+@\w+(,\s*@\w+)*\s*$", "", title)
                    link = e.get("link", "")
                    if not title or not link.startswith("http"):
                        continue
                    source = src["name"]
                    if "news.google.com" in src["url"]:
                        # Google News titles end with " - Publisher"
                        m = re.match(r"^(.*) - ([^-]{2,60})$", title)
                        if m:
                            title, source = m.group(1).strip(), m.group(2).strip()
                        summary = ""
                    else:
                        summary = clean_text(e.get("summary", "") or e.get("description", ""))
                    got.append({"title": title, "link": link, "source": source, "date": to_iso(e), "summary": summary})
            for g in got:
                g["cat"] = src["cat"]
            items.extend(got)
            rec.update(ok=bool(got), count=len(got))
        except Exception as e:  # noqa: BLE001
            rec["error"] = str(e)[:160]
        STATUS["sources"].append(rec)
        print(f"news {rec['ok']!s:5} {rec['count']:3}  {src['name']}", file=sys.stderr)

    # keep old items too, so one failed feed never empties a category
    items.extend(old.get("items", []))
    cutoff = NOW - dt.timedelta(days=21)
    seen, out = set(), []
    for it in sorted(items, key=lambda x: x["date"], reverse=True):
        key = norm_title(it["title"])
        if not key or key in seen:
            continue
        try:
            when = dt.datetime.fromisoformat(it["date"])
        except ValueError:
            continue
        if when > NOW + dt.timedelta(hours=6):
            it["date"] = NOW.isoformat(timespec="seconds")
        elif when < cutoff:
            continue
        seen.add(key)
        out.append(it)
    per_cat, final = {}, []
    for it in out:
        per_cat[it["cat"]] = per_cat.get(it["cat"], 0) + 1
        if per_cat[it["cat"]] <= 45:
            final.append(it)
    save("news.json", {"updated": NOW.isoformat(timespec="seconds"), "items": final})
    return len(final)


# ---------------------------------------------------------------- videos
def update_videos(channels):
    old = load("videos.json", {"items": []})
    items = []
    for ch in channels:
        url = f"https://www.youtube.com/feeds/videos.xml?channel_id={ch['channel']}"
        rec = {"kind": "video", "name": ch["name"], "url": url, "ok": False, "count": 0}
        try:
            feed = feedparser.parse(fetch(url))
            got = []
            for e in feed.entries[:8]:
                vid = e.get("yt_videoid") or (e.get("id", "").split(":")[-1])
                title = clean_text(e.get("title", ""), 24)
                if not vid or not title:
                    continue
                if "#shorts" in title.lower():
                    continue
                got.append({
                    "id": vid, "title": title, "channel": ch["name"], "topic": ch["topic"],
                    "date": to_iso(e),
                    "summary": clean_text((e.get("media_description") or e.get("summary") or ""), 28),
                })
            items.extend(got[:5])
            rec.update(ok=bool(got), count=len(got[:5]))
        except Exception as e:  # noqa: BLE001
            rec["error"] = str(e)[:160]
        STATUS["sources"].append(rec)
        print(f"video {rec['ok']!s:5} {rec['count']:3}  {ch['name']}", file=sys.stderr)
    items.extend(old.get("items", []))
    seen, out = set(), []
    for it in sorted(items, key=lambda x: x["date"], reverse=True):
        if it["id"] in seen:
            continue
        seen.add(it["id"])
        out.append(it)
    save("videos.json", {"updated": NOW.isoformat(timespec="seconds"), "items": out[:60]})
    return len(out[:60])


# ---------------------------------------------------------------- TLDs
def update_tlds():
    rec = {"kind": "data", "name": "IANA root zone", "url": "https://data.iana.org/TLD/tlds-alpha-by-domain.txt", "ok": False, "count": 0}
    old = load("tlds.json", {"items": []})
    try:
        txt = fetch(rec["url"]).decode("utf-8")
        lines = [l.strip() for l in txt.splitlines() if l.strip()]
        version = lines[0].lstrip("# ").strip() if lines and lines[0].startswith("#") else ""
        tlds = [l.lower() for l in lines if not l.startswith("#")]
        old_meta = {t["tld"]: t for t in old.get("items", [])}
        meta = {}
        icann = {}
        # enrich with type + manager from the root zone database
        try:
            page = fetch("https://www.iana.org/domains/root/db").decode("utf-8", "replace")
            parsed = 0
            for row in re.findall(r"<tr[^>]*>(.*?)</tr>", page, flags=re.S | re.I):
                m = re.search(r"/domains/root/db/([a-z0-9-]+)\.html", row, flags=re.I)
                cells = [html.unescape(re.sub(r"<[^>]+>", "", c)).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S | re.I)]
                if m and len(cells) >= 3:
                    meta[m.group(1).lower()] = {"tld": m.group(1).lower(), "type": cells[1], "manager": cells[2]}
                    parsed += 1
            rec_db = {"kind": "data", "name": "IANA root zone database", "url": "https://www.iana.org/domains/root/db", "ok": parsed > 0, "count": parsed}
            if not parsed:
                t = re.search(r"<title>(.*?)</title>", page, flags=re.S | re.I)
                rec_db["error"] = f"no table rows parsed ({len(page)} bytes, title: {t.group(1).strip()[:60] if t else 'none'})"
            STATUS["sources"].append(rec_db)
        except Exception as e:  # noqa: BLE001
            STATUS["sources"].append({"kind": "data", "name": "IANA root zone database", "ok": False, "error": str(e)[:160]})
        # ICANN's gTLD list: operator names and brand (Specification 13) flags for generic TLDs
        try:
            g = json.loads(fetch("https://www.icann.org/resources/registries/gtlds/v2/gtlds.json"))
            for row in g.get("gTLDs", []):
                t = str(row.get("gTLD", "")).lower()
                if t and not row.get("removalDate"):
                    icann[t] = {"manager": (row.get("registryOperator") or "").strip(), "brand": bool(row.get("specification13"))}
            STATUS["sources"].append({"kind": "data", "name": "ICANN gTLD list", "url": "https://www.icann.org/resources/registries/gtlds/v2/gtlds.json", "ok": bool(icann), "count": len(icann)})
        except Exception as e:  # noqa: BLE001
            STATUS["sources"].append({"kind": "data", "name": "ICANN gTLD list", "ok": False, "error": str(e)[:160]})
        items = []
        for t in tlds:
            m, ic, om = meta.get(t), icann.get(t), old_meta.get(t, {})
            if m:
                typ, mgr = m["type"], m["manager"]
            elif icann:
                typ = "infrastructure" if t == "arpa" else ("generic" if ic else "country-code")
                mgr = ic["manager"] if ic else ""
            else:
                typ = om.get("type") or ("country-code" if len(t) == 2 else "generic")
                mgr = om.get("manager", "")
            item = {"tld": t, "type": typ, "manager": mgr}
            if (ic and ic["brand"]) or (not icann and om.get("brand")):
                item["brand"] = True
            if t.startswith("xn--"):
                try:
                    item["unicode"] = t.encode("ascii").decode("idna")
                except Exception:  # noqa: BLE001
                    pass
            items.append(item)
        # change log between runs
        prev = {t["tld"] for t in old.get("items", [])}
        cur = set(tlds)
        changes = load("tld-changes.json", {"log": []})
        if prev and prev != cur:
            changes["log"].insert(0, {"date": NOW.date().isoformat(), "added": sorted(cur - prev), "removed": sorted(prev - cur)})
            changes["log"] = changes["log"][:50]
            save("tld-changes.json", changes)
        elif not (DATA / "tld-changes.json").exists():
            save("tld-changes.json", changes)
        save("tlds.json", {"updated": NOW.isoformat(timespec="seconds"), "version": version, "count": len(items), "items": items})
        rec.update(ok=True, count=len(items))
    except Exception as e:  # noqa: BLE001
        rec["error"] = str(e)[:160]
    STATUS["sources"].append(rec)
    print(f"tlds {rec['ok']} {rec['count']}", file=sys.stderr)


def update_rdap():
    rec = {"kind": "data", "name": "IANA RDAP bootstrap", "url": "https://data.iana.org/rdap/dns.json", "ok": False, "count": 0}
    try:
        boot = json.loads(fetch(rec["url"]))
        servers, tld_map = [], {}
        for tlds, urls in boot.get("services", []):
            url = next((u for u in urls if u.startswith("https://")), urls[0])
            if not url.endswith("/"):
                url += "/"
            if url not in servers:
                servers.append(url)
            idx = servers.index(url)
            for t in tlds:
                tld_map[t.lower()] = idx
        save("rdap.json", {"updated": NOW.isoformat(timespec="seconds"), "publication": boot.get("publication", ""), "servers": servers, "tlds": tld_map})
        rec.update(ok=True, count=len(tld_map))
    except Exception as e:  # noqa: BLE001
        rec["error"] = str(e)[:160]
    STATUS["sources"].append(rec)
    print(f"rdap {rec['ok']} {rec['count']}", file=sys.stderr)


def main():
    DATA.mkdir(exist_ok=True)
    src = json.loads((DATA / "sources.json").read_text(encoding="utf-8"))
    n = update_news(src["news"])
    v = update_videos(src["videos"])
    update_tlds()
    update_rdap()
    STATUS["news_items"], STATUS["video_items"] = n, v
    STATUS["ok_sources"] = sum(1 for s in STATUS["sources"] if s.get("ok"))
    STATUS["total_sources"] = len(STATUS["sources"])
    save("status.json", STATUS)
    print(f"done: {STATUS['ok_sources']}/{STATUS['total_sources']} sources ok", file=sys.stderr)


if __name__ == "__main__":
    main()
