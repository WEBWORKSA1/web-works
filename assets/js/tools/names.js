/* Name generator */
(function () {
  "use strict";
  var WW = window.WW, D = WW.domain, e = WW.esc;
  var form = document.getElementById("ng-form");
  if (!form) return;
  var PRE = ["get", "try", "go", "my", "use", "hey", "meet", "join", "be", "up", "pro", "the", "all", "on"];
  var SUF = ["ly", "ify", "hub", "lab", "wise", "kit", "base", "flow", "loop", "verse", "ware", "bay", "spot", "mate", "works", "desk", "nest", "craft", "stack", "path"];
  var PAIRS = ["nova", "loop", "peak", "grid", "nest", "beam", "pulse", "mint", "forge", "spark", "drift", "orbit", "bloom", "shift", "ridge", "pilot", "atlas", "cove", "lumen", "tide", "wave", "field", "north", "trail", "cedar", "echo", "prism", "kite", "anchor", "ember", "relay", "signal", "haven", "bright", "swift", "clear", "bold", "fresh", "vivid", "civic"];
  var ENDS = ["a", "o", "io", "ia", "ora", "era", "ix", "ex", "um", "eo", "ly", "ify", "ina", "ova"];
  var out = document.getElementById("ng-out"), checkBtn = document.getElementById("ng-check");
  var current = [];

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function clean(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function syll(w) { var m = w.match(/^[^aeiouy]*[aeiouy]+[^aeiouy]?/); return m ? m[0] : w.slice(0, 3); }
  function blend(a, b) {
    var res = [];
    for (var k = Math.min(a.length, b.length) - 1; k >= 2; k--) { if (a.slice(-k) === b.slice(0, k)) { res.push(a + b.slice(k)); break; } }
    res.push(a.slice(0, Math.ceil(a.length / 2)) + b.slice(Math.floor(b.length / 2)));
    res.push(syll(a) + b);
    return res;
  }
  function generate(keys, styles, max) {
    var set = {}, add = function (w, how) { w = clean(w); if (w.length >= 4 && w.length <= max && !set[w]) set[w] = how; };
    keys.forEach(function (k, i) {
      if (styles.compound) {
        keys.forEach(function (k2, j) { if (i !== j) add(k + k2, "Compound"); });
        PAIRS.forEach(function (p) { add(k + p, "Compound"); add(p + k, "Compound"); });
      }
      if (styles.affix) { PRE.forEach(function (p) { add(p + k, "Prefix"); }); SUF.forEach(function (s) { add(k + s, "Suffix"); }); }
      if (styles.blend) { keys.forEach(function (k2, j) { if (i !== j) blend(k, k2).forEach(function (b) { add(b, "Blend"); }); }); PAIRS.slice(0, 20).forEach(function (p) { blend(k, p).forEach(function (b) { add(b, "Blend"); }); }); }
      if (styles.invented) {
        var s = syll(k);
        ENDS.forEach(function (en) { add(s + en, "Invented"); add(k.replace(/[aeiou]$/, "") + en, "Invented"); });
        add(k.replace(/[aeiou]/g, function (v) { return { a: "e", e: "i", i: "o", o: "u", u: "a" }[v]; }), "Invented");
      }
    });
    var words = Object.keys(set);
    // shuffle with a stable seed so the same keywords give the same list
    var seed = keys.join("").split("").reduce(function (a, c) { return (a * 31 + c.charCodeAt(0)) >>> 0; }, 7);
    words.sort(function (a, b) { var ha = (seed ^ a.length * 2654435761 ^ a.charCodeAt(0) * 97 ^ a.charCodeAt(a.length - 1)) >>> 0, hb = (seed ^ b.length * 2654435761 ^ b.charCodeAt(0) * 97 ^ b.charCodeAt(b.length - 1)) >>> 0; return ha - hb; });
    return words.slice(0, 90).map(function (w) { return { name: w, how: set[w], state: "" }; });
  }
  function shortlist() { return WW.store.get("shortlist", []); }
  function drawShort() {
    var s = shortlist(), box = document.getElementById("ng-short");
    box.innerHTML = s.length ? s.map(function (d) { return '<a class="chip" href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(d) + '">' + e(d) + "</a>"; }).join("") : '<span class="muted small">Star names to keep them here. The list stays in this browser.</span>';
  }
  function draw(tld) {
    var short = shortlist();
    out.innerHTML = '<div class="chips">' + current.map(function (c, i) {
      var d = c.name + "." + tld, cls = c.state === "free" ? " ok" : c.state === "taken" ? " bad" : "";
      var on = short.indexOf(d) > -1;
      return '<span class="chip' + cls + '" title="' + e(c.how) + (c.state ? (c.state === "free" ? ": not registered" : c.state === "taken" ? ": registered" : "") : "") + '"><span class="dot"></span><a href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(d) + '" style="color:inherit;text-decoration:none">' + e(cap(c.name)) + "." + e(tld) + '</a><button type="button" data-star="' + i + '" aria-pressed="' + on + '" aria-label="' + (on ? "Remove from" : "Add to") + ' shortlist" style="background:none;border:0;cursor:pointer;font-size:1rem;color:' + (on ? "var(--warn)" : "var(--ink-3)") + '">' + (on ? "★" : "☆") + "</button></span>";
    }).join("") + '</div><p class="small muted" style="margin-top:.75rem">' + current.length + " names. Green: not registered. Red: registered. Hover a name to see how it was built.</p>";
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var keys = document.getElementById("ng-k").value.split(/[,\s]+/).map(clean).filter(function (k) { return k.length >= 2; }).slice(0, 6);
    if (!keys.length) { out.innerHTML = '<p class="form-msg bad" role="alert">Add at least one keyword of two letters or more.</p>'; return; }
    var styles = {}; WW.$$("#ng-styles input").forEach(function (c) { styles[c.value] = c.checked; });
    current = generate(keys, styles, +document.getElementById("ng-max").value);
    checkBtn.disabled = !current.length;
    draw(document.getElementById("ng-tld").value);
  });
  checkBtn.addEventListener("click", function () {
    var tld = document.getElementById("ng-tld").value, i = 0, done = 0, note = document.getElementById("ng-note");
    checkBtn.disabled = true;
    function next() {
      if (i >= current.length) return;
      var c = current[i++];
      D.quick(c.name + "." + tld).then(function (s) { c.state = s; done++; note.textContent = done + " of " + current.length + " checked"; if (done % 6 === 0 || done === current.length) draw(tld); if (done === current.length) { checkBtn.disabled = false; note.textContent = current.filter(function (x) { return x.state === "free"; }).length + " not registered"; } next(); });
    }
    for (var k = 0; k < 6; k++) next();
  });
  out.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-star]"); if (!b) return;
    var tld = document.getElementById("ng-tld").value, d = current[+b.getAttribute("data-star")].name + "." + tld, s = shortlist(), at = s.indexOf(d);
    if (at > -1) s.splice(at, 1); else s.unshift(d);
    WW.store.set("shortlist", s.slice(0, 200)); draw(tld); drawShort();
  });
  document.getElementById("ng-export").addEventListener("click", function () { WW.download("name-shortlist.csv", WW.csv([["domain"]].concat(shortlist().map(function (d) { return [d]; }))), "text/csv"); });
  document.getElementById("ng-clear").addEventListener("click", function () { WW.store.set("shortlist", []); drawShort(); if (current.length) draw(document.getElementById("ng-tld").value); });
  drawShort();
  var k = new URLSearchParams(location.search).get("k");
  if (k) { document.getElementById("ng-k").value = k; form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit")); }
})();
