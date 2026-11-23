/* TLD explorer */
(function () {
  "use strict";
  var WW = window.WW, e = WW.esc;
  var body = document.getElementById("tld-body");
  if (!body) return;
  var all = [], filtered = [], shown = 100;
  var q = document.getElementById("tld-q"), ty = document.getElementById("tld-type"), rd = document.getElementById("tld-rdap"), more = document.getElementById("tld-more");
  function apply() {
    var s = q.value.trim().toLowerCase().replace(/^\./, ""), t = ty.value, r = rd.value;
    filtered = all.filter(function (x) {
      if (t === "idn" ? !x.idn : t === "brand" ? !x.brand : t && x.type !== t) return false;
      if (r === "yes" && !x.rdap) return false;
      if (r === "no" && x.rdap) return false;
      if (!s) return true;
      return x.tld.indexOf(s) > -1 || (x.unicode || "").indexOf(s) > -1 || (x.manager || "").toLowerCase().indexOf(s) > -1;
    });
    if (s) filtered.sort(function (a, b) { return (a.tld === s ? -1 : 0) - (b.tld === s ? -1 : 0) || a.tld.length - b.tld.length; });
    shown = 100; draw();
  }
  function draw() {
    body.innerHTML = filtered.slice(0, shown).map(function (x) {
      return '<tr><td><b>.' + e(x.unicode || x.tld) + "</b>" + (x.unicode ? ' <span class="muted small">.' + e(x.tld) + "</span>" : "") + "</td><td>" + e(x.type) + (x.brand ? ' <span class="badge">brand</span>' : "") + "</td><td>" + e(x.manager || "—") + "</td><td>" + (x.rdap ? '<span class="status ok">Yes</span>' : '<span class="status">No</span>') + '</td><td><a href="https://www.iana.org/domains/root/db/' + encodeURIComponent(x.tld) + '.html" target="_blank" rel="noopener">IANA record</a></td></tr>';
    }).join("") || '<tr><td colspan="5">No extension matches. Try a shorter search.</td></tr>';
    more.hidden = filtered.length <= shown;
    more.textContent = "Show more (" + (filtered.length - shown) + " left)";
  }
  Promise.all([WW.json("data/tlds.json"), WW.json("data/rdap.json").catch(function () { return { tlds: {} }; })]).then(function (r) {
    var t = r[0], boot = r[1];
    all = t.items.map(function (x) { return { tld: x.tld, type: x.type, manager: x.manager, unicode: x.unicode, brand: !!x.brand, idn: x.tld.indexOf("xn--") === 0, rdap: boot.tlds[x.tld] != null }; });
    var rdapCount = all.filter(function (x) { return x.rdap; }).length;
    document.getElementById("tld-meta").textContent = all.length.toLocaleString() + " extensions, " + rdapCount.toLocaleString() + " with RDAP. Root zone " + (t.version || "") + ". Synced " + WW.fmtDate(t.updated) + ".";
    var p = new URLSearchParams(location.search).get("q"); if (p) q.value = p;
    apply();
  }).catch(function () { document.getElementById("tld-meta").textContent = "The root zone file couldn’t be loaded. Refresh the page to try again."; });
  [q, ty, rd].forEach(function (el) { el.addEventListener("input", apply); });
  more.addEventListener("click", function () { shown += 200; draw(); });
  document.getElementById("tld-csv").addEventListener("click", function () {
    WW.download("tld-list.csv", WW.csv([["tld", "unicode", "type", "operator", "rdap"]].concat(filtered.map(function (x) { return [x.tld, x.unicode || "", x.type, x.manager || "", x.rdap ? "yes" : "no"]; }))), "text/csv");
  });
})();
