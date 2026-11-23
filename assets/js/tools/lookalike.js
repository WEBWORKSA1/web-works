/* Lookalike / typosquat finder */
(function () {
  "use strict";
  var WW = window.WW, D = WW.domain, e = WW.esc;
  var form = document.getElementById("la-form"), out = document.getElementById("la-out");
  if (!form) return;
  var KEYS = { q: "wa", w: "qeas", e: "wrsd", r: "etdf", t: "ryfg", y: "tugh", u: "yihj", i: "uojk", o: "ipkl", p: "ol", a: "qwsz", s: "awedxz", d: "serfcx", f: "drtgvc", g: "ftyhbv", h: "gyujnb", j: "huikmn", k: "jiolm", l: "kop", z: "asx", x: "zsdc", c: "xdfv", v: "cfgb", b: "vghn", n: "bhjm", m: "njk" };
  var GLYPHS = [["o", "0"], ["l", "1"], ["i", "1"], ["i", "l"], ["l", "i"], ["m", "rn"], ["rn", "m"], ["w", "vv"], ["vv", "w"], ["d", "cl"], ["e", "3"], ["a", "4"], ["s", "5"], ["g", "q"], ["u", "v"]];
  var WORDS = ["login", "secure", "support", "account", "pay", "app", "my", "help", "online", "verify", "mail", "portal", "shop", "official", "team"];
  var TLDS = ["com", "net", "org", "co", "io", "app", "info", "biz", "xyz", "online", "site", "shop", "store", "cm", "om", "ai", "us", "ca", "uk"];

  function variants(sld, tld, kinds) {
    var out = {}, add = function (name, kind, t) { t = t || tld; if (!name || name === sld && t === tld) return; if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) return; var k = name + "." + t; if (!out[k]) out[k] = kind; };
    var i;
    if (kinds.typo) {
      for (i = 0; i < sld.length; i++) {
        add(sld.slice(0, i) + sld.slice(i + 1), "Missing letter");
        add(sld.slice(0, i) + sld[i] + sld.slice(i), "Double letter");
        if (i < sld.length - 1) add(sld.slice(0, i) + sld[i + 1] + sld[i] + sld.slice(i + 2), "Swapped letters");
        (KEYS[sld[i]] || "").split("").forEach(function (k) { add(sld.slice(0, i) + k + sld.slice(i + 1), "Neighbouring key"); });
        if (i > 0) add(sld.slice(0, i) + "-" + sld.slice(i), "Added hyphen");
      }
      add("www" + sld, "Missing dot after www");
    }
    if (kinds.glyph) {
      GLYPHS.forEach(function (g) {
        var idx = sld.indexOf(g[0]);
        while (idx > -1) { add(sld.slice(0, idx) + g[1] + sld.slice(idx + g[0].length), "Look-alike letters"); idx = sld.indexOf(g[0], idx + 1); }
      });
    }
    if (kinds.word) {
      WORDS.forEach(function (w) { add(sld + w, "Added word"); add(sld + "-" + w, "Added word"); add(w + sld, "Added word"); add(w + "-" + sld, "Added word"); });
    }
    if (kinds.tld) TLDS.forEach(function (t) { if (t !== tld) add(sld, "Other extension", t); });
    return Object.keys(out).slice(0, 300).map(function (k) { return { domain: k, kind: out[k] }; });
  }

  function pool(items, size, worker, onEach) {
    var i = 0, done = 0;
    return new Promise(function (resolve) {
      function next() {
        if (i >= items.length) { if (done >= items.length) resolve(); return; }
        var it = items[i++];
        worker(it).then(function () { done++; onEach(done); if (done >= items.length) resolve(); else next(); });
      }
      for (var k = 0; k < Math.min(size, items.length); k++) next();
      if (!items.length) resolve();
    });
  }

  function run() {
    var n = D.normalize(document.getElementById("la-q").value);
    if (!n.ok) { out.innerHTML = '<p class="form-msg bad" role="alert">' + e(n.error) + "</p>"; return; }
    history.replaceState(null, "", "?d=" + encodeURIComponent(n.domain));
    var kinds = {}; WW.$$("#la-opts input").forEach(function (c) { kinds[c.value] = c.checked; });
    var parts = n.domain.split("."), tld = parts.pop(), sld = parts.pop();
    var list = variants(sld, tld, kinds);
    out.innerHTML = '<div class="record"><div class="record-head"><div class="record-name">' + e(n.domain) + '</div><span class="status info" id="la-count">0 / ' + list.length + ' checked</span></div><div class="meter" aria-hidden="true"><i id="la-bar" style="width:0%"></i></div><div id="la-res" style="margin-top:1rem"></div></div>';
    var bar = document.getElementById("la-bar"), cnt = document.getElementById("la-count");
    pool(list, 6, function (it) {
      return D.quick(it.domain).then(function (s) {
        it.state = s;
        if (s === "taken") return D.dns(it.domain, "MX").then(function (m) { it.mx = D.dnsOf(m, "MX").filter(function (x) { return !/^0\s+\.$/.test(x); }).length > 0; }).catch(function () {});
      });
    }, function (done) { bar.style.width = (done / list.length * 100) + "%"; cnt.textContent = done + " / " + list.length + " checked"; }).then(function () { show(n.domain, list); });
  }

  function show(domain, list) {
    var taken = list.filter(function (x) { return x.state === "taken"; }).sort(function (a, b) { return (b.mx ? 1 : 0) - (a.mx ? 1 : 0); });
    var free = list.filter(function (x) { return x.state === "free"; });
    var unk = list.filter(function (x) { return x.state === "unknown"; });
    var mail = taken.filter(function (x) { return x.mx; }).length;
    var cnt = document.getElementById("la-count");
    cnt.className = "status " + (mail ? "bad" : taken.length ? "warn" : "ok");
    cnt.textContent = taken.length + " registered, " + mail + " accept email";
    var h = "";
    if (unk.length === list.length) { document.getElementById("la-res").innerHTML = "<p>DNS resolvers didn’t answer from this browser, so nothing could be checked. A privacy extension may be blocking DNS-over-HTTPS.</p>"; return; }
    h += '<div class="table-wrap"><table class="stack"><thead><tr><th>Registered lookalike</th><th>Technique</th><th>Email</th><th></th></tr></thead><tbody>';
    if (!taken.length) h += '<tr><td colspan="4">None of the ' + list.length + " variants are registered. Good news.</td></tr>";
    taken.forEach(function (x) {
      h += "<tr><td><b>" + e(x.domain) + "</b></td><td>" + e(x.kind) + "</td><td>" + (x.mx ? '<span class="status bad">Accepts email</span>' : '<span class="status">No mail</span>') + '</td><td><a href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(x.domain) + '">Look up</a></td></tr>';
    });
    h += "</tbody></table></div>";
    if (free.length) {
      h += '<details style="margin-top:1rem"><summary>' + free.length + " unregistered variants you could register defensively</summary><div class=\"chips\" style=\"margin-top:.75rem\">" + free.slice(0, 80).map(function (x) { return '<a class="chip ok" href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(x.domain) + '"><span class="dot"></span>' + e(x.domain) + "</a>"; }).join("") + "</div></details>";
    }
    h += '<div class="actions btn-row"><a class="btn btn-small" href="' + WW.base + "get-started/?goal=monitor&domain=" + encodeURIComponent(domain) + '">Monitor these for me</a><button class="btn btn-ghost btn-small" type="button" id="la-csv">Download CSV</button></div>';
    document.getElementById("la-res").innerHTML = h;
    document.getElementById("la-csv").addEventListener("click", function () {
      WW.download("lookalikes-" + domain + ".csv", WW.csv([["variant", "technique", "status", "accepts_email"]].concat(list.map(function (x) { return [x.domain, x.kind, x.state, x.mx ? "yes" : "no"]; }))), "text/csv");
    });
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); run(); });
  var p = new URLSearchParams(location.search).get("d");
  if (p) { document.getElementById("la-q").value = p; run(); }
})();
