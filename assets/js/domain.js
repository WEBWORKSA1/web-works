/* Web.Works registry + DNS client.
   RDAP: routed with the IANA bootstrap file that the refresh workflow snapshots into data/rdap.json.
   DNS: Google Public DNS JSON API with Cloudflare DNS-over-HTTPS as fallback. Everything runs in the browser. */
(function () {
  "use strict";
  var WW = window.WW;
  var D = (WW.domain = {});
  var TYPES = { 1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 33: "SRV", 43: "DS", 48: "DNSKEY", 65: "HTTPS", 257: "CAA" };
  D.TYPES = TYPES;

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]);
  }

  // ---------- input
  D.normalize = function (input) {
    var raw = String(input || "").trim().toLowerCase();
    if (!raw) return { ok: false, error: "Type a domain name, for example example.com." };
    raw = raw.replace(/^[a-z]+:\/\//, "").replace(/[\/?#].*$/, "").replace(/:\d+$/, "").replace(/^www\./, "").replace(/\.$/, "");
    raw = raw.replace(/\s+/g, "");
    if (raw.indexOf(".") === -1) raw += ".com";
    var ascii;
    try { ascii = new URL("http://" + raw).hostname; } catch (e) { return { ok: false, error: "That isn't a valid domain name. Use letters, numbers and hyphens, like my-shop.com." }; }
    var labels = ascii.split(".");
    for (var i = 0; i < labels.length; i++) {
      var l = labels[i];
      if (!l || l.length > 63 || !/^[a-z0-9-]+$/.test(l) || /^-|-$/.test(l)) {
        return { ok: false, error: "“" + raw + "” isn't a valid domain name. Each part can use letters, numbers and hyphens, but can't start or end with a hyphen." };
      }
    }
    if (ascii.length > 253) return { ok: false, error: "That name is longer than the 253-character limit." };
    if (labels.length < 2) return { ok: false, error: "Add an extension such as .com." };
    return { ok: true, domain: ascii, display: raw, tld: labels[labels.length - 1], sld: labels[labels.length - 2] };
  };

  // ---------- data files
  D.bootstrap = function () { return WW.json("data/rdap.json").catch(function () { return { servers: [], tlds: {} }; }); };
  D.tldList = function () { return WW.json("data/tlds.json").catch(function () { return { items: [] }; }); };

  // ---------- DNS over HTTPS
  D.dns = function (name, type) {
    var g = "https://dns.google/resolve?name=" + encodeURIComponent(name) + "&type=" + encodeURIComponent(type);
    var c = "https://cloudflare-dns.com/dns-query?name=" + encodeURIComponent(name) + "&type=" + encodeURIComponent(type);
    function parse(j) {
      return {
        status: j.Status, ad: !!j.AD,
        answers: (j.Answer || []).map(function (a) { return { name: a.name, type: TYPES[a.type] || String(a.type), ttl: a.TTL, data: a.data }; })
      };
    }
    return withTimeout(fetch(g).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }), 8000)
      .then(parse)
      .catch(function () {
        return withTimeout(fetch(c, { headers: { accept: "application/dns-json" } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }), 8000).then(parse);
      });
  };
  D.dnsOf = function (res, type) { return (res && res.answers || []).filter(function (a) { return !type || a.type === type; }).map(function (a) { return a.data; }); };

  // ---------- RDAP
  function vcardFn(ent) {
    try { var v = ent.vcardArray[1]; for (var i = 0; i < v.length; i++) if (v[i][0] === "fn") return v[i][3]; } catch (e) { /* none */ }
    return "";
  }
  function vcardField(ent, field) {
    try { var v = ent.vcardArray[1]; for (var i = 0; i < v.length; i++) if (v[i][0] === field) return v[i][3]; } catch (e) { /* none */ }
    return "";
  }
  D.parseRdap = function (j) {
    var out = { status: j.status || [], events: {}, nameservers: [], registrar: "", ianaId: "", abuse: "", dnssec: null, links: [] };
    (j.events || []).forEach(function (e) { out.events[e.eventAction] = e.eventDate; });
    (j.nameservers || []).forEach(function (n) { if (n.ldhName) out.nameservers.push(n.ldhName.toLowerCase()); });
    (j.entities || []).forEach(function (e) {
      var roles = e.roles || [];
      if (roles.indexOf("registrar") > -1) {
        out.registrar = vcardFn(e) || e.handle || "";
        (e.publicIds || []).forEach(function (p) { if (/iana/i.test(p.type)) out.ianaId = p.identifier; });
        (e.entities || []).forEach(function (s) { if ((s.roles || []).indexOf("abuse") > -1) out.abuse = vcardField(s, "email"); });
      }
      if (roles.indexOf("registrant") > -1) {
        out.registrant = vcardFn(e) || vcardField(e, "org") || "";
        var adr = vcardField(e, "adr"); if (adr && adr.length) out.registrantCountry = adr[adr.length - 1] || "";
      }
    });
    if (j.secureDNS) out.dnssec = !!j.secureDNS.delegationSigned;
    (j.links || []).forEach(function (l) { if (l.rel === "related" && l.href) out.links.push(l.href); });
    return out;
  };
  D.rdap = function (domain) {
    var tld = domain.split(".").pop();
    return D.bootstrap().then(function (b) {
      var urls = [];
      if (b.tlds && b.tlds[tld] != null) urls.push(b.servers[b.tlds[tld]] + "domain/" + domain);
      urls.push("https://rdap.org/domain/" + domain);
      var i = 0;
      function next() {
        if (i >= urls.length) return Promise.reject(new Error("unreachable"));
        var u = urls[i++];
        return withTimeout(fetch(u, { headers: { accept: "application/rdap+json, application/json" } }), 9000).then(function (r) {
          if (r.status === 404) return { state: "available", url: u };
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json().then(function (j) { return { state: "registered", url: u, raw: j, rec: D.parseRdap(j) }; });
        }).catch(function (e) { if (i < urls.length) return next(); throw e; });
      }
      return next();
    });
  };

  // Full check: registry first, DNS as a fallback signal
  D.check = function (domain) {
    return D.rdap(domain).catch(function () {
      return D.dns(domain, "NS").then(function (r) {
        if (r.status === 3) return { state: "probably-available", via: "dns" };
        if (r.answers.length || r.status === 0) return { state: "registered", via: "dns", rec: { status: [], events: {}, nameservers: D.dnsOf(r, "NS"), registrar: "" } };
        return { state: "unknown", via: "dns" };
      }).catch(function () { return { state: "unknown" }; });
    });
  };
  // Quick check used by bulk tools (DNS only: fast, no rate limits)
  D.quick = function (domain) {
    return D.dns(domain, "NS").then(function (r) {
      if (r.status === 3) return "free";
      if (r.status === 0 && r.answers.length) return "taken";
      if (r.status === 0) return "taken";
      return "unknown";
    }).catch(function () { return "unknown"; });
  };

  D.daysUntil = function (iso) {
    if (!iso) return null;
    var t = new Date(iso).getTime();
    if (isNaN(t)) return null;
    return Math.floor((t - Date.now()) / 86400000);
  };
  D.statusLabel = function (res) {
    if (res.state === "available") return { cls: "ok", text: "Not registered" };
    if (res.state === "probably-available") return { cls: "ok", text: "Probably not registered" };
    if (res.state === "unknown") return { cls: "", text: "Registry not reachable" };
    var st = (res.rec && res.rec.status || []).join(" ").toLowerCase();
    if (/pending delete/.test(st)) return { cls: "warn", text: "Pending delete — drops within days" };
    if (/redemption/.test(st)) return { cls: "warn", text: "Expired — in redemption" };
    var days = D.daysUntil(res.rec && res.rec.events && res.rec.events.expiration);
    if (days != null && days < 0) return { cls: "warn", text: "Past expiry — in grace period" };
    if (days != null && days <= 30) return { cls: "warn", text: "Registered — expires in " + days + " days" };
    return { cls: "bad", text: "Registered" };
  };

  function registrarLinks(domain) {
    var q = encodeURIComponent(domain);
    return [
      ["Porkbun", "https://porkbun.com/checkout/search?q=" + q],
      ["Namecheap", "https://www.namecheap.com/domains/registration/results/?domain=" + q],
      ["Spaceship", "https://www.spaceship.com/domain-search/?query=" + q],
      ["Dynadot", "https://www.dynadot.com/domain/search?domain=" + q]
    ];
  }

  // ---------- record card
  D.renderResult = function (n, res) {
    var b = WW.base, e = WW.esc, q = encodeURIComponent(n.domain);
    var lab = D.statusLabel(res);
    var h = '<article class="record result-enter" aria-live="polite"><div class="record-head"><div class="record-name">' + e(n.display) + '</div><span class="status ' + lab.cls + '">' + e(lab.text) + "</span></div>";
    if (res.state === "registered" && res.rec) {
      var r = res.rec, ev = r.events, days = D.daysUntil(ev.expiration);
      h += "<dl>";
      if (r.registrar) h += "<dt>Registrar</dt><dd>" + e(r.registrar) + (r.ianaId ? ' <span class="muted small">IANA ' + e(r.ianaId) + "</span>" : "") + "</dd>";
      if (ev.registration) h += "<dt>Registered</dt><dd>" + WW.fmtDate(ev.registration) + ' <span class="muted small">(' + Math.max(0, Math.floor((Date.now() - new Date(ev.registration)) / 31557600000)) + " years old)</span></dd>";
      if (ev.expiration) h += "<dt>Expires</dt><dd>" + WW.fmtDate(ev.expiration) + (days != null ? ' <span class="muted small">(' + (days >= 0 ? "in " + days + " days" : Math.abs(days) + " days ago") + ")</span>" : "") + "</dd>";
      if (ev["last changed"]) h += "<dt>Last changed</dt><dd>" + WW.fmtDate(ev["last changed"]) + "</dd>";
      if (r.nameservers && r.nameservers.length) h += "<dt>Nameservers</dt><dd>" + r.nameservers.map(e).join("<br>") + "</dd>";
      if (r.status && r.status.length) h += "<dt>Status codes</dt><dd>" + r.status.map(e).join(", ") + "</dd>";
      if (r.dnssec != null) h += "<dt>DNSSEC</dt><dd>" + (r.dnssec ? "Signed" : "Not signed") + "</dd>";
      if (r.registrant) h += "<dt>Registrant</dt><dd>" + e(r.registrant) + (r.registrantCountry ? ", " + e(r.registrantCountry) : "") + "</dd>";
      if (r.abuse) h += "<dt>Registrar abuse</dt><dd>" + e(r.abuse) + "</dd>";
      h += "</dl>";
      if (res.via === "dns") h += '<p class="muted small" style="margin-top:.75rem">The registry didn’t answer this browser, so this result comes from live DNS. Nameservers prove the name is registered; dates need the registry.</p>';
      h += '<div class="actions btn-row">' +
        '<a class="btn btn-small" href="' + b + "get-started/?goal=buy&domain=" + q + '">Make an anonymous offer</a>' +
        '<button class="btn btn-ghost btn-small" type="button" data-watch="' + e(n.domain) + '">Add to my watchlist</button>' +
        '<a class="btn btn-ghost btn-small" href="' + b + "tools/domain-health/?d=" + q + '">Check DNS &amp; email health</a>' +
        '<a class="btn btn-ghost btn-small" href="' + b + "tools/lookalike-finder/?d=" + q + '">Find lookalikes</a>' +
        '<a class="btn btn-ghost btn-small" href="' + b + "tools/domain-score/?d=" + q + '">Score this name</a></div>';
      if (res.raw) h += '<details><summary>Raw registry record (RDAP JSON)</summary><div><pre>' + e(JSON.stringify(res.raw, null, 2)) + "</pre></div></details>";
    } else if (res.state === "available" || res.state === "probably-available") {
      h += "<p>No registration on file" + (res.state === "probably-available" ? " (the registry didn’t answer, and DNS has no record of this name)" : " at the registry") + ". Prices vary: some names are reserved or sold at a premium by the registry, so confirm at checkout.</p>";
      h += '<p class="small muted">Register it at:</p><div class="chips">' + registrarLinks(n.domain).map(function (x) { return '<a class="chip" rel="nofollow noopener" target="_blank" href="' + x[1] + '">' + e(x[0]) + "</a>"; }).join("") + "</div>";
      h += '<div class="actions btn-row"><a class="btn btn-small" href="' + b + "tools/domain-score/?d=" + q + '">Score this name</a><a class="btn btn-ghost btn-small" href="' + b + "tools/name-generator/?k=" + encodeURIComponent(n.sld) + '">Generate alternatives</a><a class="btn btn-ghost btn-small" href="' + b + "get-started/?goal=brand&domain=" + q + '">Build a brand on it</a></div>';
    } else {
      h += "<p>Neither the registry nor DNS answered from this browser. That usually means a strict network, an ad blocker on DNS requests, or a country-code registry without a public RDAP service.</p>";
      h += '<div class="actions btn-row"><a class="btn btn-small" href="https://lookup.icann.org/en/lookup?name=' + q + '" target="_blank" rel="noopener">Try ICANN Lookup</a><a class="btn btn-ghost btn-small" href="' + b + "get-started/?goal=buy&domain=" + q + '">Ask us to research it</a></div>';
    }
    return h + "</article>";
  };

  D.lookupInto = function (input, out) {
    var n = D.normalize(input);
    if (!n.ok) { out.innerHTML = '<div class="record"><p class="form-msg bad" role="alert">' + WW.esc(n.error) + "</p></div>"; return Promise.resolve(); }
    out.innerHTML = '<div class="record"><span class="spinner" aria-hidden="true"></span> Reading the registry record for <strong>' + WW.esc(n.display) + "</strong>…</div>";
    var recent = WW.store.get("recent", []);
    recent = [n.domain].concat(recent.filter(function (x) { return x !== n.domain; })).slice(0, 8);
    WW.store.set("recent", recent);
    return D.check(n.domain).then(function (res) { out.innerHTML = D.renderResult(n, res); });
  };

  // ---------- watchlist (shared with the Desk)
  D.watch = function (domain) {
    var list = WW.store.get("watch", []);
    if (list.some(function (x) { return x.domain === domain; })) return false;
    list.unshift({ domain: domain, added: new Date().toISOString(), note: "", tag: "" });
    WW.store.set("watch", list);
    return true;
  };
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-watch]");
    if (!b) return;
    var added = D.watch(b.getAttribute("data-watch"));
    b.textContent = added ? "Added — open your Desk" : "Already on your watchlist";
    b.onclick = function () { location.href = WW.base + "desk/"; };
  });

  // ---------- generic console wiring: <form data-lookup> + output
  WW.$$("form[data-lookup]").forEach(function (form) {
    var input = form.querySelector("input"), out = document.getElementById(form.getAttribute("data-lookup"));
    form.addEventListener("submit", function (ev) { ev.preventDefault(); D.lookupInto(input.value, out); });
    WW.$$("[data-try]").forEach(function (b) { b.addEventListener("click", function () { input.value = b.getAttribute("data-try"); D.lookupInto(input.value, out); }); });
    var q = new URLSearchParams(location.search).get("d");
    if (q) { input.value = q; D.lookupInto(q, out); }
  });
})();
