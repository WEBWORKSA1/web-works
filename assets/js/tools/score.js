/* Domain name score: transparent heuristic, not an appraisal */
(function () {
  "use strict";
  var WW = window.WW, D = WW.domain, e = WW.esc;
  var form = document.getElementById("sc-form"), out = document.getElementById("sc-out");
  if (!form) return;
  var WORDS = ("able about account act action active ad admin advice age agent air alert all alpha amber anchor angel app apple arc area arena art asset atlas audio auto away baby back bake bank bar base basket bay beach beam bean bear beat bee bell best bet bid big bike bill bird bit black blade blank blend block blog bloom blue board boat body bold bolt bond book boost boot box brain brand brave bread break brew brick bridge bright bring broker brush budget build bull burst bus buy buzz cab cafe cake call calm camp can cap capital car card care cargo cart case cash cast cat cell center chain chair chat check chef chip city civic claim class clean clear click client climb clinic clock cloud club coach coast code coffee coin cold color comet cook cool copy core corner cost cove craft crane credit crew crop cross crowd crown cube cup cure dash data date day deal deck deep delta den dental design desk dial diet digital direct dish dock doctor dog dollar door dot dove draft dream drift drink drive drop drum duck dust eagle earth east easy echo edge egg elite ember energy engine epic equity estate event ever exact expert eye face fact fair faith farm fast father feed field file film finance find fine fire firm first fish fit five flag flash fleet flex flight flip flow flower fly focus fold food foot force forest forge form fort forum fox frame free fresh friend front fruit fuel fun fund future gain game garden gate gear gem giant gift glass global glow go goal gold golf good grace grade grain grand graph grass green grid group grow guard guide hand happy harbor hat haven head health heart heat help hero high hill hire hive home honey hook hope horse host hot hotel house hub human idea image index ink inn insure insurance invest iron island item jet job join joy judge juice jump just keen key kid kind king kit kite lab lake land lane laser launch law lawyer lead leaf lean learn legal lens level life lift light lime line link lion list live loan local lock logic loop lord love lucky lumen lunar mail main maker mall map maple market mart master match mate max meal media medic meet mega metro mile milk mill mind mint mix mobile mode money moon more motion motor mountain move movie music name nation native nature near nest net new news next nice night noble north note nova oak ocean office oil one open orange orbit order origin owl pack page paint pal palm pan paper park part pass path pay peace peak pear pen people pet phone photo pick pilot pin pine pink pixel place plan plane plant plate play plaza plus pocket point polar pool pop port post power press prime print prism pro profit project proof pulse pure push quest quick quiet race radio rain rally ranch rapid rate ray ready real red relay rent rest rich ride ridge right ring rise river road robot rock rocket roof room root rose route royal ruby rule run safe sage sail sale salt sand save scale scan school score sea seal search seed sell send sense serve set shade shape share sharp shell shield shift shine ship shop shore show side sign signal silk silver simple sing site sky sleep slice smart smile snap snow soft solar solid song sonic soul sound source south space spark speed spice spin spirit spot spring square stack staff stage star start state station steel step stock stone store storm story stream street strong studio style sugar suite summit sun super sure surf swift table tag talent talk tank tap task taste tax taxi team tech tent test text theory think tide tiger time tiny tip title today token tool top torch total touch tour tower town toy track trade trail train travel tree trend tribe trip true trust truth tune turbo twin unit united up urban user valley value van vault vector venture verse via video view villa vine vision visit vista vital vivid voice volt vote voyage wall wave way wealth web week well west whale wheel white wild win wind wine wing wise wolf wonder wood word work works world yard year yes yoga young zen zero zone").split(" ");
  var DICT = {}; WORDS.forEach(function (w) { DICT[w] = 1; });
  var HOT = ["insurance", "insure", "loan", "mortgage", "lawyer", "legal", "law", "credit", "finance", "invest", "bank", "pay", "money", "cash", "crypto", "ai", "cloud", "data", "tech", "software", "app", "health", "dental", "clinic", "medic", "doctor", "travel", "hotel", "home", "estate", "car", "auto", "solar", "energy", "shop", "market", "store", "trade", "broker", "job", "hire", "school", "learn", "security", "web", "host"];
  var TLD = { com: 20, net: 13, org: 13, io: 14, ai: 15, co: 14, ca: 12, uk: 12, de: 12, in: 11, au: 11, us: 10, app: 10, dev: 10, shop: 9, store: 8, works: 8, studio: 8, online: 6, site: 5, xyz: 5, info: 5, biz: 4 };

  function segment(s) {
    var best = [[]], n = s.length;
    for (var i = 1; i <= n; i++) {
      best[i] = null;
      for (var j = Math.max(0, i - 12); j < i; j++) {
        var w = s.slice(j, i);
        if (best[j] && DICT[w] && (!best[i] || best[j].length + 1 < best[i].length)) best[i] = best[j].concat([w]);
      }
    }
    return best[n];
  }
  function score(domain) {
    var parts = domain.split("."), tld = parts.pop(), sld = parts.join(".");
    var core = sld.replace(/-/g, ""), len = sld.length, f = [];
    // length
    var L = len <= 4 ? 25 : len === 5 ? 24 : len === 6 ? 22 : len === 7 ? 20 : len === 8 ? 17 : len === 9 ? 14 : len === 10 ? 11 : len <= 12 ? 8 : len <= 15 ? 5 : 2;
    f.push(["Length", L, 25, len + " characters before the extension."]);
    // extension
    var T = TLD[tld] != null ? TLD[tld] : (tld.length === 2 ? 9 : 6);
    f.push(["Extension", T, 20, "." + tld + (T >= 18 ? " is the default people type." : T >= 12 ? " is widely trusted." : T >= 9 ? " is recognised but less typed by default." : " is less familiar to most people.")]);
    // characters
    var digits = /\d/.test(sld), hyph = /-/.test(sld), allNum = /^\d+$/.test(sld);
    var C = allNum ? (len <= 5 ? 9 : 4) : 10 - (digits ? 4 : 0) - (hyph ? 6 : 0);
    C = Math.max(0, C);
    f.push(["Characters", C, 10, allNum ? "All-number name; short numerics have their own buyers." : (digits || hyph ? (hyph ? "Hyphen" : "") + (hyph && digits ? " and " : "") + (digits ? "digits" : "") + " make it harder to say and share." : "Letters only.")]);
    // clarity
    var seg = allNum ? null : segment(core);
    var Cl, why;
    if (allNum) { Cl = 12; why = "Numbers read clearly in many languages."; }
    else if (seg && seg.length === 1) { Cl = 20; why = "A single real word: " + seg[0] + "."; }
    else if (seg && seg.length === 2) { Cl = 15; why = "Two words: " + seg.join(" + ") + "."; }
    else if (seg && seg.length === 3) { Cl = 9; why = "Three words: " + seg.join(" + ") + ". Harder to remember."; }
    else if (seg) { Cl = 4; why = seg.length + " words: " + seg.join(" + ") + "."; }
    else { Cl = 0; why = "Not made of common words (invented or brandable)."; }
    // pronunciation
    var v = (core.match(/[aeiouy]/g) || []).length, ratio = core.length ? v / core.length : 0;
    var P = 15, pnotes = [];
    if (!allNum) {
      if (ratio < 0.25) { P -= 7; pnotes.push("few vowels"); }
      if (ratio > 0.65) { P -= 4; pnotes.push("many vowels"); }
      if (/[^aeiouy\d]{4,}/.test(core)) { P -= 5; pnotes.push("a long consonant cluster"); }
      if (/(.)\1\1/.test(core)) { P -= 4; pnotes.push("a tripled letter"); }
      if (/[qxz]{2}|[jqvwx]{2}/.test(core)) { P -= 2; pnotes.push("an awkward letter pair"); }
    } else { P = 10; pnotes.push("numbers can be said several ways"); }
    P = Math.max(0, P);
    if (!seg && !allNum) { Cl = Math.round(P * 0.7); why += " Scored on how cleanly it reads."; }
    f.push(["Clarity", Cl, 20, why]);
    f.push(["Pronunciation", P, 15, pnotes.length ? "Loses points for " + pnotes.join(", ") + "." : "Easy to say on first sight."]);
    // commercial
    var hot = HOT.filter(function (k) { return core.indexOf(k) > -1 && (k.length > 2 || core === k || core.slice(-2) === k || core.slice(0, 2) === k); });
    var M = hot.length ? 10 : 4;
    f.push(["Commercial pull", M, 10, hot.length ? "Contains " + hot.slice(0, 3).join(", ") + ", from industries that pay for customers." : "No high-value industry keyword."]);
    var total = f.reduce(function (a, x) { return a + x[1]; }, 0);
    return { total: total, factors: f, tld: tld, sld: sld };
  }
  function band(s) {
    if (s >= 85) return ["ok", "Strong", "Short, clear and on a top extension. Names like this attract unsolicited offers; price it against comparable sales, not the score."];
    if (s >= 70) return ["ok", "Good", "A solid brand candidate. Resale is possible to the right end user, especially with an active business in that space."];
    if (s >= 55) return ["warn", "Fair", "Usable for a business. Resale value is usually close to the registration cost unless a specific buyer needs it."];
    return ["bad", "Weak", "Long, hard to say or on an uncommon extension. Fine for a campaign or redirect, rarely worth buying at a premium."];
  }
  function run(v) {
    var n = D.normalize(v);
    if (!n.ok) { out.innerHTML = '<p class="form-msg bad" role="alert">' + e(n.error) + "</p>"; return; }
    history.replaceState(null, "", "?d=" + encodeURIComponent(n.domain));
    var r = score(n.domain), b = band(r.total);
    var h = '<div class="record result-enter"><div class="record-head"><div><div class="record-name">' + e(n.display) + '</div><span class="status ' + b[0] + '">' + b[1] + '</span></div><div class="score-big">' + r.total + '<span style="font-size:1.2rem;color:var(--ink-3)">/100</span></div></div><p>' + e(b[2]) + "</p>";
    h += '<div class="table-wrap"><table><thead><tr><th>Factor</th><th style="width:40%">Score</th><th>Why</th></tr></thead><tbody>';
    r.factors.forEach(function (x) { h += "<tr><td><b>" + e(x[0]) + '</b></td><td><div class="meter"><i style="width:' + (x[1] / x[2] * 100) + '%"></i></div><span class="small num">' + x[1] + " of " + x[2] + "</span></td><td>" + e(x[3]) + "</td></tr>"; });
    h += '</tbody></table></div><p class="small muted" style="margin-top:.75rem">This is an automated rating, not an appraisal or an offer.</p>';
    h += '<div class="actions btn-row"><a class="btn btn-small" href="' + WW.base + "tools/domain-lookup/?d=" + encodeURIComponent(n.domain) + '">Is it registered?</a><a class="btn btn-ghost btn-small" href="' + WW.base + "get-started/?goal=sell&domain=" + encodeURIComponent(n.domain) + '">Get a human valuation</a><a class="btn btn-ghost btn-small" href="' + WW.base + "tools/deal-calculator/?d=" + encodeURIComponent(n.domain) + '">Work out deal costs</a></div></div>';
    out.innerHTML = h;
  }
  form.addEventListener("submit", function (ev) { ev.preventDefault(); run(document.getElementById("sc-q").value); });
  WW.$$("[data-sc]").forEach(function (b) { b.addEventListener("click", function () { document.getElementById("sc-q").value = b.getAttribute("data-sc"); run(b.getAttribute("data-sc")); }); });
  var p = new URLSearchParams(location.search).get("d");
  if (p) { document.getElementById("sc-q").value = p; run(p); }
  WW.scoreDomain = score;
})();
