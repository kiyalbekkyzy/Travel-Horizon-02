/* Разделы: области + карта, туры, «когда ехать» (сезоны + погода), конструктор маршрута. */
(function () {
  var W = window.WT, $ = W.$, esc = W.esc, tr = W.tr, t = W.t;
  var selR = null;

  /* ---------- Области и схематичная карта ---------- */
  function monthsBar(r, hi) {
    var m = r.months || [], now = new Date().getMonth();
    return '<div class="mbar">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) {
      var v = m[i] == null ? 1 : m[i];
      return '<span class="m' + v + (i === now && hi ? " now" : "") + '" title="' + esc(W.month(i, true) + ": " + t("s" + v)) + '"><i>' + (v ? '<b>' + "★".repeat(v) + "</b>" : "") + '</i><small>' + esc(W.month(i)) + "</small></span>";
    }).join("") + "</div>";
  }
  function starLegend() { return '<div class="st-leg"><span><b>★★★</b> ' + esc(t("s3")) + '</span><span><b>★★</b> ' + esc(t("s2")) + '</span><span><b>★</b> ' + esc(t("s1")) + "</span></div>"; }
  function seeSlot(r, i) {
    var names = W.list(r.see), nm = names[i] || "", u = ((r.seeImg || {})[i]) || "";
    return '<div class="rp-img">' + (u ? W.img(u, nm) : '<div class="rp-ph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l5-7 4 5 3-4 6 6zM8 6a2 2 0 110 .01" fill="currentColor"/></svg><b>' + esc(nm) + "</b><small>" + esc(t("photoSoon")) + "</small></div>") + '<span class="rp-cap">' + esc(nm) + "</span></div>";
  }
  function panel(r, modal) {
    var tags = function (a, c) { return W.list(a).map(function (x) { return '<span class="tag ' + c + '">' + esc(x) + "</span>"; }).join(""); };
    var lg = r.lg || {}, tours = (W.S.tours || []).filter(function (x) { return x.r === r.id; });
    var paras = function (v) { return tr(v || "").split("\n").filter(Boolean); };
    var legend = tr(lg.d) ? '<details class="rp-lg"><summary>' + esc(t("legendBtn")) + (tr(lg.t) ? ": " + esc(tr(lg.t)) : "") + "</summary>" + paras(lg.d).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      (!modal && paras(lg.f).length ? '<ul class="facts">' + paras(lg.f).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") + "</details>" : "";
    var facts = modal && paras(lg.f).length ? '<div class="rp-facts"><span class="tl">' + esc(t("facts")) + '</span><ul class="facts">' + paras(lg.f).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul></div>" : "";
    return '<div class="rp-main"><div class="rp-img">' + W.img(r.img, tr(r.n)) + W.heart("r:" + r.id) + "</div></div><h3>" + esc(tr(r.n)) + "</h3><p>" + esc(tr(r.d)) + "</p>" +
      (W.list(r.food).length ? '<span class="tl">' + esc(t("food")) + "</span><div>" + tags(r.food, "s") + "</div>" : "") +
      (W.list(r.see).length ? '<span class="tl">' + esc(t("see")) + ' <small class="muted">' + esc(t("seeTap")) + '</small></span><div class="see-t">' + W.list(r.see).map(function (x, i) { return '<button type="button" class="tag seeb" data-act="seepick" data-i="' + i + '" aria-pressed="false">' + esc(x) + "</button>"; }).join("") + "</div>" : "") +
      (modal ? facts : "") + legend +
      (tours.length ? '<span class="tl">' + esc(t("tT")) + '</span><div class="mini-t">' + tours.map(function (x) { return '<button type="button" class="link" data-act="tour" data-id="' + x.id + '">' + esc(tr(x.t)) + "</button>"; }).join("") + "</div>" : "") +
      (modal ? "" : '<div class="row-btns"><a class="btn small" href="#plan">' + esc(t("plan")) + "</a></div>");
  }
  W.sec({ id: "regions", key: "regions", nav: "regions", order: 60,
    html: function () {
      var S = W.S, M = window.WT_MAP || { w: 956, h: 620, pins: {}, img: "" };
      selR = selR || (S.regions.slice().sort(function (a, b) { return a.order - b.order; })[0] || {}).id;
      var pins = S.regions.map(function (r) {
        var p = (S.mapPins || {})[r.id] || M.pins[r.id]; if (!p) return "";
        return '<button type="button" class="pin' + (r.id === selR ? " on" : "") + '" data-act="rsel" data-id="' + r.id + '" style="left:' + (p[0] / M.w * 100).toFixed(2) + "%;top:" + (p[1] / M.h * 100).toFixed(2) + '%" aria-label="' + esc(tr(r.n)) + '"><i class="pulse"></i><i class="dot"></i><span>' + esc(tr(r.n).split(" ")[0]) + "</span></button>";
      }).join("");
      var cur = W.region(selR);
      var chips = '<div class="rchips" id="rchips" role="group">' + S.regions.map(function (r) { return '<button type="button" class="rchip' + (r.id === selR ? ' on' : '') + '" data-act="rsel" data-id="' + r.id + '">' + esc(tr(r.n)) + "</button>"; }).join("") + "</div>";
      return '<div class="wrap">' + W.head("tReg", "sR") + '<div class="map-grid"><div class="map-l"><figure class="mapbox"><div class="map-in"><img src="' + esc(M.img) + '" alt="' + esc(t("tReg")) + '">' + pins + "</div><figcaption>" + esc(t("mapNote")) + '</figcaption></figure>' + chips + '</div><aside class="rpanel" id="rpanel" data-rp="' + selR + '">' + (cur ? panel(cur) : "") + "</aside></div>" +
        ''+ "</div></div>";
    } });
  W.acts.seepick = function (el) {
    var box = el.closest("[data-rp]"), r = box && W.region(box.getAttribute("data-rp")), m = box && box.querySelector(".rp-main"), i = +el.getAttribute("data-i"), on = el.getAttribute("aria-pressed") === "true"; if (!r || !m) return;
    Array.prototype.forEach.call(box.querySelectorAll(".seeb"), function (b) { b.setAttribute("aria-pressed", "false"); });
    if (on) { m.innerHTML = '<div class="rp-img">' + W.img(r.img, tr(r.n)) + W.heart("r:" + r.id) + "</div>"; W.markFavs(); return; }
    el.setAttribute("aria-pressed", "true"); m.innerHTML = seeSlot(r, i);
  };
  W.acts.rsel = function (el) {
    selR = el.getAttribute("data-id"); var r = W.region(selR); if (!r) return;
    $("rpanel").innerHTML = panel(r); $("rpanel").setAttribute("data-rp", selR); document.querySelectorAll(".pin,.rchip").forEach(function (p) { p.classList.toggle("on", p.getAttribute("data-id") === selR); }); W.markFavs();
  };

  W.openRegion = function (id) {
    var r = W.region(id); if (!r) return;
    W.modal('<div class="rpanel in-modal" data-rp="' + r.id + '">' + panel(r, true) + "</div>", "wide");
  };

  /* ---------- Туры ---------- */
  function tourCard(x) {
    var r = W.region(x.r), k = x.k === "horse" ? t("horse") : t("multi");
    return '<article class="card tour" data-act="tour" data-id="' + x.id + '" tabindex="0" role="button"><div class="c-img">' + W.img(x.img, tr(x.t)) + '<span class="badge">' + esc(k) + "</span>" + W.heart("t:" + x.id) + '</div><div class="c-b"><small>' + (r ? esc(tr(r.n)) : "") + "</small><h3>" + esc(tr(x.t)) + "</h3><p>" + esc(tr(x.d)) + '</p><div class="c-f"><span>' + (x.days ? W.ICONS.clock + " " + esc(x.days + " " + t("daysWord")) : "") + "</span><b>" + (x.p ? esc(t("from") + " " + W.price(x.p)) : esc(t("ask"))) + "</b></div></div></article>";
  }
  function priceNum(p) { var m = String(p || "").replace(/,/g, "").match(/\d+(\.\d+)?/); if (!m) return null; var n = +m[0]; return /kgs|сом/i.test(p) ? n / 87 : n; }
  function tourMonths(x) { var d = x.dates; d = d && typeof d === "object" ? tr(d) : d; return String(d || "").split("\n").map(function (l) { var m = l.match(/(\d{4})-(\d{2})/); return m ? +m[2] - 1 : -1; }).filter(function (i) { return i >= 0; }); }
  function inPrice(x, c) { var n = priceNum(x.p); if (n == null) return false; return c === "1" ? n < 300 : c === "2" ? n >= 300 && n < 600 : c === "3" ? n >= 600 && n < 1000 : n >= 1000; }
  function tourDates(x) { var d = x.dates; d = d && typeof d === "object" ? tr(d) : d; return String(d || "").split("\n").map(function (l) { var m = l.match(/\d{4}-\d{2}-\d{2}/); return m ? m[0] : ""; }).filter(Boolean); }
  var calY = null, calM = null;
  function calInit() {
    if (calY != null) return; var now = new Date(), iso = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2), cnt = {}, best = "";
    W.S.tours.forEach(function (x) { tourDates(x).forEach(function (d) { if (d >= iso) { var k = d.slice(0, 7); cnt[k] = (cnt[k] || 0) + 1; if (!best || cnt[k] > cnt[best] || (cnt[k] === cnt[best] && k < best)) best = k; } }); });
    var b = best ? best.split("-") : null; calY = b ? +b[0] : now.getFullYear(); calM = b ? +b[1] - 1 : now.getMonth();
  }
  function calHtml() {
    calInit(); var f = W.filter, mark = {}; W.S.tours.forEach(function (x) { tourDates(x).forEach(function (d) { mark[d] = (mark[d] || 0) + 1; }); });
    var first = new Date(calY, calM, 1), pad = (first.getDay() + 6) % 7, n = new Date(calY, calM + 1, 0).getDate(), loc = W.lang === "zh" ? "zh-CN" : W.lang, h = "";
    var wd = []; try { for (var i = 0; i < 7; i++) wd.push(new Intl.DateTimeFormat(loc, { weekday: "short" }).format(new Date(2024, 0, 1 + i))); } catch (e) { wd = ["M", "T", "W", "T", "F", "S", "S"]; }
    var title = ""; try { title = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(first); } catch (e) { title = (calM + 1) + "/" + calY; }
    h += '<div class="cal-h"><button type="button" class="cal-n" data-act="calprev" aria-label="‹">‹</button><b>' + esc(title) + '</b><button type="button" class="cal-n" data-act="calnext" aria-label="›">›</button></div><div class="cal-g">';
    wd.forEach(function (w) { h += '<span class="cal-w">' + esc(w) + "</span>"; });
    for (var k = 0; k < pad; k++) h += "<span></span>";
    for (var d = 1; d <= n; d++) {
      var iso = calY + "-" + ("0" + (calM + 1)).slice(-2) + "-" + ("0" + d).slice(-2), has = mark[iso], on = f.date === iso;
      h += has ? '<button type="button" class="cal-d has' + (on ? " on" : "") + '" data-act="calday" data-d="' + iso + '" aria-pressed="' + on + '" title="' + has + '">' + d + "</button>" : '<span class="cal-d">' + d + "</span>";
    }
    return h + '</div><p class="cal-l"><i></i>' + esc(t("fLegend")) + "</p>";
  }
  W.acts.calprev = function () { calM--; if (calM < 0) { calM = 11; calY--; } var c = $("tCal"); if (c) c.innerHTML = calHtml(); };
  W.acts.calnext = function () { calM++; if (calM > 11) { calM = 0; calY++; } var c = $("tCal"); if (c) c.innerHTML = calHtml(); };
  W.acts.calday = function (el) { var d = el.getAttribute("data-d"); W.filter.date = W.filter.date === d ? "" : d; W.filter.m = ""; W.refreshTours(); };
  function toursList() {
    var f = W.filter, l = W.S.tours.filter(function (x) { return (!f.r || x.r === f.r) && (f.m === "" || f.m == null || tourMonths(x).indexOf(+f.m) >= 0) && (!f.date || tourDates(x).indexOf(f.date) >= 0) && (!f.p || inPrice(x, f.p)); });
    return l.length ? l.map(tourCard).join("") : '<p class="muted">' + esc(t("noTours")) + "</p>";
  }
  W.refreshTours = function () {
    var g = $("tGrid"); if (!g) return; g.innerHTML = toursList(); W.markFavs();
    var c = $("tCal"); if (c) { if (W.filter.m !== "" && W.filter.m != null && !W.filter.date) { calInit(); calM = +W.filter.m; var best = null; W.S.tours.forEach(function (x) { tourDates(x).forEach(function (d) { if (+d.slice(5, 7) - 1 === calM && (!best || d < best)) best = d; }); }); if (best) calY = +best.slice(0, 4); } c.innerHTML = calHtml(); } var s = $("tReg"); if (s) s.value = W.filter.r || ""; s = $("tPr"); if (s) s.value = W.filter.p || "";
  };
  W.sec({ id: "tours", key: "tours", nav: "tours", order: 10,
    html: function () {
      var f = W.filter, sel = function (id, label, opts, cur) { return '<label class="fsel"><span>' + esc(label) + '</span><select id="' + id + '" class="chip sel">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(cur == null ? "" : cur) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></label>"; };
      var months = [["", t("fAny")]].concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return [i, W.month(i, true)]; }));
      var prices = [["", t("fAny")], ["1", t("fp1")], ["2", t("fp2")], ["3", t("fp3")], ["4", t("fp4")]];
      var regs = [["", t("fAny")]].concat(W.S.regions.map(function (r) { return [r.id, tr(r.n)]; }));
      return '<div class="wrap">' + W.head("tT", "sT") + '<div class="tf" id="tFilt"><div class="cal" id="tCal">' + calHtml() + '</div><div class="tf-s">' + sel("tPr", t("fPrice"), prices, f.p) + sel("tReg", t("sbRegion"), regs, f.r) +
        '<button type="button" class="link" data-act="treset">' + esc(t("reset")) + '</button></div></div><div class="cards3" id="tGrid">' + toursList() + "</div></div>";
    },
    init: function () { [["tReg", "r"], ["tPr", "p"]].forEach(function (a) { $(a[0]).addEventListener("change", function () { W.filter[a[1]] = this.value; W.refreshTours(); }); }); } });
  W.acts.treset = function () { W.filter = { r: "", k: "", m: "", p: "", date: "" }; var a = ["sbR", "sbP", "sbM"]; a.forEach(function (i) { if ($(i)) $(i).value = ""; }); W.refreshTours(); };

  W.acts.tour = function (el) {
    var x = W.S.tours.filter(function (q) { return q.id === el.getAttribute("data-id"); })[0]; if (!x) return;
    var r = W.region(x.r), imgs = (x.imgs && x.imgs.length ? x.imgs : [x.img]), list = function (v) { return tr(v).split("\n").filter(Boolean).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join(""); };
    W.modal('<div class="tour-m"><div class="tm-g"><div class="tm-main" id="tmMain">' + W.img(imgs[0], tr(x.t)) + "</div>" + (imgs.length > 1 ? '<div class="tm-th">' + imgs.map(function (s, i) { return '<button type="button" data-act="tmimg" data-s="' + esc(s) + '" aria-label="' + (i + 1) + '">' + W.img(s, "") + "</button>"; }).join("") + "</div>" : "") + "</div>" +
      '<div class="tm-i"><span class="badge st">' + esc(x.k === "horse" ? t("horse") : t("multi")) + "</span><h2>" + esc(tr(x.t)) + '</h2><ul class="meta">' + (x.o ? "<li><b>" + esc(t("operator")) + ":</b> " + esc(x.o) + "</li>" : "") + (x.days ? "<li><b>" + esc(t("duration")) + ":</b> " + esc(x.days + " " + t("daysWord")) + "</li>" : "") + (r ? "<li><b>" + esc(t("regions")) + ':</b> <button type="button" class="link" data-act="region" data-id="' + r.id + '">' + esc(tr(r.n)) + "</button></li>" : "") + "<li><b>" + (x.p ? esc(t("from") + " " + W.price(x.p)) : esc(t("ask"))) + "</b></li></ul><p>" + esc(tr(x.d)) + "</p>" +
      (tr(x.prog) ? "<h3>" + esc(t("program")) + '</h3><ul class="plist">' + list(x.prog) + "</ul>" : "") + (tr(x.inc) ? "<h3>" + esc(t("included")) + '</h3><ul class="ok">' + list(x.inc) + "</ul>" : "") + (tr(x.exc) ? "<h3>" + esc(t("notIncl")) + '</h3><ul class="no">' + list(x.exc) + "</ul>" : "") +
      '<div class="row-btns"><a class="btn" href="#plan" data-act="book" data-id="' + x.id + '">' + esc(t("book")) + "</a>" + W.heart("t:" + x.id) + "</div></div></div>", "wide");
  };
  W.acts.tmimg = function (el) { $("tmMain").innerHTML = W.img(el.getAttribute("data-s"), ""); };
  W.acts.book = function (el) { W.closeModal(); if (W.setTour) W.setTour(el.getAttribute("data-id")); };

  /* ---------- Когда ехать: выберите месяц → понятные группы + таблица ---------- */
  var seaM = null, BADGE = ["", "", "", ""];
  function rate(r, m) { var v = (r.months || [])[m]; return v == null ? 1 : v; }
  function seaCard(r, m, k) {
    return '<button type="button" class="sc sc' + k + '" data-act="region" data-id="' + r.id + '">' + W.img(r.img, tr(r.n)) + "<span><b>" + esc(tr(r.n)) + "</b><small>" + esc(W.list(r.see).slice(0, 2).join(" · ")) + '</small><em class="wxs" data-r="' + r.id + '"></em></span></button>';
  }
  function seaBody() {
    var S = W.S, m = seaM, g = [[3, "seaBest"], [2, "seaGood"], [1, "seaOk"], [0, "seaNo"]];
    var out = g.map(function (a) {
      var l = S.regions.filter(function (r) { return rate(r, m) === a[0]; }); if (!l.length) return "";
      return '<div class="sg sg' + a[0] + '"><h3><i></i>' + esc(t(a[1])) + '</h3><div class="sg-l">' + l.map(function (r) { return seaCard(r, m, a[0]); }).join("") + "</div></div>";
    }).join("");
    if (!S.regions.some(function (r) { return rate(r, m) === 3; })) out = '<p class="muted sea-none">' + esc(t("seaNone")) + "</p>" + out;
    return '<h3 class="sea-in">' + esc(t("seaIn")) + " <b>" + esc(W.month(m, true)) + "</b></h3>" + out;
  }
  function seaTable() {
    var S = W.S, now = new Date().getMonth();
    return '<div class="ht-w"><table class="ht"><thead><tr><th></th>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return '<th class="' + (i === seaM ? "sel" : "") + '">' + esc(W.month(i)) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      S.regions.map(function (r) { return "<tr><th>" + esc(tr(r.n)) + "</th>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { var v = rate(r, i); return '<td class="h' + v + (i === seaM ? " sel" : "") + '" title="' + esc(tr(r.n) + ", " + W.month(i, true) + ": " + t("s" + v)) + '"><span>' + (v === 3 ? "★" : v === 0 ? "×" : "") + "</span></td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>" +
      '<div class="legend-m"><span class="m3"><i></i>' + esc(t("s3")) + '</span><span class="m2"><i></i>' + esc(t("s2")) + '</span><span class="m1"><i></i>' + esc(t("s1")) + '</span><span class="m0"><i></i>' + esc(t("s0")) + '</span></div><p class="muted">' + esc(t("seaHow")) + "</p>";
  }
  function weather() {
    if (seaM !== new Date().getMonth()) return;
    document.querySelectorAll(".wxs").forEach(function (el) {
      var r = W.region(el.getAttribute("data-r")); if (!r || !r.lat) return;
      fetch("https://api.open-meteo.com/v1/forecast?latitude=" + r.lat + "&longitude=" + r.lon + "&current=temperature_2m&timezone=auto").then(function (x) { return x.json(); })
        .then(function (j) { if (j.current && document.body.contains(el)) el.textContent = t("seaNowT") + ": " + Math.round(j.current.temperature_2m) + "°C"; }).catch(function () {});
    });
  }
  W.sec({ id: "season", key: "season", nav: "nSea", order: 30, cls: "dark",
    html: function () {
      if (seaM == null) seaM = new Date().getMonth();
      return '<div class="wrap"><div class="self-b"><b>' + esc(t("selfT")) + "</b><span>" + esc(t("selfD")) + "</span></div>" + W.head("tSea", "sSea") + '<p class="sea-q">' + esc(t("seaPick")) + '</p><div class="mchips" id="mchips">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return '<button type="button" data-act="seam" data-m="' + i + '" aria-pressed="' + (i === seaM) + '">' + esc(W.month(i)) + "</button>"; }).join("") +
        '</div><div id="seaB">' + seaBody() + '</div><h3 class="sea-tt">' + esc(t("seaTable")) + '</h3><div id="seaT">' + seaTable() + "</div></div>";
    }, init: weather });
  W.acts.seam = function (el) {
    seaM = +el.getAttribute("data-m"); $("seaB").innerHTML = seaBody(); $("seaT").innerHTML = seaTable();
    document.querySelectorAll("#mchips button").forEach(function (b) { b.setAttribute("aria-pressed", +b.getAttribute("data-m") === seaM); }); weather();
  };
  W.acts.season = function () { W.closeModal(); var s = $("season"); if (s) s.scrollIntoView({ behavior: "smooth" }); };

  /* ---------- Конструктор маршрута ---------- */
  var INT = ["nature", "lakes", "horses", "culture", "food", "history", "hiking", "nomads"], picked = {}, routeDays = 7, plan = null;
  var TAGMAP = { nature: "nature", lakes: "lakes", horses: "horses", culture: "culture", food: "food", history: "history", hiking: "hiking", nomads: "nomads" };
  function build() {
    var chosen = INT.filter(function (k) { return picked[k]; }); if (!chosen.length) { plan = "none"; return; }
    var now = W.filter.m !== "" ? +W.filter.m : new Date().getMonth();
    var sc = W.S.regions.map(function (r) {
      var s = 0; (r.tags || []).forEach(function (tg) { if (picked[tg] || (tg === "horse" && picked.horses)) s += 2; });
      if (picked.horses && (r.tags || []).indexOf("horses") >= 0) s += 1;
      s += ((r.months || [])[now] || 0) * 0.5; return { r: r, s: s };
    }).sort(function (a, b) { return b.s - a.s || a.r.order - b.r.order; });
    var left = routeDays, take = [];
    sc.forEach(function (x) { if (left <= 0 || x.s <= 0) return; var d = Math.min(x.r.days || 2, left); take.push({ r: x.r, d: d }); left -= d; });
    if (left > 0 && take.length) take[take.length - 1].d += left;
    take.sort(function (a, b) { return a.r.order - b.r.order; });
    var day = 1; plan = take.map(function (x) { var o = { r: x.r, from: day, to: day + x.d - 1 }; day += x.d; return o; });
  }
  function planHtml() {
    if (!plan) return ""; if (plan === "none") return '<p class="muted">' + esc(t("pPick")) + "</p>";
    var txt = [];
    var h = '<ol class="route">' + plan.map(function (p) {
      var tour = W.S.tours.filter(function (x) { return x.r === p.r.id; })[0], rng = p.from === p.to ? p.from : p.from + "–" + p.to;
      txt.push(t("pDay") + " " + rng + ": " + tr(p.r.n) + " (" + W.list(p.r.see).slice(0, 3).join(", ") + ")" + (tour ? " · " + tr(tour.t) : ""));
      return "<li><b>" + esc(t("pDay") + " " + rng) + '</b><div><h3><button type="button" class="link" data-act="region" data-id="' + p.r.id + '">' + esc(tr(p.r.n)) + "</button></h3><p>" + esc(W.list(p.r.see).slice(0, 3).join(" · ")) + "</p>" + (tour ? '<p class="muted">' + esc(t("pTour")) + ": " + esc(tr(tour.t)) + "</p>" : "") + "</div></li>";
    }).join("") + '</ol><button type="button" class="btn" data-act="rsend">' + esc(t("pSend")) + "</button>";
    plan.text = txt.join("\n"); return h;
  }
  W.sec({ id: "route", key: "route", nav: "nRoute", order: 40,
    html: function () {
      return '<div class="wrap">' + W.head("tRoute", "sRoute") + '<div class="rt"><div class="rt-f glass-l"><span class="tl">' + esc(t("pDays")) + ': <b id="rtD">' + routeDays + '</b></span><div class="days" id="rtN" role="group" aria-label="' + esc(t("pDaysHint")) + '">' + [1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(function (n) { return '<button type="button" class="dn" data-act="rday" data-n="' + n + '" aria-pressed="' + (n === routeDays) + '">' + n + "</button>"; }).join("") + '</div><span class="tl">' + esc(t("pInt")) + '</span><div class="chips">' +
        INT.map(function (k) { return '<button type="button" class="chip" data-act="rint" data-k="' + k + '" aria-pressed="' + !!picked[k] + '">' + esc(t("i_" + k)) + "</button>"; }).join("") + '</div><button type="button" class="btn" data-act="rbuild">' + esc(t("pBuild")) + '</button></div><div class="rt-o" id="rtO">' + planHtml() + "</div></div></div>";
    },
    init: function () {} });
  W.acts.rday = function (el) { routeDays = +el.getAttribute("data-n"); $("rtD").textContent = routeDays; Array.prototype.forEach.call(document.querySelectorAll("#rtN .dn"), function (b) { b.setAttribute("aria-pressed", b === el); }); };
  W.acts.rint = function (el) { var k = el.getAttribute("data-k"); picked[k] = !picked[k]; el.setAttribute("aria-pressed", !!picked[k]); };
  W.acts.rbuild = function () { build(); $("rtO").innerHTML = planHtml(); };
  W.acts.rsend = function () { if (plan && plan.text && W.setWishes) W.setWishes(plan.text, routeDays); };
})();
