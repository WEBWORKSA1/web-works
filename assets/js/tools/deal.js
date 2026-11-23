/* Deal calculator */
(function () {
  "use strict";
  var WW = window.WW, e = WW.esc;
  var form = document.getElementById("deal-form");
  if (!form) return;
  function v(id) { var x = parseFloat(document.getElementById(id).value); return isNaN(x) ? 0 : x; }
  function $(n) { return "$" + n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  function calc() {
    var P = Math.max(0, v("dc-price"));
    var esc = Math.max(P * v("dc-esc") / 100, v("dc-escmin")), who = document.getElementById("dc-escwho").value;
    var escB = who === "buyer" ? esc : who === "split" ? esc / 2 : 0, escS = esc - escB;
    var broker = v("dc-bfee") + P * v("dc-bcom") / 100;
    var mkt = P * v("dc-mcom") / 100, sb = P * v("dc-scom") / 100;
    var down = P * v("dc-down") / 100, months = Math.max(1, Math.round(v("dc-months"))), leaseTotal = P * (1 + v("dc-lfee") / 100), monthly = (leaseTotal - down) / months;
    var rows = [
      ["Direct deal + escrow", P + escB, P - escS, "Escrow " + $(esc) + " (" + (who === "split" ? "split" : who + " pays") + ")"],
      ["Buy-side broker + escrow", P + broker + escB, P - escS, "Broker " + $(broker) + " on top of the price"],
      ["Marketplace sale", P, P - mkt, "Commission " + $(mkt) + "; payment handled by the marketplace"],
      ["Sell-side broker + escrow", P + escB, P - sb - escS, "Broker " + $(sb) + " from the seller"],
      ["Lease to own", leaseTotal, leaseTotal - mkt, $(down) + " down, then " + months + " × " + $(Math.round(monthly * 100) / 100)]
    ];
    var h = '<div class="record-head"><div class="record-name" style="font-size:1.4rem">' + (document.getElementById("dc-domain").value ? e(document.getElementById("dc-domain").value) + " at " : "") + $(P) + '</div><span class="status info">By route</span></div>';
    h += '<div class="table-wrap"><table><thead><tr><th>Route</th><th class="n">Buyer pays</th><th class="n">Seller nets</th></tr></thead><tbody>';
    rows.forEach(function (r) { h += "<tr><td><b>" + e(r[0]) + '</b><div class="small muted">' + e(r[3]) + '</div></td><td class="n">' + $(Math.round(r[1] * 100) / 100) + '</td><td class="n">' + $(Math.round(r[2] * 100) / 100) + "</td></tr>"; });
    h += '</tbody></table></div><p class="small muted" style="margin-top:.75rem">Lease-to-own seller net assumes the lease runs through a marketplace at the commission above. Taxes, transfer and renewal fees are not included.</p>';
    document.getElementById("deal-out").innerHTML = h;
    document.getElementById("ladder").innerHTML = "<dt>Opening offer</dt><dd>" + $(Math.round(P * 0.55)) + "</dd><dt>Second offer</dt><dd>" + $(Math.round(P * 0.75)) + "</dd><dt>Target</dt><dd>" + $(P) + "</dd><dt>Walk-away ceiling</dt><dd>" + $(Math.round(P * 1.2)) + ' <span class="small muted">decide this before you start</span></dd>';
    var d = document.getElementById("dc-domain").value.trim();
    document.getElementById("dc-cta").href = WW.base + "get-started/?goal=buy" + (d ? "&domain=" + encodeURIComponent(d) : "") + "&budget=" + encodeURIComponent($(P));
  }
  form.addEventListener("input", calc);
  form.addEventListener("change", calc);
  calc();
})();
