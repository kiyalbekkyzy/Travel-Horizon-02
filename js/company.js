/* Турфирма: «почему мы», вопросы, отдельная страница тура. Тексты фирмы берутся из админки (вкладка «О компании»). */
(function () {
  "use strict";
  var W = window.WT, $ = function (i) { return document.getElementById(i); }, t = function (k) { return W.t(k); }, tr = function (o) { return W.tr(o); }, esc = W.esc;
  function co() { return (W.S && W.S.company) || {}; }

  /* ---------- Почему мы + цифры ---------- */
  W.sec({ id: "company", key: "company", nav: "nCo", order: 15, cls: "dark",
    html: function () {
      var c = co(), ic = ["star", "pin", "cal", "ph", "map", "sun"];
      return '<div class="wrap">' + W.head("tCo", "sCo") +
        ((c.stats || []).length ? '<ul class="stats">' + c.stats.map(function (s) { return "<li><b>" + esc(s.n) + "</b><span>" + esc(tr(s.l)) + "</span></li>"; }).join("") + "</ul>" : "") +
        '<div class="why">' + (c.why || []).map(function (w, i) { return '<article class="why-c">' + (W.ICONS[ic[i % ic.length]] || "") + "<h3>" + esc(tr(w.t)) + "</h3><p>" + esc(tr(w.d)) + "</p></article>"; }).join("") + "</div></div>";
    } });

  /* ---------- Вопросы и оплата ---------- */
  W.sec({ id: "faq", key: "faq", nav: "nFaq", order: 100,
    html: function () {
      var c = co();
      return '<div class="wrap">' + W.head("tFaq", "sFaq") + '<div class="faq">' + (c.faq || []).map(function (f) { return '<details class="faq-i"><summary>' + esc(tr(f.q)) + "</summary><p>" + esc(tr(f.a)) + "</p></details>"; }).join("") + "</div>" +
        (tr(c.pay) ? '<aside class="pay-b"><b>' + esc(t("tpPay")) + "</b><p>" + esc(tr(c.pay)) + "</p></aside>" : "") + "</div>";
    } });

  /* ---------- Страница тура: адрес #tour/ID ---------- */
  function tourById(id) { return (W.S.tours || []).filter(function (x) { return x.id === id; })[0]; }
  function lines(v) { return tr(v).split("\n").map(function (s) { return s.trim(); }).filter(Boolean); }
  function waLink(x) { var d = String(W.S.wa || "").replace(/\D/g, ""); return d ? "https://wa.me/" + d + "?text=" + encodeURIComponent(t("tpHi") + " «" + tr(x.t) + "»") : ""; }
  function tgLink(x) { var u = String(W.S.tg || "").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""); return u ? "https://t.me/" + u : ""; }
  function telLink() { var d = String(W.S.phone || "").replace(/[^\d+]/g, ""); return d ? "tel:" + d : ""; }
  function fact(label, val) { return val ? "<li><span>" + esc(label) + "</span><b>" + esc(val) + "</b></li>" : ""; }
  function pageHtml(x) {
    var r = W.region(x.r), imgs = (x.imgs && x.imgs.length ? x.imgs : [x.img]).filter(Boolean), prog = lines(x.prog), inc = lines(x.inc), exc = lines(x.exc), dates = lines(x.dates);
    var wa = waLink(x), tg = tgLink(x), tel = telLink(), price = x.p ? t("tpFrom") + " " + W.price(x.p) : t("ask");
    var days = prog.map(function (l) {
      var m = l.match(/^((?:День|Day|Día|第)\s*\d+[^.:：]*)[.:：]\s*(.*)$/i);
      return m ? '<details class="dayx" open><summary>' + esc(m[1]) + "</summary><p>" + esc(m[2]) + "</p></details>" : '<p class="dayp">' + esc(l) + "</p>";
    }).join("");
    var others = (W.S.tours || []).filter(function (o) { return o.id !== x.id && (o.r === x.r || !x.r); }).slice(0, 3);
    return '<div class="tp-bar"><button type="button" class="tp-back" data-act="tpclose">‹ ' + esc(t("tpBack")) + '</button><b>' + esc(W.S.site.name || "") + '</b><button type="button" class="btn small" data-act="tpbook" data-id="' + x.id + '">' + esc(t("tpBook")) + '</button></div>' +
      '<div class="tp-w"><div class="tp-main"><div class="tp-g"><div class="tp-big" id="tpMain">' + (imgs[0] ? W.img(imgs[0], tr(x.t)) : "") + "</div>" +
      (imgs.length > 1 ? '<div class="tp-th">' + imgs.map(function (s, i) { return '<button type="button" data-act="tpimg" data-s="' + esc(s) + '" aria-label="' + (i + 1) + '">' + W.img(s, "") + "</button>"; }).join("") + "</div>" : "") + "</div>" +
      '<span class="badge st">' + esc(x.k === "horse" ? t("horse") : t("multi")) + "</span><h1>" + esc(tr(x.t)) + "</h1><p class=\"tp-lead\">" + esc(tr(x.d)) + "</p>" +
      '<ul class="tp-f">' + fact(t("tpDur"), x.days ? x.days + " " + t("daysWord") : "") + (r ? '<li><span>' + esc(t("regions")) + '</span><b><button type="button" class="link" data-act="tpregion" data-id="' + r.id + '">' + esc(tr(r.n)) + "</button></b></li>" : "") + fact(t("tpGroup"), x.group ? x.group + " " + t("tpPeople") : "") + fact(t("tpLevel"), tr(x.level)) + fact(t("tpSeason"), tr(x.season)) + "</ul>" +
      (days ? "<h2>" + esc(t("program")) + '</h2><div class="tp-days">' + days + "</div>" : "") +
      ((inc.length || exc.length) ? '<div class="tp-ie">' + (inc.length ? "<div><h3>" + esc(t("included")) + '</h3><ul class="ok">' + inc.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>" : "") + (exc.length ? "<div><h3>" + esc(t("notIncl")) + '</h3><ul class="no">' + exc.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>" : "") + "</div>" : "") +
      (dates.length ? "<h2>" + esc(t("tpDates")) + '</h2><ul class="tp-dates">' + dates.map(function (s) { var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/), v = s; if (m) { try { v = new Intl.DateTimeFormat(W.lang === "zh" ? "zh-CN" : W.lang, { day: "numeric", month: "long", year: "numeric" }).format(new Date(+m[1], +m[2] - 1, +m[3])); } catch (e) {} } return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>" : "") + "</div>" +
      '<aside class="tp-book"><div class="tp-pr"><small>' + esc(x.p ? t("tpFrom") : "") + "</small><b>" + esc(x.p ? W.price(x.p) : t("ask")) + "</b></div>" +
      '<button type="button" class="btn full" data-act="tpbook" data-id="' + x.id + '">' + esc(t("tpBook")) + "</button>" +
      '<div class="tp-ct">' + (wa ? '<a class="btn ghost" href="' + esc(wa) + '" target="_blank" rel="noopener">' + W.ICONS.wa + esc(t("tpWa")) + "</a>" : "") + (tg ? '<a class="btn ghost" href="' + esc(tg) + '" target="_blank" rel="noopener">' + W.ICONS.tg + esc(t("tpTg")) + "</a>" : "") + (tel ? '<a class="btn ghost" href="' + esc(tel) + '">' + W.ICONS.ph + esc(t("tpCall")) + "</a>" : "") + "</div>" +
      (tr(co().pay) ? '<p class="tp-pay"><b>' + esc(t("tpPay")) + ".</b> " + esc(tr(co().pay)) + "</p>" : "") + "</aside></div>" +
      (others.length ? '<div class="tp-oth"><h2>' + esc(t("tpMore")) + '</h2><div class="cards3">' + others.map(function (o) { return '<article class="card tour" data-act="tour" data-id="' + o.id + '" tabindex="0" role="button"><div class="c-img">' + W.img(o.img, tr(o.t)) + '</div><div class="c-b"><h3>' + esc(tr(o.t)) + "</h3><p>" + esc(tr(o.d)) + '</p><div class="c-f"><span>' + (o.days ? esc(o.days + " " + t("daysWord")) : "") + "</span><b>" + (o.p ? esc(t("from") + " " + W.price(o.p)) : esc(t("ask"))) + "</b></div></div></article>"; }).join("") + "</div></div>" : "");
  }

  var lastScroll = 0;
  function show(id) {
    var x = tourById(id), box = $("tourPage");
    if (!box) { box = document.createElement("div"); box.id = "tourPage"; box.className = "tp"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); document.body.appendChild(box); }
    if (!x) { hide(); return; }
    if (box.hidden !== false && !document.body.classList.contains("tp-open")) lastScroll = window.scrollY;
    box.innerHTML = pageHtml(x); box.hidden = false; box.scrollTop = 0; document.body.classList.add("tp-open"); document.title = tr(x.t) + " — " + (W.S.site.name || "");
  }
  function hide() { var box = $("tourPage"); if (box) box.hidden = true; document.body.classList.remove("tp-open"); document.title = W.S.site.name || document.title; }
  function route() {
    var m = location.hash.match(/^#tour\/(.+)$/);
    if (m) show(decodeURIComponent(m[1])); else if ($("tourPage") && !$("tourPage").hidden) { hide(); }
  }
  window.addEventListener("hashchange", route);
  W.acts.tour = function (el) { var id = el.getAttribute("data-id"); if (W.closeModal) W.closeModal(); location.hash = "#tour/" + encodeURIComponent(id); };
  W.acts.tpclose = function () { if (history.length > 1 && /^#tour\//.test(location.hash)) history.back(); else { history.replaceState(null, "", location.pathname + location.search + "#tours"); hide(); } setTimeout(function () { if (!/^#tour\//.test(location.hash)) { var s = $("tours"); if (s) s.scrollIntoView(); } }, 30); };
  W.acts.tpimg = function (el) { $("tpMain").innerHTML = W.img(el.getAttribute("data-s"), ""); };
  W.acts.tpbook = function (el) { var id = el.getAttribute("data-id"); history.replaceState(null, "", location.pathname + location.search + "#plan"); hide(); if (W.setTour) W.setTour(id); };
  W.acts.tpregion = function (el) { var id = el.getAttribute("data-id"); history.replaceState(null, "", location.pathname + location.search + "#regions"); hide(); var s = $("regions"); if (s) s.scrollIntoView(); if (W.openRegion) W.openRegion(id); };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && $("tourPage") && !$("tourPage").hidden) W.acts.tpclose(); });

  var prevAfter = W.afterRender;
  W.afterRender = function () { if (prevAfter) prevAfter(); if (/^#tour\//.test(location.hash)) route(); };
  setTimeout(route, 0);
  var prevBoot = W.boot; W.boot = function () { if (prevBoot) prevBoot(); route(); };
})();
