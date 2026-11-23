/* Domain health check */
(function () {
  "use strict";
  var WW = window.WW, D = WW.domain, e = WW.esc;
  var form = document.getElementById("health-form"), out = document.getElementById("health-out");
  if (!form) return;
  var SELECTORS = ["google", "selector1", "selector2", "k1", "k2", "default", "s1", "s2", "mail", "dkim", "zoho", "smtp", "mandrill", "mxvault", "sendgrid", "pm", "protonmail"];

  function txt(res) { return D.dnsOf(res, "TXT").map(function (t) { return t.replace(/^"|"$/g, "").replace(/"\s*"/g, ""); }); }
  function q(name, type) { return D.dns(name, type).catch(function () { return { status: -1, answers: [] }; }); }

  function evaluate(d) {
    var jobs = {
      a: q(d, "A"), aaaa: q(d, "AAAA"), www: q("www." + d, "A"), wwwc: q("www." + d, "CNAME"), mx: q(d, "MX"), ns: q(d, "NS"),
      txt: q(d, "TXT"), dmarc: q("_dmarc." + d, "TXT"), caa: q(d, "CAA"), ds: q(d, "DS"), sts: q("_mta-sts." + d, "TXT"),
      tlsrpt: q("_smtp._tls." + d, "TXT"), bimi: q("default._bimi." + d, "TXT"), https: q(d, "HTTPS")
    };
    SELECTORS.forEach(function (s) { jobs["dk_" + s] = q(s + "._domainkey." + d, "TXT"); });
    var keys = Object.keys(jobs);
    return Promise.all(keys.map(function (k) { return jobs[k]; })).then(function (vals) {
      var r = {}; keys.forEach(function (k, i) { r[k] = vals[i]; }); return r;
    });
  }

  function grade(d, r) {
    var checks = [];
    function add(group, name, state, weight, detail, fix) { checks.push({ group: group, name: name, state: state, weight: weight, detail: detail, fix: fix || "" }); }
    var a = D.dnsOf(r.a, "A"), aaaa = D.dnsOf(r.aaaa, "AAAA"), mx = D.dnsOf(r.mx, "MX"), ns = D.dnsOf(r.ns, "NS");
    var nullMx = mx.length === 1 && /^0\s+\.$/.test(mx[0].trim());
    var sendsMail = mx.length > 0 && !nullMx;

    // Web
    add("Web", "Domain resolves", a.length || aaaa.length ? "ok" : "bad", 8, a.length ? "Points to " + a.slice(0, 3).join(", ") : "No A or AAAA record on the bare domain.", "Add an A record for @ pointing to your host's IP, or an ALIAS/ANAME if your DNS host supports it.");
    var www = D.dnsOf(r.www, "A").length || D.dnsOf(r.wwwc, "CNAME").length;
    add("Web", "www works too", www ? "ok" : "warn", 4, www ? "www." + d + " resolves." : "www." + d + " has no record, so visitors who type www get an error.", "Add a CNAME for www pointing to " + d + " (or your host), then redirect it to one preferred version.");
    add("Web", "IPv6 ready", aaaa.length ? "ok" : "info", 2, aaaa.length ? "AAAA record present." : "No AAAA record. Fine for most sites; some hosts add one for free.", "");
    add("Web", "Nameserver redundancy", ns.length >= 2 ? "ok" : "warn", 4, ns.length + " nameserver(s): " + ns.join(", "), "Use at least two nameservers, ideally on separate networks.");

    // Email
    var spf = txt(r.txt).filter(function (t) { return /^v=spf1/i.test(t); });
    var spfState = "bad", spfDetail = "No SPF record.", spfFix = sendsMail ? 'Add a TXT record at @: v=spf1 include:<your provider> -all (your email provider publishes the exact include).' : "This domain receives no mail. Add a TXT record at @: v=spf1 -all";
    if (spf.length > 1) { spfState = "bad"; spfDetail = "Found " + spf.length + " SPF records; receivers treat that as an error."; spfFix = "Merge them into a single v=spf1 record."; }
    else if (spf.length === 1) {
      var s = spf[0], lookups = (s.match(/\b(include:|a\b|a:|mx\b|mx:|ptr|exists:|redirect=)/gi) || []).length;
      spfDetail = s;
      if (/\+all/i.test(s)) { spfState = "bad"; spfFix = "+all lets anyone send as you. Change it to -all or ~all."; }
      else if (/\?all/i.test(s) || !/[~-]all|redirect=/i.test(s)) { spfState = "warn"; spfFix = "End the record with -all (strict) or ~all (soft fail)."; }
      else if (lookups > 10) { spfState = "warn"; spfFix = "The record uses about " + lookups + " DNS lookups at the top level; the limit is 10. Flatten or remove unused includes."; }
      else { spfState = "ok"; spfFix = ""; }
    }
    add("Email", "SPF", spfState, 12, spfDetail, spfFix);

    var dm = txt(r.dmarc).filter(function (t) { return /^v=DMARC1/i.test(t); })[0];
    var dmState = "bad", dmDetail = "No DMARC record at _dmarc." + d, dmFix = "Add a TXT record at _dmarc: v=DMARC1; p=none; rua=mailto:dmarc@" + d + " and raise p to quarantine, then reject, once reports look clean.";
    if (dm) {
      var p = (dm.match(/;\s*p=(\w+)/i) || [])[1] || "";
      dmDetail = dm;
      if (/reject|quarantine/i.test(p)) { dmState = "ok"; dmFix = /rua=/i.test(dm) ? "" : "Add rua=mailto:… to receive aggregate reports."; }
      else { dmState = "warn"; dmFix = "Policy is p=none (monitor only). Move to p=quarantine, then p=reject, after checking reports."; }
      if (!sendsMail && !/reject/i.test(p)) { dmState = "warn"; dmFix = "This domain doesn’t receive mail, so it is safe to set p=reject now."; }
    }
    add("Email", "DMARC policy", dmState, 14, dmDetail, dmFix);

    var dk = SELECTORS.filter(function (s) { return txt(r["dk_" + s]).some(function (t) { return /v=DKIM1|k=rsa|p=/i.test(t); }) || D.dnsOf(r["dk_" + s], "CNAME").length; });
    add("Email", "DKIM key", dk.length ? "ok" : (sendsMail ? "warn" : "info"), sendsMail ? 10 : 0, dk.length ? "Found selector(s): " + dk.join(", ") : "No key under common selectors.", sendsMail ? "Turn on DKIM signing in your email provider's admin console and publish the key it gives you." : "");
    add("Email", "Mail servers (MX)", sendsMail ? "ok" : (nullMx ? "ok" : "info"), 4, sendsMail ? mx.join(", ") : nullMx ? "Null MX: the domain declares it accepts no email." : "No MX: this domain does not receive email.", sendsMail || nullMx ? "" : "If the domain never handles email, publish a null MX record: MX 0 .");
    var sts = txt(r.sts).some(function (t) { return /v=STSv1/i.test(t); });
    add("Email", "MTA-STS", sts ? "ok" : (sendsMail ? "warn" : "info"), sendsMail ? 4 : 0, sts ? "MTA-STS policy announced." : "No MTA-STS record.", sendsMail ? "Publish _mta-sts TXT (v=STSv1; id=1) and host the policy at https://mta-sts." + d + "/.well-known/mta-sts.txt" : "");
    var tls = txt(r.tlsrpt).some(function (t) { return /v=TLSRPTv1/i.test(t); });
    add("Email", "TLS reporting", tls ? "ok" : (sendsMail ? "info" : "info"), sendsMail ? 2 : 0, tls ? "TLS-RPT record present." : "No TLS-RPT record.", sendsMail ? "Add TXT at _smtp._tls: v=TLSRPTv1; rua=mailto:tls@" + d : "");
    var bimi = txt(r.bimi).some(function (t) { return /v=BIMI1/i.test(t); });
    add("Email", "BIMI logo", bimi ? "ok" : "info", 0, bimi ? "BIMI record present." : "No BIMI record (optional; requires DMARC enforcement).", "");

    // Security
    var ds = D.dnsOf(r.ds, "DS").length > 0 || (r.a && r.a.ad);
    add("Security", "DNSSEC", ds ? "ok" : "warn", 10, ds ? "Signed: DS record present at the registry." : "Not signed.", "Turn on DNSSEC at your DNS host and add the DS record it gives you at your registrar (many do this in one click).");
    var caa = D.dnsOf(r.caa, "CAA");
    add("Security", "CAA", caa.length ? "ok" : "warn", 6, caa.length ? caa.join(", ") : "No CAA record: any certificate authority may issue certificates for this name.", 'Add CAA records for the CA you use, e.g. 0 issue "letsencrypt.org" and 0 iodef "mailto:security@' + d + '".');
    var https = D.dnsOf(r.https, "HTTPS").length;
    add("Security", "HTTPS record", https ? "ok" : "info", 0, https ? "HTTPS resource record present (faster, HTTP/3-ready connections)." : "No HTTPS record (optional; many CDNs add it automatically).", "");
    return { checks: checks, sendsMail: sendsMail };
  }

  function render(d, g) {
    var total = 0, got = 0;
    g.checks.forEach(function (c) { total += c.weight; got += c.state === "ok" ? c.weight : c.state === "warn" ? c.weight * 0.4 : c.state === "info" ? c.weight : 0; });
    var score = total ? Math.round((got / total) * 100) : 0;
    var label = score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 55 ? "Needs work" : "At risk";
    var cls = score >= 75 ? "ok" : score >= 55 ? "warn" : "bad";
    var pill = { ok: ["ok", "Pass"], warn: ["warn", "Improve"], bad: ["bad", "Fix"], info: ["info", "Info"] };
    var h = '<div class="record result-enter"><div class="record-head"><div><div class="record-name">' + e(d) + '</div><p class="muted small" style="margin:0">' + (g.sendsMail ? "Sends and receives email" : "Does not receive email") + '. Checked ' + new Date().toLocaleString() + '</p></div><div style="text-align:right"><div class="score-big">' + score + '</div><span class="status ' + cls + '">' + label + "</span></div></div>";
    ["Web", "Email", "Security"].forEach(function (grp) {
      h += '<h3 style="margin-top:1.25rem">' + grp + '</h3><div class="table-wrap"><table class="stack"><tbody>';
      g.checks.filter(function (c) { return c.group === grp; }).forEach(function (c) {
        h += '<tr><td style="width:12rem"><b>' + e(c.name) + '</b></td><td style="width:7rem"><span class="status ' + pill[c.state][0] + '">' + pill[c.state][1] + "</span></td><td>" + e(c.detail) + (c.fix && c.state !== "ok" ? '<div class="small" style="margin-top:.35rem;color:var(--ink-2)"><b>Fix:</b> ' + e(c.fix) + "</div>" : "") + "</td></tr>";
      });
      h += "</tbody></table></div>";
    });
    var bad = g.checks.filter(function (c) { return c.state === "bad" || c.state === "warn"; }).length;
    h += '<div class="actions btn-row"><a class="btn btn-small" href="' + WW.base + "get-started/?goal=consult&domain=" + encodeURIComponent(d) + '">' + (bad ? "Have us fix " + bad + " issue" + (bad > 1 ? "s" : "") : "Get a full portfolio review") + '</a><button class="btn btn-ghost btn-small" type="button" data-watch="' + e(d) + '">Add to my watchlist</button><button class="btn btn-ghost btn-small" type="button" id="health-print">Print report</button></div></div>';
    out.innerHTML = h;
    var pb = document.getElementById("health-print"); if (pb) pb.addEventListener("click", function () { window.print(); });
  }

  function run() {
    var n = D.normalize(document.getElementById("health-q").value);
    if (!n.ok) { out.innerHTML = '<p class="form-msg bad" role="alert">' + e(n.error) + "</p>"; return; }
    history.replaceState(null, "", "?d=" + encodeURIComponent(n.domain));
    out.innerHTML = '<div class="record"><span class="spinner" aria-hidden="true"></span> Running 14 checks on ' + e(n.domain) + "…</div>";
    evaluate(n.domain).then(function (r) {
      if (r.ns.status === 3) { out.innerHTML = '<div class="record"><p>' + e(n.domain) + ' isn’t registered, so there is nothing to check yet. <a href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(n.domain) + '">See registration options</a>.</p></div>'; return; }
      if (r.ns.status === -1 && r.a.status === -1) { out.innerHTML = '<div class="record"><p>DNS resolvers didn’t answer from this browser. A privacy extension or network filter may be blocking DNS-over-HTTPS. Try another network.</p></div>'; return; }
      render(n.domain, grade(n.domain, r));
    });
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); run(); });
  var p = new URLSearchParams(location.search).get("d");
  if (p) { document.getElementById("health-q").value = p; run(); }
})();
