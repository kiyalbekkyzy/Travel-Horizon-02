/* Форма заявки: выбор канала связи (WhatsApp / Telegram / звонок), страны мира с подсказками, язык общения.
   После отправки турист остаётся на сайте: «Заявка отправлена». Админ видит канал и контакт как ссылку. */
(function () {
  var W = window.WT, $ = W.$, esc = W.esc, tr = W.tr, t = W.t;
  var CODES = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW HK MO".split(" ");
  var DIAL = {"AF": "93", "AL": "355", "DZ": "213", "AD": "376", "AO": "244", "AG": "1268", "AR": "54", "AM": "374", "AU": "61", "AT": "43", "AZ": "994", "BS": "1242", "BH": "973", "BD": "880", "BB": "1246", "BY": "375", "BE": "32", "BZ": "501", "BJ": "229", "BT": "975", "BO": "591", "BA": "387", "BW": "267", "BR": "55", "BN": "673", "BG": "359", "BF": "226", "BI": "257", "CV": "238", "KH": "855", "CM": "237", "CA": "1", "CF": "236", "TD": "235", "CL": "56", "CN": "86", "CO": "57", "KM": "269", "CG": "242", "CD": "243", "CR": "506", "CI": "225", "HR": "385", "CU": "53", "CY": "357", "CZ": "420", "DK": "45", "DJ": "253", "DM": "1767", "DO": "1809", "EC": "593", "EG": "20", "SV": "503", "GQ": "240", "ER": "291", "EE": "372", "SZ": "268", "ET": "251", "FJ": "679", "FI": "358", "FR": "33", "GA": "241", "GM": "220", "GE": "995", "DE": "49", "GH": "233", "GR": "30", "GD": "1473", "GT": "502", "GN": "224", "GW": "245", "GY": "592", "HT": "509", "HN": "504", "HU": "36", "IS": "354", "IN": "91", "ID": "62", "IR": "98", "IQ": "964", "IE": "353", "IL": "972", "IT": "39", "JM": "1876", "JP": "81", "JO": "962", "KZ": "7", "KE": "254", "KI": "686", "KP": "850", "KR": "82", "XK": "383", "KW": "965", "KG": "996", "LA": "856", "LV": "371", "LB": "961", "LS": "266", "LR": "231", "LY": "218", "LI": "423", "LT": "370", "LU": "352", "MG": "261", "MW": "265", "MY": "60", "MV": "960", "ML": "223", "MT": "356", "MH": "692", "MR": "222", "MU": "230", "MX": "52", "FM": "691", "MD": "373", "MC": "377", "MN": "976", "ME": "382", "MA": "212", "MZ": "258", "MM": "95", "NA": "264", "NR": "674", "NP": "977", "NL": "31", "NZ": "64", "NI": "505", "NE": "227", "NG": "234", "MK": "389", "NO": "47", "OM": "968", "PK": "92", "PW": "680", "PS": "970", "PA": "507", "PG": "675", "PY": "595", "PE": "51", "PH": "63", "PL": "48", "PT": "351", "QA": "974", "RO": "40", "RU": "7", "RW": "250", "KN": "1869", "LC": "1758", "VC": "1784", "WS": "685", "SM": "378", "ST": "239", "SA": "966", "SN": "221", "RS": "381", "SC": "248", "SL": "232", "SG": "65", "SK": "421", "SI": "386", "SB": "677", "SO": "252", "ZA": "27", "SS": "211", "ES": "34", "LK": "94", "SD": "249", "SR": "597", "SE": "46", "CH": "41", "SY": "963", "TW": "886", "TJ": "992", "TZ": "255", "TH": "66", "TL": "670", "TG": "228", "TO": "676", "TT": "1868", "TN": "216", "TR": "90", "TM": "993", "TV": "688", "UG": "256", "UA": "380", "AE": "971", "GB": "44", "US": "1", "UY": "598", "UZ": "998", "VU": "678", "VA": "39", "VE": "58", "VN": "84", "YE": "967", "ZM": "260", "ZW": "263", "HK": "852", "MO": "853"};
  var PRIO = ["KG", "KZ", "UZ", "RU", "TR", "CN", "US", "DE"];
  W.CODES = CODES;
  W.countryName = function (code, lang) { try { return new Intl.DisplayNames([lang === "zh" ? "zh-CN" : lang], { type: "region" }).of(code) || code; } catch (e) { return code; } };
  var st = { app: "wa", speak: null, code: "", tour: "" };

  function countries() {
    var l = CODES.map(function (c) { return { c: c, n: W.countryName(c, W.lang), e: W.countryName(c, "en") }; });
    l.sort(function (a, b) { var pa = PRIO.indexOf(a.c), pb = PRIO.indexOf(b.c); return a.n.localeCompare(b.n, W.lang); }); return l;
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/ё/g, "е"); }

  /* ссылки для связи: используются и в админке */
  W.contactLink = function (app, contact) {
    contact = String(contact || "").trim(); var digits = contact.replace(/[^\d]/g, "");
    if (app === "wa") return digits ? "https://wa.me/" + digits : "";
    if (app === "ph") return digits ? "tel:+" + digits : "";
    if (app === "tg") { if (/^\+?[\d\s()-]{7,}$/.test(contact)) return "https://t.me/+" + digits; var u = contact.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""); return u ? "https://t.me/" + u : ""; }
    return "";
  };

  W.sec({ id: "plan", key: "plan", nav: "", order: 120, cls: "plan",
    html: function () {
      var S = W.S, apps = [["wa", t("appWa"), W.ICONS.wa], ["tg", t("appTg"), W.ICONS.tg], ["ph", t("appPh"), W.ICONS.ph]];
      var langs = [["ru", "Русский"], ["en", "English"], ["zh", "中文"], ["es", "Español"]]; st.speak = st.speak || W.lang;
      var tours = '<option value="">—</option>' + S.tours.map(function (x) { return '<option value="' + x.id + '"' + (st.tour === x.id ? " selected" : "") + ">" + esc(tr(x.t)) + "</option>"; }).join("");
      return '<div class="wrap plan-g"><div class="plan-i">' + W.head("tP", "sP") + '<ul class="plan-c">' +
        (S.phone ? "<li>" + W.ICONS.ph + esc(S.phone) + "</li>" : "") + (S.email ? "<li>" + W.ICONS.mail + esc(S.email) + "</li>" : "") + "</ul>" +
        '<div class="soc big">' + (S.socials || []).map(function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener" aria-label="' + esc(s.label) + '">' + W.icon(s) + "<span>" + esc(s.label) + "</span></a>"; }).join("") + '</div><div class="plan-m" id="planM"></div></div>' +
        '<div class="form-box"><form id="lead" novalidate class="lead-f"><div class="two"><label>' + esc(t("lN")) + '<input name="name" required maxlength="80" autocomplete="name"></label>' +
        '<label class="cb">' + esc(t("lC")) + '<input id="cIn2" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="cList" autocomplete="off" placeholder="' + esc(t("lCph")) + '" required><ul id="cList" role="listbox" hidden></ul><small class="err" id="cErr" hidden>' + esc(t("errCountry")) + "</small></label></div>" +
        '<fieldset><legend>' + esc(t("lApp")) + '</legend><div class="apps">' + apps.map(function (a) { return '<button type="button" class="app" data-act="app" data-k="' + a[0] + '" aria-pressed="' + (st.app === a[0]) + '">' + a[2] + esc(a[1]) + "</button>"; }).join("") + '</div><div class="phone-row"><div class="dial" id="dialW"><button type="button" class="dial-b" id="dialBtn" aria-haspopup="listbox" aria-expanded="false"></button><div class="dial-p" id="dialP" hidden><input id="dialQ" type="search" autocomplete="off" placeholder="' + esc(t("dialSearch")) + '"><ul id="dialL" role="listbox"></ul></div></div><input name="contact" id="contactIn" required maxlength="40" inputmode="tel"></div><small class="muted" id="dialHint"></small><small class="err" id="pErr" hidden>' + esc(t("errPhone")) + "</small></fieldset>" +
        '<fieldset><legend>' + esc(t("lSpeak")) + '</legend><div class="chips">' + langs.map(function (a) { return '<button type="button" class="chip" data-act="speak" data-k="' + a[0] + '" aria-pressed="' + (st.speak === a[0]) + '">' + a[1] + "</button>"; }).join("") + "</div></fieldset>" +
        '<div class="two"><label>' + esc(t("lD")) + '<span class="dates"><input type="date" name="from"><input type="date" name="to"></span></label><label>' + esc(t("lPeople")) + '<input type="number" name="people" min="1" max="99" value="2"></label></div>' +
        "<label>" + esc(t("lTour")) + '<select name="tour" id="tourSel">' + tours + "</select></label>" +
        "<label>" + esc(t("promo")) + '<input name="promo" maxlength="40" autocomplete="off"></label>' + "<label>" + esc(t("lW")) + '<textarea name="wishes" id="wishes" rows="3" maxlength="1500"></textarea></label>' +
        '<p class="muted" id="favNote"></p><p class="urg" id="urg" hidden>' + esc(t("urg")) + '</p><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn full" type="submit">' + esc(t("send")) + "</button></form>" +
        '<div class="done" id="done" hidden><div class="done-m" id="doneM"></div><h3>' + esc(t("okTitle")) + '</h3><p>' + esc(t("okText")) + '</p><p class="done-c" id="doneC"></p><button type="button" class="btn ghost" data-act="again">' + esc(t("okAgain")) + "</button></div></div></div>";
    },
    init: function () {
      var inp = $("cIn2"), list = $("cList"), sel = -1, all = countries(), cur = [];
      if (st.code) { inp.value = W.countryName(st.code, W.lang); }
      function show() {
        var q = norm(inp.value.trim()); st.code = "";
        cur = all.filter(function (x) { return !q || norm(x.n).indexOf(q) === 0 || norm(x.e).indexOf(q) === 0 || (q.length > 2 && (norm(x.n).indexOf(q) >= 0 || norm(x.e).indexOf(q) >= 0)); });
        cur.sort(function (a, b) { var pa = PRIO.indexOf(a.c), pb = PRIO.indexOf(b.c); pa = pa < 0 ? 99 : pa; pb = pb < 0 ? 99 : pb; return q && pa !== pb ? pa - pb : 0; });
        sel = -1; list.innerHTML = cur.slice(0, 40).map(function (x, i) { return '<li role="option" id="co' + i + '" data-c="' + x.c + '">' + esc(x.n) + (x.n !== x.e ? " <small>" + esc(x.e) + "</small>" : "") + "</li>"; }).join("");
        list.hidden = !cur.length; inp.setAttribute("aria-expanded", !list.hidden); $("cErr").hidden = true;
      }
      function pick(c) { st.code = c; if (!st.dialManual && DIAL[c]) { st.dial = DIAL[c]; dialDraw(); } inp.value = W.countryName(c, W.lang); list.hidden = true; inp.setAttribute("aria-expanded", "false"); $("cErr").hidden = true; }
      inp.addEventListener("input", show); inp.addEventListener("focus", show);
      inp.addEventListener("keydown", function (e) {
        var items = list.querySelectorAll("li"); if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (list.hidden) show(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % (items.length || 1); items.forEach(function (li, i) { li.classList.toggle("on", i === sel); }); if (items[sel]) { inp.setAttribute("aria-activedescendant", items[sel].id); items[sel].scrollIntoView({ block: "nearest" }); } }
        else if (e.key === "Enter" && !list.hidden && items.length) { e.preventDefault(); pick((items[sel >= 0 ? sel : 0]).getAttribute("data-c")); }
        else if (e.key === "Escape") list.hidden = true;
      });
      list.addEventListener("mousedown", function (e) { var li = e.target.closest("li"); if (li) { e.preventDefault(); pick(li.getAttribute("data-c")); } });
      inp.addEventListener("blur", function () { setTimeout(function () { list.hidden = true; if (!st.code) { var q = norm(inp.value.trim()), m = all.filter(function (x) { return norm(x.n) === q || norm(x.e) === q; })[0]; if (m) pick(m.c); } }, 120); });
      dialInit(); W.setAppPlaceholder();
      var from = document.querySelector('#lead [name=from]'), urg = $("urg");
      from.addEventListener("change", function () { var d = new Date(this.value); urg.hidden = !(this.value && (d - Date.now()) / 864e5 < 14 && d >= new Date(new Date().setHours(0, 0, 0, 0))); });
      var n = W.fav.all().length; $("favNote").textContent = n ? t("favsIn") + ": " + n : "";
      WTBars.mount($("planM"), { face: true }).set("wave", 2500);
      $("lead").addEventListener("submit", submit);
    } });

  st.dial = st.dial || "996";
  function dialDraw() { var b = $("dialBtn"); if (b) b.textContent = "+" + st.dial + " ▾"; }
  function dialList(q) {
    q = norm(String(q || "").trim()).replace(/^\+/, ""); var l = countries().filter(function (x) { return DIAL[x.c] && (!q || norm(x.n).indexOf(q) >= 0 || norm(x.e).indexOf(q) >= 0 || DIAL[x.c].indexOf(q) === 0); });
    var seen = {}; $("dialL").innerHTML = l.slice(0, 80).map(function (x) { return '<li role="option" data-d="' + DIAL[x.c] + '"><span>' + esc(x.n) + "</span><b>+" + DIAL[x.c] + "</b></li>"; }).join("");
  }
  function dialInit() {
    var b = $("dialBtn"), p = $("dialP"), q = $("dialQ"); dialDraw();
    function close() { p.hidden = true; b.setAttribute("aria-expanded", "false"); }
    b.addEventListener("click", function () { p.hidden = !p.hidden; b.setAttribute("aria-expanded", String(!p.hidden)); if (!p.hidden) { q.value = ""; dialList(""); q.focus(); } });
    q.addEventListener("input", function () { dialList(q.value); });
    q.addEventListener("keydown", function (e) { if (e.key === "Escape") { close(); b.focus(); } if (e.key === "Enter") { e.preventDefault(); var f = $("dialL").querySelector("li"); if (f) f.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); } });
    $("dialL").addEventListener("mousedown", function (e) { var li = e.target.closest("li"); if (!li) return; e.preventDefault(); st.dial = li.getAttribute("data-d"); st.dialManual = true; dialDraw(); close(); $("contactIn").focus(); });
    document.addEventListener("click", function (e) { if (p && !e.target.closest("#dialW")) close(); });
  }
  function fullContact(raw) {
    raw = raw.trim(); if (st.app === "tg" && /[a-z@_]/i.test(raw)) return raw;
    if (raw.charAt(0) === "+") return "+" + raw.replace(/\D/g, "");
    return "+" + st.dial + raw.replace(/\D/g, "").replace(/^0+/, "");
  }
  W.setAppPlaceholder = function () {
    var i = $("contactIn"); if (!i) return;
    i.placeholder = st.app === "tg" ? "@username / 555 000 000" : "555 000 000"; var h = $("dialHint"); if (h) h.textContent = t("dialHint");
    i.setAttribute("inputmode", st.app === "tg" ? "text" : "tel");
  };
  W.acts.app = function (el) { st.app = el.getAttribute("data-k"); document.querySelectorAll(".app").forEach(function (b) { b.setAttribute("aria-pressed", b === el); }); W.setAppPlaceholder(); };
  W.acts.speak = function (el) { st.speak = el.getAttribute("data-k"); document.querySelectorAll('[data-act="speak"]').forEach(function (b) { b.setAttribute("aria-pressed", b === el); }); };
  W.setTour = function (id) { st.tour = id; var s = $("tourSel"); if (s) s.value = id; var p = $("plan"); if (p) p.scrollIntoView({ behavior: "smooth" }); };
  W.setWishes = function (txt, days) { var w = $("wishes"); if (w) w.value = (w.value ? w.value + "\n\n" : "") + (days ? days + " " + t("daysWord") + "\n" : "") + txt; var p = $("plan"); if (p) p.scrollIntoView({ behavior: "smooth" }); };
  W.acts.again = function () { $("done").hidden = true; $("lead").hidden = false; $("lead").reset(); st.code = ""; $("cIn2").value = ""; };

  function submit(e) {
    e.preventDefault(); var f = e.target; if (f.website.value) return;
    var ok = true, contact = fullContact(f.contact.value), digits = contact.replace(/\D/g, "");
    if (!f.name.value.trim()) { f.name.focus(); return; }
    if (!st.code) { $("cErr").hidden = false; $("cIn2").focus(); ok = false; }
    var bad = st.app === "tg" ? contact.replace(/^@/, "").length < 3 : digits.length < 7; $("pErr").hidden = !bad; if (bad) { if (ok) f.contact.focus(); ok = false; }
    if (!ok) return;
    var tour = W.S.tours.filter(function (x) { return x.id === f.tour.value; })[0], from = f.from.value, urgent = !!from && (new Date(from) - Date.now()) / 864e5 < 14;
    var favs = W.fav.all().map(function (k) { var o = W.favTitle(k); return o ? o.t : null; }).filter(Boolean);
    var lead = { name: f.name.value.trim(), country: W.countryName(st.code, "en"), countryCode: st.code, app: st.app, contact: contact, link: W.contactLink(st.app, contact), speak: st.speak, from: from, to: f.to.value, people: f.people.value, tour: tour ? tr(tour.t) : "", tourId: tour ? tour.id : "", wishes: f.wishes.value.trim(), promo: f.promo.value.trim(), favs: favs, urgent: urgent, siteLang: W.lang };
    var btn = f.querySelector("button[type=submit]"); btn.disabled = true;
    WTStore.submitLead(lead).then(function () {
      W.track("lead"); f.hidden = true; $("done").hidden = false;
      var key = { wa: "okWa", tg: "okTg", ph: "okPh" }[st.app];
      $("doneC").textContent = t(key) + " " + contact; WTBars.mount($("doneM"), { face: true }).set("happy", 3600); $("done").scrollIntoView({ behavior: "smooth", block: "center" });
      if (W.botSay) W.botSay("ok");
    }).catch(function () { alert("Error / Ошибка"); }).then(function () { btn.disabled = false; });
  }
})();
