/* Личный кабинет: вход/аватар в шапке и панель (профиль, поездки, история, настройки). Работает с Cloudflare Worker (/api/me, /api/trips, /api/history). */
(function () {
  var W = window.WT, $ = W.$, esc = W.esc, t = W.t, tr = W.tr;
  var AC = { tab: "p", trips: null, hist: null };
  var ERR = { phone: "acErrPhone", same: "acErrSame", auth: "acErrAuth", name: "acErrName", pass: "dErrPass", mail: "dErrMail", typo: "dErrTypo", disposable: "dErrDisp", nomx: "dErrNoMx", used: "dErrUsed", mail_off: "dErrOff", mail_fail: "dErrSend", "too many": "dErrMany", limit: "acErrLimit", token: "dVerBad" };
  function me() { return WTStore.me(); }
  function msg(id, text, bad) { var x = $(id); if (!x) return; x.textContent = text || ""; x.className = "ac-msg " + (bad ? "err" : "ok-t"); x.hidden = !text; }
  function fail(id, er) { msg(id, er.status === 401 && er.message === "auth" && id !== "acPwMsg" && id !== "acMailMsg" && id !== "acDelMsg" ? t("acErrAuth") : t(ERR[er.message] || (er instanceof TypeError ? "dErrNet" : "acErrServer")), true); }
  function fmtDate(s) { if (!s) return ""; var d = new Date(s); return isNaN(d) ? s : d.toLocaleDateString(W.lang === "zh" ? "zh-CN" : W.lang, { day: "numeric", month: "short", year: "numeric" }); }
  function fmtTime(s) { var d = new Date(s); return isNaN(d) ? "" : d.toLocaleDateString(W.lang === "zh" ? "zh-CN" : W.lang, { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString(W.lang === "zh" ? "zh-CN" : W.lang, { hour: "2-digit", minute: "2-digit" }); }

  /* ---------- шапка: «Войти» или аватар ---------- */
  function drawBtn() {
    var b = $("accBtn"); if (!b) return; var u = me();
    if (!WTStore.hasApi) { b.hidden = true; return; } // кабинет нужен серверу: в демо-режиме скрыт
    b.hidden = false;
    if (u) { b.className = "acc-btn in"; b.setAttribute("aria-label", t("acTitle")); b.innerHTML = '<span class="acc-av">' + esc((u.name || "?").trim().charAt(0).toUpperCase()) + '</span><span class="acc-nm">' + esc(u.name.split(" ")[0]) + "</span>"; }
    else { b.className = "acc-btn out btn small glass-btn"; b.removeAttribute("aria-label"); b.textContent = t("dLogin"); }
  }
  W.acts.accbtn = function () { if (me()) openAccount(); else W.authModal("login"); };
  W.acts.acc = function () { if (me()) openAccount(); else W.authModal("login"); };
  window.addEventListener("wt-auth", function () { drawBtn(); if (!me()) W.closeModal(); });

  /* ---------- панель ---------- */
  var TABS = [["p", "acTabP"], ["t", "acTabT"], ["h", "acTabH"], ["s", "acTabS"]];
  function openAccount(tab) {
    var u = me(); if (!u) return; AC.tab = tab || "p";
    W.modal('<div class="acct"><div class="ac-head"><span class="acc-av big">' + esc((u.name || "?").trim().charAt(0).toUpperCase()) + '</span><div><h2 id="acName">' + esc(u.name) + '</h2><p class="muted">' + esc(u.email) + ' <span class="tag ok">✓ ' + esc(t("acVer")) + '</span></p></div></div>' +
      '<div class="ac-tabs" role="tablist">' + TABS.map(function (x) { return '<button type="button" role="tab" class="ac-tab" data-act="actab" data-tab="' + x[0] + '">' + esc(t(x[1])) + "</button>"; }).join("") + '</div><div id="acBody" class="ac-body"></div></div>', "wide acmodal");
    WTStore.refreshMe().then(function (nu) { drawBtn(); var n = $("acName"); if (n) n.textContent = nu.name; if (AC.tab === "p" || AC.tab === "s") drawTab(); window.dispatchEvent(new Event("wt-user")); }).catch(function (er) { if (er.status === 401) { WTStore.signOut(); window.dispatchEvent(new Event("wt-auth")); } });
    drawTab();
  }
  W.openAccount = openAccount;
  W.acts.actab = function (el) { AC.tab = el.getAttribute("data-tab"); drawTab(); };
  function drawTab() {
    var u = me(); if (!u || !$("acBody")) return;
    document.querySelectorAll(".ac-tab").forEach(function (x) { var on = x.getAttribute("data-tab") === AC.tab; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
    ({ p: tabProfile, t: tabTrips, h: tabHistory, s: tabSettings })[AC.tab](u);
  }

  /* --- профиль --- */
  function tabProfile(u) {
    var on = u.diary !== false;
    $("acBody").innerHTML = '<form id="acForm" class="ac-form" novalidate><label>' + esc(t("acName")) + '<input name="name" maxlength="60" autocomplete="name" value="' + esc(u.name) + '"></label>' +
      '<label>' + esc(t("acPhone")) + '<input name="phone" type="tel" maxlength="24" autocomplete="tel" inputmode="tel" value="' + esc(u.phone || "") + '" placeholder="+996 555 000 000"></label>' +
      '<label>' + esc(t("acCountry")) + '<input name="country" maxlength="60" autocomplete="country-name" value="' + esc(u.country || "") + '"></label>' +
      '<label class="full">' + esc(t("acAbout")) + '<textarea name="about" rows="3" maxlength="400">' + esc(u.about || "") + '</textarea></label>' +
      '<p class="ac-msg" id="acMsg" hidden role="status" aria-live="polite"></p><button class="btn" type="submit">' + esc(t("acSave")) + "</button></form>" +
      '<div class="ac-card"><h4>' + esc(t("acDiary")) + "</h4><p>" + esc(t(on ? "acDiaryOn" : "acDiaryOff")) + '</p><div class="ac-row">' +
      (on ? '<button type="button" class="btn small" data-act="acgodiary">' + esc(t("acGoDiary")) + "</button>" : '<button type="button" class="btn small" data-act="acdiary" data-v="1">' + esc(t("acEnable")) + "</button>") + "</div></div>";
    $("acForm").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, b = f.querySelector("button"); b.disabled = true; msg("acMsg", "");
      WTStore.updateMe({ name: f.name.value, phone: f.phone.value, country: f.country.value, about: f.about.value }).then(function (nu) { b.disabled = false; msg("acMsg", t("acSaved")); $("acName").textContent = nu.name; drawBtn(); if (W.loadDiary) W.loadDiary(); }).catch(function (er) { b.disabled = false; fail("acMsg", er); });
    });
  }
  W.acts.acgodiary = function () { W.closeModal(); var p = $("passport"); if (p) p.scrollIntoView({ behavior: "smooth" }); };
  W.acts.acdiary = function (el) { WTStore.updateMe({ diary: el.getAttribute("data-v") === "1" }).then(function () { if (W.loadDiary) W.loadDiary(); drawTab(); }).catch(function () { W.toast(t("acErrServer")); }); };

  /* --- поездки --- */
  function tripHtml(x) {
    var dates = x.from ? fmtDate(x.from) + (x.to ? " – " + fmtDate(x.to) : "") : "", st = x.status;
    return '<li class="trip ' + st + '"><div class="tp-main"><b>' + esc(x.title) + '</b><span class="tag st-' + st + '">' + esc(t({ planned: "acTrPlanned", done: "acTrDone", cancelled: "acTrCancelled" }[st])) + "</span>" +
      '<small class="muted">' + esc([dates, x.people ? x.people + " " + t("acPpl") : ""].filter(Boolean).join(" · ")) + "</small>" + (x.note ? "<p>" + esc(x.note) + "</p>" : "") + '</div><div class="tp-act">' +
      (st === "planned" ? '<button type="button" class="link" data-act="actrset" data-id="' + esc(x.id) + '" data-s="done">' + esc(t("acTrMarkDone")) + '</button><button type="button" class="link" data-act="actrset" data-id="' + esc(x.id) + '" data-s="cancelled">' + esc(t("acTrCancel")) + "</button>" : "") +
      '<button type="button" class="link danger" data-act="actrdel" data-id="' + esc(x.id) + '">' + esc(t("acTrDel")) + "</button></div></li>";
  }
  function drawTrips() {
    var l = $("acTrips"); if (!l) return; var tr0 = AC.trips || [];
    l.innerHTML = tr0.length ? tr0.map(tripHtml).join("") : '<li class="muted">' + esc(t("acTrEmpty")) + "</li>";
  }
  function tabTrips() {
    var tours = ((W.S || {}).tours || []).map(function (x) { return '<option value="' + esc(tr(x.t)) + '">'; }).join("");
    $("acBody").innerHTML = '<form id="acTripF" class="ac-form" novalidate><h4 class="full">' + esc(t("acTrNew")) + '</h4><label class="full">' + esc(t("acTrWhere")) + '<input name="title" maxlength="100" list="acTours" autocomplete="off"></label><datalist id="acTours">' + tours + "</datalist>" +
      '<label>' + esc(t("acTrFrom")) + '<input name="from" type="date"></label><label>' + esc(t("acTrTo")) + '<input name="to" type="date"></label><label>' + esc(t("acTrPeople")) + '<input name="people" type="number" min="1" max="50" value="2"></label>' +
      '<label class="full">' + esc(t("acTrNote")) + '<input name="note" maxlength="500"></label><p class="ac-msg" id="acMsg" hidden></p><button class="btn" type="submit">' + esc(t("acTrAdd")) + '</button></form><ul class="trips" id="acTrips"><li class="muted">…</li></ul>';
    $("acTripF").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target; if (!f.title.value.trim()) { msg("acMsg", t("acTrNeed"), true); return; } var b = f.querySelector("button"); b.disabled = true; msg("acMsg", "");
      WTStore.addTrip({ title: f.title.value, from: f.from.value, to: f.to.value, people: f.people.value, note: f.note.value }).then(function (x) { b.disabled = false; AC.trips = [x].concat(AC.trips || []); f.reset(); f.people.value = 2; drawTrips(); }).catch(function (er) { b.disabled = false; fail("acMsg", er); });
    });
    drawTrips();
    WTStore.trips().then(function (l) { AC.trips = l; drawTrips(); }).catch(function (er) { fail("acMsg", er); });
  }
  W.acts.actrset = function (el) { var id = el.getAttribute("data-id"), s = el.getAttribute("data-s"); WTStore.patchTrip(id, { status: s }).then(function (x) { AC.trips = AC.trips.map(function (y) { return y.id === id ? x : y; }); drawTrips(); }).catch(function () { W.toast(t("acErrServer")); }); };
  W.acts.actrdel = function (el) { if (!confirm(t("acTrDelQ"))) return; var id = el.getAttribute("data-id"); WTStore.deleteTrip(id).then(function () { AC.trips = AC.trips.filter(function (y) { return y.id !== id; }); drawTrips(); }).catch(function () { W.toast(t("acErrServer")); }); };

  /* --- история --- */
  function evText(e) {
    var m = { signup: "evSignup", profile: "evProfile", password: "evPassword", trip: "evTrip", trip_done: "evTripDone", trip_cancelled: "evTripCancelled", request: "evRequest", request_status: "evReqStatus", email: "evEmail", diary: e.text === "on" ? "evDiaryOn" : "evDiaryOff" }[e.type];
    var extra = e.type === "request_status" ? t({ new: "stNew", progress: "stProgress", done: "stDone" }[e.text] || "stNew") : (e.type === "signup" || e.type === "diary" || e.type === "profile" || e.type === "password") ? "" : e.text;
    return (m ? t(m) : e.type) + (extra ? ": " + extra : "");
  }
  function tabHistory() {
    $("acBody").innerHTML = '<p class="muted">…</p>';
    WTStore.history().then(function (h) {
      AC.hist = h; if (AC.tab !== "h" || !$("acBody")) return;
      var st = { new: "stNew", progress: "stProgress", done: "stDone" };
      $("acBody").innerHTML = '<ul class="ac-stats"><li><b>' + esc(fmtDate(h.joined)) + "</b><span>" + esc(t("acHJoined")) + "</span></li><li><b>" + (h.requests || []).length + "</b><span>" + esc(t("acHReq")) + "</span></li><li><b>" + h.diaryEntries + "</b><span>" + esc(t("acHDiary")) + "</span></li></ul>" +
        "<h4>" + esc(t("acHReq")) + '</h4><ul class="hist">' + ((h.requests || []).length ? h.requests.map(function (r) {
          return '<li><div><b>' + esc(r.tour || "—") + "</b><small class=\"muted\">" + esc([fmtDate(r.at), r.from ? fmtDate(r.from) + (r.to ? " – " + fmtDate(r.to) : "") : ""].filter(Boolean).join(" · ")) + '</small></div><span class="tag st-' + esc(r.status) + '">' + esc(t(st[r.status] || "stNew")) + "</span></li>";
        }).join("") : '<li class="muted">' + esc(t("acHReqEmpty")) + "</li>") + "</ul>" +
        "<h4>" + esc(t("acHAct")) + '</h4><ul class="hist ev">' + ((h.events || []).length ? h.events.map(function (e) { return "<li><span>" + esc(evText(e)) + "</span><small class=\"muted\">" + esc(fmtTime(e.at)) + "</small></li>"; }).join("") : '<li class="muted">' + esc(t("acHNone")) + "</li>") + "</ul>";
    }).catch(function (er) { if ($("acBody")) $("acBody").innerHTML = '<p class="err">' + esc(t(ERR[er.message] || "acErrServer")) + "</p>"; });
  }

  /* --- настройки --- */
  function tabSettings(u) {
    var on = u.diary !== false, lg = u.lang || W.lang;
    $("acBody").innerHTML = '<div class="ac-card"><label class="sw"><input type="checkbox" id="acNotify"' + (u.notify !== false ? " checked" : "") + '><span><b>' + esc(t("acNotify")) + "</b><small class=\"muted\">" + esc(t("acNotifyH")) + "</small></span></label>" +
      '<label class="sw"><input type="checkbox" id="acDiaryT"' + (on ? " checked" : "") + '><span><b>' + esc(t("acDiary")) + '</b><small class="muted">' + esc(t(on ? "acDiaryOn" : "acDiaryOff")) + "</small></span></label>" +
      '<label class="ac-sel">' + esc(t("acLangMail")) + '<select id="acLang">' + [["ru", "Русский"], ["en", "English"], ["es", "Español"], ["zh", "中文"]].map(function (x) { return '<option value="' + x[0] + '"' + (lg === x[0] ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + '</select></label><p class="ac-msg" id="acSetMsg" hidden></p></div>' +
      '<div class="ac-card"><h4>' + esc(t("acSecurity")) + '</h4><form id="acPwF" class="ac-form" novalidate><label>' + esc(t("acPwOld")) + '<input name="old" type="password" autocomplete="current-password"></label><label>' + esc(t("acPwNew")) + ' <small class="muted">(' + esc(t("dPass").replace(/^[^(]*\(?/, "").replace(/\)$/, "")) + ')</small><input name="pw" type="password" autocomplete="new-password"></label>' +
      '<p class="ac-msg" id="acPwMsg" hidden></p><button class="btn small" type="submit">' + esc(t("acPwBtn")) + '</button></form>' +
      '<form id="acMailF" class="ac-form" novalidate><label class="full">' + esc(t("acEmailNew")) + ' <small class="muted">(' + esc(t("acEmailCur")) + ": " + esc(u.email) + ')</small><input name="email" type="email" autocomplete="email"></label><label class="full">' + esc(t("acPwOld")) + '<input name="pw" type="password" autocomplete="current-password"></label>' +
      '<p class="ac-msg" id="acMailMsg" hidden></p><button class="btn small" type="submit">' + esc(t("acEmailBtn")) + "</button></form></div>" +
      '<div class="ac-row between"><button type="button" class="btn ghost" data-act="dout">' + esc(t("acOut")) + '</button></div>' +
      '<div class="ac-card danger"><h4>' + esc(t("acDanger")) + "</h4><p>" + esc(t("acDelP")) + '</p><div id="acDelBox"><button type="button" class="link danger" data-act="acdel1">' + esc(t("acDelBtn")) + "</button></div></div>";
    var set = function (patch) { msg("acSetMsg", ""); WTStore.updateMe(patch).then(function () { msg("acSetMsg", t("acSaved")); if (W.loadDiary) W.loadDiary(); }).catch(function (er) { fail("acSetMsg", er); }); };
    $("acNotify").addEventListener("change", function () { set({ notify: this.checked }); });
    $("acDiaryT").addEventListener("change", function () { var c = this.checked; msg("acSetMsg", ""); WTStore.updateMe({ diary: c }).then(function () { if (W.loadDiary) W.loadDiary(); drawTab(); }).catch(function (er) { fail("acSetMsg", er); }); });
    $("acLang").addEventListener("change", function () { set({ lang: this.value }); });
    $("acPwF").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, b = f.querySelector("button"); b.disabled = true; msg("acPwMsg", "");
      WTStore.changePassword(f.old.value, f.pw.value, W.lang).then(function () { b.disabled = false; f.reset(); msg("acPwMsg", t("acPwDone")); }).catch(function (er) { b.disabled = false; fail("acPwMsg", er); });
    });
    $("acMailF").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, b = f.querySelector("button"); b.disabled = true; msg("acMailMsg", "");
      WTStore.changeEmail(f.email.value, f.pw.value, W.lang).then(function (r) { b.disabled = false; f.reset(); msg("acMailMsg", t("acEmailSent") + " (" + r.email + ")"); }).catch(function (er) { b.disabled = false; if (er.message === "typo") { msg("acMailMsg", t("dErrTypo") + "?", true); } else fail("acMailMsg", er); });
    });
  }
  W.acts.acdel1 = function () {
    $("acDelBox").innerHTML = '<form id="acDelF" class="ac-form" novalidate><label class="full">' + esc(t("acDelPw")) + '<input name="pw" type="password" autocomplete="current-password"></label><p class="ac-msg" id="acDelMsg" hidden></p><button class="btn danger" type="submit">' + esc(t("acDelSure")) + "</button></form>";
    $("acDelF").addEventListener("submit", function (e) {
      e.preventDefault(); var b = e.target.querySelector("button"); b.disabled = true;
      WTStore.deleteAccount(e.target.pw.value).then(function () { W.closeModal(); if (W.loadDiary) W.loadDiary(); window.dispatchEvent(new Event("wt-auth")); }).catch(function (er) { b.disabled = false; fail("acDelMsg", er); });
    });
  };

  /* ---------- ссылка из письма о смене почты: ?confirm=… ---------- */
  function mailLink() {
    var c = new URLSearchParams(location.search).get("confirm"); if (!c) return;
    try { history.replaceState(null, "", location.pathname + "#passport"); } catch (e) {}
    WTStore.confirmEmail(c, W.lang).then(function () { drawBtn(); if (W.loadDiary) W.loadDiary(); window.dispatchEvent(new Event("wt-user")); W.modal('<div class="auth"><h2>' + esc(t("acMailOkT")) + "</h2><p>" + esc(t("acMailOkP")) + '</p><button type="button" class="btn full" data-act="mclose">' + esc(t("dOkBtn")) + "</button></div>", "narrow"); })
      .catch(function () { W.modal('<div class="auth"><h2>' + esc(t("acMailOkT")) + '?</h2><p>' + esc(t("dVerBad")) + '</p><button type="button" class="btn full" data-act="mclose">' + esc(t("dOkBtn")) + "</button></div>", "narrow"); });
  }
  drawBtn(); setTimeout(mailLink, 600);
  // после смены языка надписи в шапке обновляются
  var orig = W.render; if (typeof orig === "function") W.render = function () { var r = orig.apply(this, arguments); drawBtn(); return r; };
})();
