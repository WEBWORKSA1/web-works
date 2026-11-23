/* DNS lookup tool */
(function () {
  "use strict";
  var WW = window.WW, D = WW.domain, e = WW.esc;
  var form = document.getElementById("dns-form"), out = document.getElementById("dns-out");
  if (!form) return;
  var ALL = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "CAA", "SOA", "DS", "HTTPS"];
  var STATUS = { 0: "OK", 1: "Format error", 2: "Server failure", 3: "No such name (NXDOMAIN)", 5: "Refused" };

  function hostOf(v) {
    v = String(v || "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[\/?#].*$/, "").replace(/\.$/, "");
    try { return new URL("http://" + v).hostname; } catch (err) { return ""; }
  }
  function cf(name, type) {
    return fetch("https://cloudflare-dns.com/dns-query?name=" + encodeURIComponent(name) + "&type=" + type, { headers: { accept: "application/dns-json" } })
      .then(function (r) { return r.json(); })
      .then(function (j) { return { status: j.Status, answers: (j.Answer || []).map(function (a) { return { type: D.TYPES[a.type] || a.type, ttl: a.TTL, data: a.data }; }) }; });
  }
  function rows(res, type) {
    var list = res.answers.filter(function (a) { return a.type === type || (type === "CNAME" && a.type === "CNAME"); });
    if (!list.length) return "";
    return list.map(function (a) { return "<tr><td>" + e(a.type) + '</td><td class="n">' + e(a.ttl) + "</td><td>" + e(a.data) + "</td></tr>"; }).join("");
  }
  function run() {
    var host = hostOf(document.getElementById("dns-q").value);
    if (!host || host.indexOf(".") < 0) { out.innerHTML = '<p class="form-msg bad" role="alert">Enter a hostname such as example.com.</p>'; return; }
    var t = document.getElementById("dns-type").value, types = t === "ALL" ? ALL : [t];
    var compare = document.getElementById("dns-compare").checked;
    out.innerHTML = '<div class="record"><span class="spinner" aria-hidden="true"></span> Asking resolvers about ' + e(host) + "…</div>";
    history.replaceState(null, "", "?d=" + encodeURIComponent(host) + (t !== "ALL" ? "&type=" + t : ""));
    Promise.all(types.map(function (ty) {
      return Promise.all([D.dns(host, ty).catch(function () { return null; }), compare ? cf(host, ty).catch(function () { return null; }) : Promise.resolve(null)])
        .then(function (r) { return { type: ty, g: r[0], c: r[1] }; });
    })).then(function (results) {
      var nx = results[0].g && results[0].g.status === 3;
      var h = '<div class="record result-enter"><div class="record-head"><div class="record-name">' + e(host) + "</div>" +
        (nx ? '<span class="status bad">No such name</span>' : '<span class="status ok">Resolving</span>') + "</div>";
      if (results.every(function (r) { return !r.g; })) {
        h += "<p>The resolvers didn’t answer from this browser. A privacy extension or network filter may be blocking DNS-over-HTTPS requests.</p></div>";
        out.innerHTML = h; return;
      }
      h += '<div class="table-wrap"><table><thead><tr><th>Type</th><th class="n">TTL (s)</th><th>Value' + (compare ? " (Google)" : "") + "</th></tr></thead><tbody>";
      var any = false, diffs = [];
      results.forEach(function (r) {
        if (!r.g) return;
        var rr = rows(r.g, r.type);
        if (rr) { any = true; h += rr; }
        if (compare && r.c) {
          var a = r.g.answers.filter(function (x) { return x.type === r.type; }).map(function (x) { return x.data; }).sort().join("|");
          var b = r.c.answers.filter(function (x) { return x.type === r.type; }).map(function (x) { return x.data; }).sort().join("|");
          if (a !== b) diffs.push({ type: r.type, g: a, c: b });
        }
      });
      if (!any) h += '<tr><td colspan="3">No records of ' + (t === "ALL" ? "these types" : e(t)) + " for this name. Status: " + e(STATUS[results[0].g.status] || results[0].g.status) + ".</td></tr>";
      h += "</tbody></table></div>";
      if (compare) {
        h += diffs.length
          ? '<h3 style="margin-top:1.25rem">Resolvers disagree on ' + diffs.length + ' record type(s)</h3><div class="table-wrap"><table><thead><tr><th>Type</th><th>Google</th><th>Cloudflare</th></tr></thead><tbody>' + diffs.map(function (d) { return "<tr><td>" + e(d.type) + "</td><td>" + (e(d.g.replace(/\|/g, ", ")) || "—") + "</td><td>" + (e(d.c.replace(/\|/g, ", ")) || "—") + "</td></tr>"; }).join("") + '</tbody></table></div><p class="small muted">A recent change is still propagating, or the zone uses location-based answers. Check again after the TTL shown above.</p>'
          : '<p class="status ok" style="margin-top:1rem">Google and Cloudflare return identical answers.</p>';
      }
      var dnssec = results.some(function (r) { return r.g && r.g.ad; });
      h += '<p class="small muted" style="margin-top:1rem">DNSSEC validation: ' + (dnssec ? "answers are signed and validated." : "answers are not DNSSEC-validated.") + ' <a href="' + WW.base + "tools/domain-health/?d=" + encodeURIComponent(host) + '">Run a full health check</a></p></div>';
      out.innerHTML = h;
    });
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); run(); });
  var p = new URLSearchParams(location.search);
  if (p.get("d")) { document.getElementById("dns-q").value = p.get("d"); if (p.get("type")) document.getElementById("dns-type").value = p.get("type"); run(); }
})();
