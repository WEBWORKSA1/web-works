/* Launch checklist: progress saved locally */
(function () {
  "use strict";
  var WW = window.WW, boxes = WW.$$("[data-ck]");
  if (!boxes.length) return;
  var state = WW.store.get("checklist", {});
  function update() {
    var done = boxes.filter(function (b) { return b.checked; }).length, pct = Math.round(done / boxes.length * 100);
    document.getElementById("ck-pct").textContent = pct + "%";
    document.getElementById("ck-bar").style.width = pct + "%";
    document.getElementById("ck-count").textContent = done + " of " + boxes.length + " done";
  }
  boxes.forEach(function (b) {
    b.checked = !!state[b.getAttribute("data-ck")];
    b.addEventListener("change", function () { state[b.getAttribute("data-ck")] = b.checked; WW.store.set("checklist", state); update(); });
  });
  document.getElementById("ck-reset").addEventListener("click", function () { state = {}; WW.store.set("checklist", state); boxes.forEach(function (b) { b.checked = false; }); update(); });
  update();
})();
