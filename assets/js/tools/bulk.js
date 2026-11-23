/* Bulk domain checker */
(function () {
  "use strict";
  var WW = window.WW, D = WW.domain, e = WW.esc;
  var form = document.getElementById("bulk-form"), out = document.getElementById("bulk-out"), ta = document.getElementById("bulk-in");
  if (!form) return;
  function parse() {
    var seen = {}, list = [], bad = [];
    ta.value.split(/[\s,;]+/).forEach(function (v) {
      if (!v.trim()) return;
      var n = D.normalize(v);
      if (!n.ok) { bad.push(v); return; }
      if (!seen[n.domain]) { seen[n.domain] = 1; list.push(n.domain); }
    });
    return { list: list.slice(0, 100), over: Math.max(0, list.length - 100), bad: bad };
  }
  ta.addEventListener("input", function () { var p = parse(); document.getElementById("bulk-count").textContent = p.list.length + " name" + (p.list.length === 1 ? "" : "s") + (p.over ? " (first 100 used)" : ""); });
  var rows = [];
  function draw(done, total, mode) {
    var h = '<div class="record"><div class="record-head"><div class="record-name" style="font-size:1.3rem">' + done + " of " + total + ' checked</div><div class="btn-row"><button class="btn btn-ghost btn-small" type="button" id="bulk-csv"' + (done < total ? " disabled" : "") + '>Download CSV</button><button class="btn btn-ghost btn-small" type="button" id="bulk-watch"' + (done < total ? " disabled" : "") + ">Add registered names to watchlist</button></div></div>";
    h += '<div class="meter" aria-hidden="true"><i style="width:' + (total ? done / total * 100 : 0) + '%"></i></div><div class="table-wrap" style="margin-top:1rem"><table><thead><tr><th>Domain</th><th>Status</th>' + (mode === "full" ? "<th>Registrar</th><th>Expires</th>" : "") + "<th></th></tr></thead><tbody>";
    rows.forEach(function (r) {
      var cls = r.state === "free" ? "ok" : r.state === "taken" ? "bad" : r.state === "soon" ? "warn" : "";
      var txt = r.state === "free" ? "Not registered" : r.state === "taken" ? "Registered" : r.state === "soon" ? r.note : r.state === "pending" ? "Checking…" : "Unknown";
      h += "<tr><td><b>" + e(r.domain) + '</b></td><td><span class="status ' + cls + '">' + e(txt) + "</span></td>" + (mode === "full" ? "<td>" + e(r.registrar || "") + '</td><td class="num">' + (r.expires ? WW.fmtDate(r.expires) : "") + "</td>" : "") +
        '<td><a href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(r.domain) + '">Details</a></td></tr>';
    });
    h += "</tbody></table></div></div>";
    out.innerHTML = h;
    if (done >= total) {
      document.getElementById("bulk-csv").addEventListener("click", function () {
        WW.download("domain-check.csv", WW.csv([["domain", "status", "registrar", "expires"]].concat(rows.map(function (r) { return [r.domain, r.state === "soon" ? "registered" : r.state, r.registrar || "", r.expires || ""]; }))), "text/csv");
      });
      document.getElementById("bulk-watch").addEventListener("click", function (ev) {
        var n = 0; rows.forEach(function (r) { if ((r.state === "taken" || r.state === "soon") && D.watch(r.domain)) n++; });
        ev.target.textContent = n + " added. Open your Desk"; ev.target.onclick = function () { location.href = WW.base + "desk/"; };
      });
    }
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var p = parse(), mode = form.querySelector('[name="mode"]:checked').value;
    if (!p.list.length) { out.innerHTML = '<p class="form-msg bad" role="alert">Add at least one domain name.</p>'; return; }
    rows = p.list.map(function (d) { return { domain: d, state: "pending" }; });
    var done = 0, i = 0, size = mode === "full" ? 2 : 6;
    draw(0, rows.length, mode);
    function next() {
      if (i >= rows.length) return;
      var r = rows[i++];
      var job = mode === "full"
        ? D.check(r.domain).then(function (res) {
            if (res.state === "available" || res.state === "probably-available") r.state = "free";
            else if (res.state === "registered") {
              r.state = "taken"; r.registrar = res.rec && res.rec.registrar; r.expires = res.rec && res.rec.events && res.rec.events.expiration;
              var days = D.daysUntil(r.expires); if (days != null && days <= 45) { r.state = "soon"; r.note = days < 0 ? "Past expiry" : "Expires in " + days + " d"; }
            } else r.state = "unknown";
            return new Promise(function (ok) { setTimeout(ok, 350); });
          })
        : D.quick(r.domain).then(function (s) { r.state = s; });
      job.catch(function () { r.state = "unknown"; }).then(function () { done++; draw(done, rows.length, mode); next(); });
    }
    for (var k = 0; k < size; k++) next();
  });
})();
