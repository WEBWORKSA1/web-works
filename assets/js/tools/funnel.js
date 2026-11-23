/* Project planner: three-step lead funnel */
(function () {
  "use strict";
  var WW = window.WW;
  var form = document.getElementById("funnel");
  if (!form) return;
  var steps = WW.$$(".step", form), marks = WW.$$("#f-steps li"), cur = 0;
  var COPY = {
    buy: { budget: "Your ceiling for the domain", hint: "The name you want to buy", plan: ["Who owns it and how they use it", "A realistic price range from comparable sales", "Our anonymous outreach approach", "Research and success fees"] },
    sell: { budget: "Price you have in mind", hint: "The name or names you want to sell or value", plan: ["A valuation range with comparable sales", "Likely buyer types and where to reach them", "Listing, landing page and pricing advice", "Our fee if you want us to broker it"] },
    monitor: { budget: "Monthly budget", hint: "Your domains and brand names (paste a list)", plan: ["What we would watch and how often", "Who gets alerted, and how", "Quick security wins we already spotted", "A monthly price for your portfolio size"] },
    brand: { budget: "Budget for the name and domain", hint: "Any names you already like (optional)", plan: ["The naming brief we would work from", "Delivery timeline for the shortlist", "Domain budget guidance", "A fixed price for the sprint"] },
    build: { budget: "Project budget", hint: "The domain the site will live on", plan: ["Site structure and page list", "How it will earn: ads, leads or both", "Launch checklist items included", "A fixed price and timeline"] },
    consult: { budget: "Budget", hint: "The domains involved, if any", plan: ["What we would look at first", "Quick fixes you can make today", "Scope and a fixed price", "Timeline"] }
  };
  function show(i) {
    cur = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    marks.forEach(function (m, k) { m.className = k === i ? "on" : k < i ? "done" : ""; if (k === i) m.setAttribute("aria-current", "step"); else m.removeAttribute("aria-current"); });
    var first = steps[i].querySelector("input:not([type=hidden]), select, textarea");
    if (first && i > 0) first.focus();
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
  }
  function goal() { var g = form.querySelector('[name="goal"]:checked'); return g ? g.value : ""; }
  function tailor() {
    var c = COPY[goal()]; if (!c) return;
    document.getElementById("f-budget-label").textContent = c.budget;
    document.getElementById("f-domain-hint").textContent = c.hint;
    document.getElementById("f-preview-list").innerHTML = c.plan.map(function (p) { return "<li>" + WW.esc(p) + "</li>"; }).join("");
  }
  form.addEventListener("change", function (ev) { if (ev.target.name === "goal") tailor(); });
  form.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-next]")) {
      if (cur === 0 && !goal()) { var box = steps[0].querySelector(".choice span"); steps[0].querySelector("input").focus(); box && box.scrollIntoView({ block: "center" }); WW.showMsg(steps[0], false, "Choose what you want to do."); return; }
      if (!WW.validate(steps[cur])) return;
      var m = steps[0].querySelector(".form-msg"); if (m) m.hidden = true;
      show(Math.min(cur + 1, steps.length - 1));
    }
    if (ev.target.closest("[data-back]")) show(Math.max(cur - 1, 0));
  });
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!WW.validate(steps[2])) return;
    var btn = form.querySelector('[type="submit"]'), label = btn.textContent;
    btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending';
    var labels = { buy: "Acquisition", sell: "Sale / valuation", monitor: "Monitoring", brand: "Naming", build: "Website build", consult: "Consulting" };
    form.setAttribute("data-subject", "New " + (labels[goal()] || "project") + " request");
    WW.send(form, { lead_type: labels[goal()] || goal() }).then(function () {
      form.hidden = true; WW.$("#f-steps").hidden = true;
      var done = document.getElementById("f-done"); done.hidden = false; done.focus();
      try { if (window.gtag) window.gtag("event", "generate_lead", { lead_type: goal() }); } catch (e) { /* optional */ }
    }).catch(function () {
      WW.showMsg(steps[2], false, "That didn’t go through. Check your connection and press Send again.");
    }).then(function () { btn.disabled = false; btn.textContent = label; });
  });
  // preselected goal from URL (?goal=buy) jumps to step 2
  if (goal()) { tailor(); show(1); }
})();
