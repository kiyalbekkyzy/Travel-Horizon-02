/* Барс — анимированный помощник: здоровается, спрашивает «нужна помощь?», «задумывается» перед ответом и «говорит» пока печатает.
   Ответы собираются из содержимого сайта (области, туры, события), поэтому правятся в админке. */
(function () {
  var W = window.WT, $ = W.$, esc = W.esc, tr = W.tr, t = W.t;
  var bb = null, chatB = null, opened = false, busy = false, greeted = false;
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function say2(ru, en) { return W.lang === "ru" ? ru : en; }
  function norm(s) { return String(s || "").toLowerCase().replace(/ё/g, "е"); }
  function has(q, re) { return re.test(q); }

  function labels() {
    $("chName").textContent = t("chatName"); $("cIn").placeholder = t("chatPh"); $("bb").setAttribute("aria-label", t("chatName"));
    $("cQ").innerHTML = [1, 2, 3, 4].map(function (i) { return '<button type="button" class="chip" data-act="botq" data-q="' + esc(t("botQ" + i)) + '">' + esc(t("botQ" + i)) + "</button>"; }).join("");
  }
  function addMsg(who, html) {
    var d = document.createElement("div"); d.className = "msg " + who; d.innerHTML = html; $("cLog").appendChild(d); $("cLog").scrollTop = $("cLog").scrollHeight; return d;
  }

  /* ---- ответы ---- */
  function regionIn(q) {
    var best = null; W.S.regions.forEach(function (r) {
      var names = [r.n.ru, r.n.en, r.n.zh, r.n.es, r.id].filter(Boolean).map(norm).map(function (s) { return s.replace(/ская$|ская область|\s*область/g, "").trim(); });
      if (names.some(function (n) { return n.length > 2 && q.indexOf(n.slice(0, Math.max(4, n.length - 2))) >= 0; })) best = r;
    }); return best;
  }
  function answer(raw) {
    var q = norm(raw), S = W.S, r = regionIn(q), now = new Date().getMonth(), out;
    if (has(q, /^(привет|здравств|салам|hello|hi\b|hola|你好|добрый)/)) return { text: t("chatHi") };
    if (r && !has(q, /тур|tour/)) {
      out = tr(r.n) + ": " + tr(r.d) + "\n" + say2("Посмотреть: ", "See: ") + W.list(r.see).join(", ") + "\n" + say2("Попробовать: ", "Try: ") + W.list(r.food).join(", ") + "\n" + say2("Сейчас — ", "Right now — ") + t("s" + ((r.months || [])[now] == null ? 1 : r.months[now])).toLowerCase() + ".";
      return { text: out, btn: [{ l: t("legendBtn"), a: "legend", id: r.id }, { l: t("seasonBtn"), a: "season", id: r.id }] };
    }
    if (has(q, /перев|разговорник|как сказать|по-кыргыз|кыргызск.*(язык|слов|фраз)|translat|phrase|how (do|to) (i )?say|kyrgyz (word|lang)|traduc|frase|翻译/)) return { text: say2("В разделе «Переводчик» есть готовые фразы по-кыргызски с произношением и перевод вашего текста на другие языки. Откроем?", "The Translator section has ready Kyrgyz phrases you can play aloud and a translator for your own text. Shall we open it?"), btn: [{ l: t("nTr"), a: "goto", id: "translator" }] };
    if (has(q, /сам(ому|остоятельно)|без тура|самосто|on my own|by myself|independent|solo|por mi cuenta|自由行/)) return { text: say2("Без тура тоже можно! Сначала выберите лучшее время, потом соберите маршрут, а в путеводителе найдёте карту 2ГИС, обмен валюты и переводчик.", "You can travel without a tour! First pick the best time, then build a route; the guide has 2GIS maps, money exchange and a translator."), btn: [{ l: t("nSea"), a: "goto", id: "season" }, { l: t("nRoute"), a: "goto", id: "route" }, { l: t("nGuide"), a: "goto", id: "guide" }] };
    if (has(q, /дневник|паспорт|отмет|печат|скидк|подар|diary|passport|check.?in|discount|gift|snow leopard|снежн.*барс|diario|sello/)) return { text: say2("В разделе «Дневник» создайте профиль, а на месте поездки нажимайте «Я здесь был!»: отметьте место, добавьте фото и заметку. За отметки даём баллы, звания и подарки; за все семь областей — звание «Снежный барс».", "In the Diary section create a profile, and on your trip press “I was here!”: mark the place, add a photo and a note. Check-ins earn points, titles and gifts; all seven regions earn the “Snow Leopard” title."), btn: [{ l: t("nDiary"), a: "goto", id: "passport" }] };
    if (has(q, /событ|праздник|фестивал|нооруз|event|festival|nooruz|holiday|fiesta|evento/)) {
      var ev = (S.events || []).slice(0, 4).map(function (e) { return "• " + tr(e.t); }).join("\n"); return { text: say2("Ближайшие и ежегодные события:\n", "Upcoming and annual events:\n") + ev, btn: [{ l: t("nEv"), a: "goto", id: "events" }] };
    }
    if (has(q, /когда|сезон|лучш.*врем|when|season|best time|cuando|cuándo|何时/)) {
      var good = S.regions.filter(function (x) { return (x.months || [])[now] >= 3; }).map(function (x) { return tr(x.n); });
      return { text: say2("В этом месяце лучше всего: ", "Best this month: ") + (good.join(", ") || say2("загляните в раздел «Когда ехать»", "see the “When to go” section")) + ".", btn: [{ l: t("tSea"), a: "goto", id: "season" }] };
    }
    if (has(q, /погод|weather|clima|tiempo/)) return { text: say2("Погода сейчас — в разделе «Когда лучше ехать»: выберите область.", "Live weather is in the “When to go” section: choose a region."), btn: [{ l: t("tSea"), a: "goto", id: "season" }] };
    if (has(q, /тур|конн|лошад|tour|horse|trek|caballo|excursi/)) {
      var tl = S.tours.slice(0, 4).map(function (x) { return "• " + tr(x.t) + (x.p ? " — " + t("from") + " " + W.price(x.p) : ""); }).join("\n"); return { text: say2("Популярные туры:\n", "Popular tours:\n") + tl, btn: [{ l: t("tT"), a: "goto", id: "tours" }] };
    }
    if (has(q, /что посмотр|посет|смотреть|достопримеч|see|visit|attraction|ver\b|visitar|看|去哪/)) {
      var pl = S.regions.slice(0, 4).map(function (x) { return "• " + tr(x.n) + ": " + W.list(x.see).slice(0, 3).join(", "); }).join("\n"); return { text: say2("Вот с чего можно начать:\n", "Places to start:\n") + pl, btn: [{ l: t("regions"), a: "goto", id: "regions" }] };
    }
    if (has(q, /еда|поесть|вкус|кухн|food|eat|dish|comida|cuisine|吃/)) {
      var fl = S.regions.slice(0, 5).map(function (x) { return "• " + tr(x.n) + ": " + W.list(x.food).join(", "); }).join("\n"); return { text: say2("Что попробовать:\n", "What to try:\n") + fl };
    }
    if (has(q, /обмен|валют|деньги|курс|банк|банкомат|2гис|2gis|карта|exchange|currency|money|bank|atm|cambio|dinero|汇率|换钱/)) return { text: say2("В «Путеводителе» есть калькулятор валют, а также банки, банкоматы, обменники, кафе и аптеки на карте 2ГИС. Выберите город — и откроется нужный поиск.", "The Guide has a currency calculator, plus banks, ATMs, exchange offices, cafes and pharmacies on 2GIS. Pick a city and the search opens."), btn: [{ l: t("nGuide"), a: "goto", id: "guide" }] };
    if (has(q, /навигац|карта|маршрут|2гис|navigation|map|route|gps|mapa|地图/)) return { text: say2("Для карты и маршрутов удобен 2ГИС — он работает по Кыргызстану. А свой маршрут можно собрать в конструкторе.", "2GIS works well for maps and routes in Kyrgyzstan. You can also build your own route in the planner."), btn: [{ l: t("open"), a: "url", id: "https://2gis.kg" }, { l: t("tRoute"), a: "goto", id: "route" }] };
    if (has(q, /заявк|заказ|забронир|связ|оставить|request|book|contact|apply|solicitud|reserv|预订/)) return { text: say2("Оставьте заявку: укажите страну, удобный мессенджер (WhatsApp, Telegram или звонок) и язык общения — и мы свяжемся.", "Send a request: choose your country, preferred contact (WhatsApp, Telegram or a call) and language — and we'll get in touch."), btn: [{ l: t("formB"), a: "goto", id: "plan" }] };
    return { text: t("toForm"), btn: [{ l: t("formB"), a: "goto", id: "plan" }], oops: true };
  }
  function btns(o) {
    return o.btn ? '<div class="m-btns">' + o.btn.map(function (b) { return '<button type="button" class="chip" data-act="botgo" data-a="' + b.a + '" data-id="' + esc(b.id) + '">' + esc(b.l) + "</button>"; }).join("") + "</div>" : "";
  }
  W.acts.botgo = function (el) {
    var a = el.getAttribute("data-a"), id = el.getAttribute("data-id");
    if (a === "goto") { W.closeChat(); var e = $(id); if (e) e.scrollIntoView({ behavior: "smooth" }); }
    else if (a === "url") window.open(id, "_blank", "noopener");
    else if (W.acts[a]) { if (a === "legend" || a === "season") W.closeChat(); W.acts[a]({ getAttribute: function () { return id; }, classList: { contains: function () { return false; } } }); }
  };

  function ask(q) {
    q = String(q || "").trim(); if (!q || busy) return; busy = true; W.track("chat");
    addMsg("me", esc(q)); var dots = addMsg("bot typing", "<i></i><i></i><i></i>");
    chatB.set("think"); bb.set("think");
    setTimeout(function () {
      var a = answer(q); dots.remove(); var m = addMsg("bot", ""); chatB.set(a.oops ? "oops" : "talk"); bb.set(a.oops ? "oops" : "talk");
      var i = 0, txt = a.text, step = Math.max(1, Math.ceil(txt.length / 70));
      var iv = setInterval(function () { i += step; m.innerHTML = W.nl(txt.slice(0, i)); $("cLog").scrollTop = $("cLog").scrollHeight; if (i >= txt.length) { clearInterval(iv); m.innerHTML = W.nl(txt) + btns(a); chatB.set(a.oops ? "oops" : "idle", a.oops ? 1400 : 0); if (!a.oops) chatB.set("idle"); bb.set(a.oops ? "oops" : "happy", a.oops ? 1400 : 1600); busy = false; $("cLog").scrollTop = $("cLog").scrollHeight; if (a.play) { W.closeChat(); var k = $("kyrgyz"); if (k) { k.scrollIntoView({ behavior: "smooth" }); setTimeout(W.acts.kystart, 600); } } } }, 28);
    }, 900 + Math.random() * 500);
  }

  W.openChat = function () {
    $("chat").hidden = false; $("bHello").hidden = true; opened = true; if (bb && bb.state === "wave") bb.set("idle"); ss("wt_greeted", "1");
    if (!$("cLog").children.length) { addMsg("bot", W.nl(t("chatHi"))); chatB.set("wave", 2200); }
    $("cIn").focus();
  };
  W.closeChat = function () { $("chat").hidden = true; opened = false; };
  W.acts.cclose = W.closeChat;
  W.acts.botq = function (el) { W.openChat(); ask(el.getAttribute("data-q")); };
  W.botSay = function () { if (bb) bb.set("happy", 3200); };
  /* взгляд: голова Барса поворачивается за курсором */
  (function () {
    var raf = 0, mx = 0, my = 0;
    function look() { raf = 0; var b = $("bb"); if (!b || !b.offsetParent) return; var r = b.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), d = Math.max(1, Math.hypot(dx, dy)), k = Math.min(1, d / 300);
      b.style.setProperty("--lx", (dx / d * k * 5).toFixed(2)); b.style.setProperty("--ly", (dy / d * k * 4).toFixed(2)); }
    document.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });
  })();
  /* «живой» Барс: сам время от времени машет, подпрыгивает, а при наведении здоровается */
  W.botRefresh = function () { labels(); $("cLog").innerHTML = ""; if (opened) addMsg("bot", W.nl(t("chatHi"))); };

  /* приветствие: появляется через пару секунд после входа */
  W.botGreet = function (allow) {
    if (!bb) {
      bb = WTBars.mount($("bbMasc")); chatB = WTBars.mount($("chMasc"), { face: true }); labels();
      $("bb").addEventListener("click", function () { if ($("chat").hidden) W.openChat(); else W.closeChat(); });
      $("cForm").addEventListener("submit", function (e) { e.preventDefault(); var v = $("cIn").value; $("cIn").value = ""; ask(v); });
    }
    if (greeted || allow === false) return; greeted = true;
    var h = $("bHello"), idle = null;
    function offer() {
      if (opened || !$("chat").hidden) return;
      bb.set("wave");
      h.innerHTML = '<p class="sal">Салам!</p><p>' + esc(t("botHello")) + '</p><div><button type="button" class="btn small" data-act="hyes">' + esc(t("botYes")) + '</button><button type="button" class="btn small ghost" data-act="hno">' + esc(t("botNo")) + "</button></div>"; h.hidden = false;
    }
    function arm() { clearTimeout(idle); idle = setTimeout(function () { offer(); arm(); }, 60000); }
    ["pointerdown", "keydown", "touchstart", "wheel"].forEach(function (ev) { document.addEventListener(ev, arm, { passive: true }); });
    setTimeout(function () { offer(); arm(); }, 400);
  };
  W.acts.hyes = function () { W.openChat(); };
  W.acts.hno = function () { $("bHello").hidden = true; ss("wt_greeted", "1"); bb.set("idle"); };
  W.afterRender = function () { if (bb) labels(); };
})();
