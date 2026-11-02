/* Разделы: дневник путешественника (отметки, фото, баллы, подарки), игра «по-кыргызски», события, «Моя страна», путеводитель, знакомство с Барсом. */
(function () {
  var W = window.WT, $ = W.$, esc = W.esc, tr = W.tr, t = W.t;

  W.toast = function (msg) {
    document.querySelectorAll(".toast").forEach(function (x) { x.remove(); }); var e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = msg; document.body.appendChild(e);
    setTimeout(function () { e.classList.add("out"); }, 3200); setTimeout(function () { e.remove(); }, 3700);
  };

  /* ---------- Дневник путешественника ---------- */
  var DY = { user: null, list: [], loaded: false, mode: "register", pending: "" };
  function places() { return ((W.S.passport || {}).places) || []; }
  function dcfg() { return W.S.diary || { pts: 10, ptsRegion: 20, rewards: [] }; }
  function stats() {
    var l = DY.list, regs = {}, pts = 0; l.forEach(function (e) { if (e.regionId) regs[e.regionId] = 1; pts += e.pts || 0; });
    var n = l.length, all = W.S.regions.length, nr = Object.keys(regs).length, top = all > 0 && nr >= all;
    var ranks = ((W.S.passport || {}).ranks || []).slice().sort(function (a, b) { return a.n - b.n; }), cur = ranks[0], next = null;
    ranks.forEach(function (r) { if (n >= r.n) cur = r; }); ranks.forEach(function (r) { if (!next && r.n > n) next = r; });
    return { n: n, pts: pts, regs: nr, regMap: regs, all: all, top: top, cur: cur, next: next };
  }
  function ringHtml(k) {
    var p = Math.min(1, k.regs / (k.all || 1)), C = 2 * Math.PI * 52;
    return '<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - p)).toFixed(1) + '"/><text x="60" y="60" text-anchor="middle">' + k.regs + "/" + k.all + '</text><text x="60" y="78" text-anchor="middle" class="sm">' + esc(t("dRegions")) + "</text></svg>";
  }
  function rewardsHtml(k) {
    var rw = (dcfg().rewards || []).slice().sort(function (a, b) { return a.n - b.n; });
    if (!rw.length) return "";
    return '<h3 class="d-h3">' + esc(t("dRewards")) + '</h3><ol class="rw">' + rw.map(function (r) {
      var got = DY.user && k.n >= r.n;
      return '<li class="' + (got ? "got" : "") + '"><span class="rw-n">' + (got ? W.ICONS.check : r.n) + '</span><div><b>' + esc(tr(r.t)) + "</b><p>" + esc(tr(r.d)) + "</p>" +
        (got && r.code ? '<p class="rw-c">' + esc(t("dCode")) + ": <code>" + esc(r.code) + "</code></p>" : "") + (!got && DY.user ? '<small class="muted">' + esc(t("dMore") + " " + (r.n - k.n)) + "</small>" : "") + "</div></li>";
    }).join("") + "</ol>" + (DY.user && (dcfg().rewards || []).some(function (r) { return k.n >= r.n && r.code; }) ? '<p class="muted">' + esc(t("dCodeHow")) + "</p>" : "");
  }
  function entryHtml(e) {
    var r = W.region(e.regionId), d = new Date(e.at).toLocaleDateString(W.lang === "zh" ? "zh-CN" : W.lang, { day: "numeric", month: "long", year: "numeric" });
    var via = e.via === "qr" ? t("dVerified") : e.via === "gps" ? t("dByGps") : t("dManual");
    return '<article class="entry">' + (e.img ? '<div class="e-img"><img src="' + esc(e.img) + '" alt="" loading="lazy"></div>' : '<div class="e-img ph">' + W.ICONS.pin + "</div>") +
      '<div class="e-b"><small>' + esc(d) + (r ? " · " + esc(tr(r.n)) : "") + '</small><h4>' + esc(e.title) + '</h4>' + (e.note ? "<p>" + esc(e.note) + "</p>" : "") +
      '<div class="e-m"><span class="tag">' + esc(via) + '</span><span class="tag s">+' + (e.pts || 0) + " " + esc(t("dPoints")) + '</span><button type="button" class="link" data-act="edel" data-id="' + esc(e.id) + '">' + esc(t("dDel")) + "</button></div></div></article>";
  }
  function diaryHtml() {
    var steps = '<ol class="d-steps">' + [1, 2, 3].map(function (i) { return "<li><b>" + i + "</b><div><h4>" + esc(t("dS" + i)) + "</h4><p>" + esc(t("dS" + i + "d")) + "</p></div></li>"; }).join("") + "</ol>";
    var demo = !(window.WT_CONFIG || {}).API_URL ? '<p class="muted small">' + esc(t("dDemo")) + "</p>" : "";
    if (!DY.user) {
      return '<div class="diary out">' + steps + '<div class="d-cta"><button type="button" class="btn" data-act="dauth" data-m="register">' + esc(t("dReg")) + '</button><button type="button" class="btn ghost" data-act="dauth" data-m="login">' + esc(t("dLogin")) + "</button></div>" + demo + rewardsHtml({ n: 0 }) + "</div>";
    }
    var k = stats(), name = k.top ? tr((W.S.passport.topRank || {}).name) : tr((k.cur || {}).name);
    return '<div class="diary in"><div class="d-top glass-l">' + ringHtml(k) + '<div class="d-who"><small>' + esc(t("dHello")) + ", " + esc(DY.user.name) + "</small><h3>" + esc(name) + "</h3>" +
      (k.top ? '<p class="ok-t">' + esc(t("dToTop")) + "</p>" : (k.next ? '<p class="muted">' + esc((k.next.n - k.n) + " " + t("dCheckins") + " " + t("dNext") + ": " + tr(k.next.name)) + "</p>" : "")) +
      '<ul class="d-nums"><li><b>' + k.pts + "</b><span>" + esc(t("dPoints")) + "</span></li><li><b>" + k.n + "</b><span>" + esc(t("dCheckins")) + '</span></li></ul></div>' +
      '<div class="d-act"><button type="button" class="btn big" data-act="dcheck">' + W.ICONS.pin + esc(t("dCheck")) + '</button><button type="button" class="link" data-act="dout">' + esc(t("dOut")) + "</button></div></div>" +
      (DY.loaded ? (DY.list.length ? '<div class="entries">' + DY.list.map(entryHtml).join("") + "</div>" : '<p class="muted d-empty">' + esc(t("dEmpty")) + "</p>") : '<p class="muted">…</p>') + rewardsHtml(k) + demo + "</div>";
  }
  function drawDiary() { var b = $("passB"); if (b) b.innerHTML = diaryHtml(); }
  function loadDiary() {
    DY.user = WTStore.me(); DY.loaded = false; DY.list = []; drawDiary(); if (!DY.user) return;
    WTStore.getDiary().then(function (l) { DY.list = l || []; DY.loaded = true; drawDiary(); }).catch(function () { WTStore.signOut(); DY.user = null; drawDiary(); });
  }
  W.sec({ id: "passport", key: "passport", nav: "nDiary", order: 70,
    html: function () { return '<div class="wrap">' + W.head("tDiary", "sDiary") + '<div id="passB"></div></div>'; },
    init: loadDiary });

  function authModal(mode) {
    DY.mode = mode || DY.mode; var reg = DY.mode === "register";
    W.modal('<div class="auth"><h2>' + esc(t(reg ? "dReg" : "dLogin")) + '</h2><form id="aForm" novalidate>' + (reg ? '<label>' + esc(t("dName")) + '<input name="name" autocomplete="name" maxlength="60"></label>' : "") +
      '<label>' + esc(t("dEmail")) + '<input name="email" type="email" autocomplete="email" inputmode="email"></label><label>' + esc(t("dPass")) + '<input name="password" type="password" autocomplete="' + (reg ? "new-password" : "current-password") + '"></label>' +
      '<p class="err" id="aErr" role="alert" hidden></p><button class="btn full" type="submit">' + esc(t(reg ? "dReg" : "dLogin")) + '</button></form><button type="button" class="link" data-act="dauth" data-m="' + (reg ? "login" : "register") + '">' + esc(t(reg ? "dHave" : "dNo")) + '</button><p class="muted small">' + esc(t("dPriv")) + "</p></div>", "narrow");
    $("aForm").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, b = f.querySelector("button");
      b.disabled = true;
      WTStore.auth(DY.mode, { name: f.name ? f.name.value : "", email: f.email.value, password: f.password.value }).then(function () {
        W.closeModal(); loadDiary(); var pa = $("passport"); if (pa) pa.scrollIntoView({ behavior: "smooth" });
        if (DY.pending) { var c = DY.pending; DY.pending = ""; setTimeout(function () { W.applyStamp(c); }, 500); }
      }).catch(function (er) {
        b.disabled = false; var m = { mail: "dErrMail", pass: "dErrPass", auth: "dErrAuth", used: "dErrUsed", name: "dErrName" }[er.message] || "dErrAuth";
        var x = $("aErr"); x.textContent = t(m); x.hidden = false;
      });
    });
  }
  W.acts.dauth = function (el) { authModal(el.getAttribute("data-m")); };
  W.acts.dout = function () { WTStore.signOut(); loadDiary(); };
  W.acts.edel = function (el) { if (!confirm(t("dDelQ"))) return; var id = el.getAttribute("data-id"); WTStore.deleteEntry(id).then(function () { DY.list = DY.list.filter(function (x) { return x.id !== id; }); drawDiary(); }); };

  function dist(a, b, c, d) { var R = 6371, p = Math.PI / 180, x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
  var CI = null;
  function placeOpts(rid, sel) {
    var l = places().filter(function (p) { return p.r === rid; });
    return l.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? " selected" : "") + ">" + esc(tr(p.t)) + "</option>"; }).join("") + '<option value="">' + esc(t("dOther")) + "</option>";
  }
  function checkModal(pre) {
    pre = pre || {}; CI = { via: pre.via || "manual", lat: null, lon: null, img: "" };
    var rid = pre.rid || W.S.regions[0].id;
    W.modal('<div class="auth chk"><h2>' + esc(t("dWhere")) + '</h2><form id="cForm2" novalidate><button type="button" class="btn ghost small" data-act="dgps">' + W.ICONS.map + esc(t("dGps")) + '</button><p class="muted small" id="gMsg" aria-live="polite"></p>' +
      '<label>' + esc(t("dRegion")) + '<select name="region" id="ciR">' + W.S.regions.map(function (r) { return '<option value="' + r.id + '"' + (r.id === rid ? " selected" : "") + ">" + esc(tr(r.n)) + "</option>"; }).join("") + '</select></label>' +
      '<label>' + esc(t("dPlace")) + '<select name="place" id="ciP">' + placeOpts(rid, pre.pid) + '</select></label><label id="ciOL" hidden>' + esc(t("dOtherName")) + '<input name="other" maxlength="100"></label>' +
      '<label>' + esc(t("dNote")) + '<textarea name="note" rows="2" maxlength="500"></textarea></label><label class="file">' + esc(t("dPhoto")) + '<input type="file" id="ciF" accept="image/*"></label><div id="ciPrev" class="prev"></div>' +
      '<p class="err" id="cErr" role="alert" hidden></p><button class="btn full" type="submit">' + esc(t("dSave")) + "</button></form></div>", "narrow");
    var P = $("ciP"), OL = $("ciOL"); function sync() { OL.hidden = P.value !== ""; } sync(); P.addEventListener("change", sync);
    $("ciR").addEventListener("change", function () { P.innerHTML = placeOpts(this.value); sync(); });
    $("ciF").addEventListener("change", function () { var f = this.files[0]; if (!f) return; shrink(f, 800, function (d) { CI.img = d; $("ciPrev").innerHTML = '<img src="' + d + '" alt="">'; }); });
    $("cForm2").addEventListener("submit", saveCheck);
  }
  function shrink(file, max, cb) {
    var fr = new FileReader(); fr.onload = function () { var im = new Image(); im.onload = function () { var s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL("image/jpeg", 0.72)); }; im.src = fr.result; }; fr.readAsDataURL(file);
  }
  W.acts.dgps = function () {
    var m = $("gMsg"); if (!navigator.geolocation) { m.textContent = t("dGpsNo"); return; } m.textContent = "…";
    navigator.geolocation.getCurrentPosition(function (p) {
      var la = p.coords.latitude, lo = p.coords.longitude, best = null;
      W.S.regions.forEach(function (r) { if (r.lat == null) return; var d = dist(la, lo, r.lat, r.lon); if (!best || d < best.d) best = { r: r, d: d }; });
      if (!best || best.d > 300) { m.textContent = t("dGpsNo"); return; }
      CI.lat = la; CI.lon = lo; CI.via = "gps"; $("ciR").value = best.r.id; $("ciP").innerHTML = placeOpts(best.r.id); $("ciOL").hidden = $("ciP").value !== "";
      m.textContent = t("dGpsOk") + ": " + tr(best.r.n);
    }, function () { m.textContent = t("dGpsNo"); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  };
  function saveCheck(e) {
    e.preventDefault(); var f = e.target, rid = f.region.value, pid = f.place.value, pl = places().filter(function (p) { return p.id === pid; })[0];
    var title = pl ? tr(pl.t) : f.other.value.trim(), er = $("cErr");
    if (!title) { er.textContent = t("dErrPlace"); er.hidden = false; return; }
    var today = new Date().toISOString().slice(0, 10);
    if (pid && DY.list.some(function (x) { return x.placeId === pid && (x.at || "").slice(0, 10) === today; })) { er.textContent = t("dDup"); er.hidden = false; return; }
    var first = !DY.list.some(function (x) { return x.regionId === rid; }), c = dcfg(), before = stats();
    var ent = { placeId: pid, title: title, regionId: rid, note: f.note.value.trim(), via: CI.via, pts: (c.pts || 0) + (first ? (c.ptsRegion || 0) : 0) };
    if (CI.lat != null) { ent.lat = CI.lat; ent.lon = CI.lon; } if (CI.img) ent.img = CI.img;
    var b = f.querySelector("button[type=submit]"); b.disabled = true;
    WTStore.addEntry(ent).then(function (saved) {
      DY.list.unshift(saved || ent); drawDiary(); W.track("checkin"); var k = stats();
      var newR = (c.rewards || []).filter(function (r) { return before.n < r.n && k.n >= r.n; })[0], promoted = k.cur && before.cur && k.cur.n !== before.cur.n;
      W.modal('<div class="award"><div class="aw-m" id="awM"></div><h2>' + esc(t("dSaved")) + "</h2><h3>" + esc(title) + '</h3><p class="rank-up">+' + ent.pts + " " + esc(t("dPoints")) + "</p>" +
        (newR ? '<p class="ok-t">' + esc(t("dGot")) + ": " + esc(tr(newR.t)) + (newR.code ? " — " + esc(newR.code) : "") + "</p>" : "") + (promoted || k.top ? '<p class="rank-up">' + esc(t("dRank")) + ": <b>" + esc(k.top ? tr(W.S.passport.topRank.name) : tr(k.cur.name)) + "</b></p>" : "") +
        '<button type="button" class="btn" data-act="mclose">OK</button></div>', "narrow");
      WTBars.mount($("awM"), { face: true }).set("happy", 3200); var pa = $("passport"); if (pa) pa.scrollIntoView({ behavior: "smooth" });
    }).catch(function () { b.disabled = false; er.textContent = t("dErrAuth"); er.hidden = false; });
  }
  W.acts.dcheck = function () { checkModal(); };
  /* ---------- Переводчик и разговорник ---------- */
  var TL = [["ru", "Русский"], ["en", "English"], ["ky", "Кыргызча"], ["zh-CN", "中文"], ["es", "Español"], ["tr", "Türkçe"], ["de", "Deutsch"], ["fr", "Français"], ["ko", "한국어"], ["ja", "日本語"]];
  var TS = { from: "ru", to: "ky" };
  function tl(w) { return W.lang === "ru" ? w.ru : (w.en || w.ru); }
  function speak(txt) { try { var u = new SpeechSynthesisUtterance(txt); u.lang = "ru-RU"; u.rate = 0.8; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} }
  function langOpts(sel) { return TL.map(function (a) { return '<option value="' + a[0] + '"' + (a[0] === sel ? " selected" : "") + ">" + esc(a[1]) + "</option>"; }).join(""); }
  function phrasesHtml() {
    var all = W.S.kyrgyz || [], cats = W.S.kyCats || {}, order = Object.keys(cats);
    return order.map(function (c) {
      var l = all.filter(function (w) { return w.c === c; }); if (!l.length) return "";
      return '<h4 class="ph-h">' + esc(tr(cats[c])) + '</h4><div class="ph-l">' + l.map(function (w) { return '<button type="button" class="ph" data-act="phrase" data-ky="' + esc(w.ky) + '" data-tx="' + esc(tl(w)) + '"><b class="tx">' + esc(tl(w)) + '</b><span class="kyw">' + esc(w.ky) + "</span></button>"; }).join("") + "</div>";
    }).join("");
  }
  W.sec({ id: "translator", key: "translator", nav: "nTr", order: 85, cls: "dark",
    html: function () {
      return '<div class="wrap">' + W.head("tTr", "sTr") + '<div class="trx"><div class="trx-m" id="trM"></div><div class="trx-f glass-l"><div class="tr-row"><label>' + esc(t("trFrom")) + '<select id="trF">' + langOpts(TS.from) + '</select></label><button type="button" class="ico-btn" data-act="trswap" aria-label="' + esc(t("trSwap")) + '">⇄</button><label>' + esc(t("trTo")) + '<select id="trT">' + langOpts(TS.to) + '</select></label></div>' +
        '<textarea id="trIn" rows="3" maxlength="400" placeholder="' + esc(t("trPh")) + '"></textarea><button type="button" class="btn" data-act="trgo">' + esc(t("trGo")) + '</button><div class="tr-out" id="trOut" aria-live="polite" hidden></div><p class="muted small">' + esc(t("trAttr")) + "</p></div></div>" +
        '<h3 class="d-h3 light">' + esc(t("trPhrases")) + "</h3>" + phrasesHtml() + "</div>";
    },
    init: function () { var m = WTBars.mount($("trM"), { face: true }); m.set("wave", 1800); W.trBars = m; $("trF").addEventListener("change", function () { TS.from = this.value; }); $("trT").addEventListener("change", function () { TS.to = this.value; }); } });
  W.acts.trswap = function () { var f = $("trF").value; $("trF").value = $("trT").value; $("trT").value = f; TS.from = $("trF").value; TS.to = $("trT").value; var o = $("trOut"); if (!o.hidden) { $("trIn").value = o.getAttribute("data-tx") || ""; o.hidden = true; } };
  function outBox(txt, orig) {
    var o = $("trOut"); o.hidden = false; o.setAttribute("data-tx", txt);
    o.innerHTML = "<b>" + esc(txt) + '</b><div class="row-btns"><button type="button" class="btn small ghost" data-act="trspeak" data-w="' + esc(txt) + '">' + W.ICONS.sound + esc(t("trListen")) + '</button><button type="button" class="btn small ghost" data-act="trcopy" data-w="' + esc(txt) + '">' + esc(t("trCopy")) + "</button></div>";
  }
  W.acts.trgo = function (el) {
    var v = $("trIn").value.trim(), o = $("trOut"); if (!v) { o.hidden = false; o.textContent = t("trEmpty"); return; }
    o.hidden = false; o.textContent = t("trBusy"); if (W.trBars) W.trBars.set("think", 1500); el.disabled = true;
    fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(v) + "&langpair=" + encodeURIComponent(TS.from + "|" + TS.to))
      .then(function (r) { return r.json(); }).then(function (j) {
        var x = j && j.responseData && j.responseData.translatedText; if (!x || /MYMEMORY WARNING|INVALID/i.test(x)) throw 0; outBox(x); if (W.trBars) W.trBars.set("happy", 1500);
      }).catch(function () { o.textContent = t("trFail"); if (W.trBars) W.trBars.set("oops", 1500); }).then(function () { el.disabled = false; });
  };
  W.acts.phrase = function (el) { outBox(el.getAttribute("data-ky")); $("trOut").insertAdjacentHTML("afterbegin", '<small class="muted">' + esc(el.getAttribute("data-tx")) + "</small>"); $("trOut").scrollIntoView({ behavior: "smooth", block: "nearest" }); if (W.trBars) W.trBars.set("talk", 1200); };
  W.acts.trspeak = function (el) { speak(el.getAttribute("data-w")); if (W.trBars) W.trBars.set("talk", 1500); };
  W.acts.trcopy = function (el) { try { navigator.clipboard.writeText(el.getAttribute("data-w")); W.toast(t("trCopied")); } catch (e) {} };

  /* ---------- События ---------- */
  function nextDate(e) {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    if (e.annual && /^\d\d-\d\d$/.test(e.md || "")) { var p = e.md.split("-"), d = new Date(now.getFullYear(), +p[0] - 1, +p[1]); if (d < now) d = new Date(now.getFullYear() + 1, +p[0] - 1, +p[1]); return d; }
    if (/^\d{4}-\d\d-\d\d$/.test(e.date || "")) { var q = e.date.split("-"); return new Date(+q[0], +q[1] - 1, +q[2]); }
    return null;
  }
  function eventsSorted() { return (W.S.events || []).map(function (e) { return { e: e, d: nextDate(e) }; }).filter(function (x) { return !x.d || x.d >= new Date(new Date().setHours(0, 0, 0, 0)); }).sort(function (a, b) { return (a.d ? a.d.getTime() : 9e15) - (b.d ? b.d.getTime() : 9e15); }); }
  W.sec({ id: "events", key: "events", nav: "nEv", order: 20, cls: "events",
    html: function () {
      var l = eventsSorted(), soon = new Date(Date.now() + 30 * 864e5), loc = W.lang === "zh" ? "zh-CN" : W.lang;
      return '<div class="wrap">' + W.head("tEv", "sEv") + (l.length ? '<div class="ev-l">' + l.map(function (x) {
        var e = x.e, d = x.d;
        return '<article class="ev"><div class="ev-d">' + (d ? "<b>" + d.getDate() + "</b><span>" + esc(new Intl.DateTimeFormat(loc, { month: "short" }).format(d)) + "</span>" : "<b>?</b><span>" + esc(t("evTbc")) + "</span>") + '</div><div class="ev-i">' + W.img(e.img, tr(e.t)) + '</div><div class="ev-b"><h3>' + esc(tr(e.t)) + (d && d <= soon ? ' <span class="badge st">' + esc(t("evSoon")) + "</span>" : "") + "</h3><p>" + esc(tr(e.d)) + '</p><div class="ev-m">' + (tr(e.place) ? "<span>" + W.ICONS.pin + esc(tr(e.place)) + "</span>" : "") + (e.annual ? "<span>" + W.ICONS.cal + esc(t("evAnnual")) + "</span>" : "") + "</div>" +
          '<div class="row-btns">' + (d ? '<button type="button" class="btn small ghost" data-act="ics" data-id="' + esc(e.id) + '">' + W.ICONS.cal + esc(t("evAdd")) + "</button>" : "") + (e.url ? '<a class="btn small" href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(t("evMore")) + "</a>" : "") + "</div></div></article>";
      }).join("") + "</div>" : '<p class="muted">' + esc(t("evNone")) + "</p>") + "</div>";
    } });
  W.acts.ics = function (el) {
    var e = (W.S.events || []).filter(function (x) { return x.id === el.getAttribute("data-id"); })[0], d = e && nextDate(e); if (!d) return;
    var f = function (x) { return x.getFullYear() + ("0" + (x.getMonth() + 1)).slice(-2) + ("0" + x.getDate()).slice(-2); }, d2 = new Date(d.getTime() + 864e5), q = function (s) { return String(s || "").replace(/[\\;,]/g, "\\$&").replace(/\n/g, "\\n"); };
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//web-touristKG//EN", "BEGIN:VEVENT", "UID:" + e.id + "@web-touristkg", "DTSTAMP:" + new Date().toISOString().replace(/[-:]|\.\d+/g, ""), "DTSTART;VALUE=DATE:" + f(d), "DTEND;VALUE=DATE:" + f(d2), e.annual ? "RRULE:FREQ=YEARLY" : "", "SUMMARY:" + q(tr(e.t)), "DESCRIPTION:" + q(tr(e.d)), "LOCATION:" + q(tr(e.place)), "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = (e.id || "event") + ".ics"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- Моя страна: галерея + впечатления гостей ---------- */
  function compress(file, max) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = rej; fr.onload = function () {
        var im = new Image(); im.onerror = rej; im.onload = function () {
          var k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.72));
        }; im.src = fr.result;
      }; fr.readAsDataURL(file);
    });
  }
  var storyImgs = [], storyRate = 0;
  function stars(n) { var o = ""; for (var i = 1; i <= 5; i++) o += '<i class="' + (i <= n ? "on" : "") + '">★</i>'; return '<span class="stv" aria-label="' + n + '/5">' + o + "</span>"; }
  function storyCards(l) {
    if (!l.length) return '<p class="muted">' + esc(t("stNone")) + "</p>";
    return l.map(function (s) {
      var im = (s.imgs && s.imgs.length ? s.imgs : (s.img ? [s.img] : [])).slice(0, 3);
      return '<article class="story">' + (im.length ? '<div class="st-ph n' + im.length + '">' + im.map(function (u) { return W.img(u, s.name); }).join("") + "</div>" : "") + (s.rating ? stars(+s.rating) : "") + "<p>“" + esc(s.text) + "”</p><b>— " + esc(s.name || "") + (s.from ? " " + esc(t("stBy")) + " " + esc(s.from) : "") + "</b></article>";
    }).join("");
  }
  function paintPrev() {
    $("stPrev").innerHTML = storyImgs.map(function (u, i) { return '<span class="pv"><img src="' + u + '" alt=""><button type="button" data-act="strm" data-i="' + i + '" aria-label="' + esc(t("stRm")) + '">×</button></span>'; }).join("");
    $("stFile").disabled = storyImgs.length >= 3;
  }
  function paintRate() { Array.prototype.forEach.call(document.querySelectorAll("#stRate button"), function (b) { var n = +b.getAttribute("data-n"); b.className = n <= storyRate ? "on" : ""; b.setAttribute("aria-pressed", n === storyRate); }); }
  W.acts.strate = function (el) { storyRate = +el.getAttribute("data-n"); paintRate(); $("stRn").hidden = true; };
  W.acts.strm = function (el) { storyImgs.splice(+el.getAttribute("data-i"), 1); paintPrev(); $("stMax").hidden = true; };
  W.sec({ id: "stories", key: "stories", nav: "nStories", order: 90,
    html: function () {
      var rb = [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-act="strate" data-n="' + n + '" aria-pressed="false" aria-label="' + n + " " + esc(t("star")) + '">★</button>'; }).join("");
      return '<div class="wrap">' + W.head("tSt", "sSt") + '<div class="gal">' + (W.S.gallery || []).map(function (g, i) { return '<figure data-act="gimg" data-i="' + i + '" tabindex="0" role="button">' + W.img(g.img, tr(g.c)) + "<figcaption>" + esc(tr(g.c)) + "</figcaption></figure>"; }).join("") + '</div><div class="stories" id="stList"></div>' +
        '<form class="story-f glass-l" id="stF"><h3>' + esc(t("stShare")) + '</h3><div class="two"><label>' + esc(t("stName")) + '<input name="name" required maxlength="60"></label><label>' + esc(t("lC")) + '<input name="from" maxlength="60"></label></div><div class="rate"><span class="tl">' + esc(t("stRate")) + '</span><div class="stars" id="stRate" role="group">' + rb + '</div><small class="err-t" id="stRn" hidden>' + esc(t("stRateNeed")) + '</small></div><label>' + esc(t("stText")) + '<textarea name="text" required maxlength="600" rows="3"></textarea></label><label class="file">' + esc(t("stPhotos")) + '<input type="file" accept="image/*" multiple id="stFile"></label><div id="stPrev" class="st-prev"></div><small class="muted" id="stMax" hidden>' + esc(t("stPhMax")) + '</small><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn" type="submit">' + esc(t("stSend")) + '</button><p class="ok-t" id="stOk" hidden>' + esc(t("stThanks")) + "</p></form></div>";
    },
    init: function () {
      storyImgs = []; storyRate = 0;
      WTStore.getStories(false).then(function (l) { if ($("stList")) $("stList").innerHTML = storyCards(l); });
      $("stFile").addEventListener("change", function () {
        var fs = Array.prototype.slice.call(this.files), room = 3 - storyImgs.length, inp = this; $("stMax").hidden = fs.length <= room;
        Promise.all(fs.slice(0, Math.max(room, 0)).map(function (f) { return compress(f, 800); })).then(function (us) { storyImgs = storyImgs.concat(us).slice(0, 3); inp.value = ""; paintPrev(); });
      });
      $("stF").addEventListener("submit", function (e) {
        e.preventDefault(); var f = e.target; if (f.website.value) return;
        if (!storyRate) { $("stRn").hidden = false; $("stRate").scrollIntoView({ block: "center" }); return; }
        WTStore.submitStory({ name: f.name.value.trim(), from: f.from.value.trim(), text: f.text.value.trim(), rating: storyRate, imgs: storyImgs.slice(0, 3), lang: W.lang }).then(function () { f.reset(); storyImgs = []; storyRate = 0; paintPrev(); paintRate(); $("stOk").hidden = false; });
      });
    } });
  W.acts.gimg = function (el) { var g = (W.S.gallery || [])[+el.getAttribute("data-i")]; if (g) W.modal('<div class="lightbox">' + W.img(g.img, tr(g.c)) + "<p>" + esc(tr(g.c)) + "</p></div>", "wide dark"); };

  /* ---------- Свой путеводитель: 2ГИС, обмен валют, банки ---------- */
  var GC = { city: 0, from: "USD", to: "KGS", amt: 100, rates: null };
  var GP = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  var GI = {
    food: GP('<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1-3.500 4-3.500 7 0 1.500 1 2.500 3.500 2.500"/>'), cafe: GP('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"/>'),
    atm: GP('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>'), exch: GP('<circle cx="9" cy="9" r="5.500"/><path d="M15 10.500a5.500 5.500 0 1 1-4.500 4.500M9 7v4M7.500 8.500h3"/>'),
    pharm: GP('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>'), hotel: GP('<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.500"/>'),
    taxi: GP('<path d="M5 16V12l2-5h10l2 5v4M3 16h18M7 19v-3M17 19v-3M9 4h6"/>'), see: GP('<path d="M4 8h3l2-3h6l2 3h3v11H4V8Z"/><circle cx="12" cy="13" r="3.500"/>')
  };
  function gUrl(q) { var c = (W.S.guide.cities || [])[GC.city] || { slug: "bishkek" }; return "https://2gis.kg/" + encodeURIComponent(c.slug) + "/search/" + encodeURIComponent(q); }
  function curList() { return String((W.S.guide || {}).currencies || "KGS, USD, EUR, RUB, KZT, CNY").split(/[\s,;]+/).filter(Boolean); }
  function convHtml() {
    var o = function (sel) { return curList().map(function (c) { return '<option' + (c === sel ? " selected" : "") + ">" + c + "</option>"; }).join(""); };
    return '<div class="conv glass-l"><h3>' + W.ICONS.coin + esc(t("gConv")) + '</h3><div class="cv-row"><label>' + esc(t("gAmt")) + '<input id="cvA" type="number" min="0" step="any" value="' + GC.amt + '" inputmode="decimal"></label><label>' + esc(t("gFrom")) + '<select id="cvF">' + o(GC.from) + '</select></label>' +
      '<button type="button" class="ico-btn" data-act="cvswap" aria-label="' + esc(t("gSwap")) + '">⇄</button><label>' + esc(t("gTo")) + '<select id="cvT">' + o(GC.to) + '</select></label></div><div class="cv-out" id="cvO" aria-live="polite">' + esc(t("gLoading")) + '</div><p class="muted small">' + esc(t("gRateNote")) + '</p><a class="link" href="https://www.nbkr.kg/index1.jsp?item=2756&lang=RUS" target="_blank" rel="noopener">' + esc(t("gNbkr")) + " " + W.ICONS.arrow + '</a> <span class="muted small">· ' + esc(t("gAttr")) + ' <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">ExchangeRate-API</a></span></div>';
  }
  function convCalc() {
    var o = $("cvO"); if (!o) return; if (!GC.rates) return;
    var a = parseFloat($("cvA").value) || 0, f = $("cvF").value, to = $("cvT").value, r = GC.rates;
    if (!r[f] || !r[to]) { o.textContent = t("gNoRate"); return; }
    var v = a / r[f] * r[to], rate = r[to] / r[f]; GC.amt = a; GC.from = f; GC.to = to;
    o.innerHTML = "<b>" + a.toLocaleString(W.lang) + " " + f + " = " + v.toLocaleString(W.lang, { maximumFractionDigits: v < 10 ? 3 : 2 }) + " " + to + "</b><small>" + esc(t("gRate")) + ": 1 " + f + " = " + rate.toLocaleString(W.lang, { maximumFractionDigits: 4 }) + " " + to + "</small>";
  }
  function loadRates() {
    try { var c = JSON.parse(W.ls("wt_rates") || "null"); if (c && Date.now() - c.at < 6 * 36e5) { GC.rates = c.r; convCalc(); return; } } catch (e) {}
    fetch("https://open.er-api.com/v6/latest/USD").then(function (x) { return x.json(); }).then(function (j) { if (!j.rates) throw 0; GC.rates = j.rates; W.ls("wt_rates", JSON.stringify({ at: Date.now(), r: j.rates })); convCalc(); })
      .catch(function () { var o = $("cvO"); if (o) o.textContent = t("gNoRate"); });
  }
  function guideCityBtns() {
    return (W.S.guide.cities || []).map(function (c, i) { return '<button type="button" class="chip" data-act="gcity" data-i="' + i + '" aria-pressed="' + (i === GC.city) + '">' + esc(tr(c.n)) + "</button>"; }).join("");
  }
  function guideLinks() {
    var g = W.S.guide;
    return '<div class="g-tiles">' + (g.cats || []).map(function (c) { return '<a class="g-tile" target="_blank" rel="noopener" href="' + esc(gUrl(tr(c.q))) + '"><span class="g-i">' + (GI[c.k] || GI.see) + "</span><b>" + esc(t(c.t)) + "</b><small>" + esc(t("gOpen")) + "</small></a>"; }).join("") + "</div>" +
      ((g.banks || []).length ? '<h3 class="d-h3">' + esc(t("gBanks")) + '</h3><div class="banks">' + g.banks.map(function (b) { return '<a class="tag bank" target="_blank" rel="noopener" href="' + esc(gUrl(b.n)) + '">' + esc(b.n) + "</a>"; }).join("") + '</div><a class="link" target="_blank" rel="noopener" href="' + esc(gUrl(tr({ ru: "Банкомат", en: "ATM", zh: "ATM", es: "Cajero" }))) + '">' + esc(t("gBankFind")) + " " + W.ICONS.arrow + "</a>" : "");
  }
  W.sec({ id: "guide", key: "guide", nav: "nGuide", order: 80,
    html: function () {
      var g = W.S.guide || {}; if (!g.cities) return "";
      var tips = tr(g.tips).split("\n").filter(Boolean);
      return '<div class="wrap">' + W.head("tGuide", "gHint") + '<div class="g-grid"><div><span class="tl">' + esc(t("gCity")) + '</span><div class="chips" id="gCities">' + guideCityBtns() + '</div><div id="gLinks">' + guideLinks() + "</div></div>" + convHtml() + "</div>" +
        (tips.length ? '<h3 class="d-h3">' + esc(t("gTips")) + '</h3><ul class="tips">' + tips.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    },
    init: function () {
      if (!$("cvA")) return; ["cvA", "cvF", "cvT"].forEach(function (i) { $(i).addEventListener("input", convCalc); }); loadRates();
    } });
  W.acts.gcity = function (el) { GC.city = +el.getAttribute("data-i"); $("gCities").innerHTML = guideCityBtns(); $("gLinks").innerHTML = guideLinks(); };
  W.acts.cvswap = function () { var f = $("cvF").value; $("cvF").value = $("cvT").value; $("cvT").value = f; convCalc(); };

  /* ---------- запуск ---------- */
  W.boot = function () { if (W.botGreet) W.botGreet(true); };
})();
