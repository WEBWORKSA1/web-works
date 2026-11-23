/* Filters for the news wire and video shelf */
(function () {
  "use strict";
  var WW = window.WW;
  var list = document.getElementById("news-list") || document.getElementById("video-list");
  if (!list) return;
  var items = WW.$$("[data-cat]", list), q = document.getElementById("news-q"), cat = "all";
  function apply() {
    var s = q ? q.value.trim().toLowerCase() : "";
    var shown = 0;
    items.forEach(function (it) {
      var ok = (cat === "all" || it.getAttribute("data-cat") === cat) && (!s || it.textContent.toLowerCase().indexOf(s) > -1);
      it.hidden = !ok; if (ok) shown++;
    });
    var empty = document.getElementById("filter-empty");
    if (!shown && !empty) list.insertAdjacentHTML("afterend", '<div class="empty" id="filter-empty">Nothing matches. Clear the search or pick another topic.</div>');
    if (shown && empty) empty.remove();
  }
  WW.$$("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      cat = b.getAttribute("data-filter");
      WW.$$("[data-filter]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      apply();
    });
  });
  if (q) q.addEventListener("input", apply);
})();
