/* Web.Works core: navigation, forms, storage, video facades, small helpers. */
(function () {
  "use strict";
  var WW = (window.WW = window.WW || {});
  var doc = document.documentElement;
  WW.base = doc.getAttribute("data-base") || "./";

  // ---------- helpers
  WW.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  WW.$ = function (sel, root) { return (root || document).querySelector(sel); };
  WW.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  WW.store = {
    get: function (k, d) { try { var v = localStorage.getItem("ww:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("ww:" + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  var jsonCache = {};
  WW.json = function (path) {
    if (!jsonCache[path]) {
      jsonCache[path] = fetch(WW.base + path, { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }
    return jsonCache[path];
  };
  WW.fmtDate = function (iso, opts) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString(undefined, opts || { year: "numeric", month: "short", day: "numeric" });
  };
  WW.ago = function (iso) {
    var d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
    if (isNaN(s)) return "";
    if (s < 90) return "just now";
    if (s < 3600) return Math.round(s / 60) + " min ago";
    if (s < 86400) return Math.round(s / 3600) + " h ago";
    if (s < 86400 * 14) return Math.round(s / 86400) + " d ago";
    return WW.fmtDate(iso);
  };
  WW.download = function (name, text, type) {
    var blob = new Blob([text], { type: type || "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  WW.csv = function (rows) {
    return rows.map(function (r) {
      return r.map(function (c) { c = String(c == null ? "" : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(",");
    }).join("\n");
  };

  // ---------- navigation
  var toggle = WW.$(".nav-toggle"), nav = WW.$("#nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---------- attribution capture (sent with leads)
  try {
    var qs = new URLSearchParams(location.search), utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"].forEach(function (k) { if (qs.get(k)) utm[k] = qs.get(k); });
    if (Object.keys(utm).length) sessionStorage.setItem("ww:utm", JSON.stringify(utm));
    if (!sessionStorage.getItem("ww:landing")) sessionStorage.setItem("ww:landing", location.pathname + location.search);
  } catch (e) { /* storage blocked */ }

  // ---------- prefill fields from the URL (?goal=buy&domain=example.com)
  try {
    var params = new URLSearchParams(location.search);
    params.forEach(function (value, key) {
      WW.$$('[name="' + key.replace(/"/g, "") + '"]').forEach(function (el) {
        if (el.type === "radio" || el.type === "checkbox") { if (el.value === value) el.checked = true; }
        else if (!el.value) el.value = value;
      });
    });
  } catch (e) { /* ignore */ }

  // ---------- forms
  function inbox() {
    var c = window.WW_CONFIG || {}, k = c._k || [], v = (c._v || []).slice().reverse(), out = "";
    for (var i = 0; i < v.length; i++) out += String.fromCharCode(v[i] ^ k[i % k.length]);
    return out;
  }
  WW.validate = function (scope) {
    var ok = true, first = null;
    WW.$$("input, select, textarea", scope).forEach(function (el) {
      if (el.closest(".hp") || el.disabled || el.type === "hidden") return;
      var valid = el.checkValidity();
      if (el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value)) valid = false;
      el.setAttribute("aria-invalid", valid ? "false" : "true");
      if (!valid) { ok = false; if (!first) first = el; }
    });
    if (first) { first.focus(); if (first.reportValidity) first.reportValidity(); }
    return ok;
  };
  WW.collect = function (form) {
    var data = {}, fd = new FormData(form);
    fd.forEach(function (val, key) {
      if (key === "_honey") return;
      val = typeof val === "string" ? val.trim() : val;
      if (data[key]) data[key] = data[key] + ", " + val; else data[key] = val;
    });
    return data;
  };
  WW.send = function (form, extra) {
    var honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value) return Promise.resolve({ ok: true, spam: true });
    var data = WW.collect(form);
    Object.keys(extra || {}).forEach(function (k) { data[k] = extra[k]; });
    var who = data.name || data.email || "visitor";
    data._subject = "[Web.Works] " + (form.getAttribute("data-subject") || "Website message") + " — " + who;
    data._template = "table";
    data._captcha = "false";
    data.form = form.getAttribute("data-ww-form") || "form";
    data.page = location.href;
    data.referrer = document.referrer || "(direct)";
    data.submitted = new Date().toISOString();
    try {
      var u = sessionStorage.getItem("ww:utm"); if (u) data.attribution = u;
      data.landing_page = sessionStorage.getItem("ww:landing") || "";
    } catch (e) { /* ignore */ }
    var endpoint = ((window.WW_CONFIG || {}).relay || "") + inbox();
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        var success = res.ok && (String(res.body.success) === "true" || /activat/i.test(res.body.message || ""));
        if (!success) throw new Error(res.body.message || "Relay refused the message");
        return { ok: true };
      });
  };
  function showMsg(form, ok, text) {
    var box = form.querySelector(".form-msg") || form.parentNode.querySelector(".form-msg");
    if (!box) { box = document.createElement("div"); form.appendChild(box); }
    box.className = "form-msg " + (ok ? "ok" : "bad");
    box.setAttribute("role", ok ? "status" : "alert");
    box.textContent = text;
    box.hidden = false;
  }
  WW.showMsg = showMsg;
  WW.$$("form[data-ww-form]").forEach(function (form) {
    if (form.hasAttribute("data-steps")) return; // multi-step funnel handles its own submit
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!WW.validate(form)) return;
      var btn = form.querySelector('[type="submit"]'), label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending'; }
      WW.send(form).then(function () {
        var done = form.getAttribute("data-done") || "Sent. We'll reply by email.";
        var target = form.getAttribute("data-success") && document.getElementById(form.getAttribute("data-success"));
        if (target) { form.hidden = true; target.hidden = false; target.focus && target.focus(); }
        else { showMsg(form, true, done); form.reset(); }
      }).catch(function () {
        showMsg(form, false, "That didn't go through. Check your connection and press the button again.");
      }).then(function () { if (btn) { btn.disabled = false; btn.textContent = label; } });
    });
  });

  // ---------- video facades (load YouTube only on click)
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".yt[data-id]");
    if (!b || b.querySelector("iframe")) return;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(b.getAttribute("data-id")) + "?autoplay=1&rel=0";
    f.title = b.getAttribute("aria-label") || "Video";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    b.appendChild(f);
  });

  // ---------- relative times
  function stamp() {
    WW.$$("time[data-ago]").forEach(function (t) { var v = WW.ago(t.getAttribute("datetime")); if (v) t.textContent = v; });
  }
  stamp(); setInterval(stamp, 60000);

  // ---------- countdowns
  function tick() {
    WW.$$("[data-countdown]").forEach(function (el) {
      var end = new Date(el.getAttribute("data-countdown")).getTime(), s = Math.max(0, (end - Date.now()) / 1000);
      var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
      el.textContent = s <= 0 ? "Closed" : d + "d " + h + "h " + m + "m left";
    });
  }
  tick(); setInterval(tick, 30000);

  // ---------- cookie notice (information; consent for ads is handled by Google's message when enabled)
  if (!WW.store.get("cookie-ok", false)) {
    var c = document.createElement("div");
    c.className = "cookie no-print"; c.setAttribute("role", "region"); c.setAttribute("aria-label", "Cookie notice");
    c.innerHTML = '<p>We use cookies for ads (Google AdSense) and to remember your tool settings on this device. <a href="' + WW.base + 'cookies/">Cookie policy</a></p><div class="btn-row"><button class="btn btn-small" type="button" data-ok>OK</button><a class="btn btn-ghost btn-small" href="' + WW.base + 'privacy/">Privacy choices</a></div>';
    document.body.appendChild(c);
    c.querySelector("[data-ok]").addEventListener("click", function () { WW.store.set("cookie-ok", true); c.remove(); });
  }

  // ---------- values from config.js (contest prize, payment links)
  var cfg = window.WW_CONFIG || {};
  WW.$$("[data-cfg]").forEach(function (el) { var v = cfg[el.getAttribute("data-cfg")]; if (v) el.textContent = v; });
  var pay = document.getElementById("pay-buttons");
  if (pay && cfg.payments) {
    var names = { paypal: "Give with PayPal", stripe: "Give by card", kofi: "Support on Ko-fi", buymeacoffee: "Buy us a coffee" }, any = false;
    Object.keys(names).forEach(function (k) {
      var u = cfg.payments[k];
      if (u && /^https:\/\//.test(u)) { any = true; pay.insertAdjacentHTML("beforeend", '<a class="btn btn-sun" rel="noopener" target="_blank" href="' + WW.esc(u) + '">' + names[k] + "</a>"); }
    });
    pay.hidden = !any;
  }
  WW.$$("[data-tier]").forEach(function (b) {
    b.addEventListener("click", function () {
      var sel = document.getElementById("s-tier"); if (sel) sel.value = b.getAttribute("data-tier");
      var target = document.getElementById("pledge"); if (target) target.scrollIntoView({ behavior: "smooth" });
      var amt = document.getElementById("s-amount"); if (amt) setTimeout(function () { (sel.value === "One-time" ? amt : document.getElementById("s-name")).focus(); }, 400);
    });
  });

  WW.$$("[data-role]").forEach(function (a) {
    a.addEventListener("click", function () { var s = document.getElementById("j-role"); if (s) s.value = a.getAttribute("data-role"); });
  });

  // ---------- footer year
  WW.$$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
