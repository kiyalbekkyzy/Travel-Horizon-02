/* web-touristKG — ядро главной страницы: язык, тексты, окно, избранное, шапка, hero, футер, история.
   Остальные разделы подключаются файлами explore.js, play.js, contact.js, bot.js через WT.sec(...). */
(function () {
  var L = window.WT_I18N;
  var W = window.WT = { mods: [], acts: {}, S: null, filter: { r: "", k: "", m: "" } };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  W.ls = ls;
  W.lang = ls("wl") || (navigator.language || "en").slice(0, 2); if (!L[W.lang]) W.lang = "en";
  var $ = W.$ = function (i) { return document.getElementById(i); };

  /* ---------- тексты ---------- */
  W.t = function (k) { var o = (W.S && W.S.ui && W.S.ui[W.lang]) || {}; return o[k] || L[W.lang][k] || L.en[k] || L.ru[k] || k; };
  W.tr = function (o) { return typeof o === "string" ? o : (o && (o[W.lang] || o.en || o.ru || "")) || ""; };
  W.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  W.list = function (v) { return W.tr(v).split(/\s*[,，、]\s*/).map(function (x) { return x.trim(); }).filter(Boolean); };
  W.nl = function (s) { return W.esc(s).replace(/\n/g, "<br>"); };
  W.img = function (src, alt, cls) { return src ? '<img ' + (cls ? 'class="' + cls + '" ' : "") + 'src="' + W.esc(src) + '" alt="' + W.esc(alt || "") + '" loading="lazy">' : ""; };
  W.price = function (p) {
    p = String(p || "").replace(/^from\s*/i, "");
    var ru = W.lang === "ru", zh = W.lang === "zh", es = W.lang === "es";
    return p.replace(/\s*\/\s*2\s*pax/i, ru ? " за двоих" : zh ? " /2人" : es ? " por 2 personas" : " for two").replace(/KGS/g, ru ? "сом" : zh ? "索姆" : es ? "som" : "KGS");
  };
  W.month = function (i, long) { try { return new Intl.DateTimeFormat(W.lang === "zh" ? "zh-CN" : W.lang, { month: long ? "long" : "short" }).format(new Date(2024, i, 1)); } catch (e) { return String(i + 1); } };
  W.region = function (id) { return (W.S.regions || []).filter(function (r) { return r.id === id; })[0]; };
  W.track = function (ev) { try { WTStore.track(ev); } catch (e) {} };

  /* ---------- иконки (контурные) ---------- */
  var P = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  W.ICONS = {
    wa: P('<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6L3 21Z"/><path d="M9 8.5c.4 2.6 2.6 4.8 5.5 5.5l1.4-1.5-2.1-1-1 .8c-.8-.4-1.6-1.2-2-2l.8-1-1-2.1L9 8.5Z"/>'),
    tg: P('<path d="M21 4 3 11l6 2 2 6 3.2-4.2L19 18 21 4Z"/><path d="m9 13 8-6"/>'),
    ig: P('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'),
    tt: P('<path d="M14 4v10.2a3.6 3.6 0 1 1-3.6-3.6"/><path d="M14 4c.4 2.6 2 4.2 5 4.4"/>'),
    ph: P('<path d="M5 4h4l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2L15.000 12.500 19 14v4a2 2 0 0 1-2 2A14 14 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'),
    mail: P('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>'),
    heart: P('<path d="M12 20s-7.500-5-7.500-10.500A4.300 4.300 0 0 1 12 7a4.300 4.300 0 0 1 7.500 2.500C19.500 15 12 20 12 20Z"/>'),
    pin: P('<path d="M12 21s-7-6-7-11.500a7 7 0 0 1 14 0C19 15 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/>'),
    map: P('<path d="M12 21s-7-6-7-11.500a7 7 0 0 1 14 0C19 15 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/>'),
    coin: P('<circle cx="12" cy="12" r="9"/><path d="M14.500 9c-.5-1-1.500-1.500-2.500-1.500-1.500 0-2.500 1-2.500 2 0 3 5 1.500 5 4.500 0 1-1 2-2.500 2-1 0-2-.5-2.500-1.500M12 5.500v2M12 16.500v2"/>'),
    clock: P('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    cal: P('<rect x="3.500" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.500 10h17"/>'),
    star: P('<path d="m12 3 2.700 5.600 6.100.8-4.500 4.200 1.200 6L12 16.700 6.500 19.600l1.200-6L3.200 9.400l6.100-.8L12 3Z"/>'),
    play: P('<path d="M8 5.500v13l11-6.500-11-6.500Z"/>'),
    sound: P('<path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16.500 9a4 4 0 0 1 0 6"/>'),
    check: P('<path d="m5 12.500 4.500 4.500L19 7.500"/>'),
    arrow: P('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600 7 7M17 17l1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400"/>'),
    qr: P('<rect x="3.500" y="3.500" width="7" height="7" rx="1"/><rect x="13.500" y="3.500" width="7" height="7" rx="1"/><rect x="3.500" y="13.500" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14v3M14 19h3M20 19v1.500"/>'),
    globe: P('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>')
  };
  W.icon = function (s) { return s.icon ? '<img class="soc-i" src="' + W.esc(s.icon) + '" alt="">' : (W.ICONS[s.kind] || W.ICONS.globe); };

  /* ---------- регистрация разделов ---------- */
  W.sec = function (m) { W.mods.push(m); W.mods.sort(function (a, b) { return a.order - b.order; }); };
  W.head = function (tk, sk, extra) { return '<div class="sec-h"><h2>' + W.esc(W.t(tk)) + "</h2>" + (sk ? "<p>" + W.esc(W.t(sk)) + "</p>" : "") + (extra || "") + "</div>"; };
  function on(m) { if (m.key === "season" || m.key === "route" || m.key === "translator") return false; return (W.S.sections || {})[m.key] !== false; }

  /* ---------- действия по data-act ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el) return;
    var f = W.acts[el.getAttribute("data-act")]; if (f) { if (el.tagName === "A" && el.getAttribute("href") === "#") e.preventDefault(); f(el, e); }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { W.closeModal(); W.closeDrawer(); } });

  /* ---------- окно ---------- */
  var lastFocus = null;
  W.modal = function (html, cls) {
    lastFocus = document.activeElement; $("mBody").innerHTML = html; $("modal").className = "modal " + (cls || ""); $("modal").hidden = false;
    document.body.classList.add("lock"); $("modal").querySelector(".m-box").scrollTop = 0; $("mx").focus();
  };
  W.closeModal = function () { if ($("modal").hidden) return; $("modal").hidden = true; $("mBody").innerHTML = ""; document.body.classList.remove("lock"); if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} };
  W.acts.mclose = W.closeModal;

  /* ---------- избранное ---------- */
  function favList() { try { return JSON.parse(ls("wt_favs") || "[]"); } catch (e) { return []; } }
  W.fav = {
    all: favList, has: function (k) { return favList().indexOf(k) >= 0; },
    toggle: function (k) { var l = favList(), i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else l.push(k); ls("wt_favs", JSON.stringify(l)); W.markFavs(); }
  };
  W.heart = function (k) { return '<button type="button" class="heart" data-act="fav" data-k="' + W.esc(k) + '" aria-label="' + W.esc(W.t("favs")) + '" aria-pressed="' + W.fav.has(k) + '">' + W.ICONS.heart + "</button>"; };
  W.markFavs = function () {
    var n = favList().length, b = $("favN"); b.hidden = !n; b.textContent = n;
    document.querySelectorAll(".heart").forEach(function (h) { h.setAttribute("aria-pressed", W.fav.has(h.getAttribute("data-k"))); });
    if (!$("drawer").hidden) W.openDrawer();
  };
  W.acts.fav = function (el, e) { e.stopPropagation(); W.fav.toggle(el.getAttribute("data-k")); };
  W.favTitle = function (k) {
    var p = k.split(":"), id = p[1], S = W.S, x;
    if (p[0] === "t") { x = S.tours.filter(function (t) { return t.id === id; })[0]; return x && { t: W.tr(x.t), img: x.img, go: "tour" }; }
    if (p[0] === "r") { x = W.region(id); return x && { t: W.tr(x.n), img: x.img, go: "region" }; }
    if (p[0] === "p") { x = ((S.passport || {}).places || []).filter(function (t) { return t.id === id; })[0]; return x && { t: W.tr(x.t), img: x.img, go: "place" }; }
    return null;
  };
  W.openDrawer = function () {
    $("dTitle").textContent = W.t("favs"); $("drawer").hidden = false; document.body.classList.add("lock");
    var l = favList().map(function (k) { var o = W.favTitle(k); return o ? { k: k, o: o } : null; }).filter(Boolean);
    $("dBody").innerHTML = l.length ? '<ul class="fav-l">' + l.map(function (x) {
      return '<li>' + W.img(x.o.img, "") + "<span>" + W.esc(x.o.t) + '</span><button type="button" class="link" data-act="fav" data-k="' + W.esc(x.k) + '">' + W.esc(W.t("favRemove")) + "</button></li>";
    }).join("") + '</ul><a class="btn full" href="#plan" data-act="favsend">' + W.esc(W.t("favSend")) + "</a>" : '<p class="muted">' + W.esc(W.t("favEmpty")) + "</p>";
  };
  W.closeDrawer = function () { if ($("drawer").hidden) return; $("drawer").hidden = true; if ($("modal").hidden) document.body.classList.remove("lock"); };
  W.acts.dclose = W.closeDrawer; W.acts.favsend = function () { W.closeDrawer(); };

  /* ---------- шапка, hero, футер ---------- */
  function applyTheme() {
    var th = W.S.theme || {}, r = document.documentElement.style;
    ["c1", "c2", "c3", "c4", "ink"].forEach(function (k) { if (th[k]) r.setProperty("--" + k, th[k]); });
  }
  function heroHtml() {
    var S = W.S, t = W.t, esc = W.esc, slides = (S.hero && S.hero.slides) || [];
    var rOpts = '<option value="">' + esc(t("sbAny")) + "</option>" + S.regions.map(function (r) { return '<option value="' + r.id + '"' + (W.filter.r === r.id ? " selected" : "") + ">" + esc(W.tr(r.n)) + "</option>"; }).join("");
    var pOpts = [["", t("fAny")], ["1", t("fp1")], ["2", t("fp2")], ["3", t("fp3")], ["4", t("fp4")]].map(function (a) { return '<option value="' + a[0] + '"' + (W.filter.p === a[0] ? " selected" : "") + ">" + esc(a[1]) + "</option>"; }).join("");
    var mOpts = '<option value="">' + esc(t("sbAny")) + "</option>" + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return '<option value="' + i + '"' + (String(W.filter.m) === String(i) ? " selected" : "") + ">" + esc(W.month(i, true)) + "</option>"; }).join("");
    var dest = (S.regions || []).slice().sort(function (x, y) { return (x.order || 0) - (y.order || 0); });
    return '<section class="hero" id="top"><div class="slides" id="slides">' + slides.map(function (s, i) {
      return '<div class="slide' + (i === 0 ? " on" : "") + '" style="background-image:url(\'' + esc(s.img) + "');background-position:" + esc(s.pos || "50% 60%") + '"></div>';
    }).join("") + '</div><div class="hero-shade"></div>' +
      '<div class="hero-in"><span class="kick">' + esc(t("kick")) + "</span>" +
      '<h1><span class="h1a">' + esc(t("h1a")) + '</span><span class="h1b">' + esc(t("h1b")) + '</span></h1><p class="lead">' + esc(t("h2")) + "</p>" +
      '<div class="hero-cta"><a class="btn" href="#tours">' + esc(t("cta")) + "</a>" + (((S.sections || {}).plan !== false) ? '<a class="btn glass-btn" href="#plan">' + esc(t("cta2")) + "</a>" : "") + "</div>" +
      ((S.sections || {}).passport !== false ? '<a class="h-diary glass" href="#passport">' + W.ICONS.pin + "<span>" + esc(t("heroDiary")) + "</span><b>" + esc(t("heroDiaryB")) + " " + W.ICONS.arrow + "</b></a>" : "") +
      (dest.length ? '<div class="dest-w"><button type="button" class="d-nav l" data-act="dnav" data-d="-1" aria-label="←">‹</button><div class="dest" id="dest">' + dest.map(function (r) { return '<button type="button" class="d-card" data-act="region" data-id="' + r.id + '">' + W.img(r.img, W.tr(r.n)) + "<span><b>" + esc(W.tr(r.n)) + "</b><small>" + esc(W.list(r.see).slice(0, 2).join(" · ")) + "</small></span></button>"; }).join("") + '</div><button type="button" class="d-nav r" data-act="dnav" data-d="1" aria-label="→">›</button></div>' : "") +
      '<form class="sbar glass" id="sbar"><label><span>' + esc(t("sbRegion")) + '</span><select id="sbR">' + rOpts + "</select></label>" +
      '<label><span>' + esc(t("fPrice")) + '</span><select id="sbP">' + pOpts + "</select></label>" +
      '<label><span>' + esc(t("fDate")) + '</span><select id="sbM">' + mOpts + "</select></label>" +
      '<button class="btn" type="submit">' + esc(t("sbGo")) + "</button></form></div>" +
      '<div class="dots" id="dots">' + slides.map(function (s, i) { return '<button type="button" data-act="slide" data-i="' + i + '" aria-label="' + (i + 1) + '"' + (i === 0 ? ' class="on"' : "") + "></button>"; }).join("") + "</div></section>";
  }
  /* о стране: большой Барс и четыре «плюса» */
  W.aboutHtml = function () {
    var t = W.t, esc = W.esc, S = W.S, f = [["aboutF1", "sun"], ["aboutF2", "map"], ["aboutF3", "cal"], ["aboutF4", "star"]];
    return '<div class="wrap about-g"><div class="about-m"><div id="aboutM"></div></div><div class="about-t"><span class="kick">' + esc(t("aboutT")) + "</span><h2>" + esc(t("aboutQ")) + "</h2><p>" + esc(t("aboutD")) + '</p><ul class="about-f">' +
      f.map(function (a) { return "<li>" + W.ICONS[a[1]] + "<span>" + esc(t(a[0])) + "</span></li>"; }).join("") + '</ul><button type="button" class="btn" data-act="chat">' + esc(t("hB")) + "</button></div></div>";
  };
  var slideI = 0, slideT = null;
  function goSlide(i) {
    var s = document.querySelectorAll(".slide"), d = document.querySelectorAll("#dots button"); if (!s.length) return;
    slideI = (i + s.length) % s.length; s.forEach(function (x, j) { x.classList.toggle("on", j === slideI); }); d.forEach(function (x, j) { x.classList.toggle("on", j === slideI); });
  }
  W.acts.slide = function (el) { goSlide(+el.getAttribute("data-i")); startSlides(); };
  function startSlides() { clearInterval(slideT); if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; slideT = setInterval(function () { goSlide(slideI + 1); }, 6500); }

  function footHtml() {
    var S = W.S, t = W.t, esc = W.esc;
    return '<div class="wrap foot-in"><div class="f-brand"><img src="' + esc(S.site.logo || (S.mascot || {}).head || "") + '" alt=""><div><b>' + esc(S.site.name || "") + "</b><p>" + esc(t("kick")) + "</p></div></div>" +
      '<div class="f-soc"><span>' + esc(t("follow")) + '</span><div class="soc">' + (S.socials || []).map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" aria-label="' + esc(s.label) + '" title="' + esc(s.label) + '">' + W.icon(s) + "</a>"; }).join("") + "</div></div>" +
      '<div class="f-c">' + (S.phone ? "<span>" + W.ICONS.ph + esc(S.phone) + "</span>" : "") + (S.email ? '<a href="mailto:' + esc(S.email) + '">' + W.ICONS.mail + esc(S.email) + "</a>" : "") + "</div>" +
      '<p class="copy">© ' + new Date().getFullYear() + " " + esc(S.site.name || "") + ". " + esc(t("rights")) + "</p></div>";
  }

  /* ---------- раздел «История Кыргызстана» ---------- */
  var histTab = "leg";
  W.sec({ id: "history", key: "history", nav: "nHist", order: 50,
    html: function () {
      var S = W.S, t = W.t, esc = W.esc, tr = W.tr;
      var tabs = [["leg", "tabLeg"], ["works", "tabWorks"], ["sym", "tabSym"], ["time", "tabTime"]];
      var body;
      if (histTab === "leg") body = '<div class="cards3">' + S.regions.map(function (r) {
        return '<article class="card leg" data-act="legend" data-id="' + r.id + '" tabindex="0" role="button"><div class="c-img">' + W.img((r.lg.imgs || [])[0] || r.img, tr(r.lg.t)) + "<span class=\"badge\">" + esc(tr(r.n)) + "</span></div><div class=\"c-b\"><h3>" + esc(tr(r.lg.t)) + "</h3><p>" + esc(tr(r.lg.d).split("\n")[0].slice(0, 130)) + "…</p><span class=\"link\">" + esc(t("readLeg")) + " " + W.ICONS.arrow + "</span></div></article>";
      }).join("") + "</div>";
      else if (histTab === "time") body = '<ol class="timeline">' + (S.timeline || []).map(function (x) { return "<li><b>" + esc(tr(x.y)) + "</b><div><h3>" + esc(tr(x.t)) + "</h3><p>" + esc(tr(x.d)) + "</p></div></li>"; }).join("") + "</ol>";
      else { var list = histTab === "works" ? S.works : S.symbols; body = '<div class="cards2">' + (list || []).map(function (w, i) { return '<article class="card row" data-act="work" data-kind="' + histTab + '" data-i="' + i + '" tabindex="0" role="button"><div class="c-img sq">' + W.img(w.img, tr(w.t)) + '</div><div class="c-b"><h3>' + esc(tr(w.t)) + "</h3><p>" + esc(tr(w.d).split("\n")[0].slice(0, 150)) + '…</p><span class="link">' + esc(t("more")) + " " + W.ICONS.arrow + "</span></div></article>"; }).join("") + "</div>"; }
      return '<div class="wrap">' + W.head("tHist", "sHist") + '<div class="tabs" role="tablist">' + tabs.map(function (a) { return '<button type="button" role="tab" data-act="htab" data-k="' + a[0] + '" aria-selected="' + (histTab === a[0]) + '">' + esc(t(a[1])) + "</button>"; }).join("") + "</div>" + body + "</div>";
    } });
  W.acts.htab = function (el) { histTab = el.getAttribute("data-k"); var s = $("history"); s.innerHTML = W.mods.filter(function (m) { return m.id === "history"; })[0].html(); };
  W.legendHtml = function (r) {
    var lg = r.lg || {}, tr = W.tr, esc = W.esc, imgs = lg.imgs || [];
    return '<div class="lg-hero">' + W.img(imgs[0] || r.img, tr(lg.t)) + '<div class="lg-t"><span class="kick glass">' + esc(tr(r.n)) + "</span><h2>" + esc(tr(lg.t)) + "</h2></div></div>" +
      '<div class="lg-b"><div class="lg-text">' + tr(lg.d).split("\n").filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      (imgs.length > 1 ? '<div class="lg-g">' + imgs.slice(1).map(function (s) { return W.img(s, tr(lg.t)); }).join("") + "</div>" : "") +
      (tr(lg.f) ? "<h3>" + esc(W.t("facts")) + '</h3><ul class="facts">' + tr(lg.f).split("\n").filter(Boolean).map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="row-btns"><button type="button" class="btn small" data-act="region" data-id="' + r.id + '">' + esc(W.t("regions")) + '</button><a class="btn small ghost" href="#plan" data-act="mclose">' + esc(W.t("plan")) + "</a></div></div>";
  };
  W.acts.dnav = function (el) { var d = document.getElementById("dest"); if (d) d.scrollBy({ left: +el.getAttribute("data-d") * Math.max(260, d.clientWidth * .8), behavior: "smooth" }); };
  W.acts.legend = function (el) { var r = W.region(el.getAttribute("data-id")); if (r) W.modal(W.legendHtml(r), "wide"); };
  W.acts.work = function (el) {
    var l = el.getAttribute("data-kind") === "works" ? W.S.works : W.S.symbols, w = l[+el.getAttribute("data-i")], tr = W.tr; if (!w) return;
    W.modal('<div class="lg-hero">' + W.img(w.img, tr(w.t)) + '<div class="lg-t"><h2>' + W.esc(tr(w.t)) + '</h2></div></div><div class="lg-b"><div class="lg-text">' + tr(w.d).split("\n").filter(Boolean).map(function (p) { return "<p>" + W.esc(p) + "</p>"; }).join("") + "</div></div>", "wide");
  };
  document.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); } });

  /* ---------- сборка страницы ---------- */
  var NAV = [["tours"], ["events"], ["guide"], ["nGrpKg", ["company", "history", "regions", "stories", "faq"]], ["passport"]];
  function navHtml(mods) {
    var by = {}; mods.forEach(function (m) { if (m.nav) by[m.id] = m; });
    var link = function (id) { return '<a href="#' + id + '">' + W.esc(W.t(by[id].nav)) + "</a>"; };
    return NAV.map(function (n) {
      if (typeof n[1] === "undefined") return by[n[0]] ? link(n[0]) : "";
      var ids = n[1].filter(function (i) { return by[i]; }); if (!ids.length) return "";
      return '<div class="ng"><button type="button" class="ng-b" data-act="ng" aria-expanded="false">' + W.esc(W.t(n[0])) + ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="ng-m">' + ids.map(link).join("") + "</div></div>";
    }).join("");
  }
  W.acts.ng = function (el) { var g = el.parentNode, o = g.classList.toggle("open"); el.setAttribute("aria-expanded", o); document.querySelectorAll(".ng.open").forEach(function (x) { if (x !== g) { x.classList.remove("open"); x.firstChild.setAttribute("aria-expanded", "false"); } }); };
  document.addEventListener("click", function (e) { if (!e.target.closest(".ng")) document.querySelectorAll(".ng.open").forEach(function (x) { x.classList.remove("open"); }); });
  W.render = function () {
    var S = W.S, y = window.scrollY; document.documentElement.lang = W.lang; $("lng").value = W.lang; applyTheme();
    var sk = document.querySelector(".skip"); if (sk) sk.textContent = { ru: "К содержимому", en: "Skip to content", zh: "跳到内容", es: "Ir al contenido" }[W.lang];
    $("lng").setAttribute("aria-label", { ru: "Язык", en: "Language", zh: "语言", es: "Idioma" }[W.lang]); $("navbar").querySelector("nav").setAttribute("aria-label", { ru: "Меню", en: "Menu", zh: "菜单", es: "Menú" }[W.lang]);
    document.title = (S.site.name || "web-touristKG") + " — " + W.t("kick");
    $("logoImg").src = S.site.logo || (S.mascot || {}).head || ""; $("logoTx").textContent = S.site.name || "";
    var mods = W.mods.filter(on);
    $("nav").innerHTML = navHtml(mods);
    $("topCta").textContent = W.t("plan"); $("topCta").hidden = (S.sections || {}).plan === false; $("burger").setAttribute("aria-label", W.t("menu"));
    $("main").innerHTML = heroHtml() + mods.map(function (m) { return '<section class="sec ' + (m.cls || "") + '" id="' + m.id + '">' + m.html() + "</section>"; }).join("");
    $("foot").innerHTML = footHtml();
    document.getElementById("sbar").addEventListener("submit", function (e) {
      e.preventDefault(); W.filter = { r: $("sbR").value, p: $("sbP").value, m: $("sbM").value };
      if (W.refreshTours) W.refreshTours(); var to = $("tours") || $("regions"); if (to) to.scrollIntoView({ behavior: "smooth" });
    });
    mods.forEach(function (m) { if (m.init) m.init(); });
    W.markFavs(); startSlides();
    if (W.afterRender) W.afterRender();
    window.scrollTo(0, y);
  };
  W.acts.region = function (el) { W.closeModal(); if (W.openRegion) W.openRegion(el.getAttribute("data-id")); };
  W.acts.chat = function () { if (W.openChat) W.openChat(); };

  W.start = function () {
    $("lng").addEventListener("change", function () { W.lang = this.value; ls("wl", W.lang); W.render(); if (W.botRefresh) W.botRefresh(); });
    $("favBtn").addEventListener("click", W.openDrawer);
    $("burger").addEventListener("click", function () { document.body.classList.toggle("menu-open"); });
    $("nav").addEventListener("click", function (e) { if (e.target.closest("a")) { document.body.classList.remove("menu-open"); document.querySelectorAll(".ng.open").forEach(function (x) { x.classList.remove("open"); }); } });
    var nb = $("navbar"); window.addEventListener("scroll", function () { nb.classList.toggle("solid", window.scrollY > 40); }, { passive: true });
    WTStore.load().then(function (S) { W.S = S; W.render(); W.track("view"); if (W.boot) W.boot(); });
  };
})();
