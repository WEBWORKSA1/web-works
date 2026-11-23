/* The Desk: local watchlist, targets and alerts */
(function () {
  "use strict";
  var WW = window.WW, D = WW.domain, e = WW.esc;
  if (!document.getElementById("w-body")) return;
  var watch = WW.store.get("watch", []), targets = WW.store.get("targets", []);
  function save() { WW.store.set("watch", watch); WW.store.set("targets", targets); }

  // ---------- tabs
  var tabs = WW.$$('[role="tab"]');
  function select(id) {
    tabs.forEach(function (t) {
      var on = t.id === id; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { select(t.id); history.replaceState(null, "", "#" + t.id.slice(2)); });
    t.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { var n = tabs[(i + (ev.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click(); }
    });
  });
  var hash = location.hash.replace("#", "");
  if (hash && document.getElementById("t-" + hash)) select("t-" + hash);

  // ---------- helpers
  function expiryPill(w) {
    var c = w.check;
    if (!c) return '<span class="status">Not checked yet</span>';
    if (c.state === "available") return '<span class="status bad">Not registered!</span>';
    if (c.state === "unknown") return '<span class="status">Registry unreachable</span>';
    var st = (c.status || []).join(" ");
    if (/pending delete/i.test(st)) return '<span class="status bad">Pending delete</span>';
    if (/redemption/i.test(st)) return '<span class="status bad">In redemption</span>';
    var d = D.daysUntil(c.expires);
    if (d == null) return '<span class="status info">Registered</span>';
    var cls = d < 0 ? "bad" : d <= 30 ? "bad" : d <= 60 ? "warn" : "ok";
    return '<span class="status ' + cls + '">' + (d < 0 ? Math.abs(d) + " days past expiry" : d + " days") + '</span><div class="small muted">' + WW.fmtDate(c.expires) + "</div>";
  }
  function parseList(v) {
    var out = [];
    String(v || "").split(/[\s,;]+/).forEach(function (x) { var n = D.normalize(x); if (n.ok && out.indexOf(n.domain) < 0) out.push(n.domain); });
    return out;
  }

  // ---------- alerts
  function alerts() {
    var list = [];
    watch.forEach(function (w) {
      var c = w.check; if (!c) return;
      var d = D.daysUntil(c.expires), st = (c.status || []).join(" ");
      if (c.state === "available") list.push(["bad", w.domain + " is no longer registered", "Re-register it now if it is yours."]);
      else if (/pending delete/i.test(st)) list.push(["bad", w.domain + " is pending delete", "It will drop within days and cannot be renewed."]);
      else if (/redemption/i.test(st)) list.push(["bad", w.domain + " is in redemption", "The last owner can still restore it for a fee."]);
      else if (d != null && d < 0) list.push(["bad", w.domain + " passed its expiry date " + Math.abs(d) + " days ago", "Renew at " + (c.registrar || "the registrar") + " before the grace period ends."]);
      else if (d != null && d <= 7) list.push(["bad", w.domain + " expires in " + d + " days", "Renew now."]);
      else if (d != null && d <= 30) list.push(["warn", w.domain + " expires in " + d + " days", "Confirm auto-renew and the card on file."]);
      else if (d != null && d <= 60) list.push(["warn", w.domain + " expires in " + d + " days", "Put the renewal on your calendar."]);
      if (w.changes && w.changes.length) w.changes.forEach(function (ch) { list.push(["warn", w.domain + ": " + ch.what + " changed", "From " + ch.from + " to " + ch.to + " (seen " + WW.fmtDate(ch.at) + ")."]); });
    });
    targets.forEach(function (t) {
      if (t.state === "available") list.push(["ok", t.domain + " is available to register", "A name you were tracking is free. Register it before someone else does."]);
      if (t.state === "dropping") list.push(["warn", t.domain + " is on its way to deletion", "Consider a backorder with a drop-catching service."]);
    });
    document.getElementById("n-alerts").textContent = list.length;
    document.getElementById("a-body").innerHTML = list.length ? '<ul class="feed">' + list.map(function (a) { return '<li><span class="status ' + a[0] + '">' + (a[0] === "ok" ? "Opportunity" : a[0] === "bad" ? "Act now" : "Heads up") + '</span> <b style="margin-left:.4rem">' + e(a[1]) + "</b><p>" + e(a[2]) + "</p></li>"; }).join("") + "</ul>" : '<div class="empty">No alerts. Refresh your watchlist to check for new ones.</div>';
  }

  // ---------- render
  function draw() {
    document.getElementById("n-watch").textContent = watch.length;
    document.getElementById("n-targets").textContent = targets.length;
    document.getElementById("w-body").innerHTML = watch.length ? watch.map(function (w, i) {
      var c = w.check || {};
      return "<tr><td><b>" + e(w.domain) + "</b>" + (w.tag ? ' <span class="badge">' + e(w.tag) + "</span>" : "") + (w.note ? '<div class="small muted">' + e(w.note) + "</div>" : "") + "</td><td>" + expiryPill(w) + "</td><td>" + e(c.registrar || "") + '</td><td class="small">' + (c.ns || []).map(e).join("<br>") + '</td><td class="small muted">' + (c.at ? WW.ago(c.at) : "—") +
        '</td><td class="small"><button class="btn btn-ghost btn-small" type="button" data-refresh="' + i + '">Refresh</button> <a href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(w.domain) + '">Details</a> <button type="button" class="btn btn-ghost btn-small" data-rm="' + i + '" aria-label="Remove ' + e(w.domain) + '">Remove</button></td></tr>';
    }).join("") : '<tr><td colspan="6"><div class="empty">Your watchlist is empty. Add the domains you own, or names you are watching.</div></td></tr>';
    document.getElementById("g-body").innerHTML = targets.length ? targets.map(function (t, i) {
      var st = t.state === "available" ? '<span class="status ok">Available</span>' : t.state === "dropping" ? '<span class="status warn">Dropping</span>' : t.state === "registered" ? '<span class="status bad">Registered</span>' : '<span class="status">Not checked</span>';
      var opts = ["Researching", "Owner found", "Contacted", "Negotiating", "In escrow", "Acquired", "Passed"].map(function (s) { return "<option" + (s === t.stage ? " selected" : "") + ">" + s + "</option>"; }).join("");
      return "<tr><td><b>" + e(t.domain) + '</b></td><td><label class="visually-hidden" for="st-' + i + '">Stage</label><select id="st-' + i + '" data-stage="' + i + '">' + opts + '</select></td><td class="n">' + (t.budget ? "$" + Number(t.budget).toLocaleString() : "—") + "</td><td>" + st + '</td><td class="small">' + e(t.note || "") + '</td><td class="small"><a href="' + WW.base + "get-started/?goal=buy&domain=" + encodeURIComponent(t.domain) + (t.budget ? "&budget=" + encodeURIComponent("$" + t.budget) : "") + '">Get help</a> <button type="button" class="btn btn-ghost btn-small" data-rmt="' + i + '">Remove</button></td></tr>';
    }).join("") : '<tr><td colspan="6"><div class="empty">Track names you want to buy: stage, budget and whether they free up.</div></td></tr>';
    alerts();
  }

  // ---------- checks
  function checkWatch(w) {
    return D.check(w.domain).then(function (res) {
      var prev = w.check, rec = res.rec || {};
      var now = { at: new Date().toISOString(), state: res.state === "probably-available" ? "available" : res.state, registrar: rec.registrar || "", expires: rec.events && rec.events.expiration || "", status: rec.status || [], ns: (rec.nameservers || []).slice(0, 4) };
      w.changes = w.changes || [];
      if (prev && prev.state === "registered" && now.state === "registered") {
        if (prev.registrar && now.registrar && prev.registrar !== now.registrar) w.changes.unshift({ what: "Registrar", from: prev.registrar, to: now.registrar, at: now.at });
        var a = (prev.ns || []).slice().sort().join(", "), b = now.ns.slice().sort().join(", ");
        if (a && b && a !== b) w.changes.unshift({ what: "Nameservers", from: a, to: b, at: now.at });
        w.changes = w.changes.slice(0, 5);
      }
      w.check = now;
    });
  }
  function checkTarget(t) {
    return D.check(t.domain).then(function (res) {
      var st = (res.rec && res.rec.status || []).join(" ");
      t.state = res.state === "available" || res.state === "probably-available" ? "available" : /pending delete|redemption/i.test(st) ? "dropping" : res.state === "registered" ? "registered" : "";
      t.checked = new Date().toISOString();
    });
  }
  function refreshAll() {
    var jobs = watch.map(function (w) { return function () { return checkWatch(w); }; }).concat(targets.map(function (t) { return function () { return checkTarget(t); }; }));
    var i = 0, prog = document.getElementById("w-progress"), btn = document.getElementById("w-refresh");
    btn.disabled = true;
    function next() {
      if (i >= jobs.length) { prog.textContent = "All records refreshed."; btn.disabled = false; save(); draw(); return; }
      prog.textContent = "Checking " + (i + 1) + " of " + jobs.length + "…";
      jobs[i++]().catch(function () {}).then(function () { save(); draw(); setTimeout(next, 300); });
    }
    next();
  }

  // ---------- events
  document.getElementById("w-add").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var list = parseList(document.getElementById("w-domain").value), tag = document.getElementById("w-tag").value.trim(), note = document.getElementById("w-note").value.trim();
    if (!list.length) { document.getElementById("w-domain").setAttribute("aria-invalid", "true"); return; }
    var added = [];
    list.forEach(function (d) { if (!watch.some(function (w) { return w.domain === d; })) { var w = { domain: d, tag: tag, note: note, added: new Date().toISOString() }; watch.unshift(w); added.push(w); } });
    save(); draw(); ev.target.reset();
    added.reduce(function (p, w) { return p.then(function () { return checkWatch(w).catch(function () {}).then(function () { save(); draw(); }); }); }, Promise.resolve());
  });
  document.getElementById("g-add").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var n = D.normalize(document.getElementById("g-domain").value);
    if (!n.ok) { document.getElementById("g-domain").setAttribute("aria-invalid", "true"); return; }
    if (targets.some(function (t) { return t.domain === n.domain; })) return;
    var t = { domain: n.domain, budget: document.getElementById("g-budget").value, stage: document.getElementById("g-stage").value, note: document.getElementById("g-note").value.trim(), added: new Date().toISOString() };
    targets.unshift(t); save(); draw(); ev.target.reset();
    checkTarget(t).catch(function () {}).then(function () { save(); draw(); });
  });
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-refresh],[data-rm],[data-rmt]"); if (!b) return;
    if (b.hasAttribute("data-rm")) { watch.splice(+b.getAttribute("data-rm"), 1); save(); draw(); }
    else if (b.hasAttribute("data-rmt")) { targets.splice(+b.getAttribute("data-rmt"), 1); save(); draw(); }
    else { var w = watch[+b.getAttribute("data-refresh")]; b.disabled = true; b.textContent = "Checking"; checkWatch(w).catch(function () {}).then(function () { save(); draw(); }); }
  });
  document.addEventListener("change", function (ev) { var s = ev.target.closest("[data-stage]"); if (s) { targets[+s.getAttribute("data-stage")].stage = s.value; save(); } });
  document.getElementById("w-refresh").addEventListener("click", refreshAll);
  document.getElementById("w-csv").addEventListener("click", function () {
    WW.download("watchlist.csv", WW.csv([["domain", "tag", "note", "registrar", "expires", "status", "nameservers", "checked"]].concat(watch.map(function (w) { var c = w.check || {}; return [w.domain, w.tag, w.note, c.registrar, c.expires, (c.status || []).join(" "), (c.ns || []).join(" "), c.at]; }))), "text/csv");
  });
  document.getElementById("w-ics").addEventListener("click", function () {
    function d8(iso, minus) { var d = new Date(iso); d.setUTCDate(d.getUTCDate() - (minus || 0)); return d.toISOString().slice(0, 10).replace(/-/g, ""); }
    var ev = [], stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    watch.forEach(function (w) {
      var x = w.check && w.check.expires; if (!x) return;
      [[30, "Renew " + w.domain + " (expires in 30 days)"], [7, "Renew " + w.domain + " (expires in 7 days)"], [0, w.domain + " expires today"]].forEach(function (r) {
        ev.push("BEGIN:VEVENT\r\nUID:" + w.domain + "-" + r[0] + "@web.works\r\nDTSTAMP:" + stamp + "\r\nDTSTART;VALUE=DATE:" + d8(x, r[0]) + "\r\nSUMMARY:" + r[1] + "\r\nDESCRIPTION:Registrar: " + (w.check.registrar || "unknown") + "\r\nEND:VEVENT");
      });
    });
    if (!ev.length) { document.getElementById("w-progress").textContent = "Refresh records first so expiry dates are known."; return; }
    WW.download("domain-renewals.ics", "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Web.Works//Desk//EN\r\n" + ev.join("\r\n") + "\r\nEND:VCALENDAR\r\n", "text/calendar");
  });
  document.getElementById("b-export").addEventListener("click", function () { WW.download("web-works-desk-backup.json", JSON.stringify({ version: 1, exported: new Date().toISOString(), watch: watch, targets: targets, shortlist: WW.store.get("shortlist", []) }, null, 2), "application/json"); });
  document.getElementById("b-file").addEventListener("change", function (ev) {
    var f = ev.target.files[0]; if (!f) return;
    f.text().then(function (t) {
      var j = JSON.parse(t);
      (j.watch || []).forEach(function (w) { if (w.domain && !watch.some(function (x) { return x.domain === w.domain; })) watch.push(w); });
      (j.targets || []).forEach(function (w) { if (w.domain && !targets.some(function (x) { return x.domain === w.domain; })) targets.push(w); });
      if (j.shortlist) WW.store.set("shortlist", j.shortlist);
      save(); draw(); select("t-watch");
    }).catch(function () { alertBox("That file isn’t a Desk backup."); });
  });
  function alertBox(msg) { document.getElementById("w-progress").textContent = msg; }
  document.getElementById("b-clear").addEventListener("click", function (ev) {
    if (ev.target.getAttribute("data-confirm") !== "1") { ev.target.setAttribute("data-confirm", "1"); ev.target.textContent = "Press again to clear everything"; return; }
    watch = []; targets = []; save(); draw(); ev.target.removeAttribute("data-confirm"); ev.target.textContent = "Clear everything";
  });
  draw();
  // auto-refresh stale records (older than 12 hours) once per visit
  var stale = watch.filter(function (w) { return !w.check || Date.now() - new Date(w.check.at).getTime() > 43200000; });
  if (stale.length && stale.length <= 25) stale.reduce(function (p, w) { return p.then(function () { return checkWatch(w).catch(function () {}).then(function () { save(); draw(); }); }); }, Promise.resolve());
})();
