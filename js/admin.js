/* Админка: меняйте на сайте всё — тексты, фото, области и легенды, туры, события, паспорт (QR), слова, соцсети, цвета — и ведите заявки.
   Текст на русском автоматически переводится на en / zh / es (можно отключить; перевод можно поправить руками). */
(function () {
  var Store = window.WTStore, L = window.WT_I18N, $ = function (i) { return document.getElementById(i); };
  var c = null, tab = "leads", dirty = false, leads = [], refreshTimer = null, autoOn = true;
  var LANGS = ["ru", "en", "zh", "es"], LN = { ru: "Русский", en: "English", zh: "中文", es: "Español" };
  var TABS = [["leads", "Заявки"], ["stats", "Статистика"], ["stories", "Впечатления гостей"], ["home", "Главная"], ["history", "История"], ["regions", "Области и легенды"], ["company", "О компании"], ["tours", "Туры"], ["events", "События"], ["passport", "Дневник и подарки"], ["travellers", "Путешественники"], ["kyrgyz", "Разговорник (кнопки фраз)"], ["gallery", "Моя страна (фото)"], ["guide", "Путеводитель (2ГИС, валюта)"], ["contacts", "Контакты и соцсети"], ["texts", "Все надписи"], ["theme", "Цвета и логотип"], ["data", "Данные"]];
  var ST = { new: ["Новая", "s-new"], progress: ["Выполняется", "s-prog"], done: ["Выполнена", "s-done"] };
  var ORDER = { new: 0, progress: 1, done: 2 };
  var APPN = { wa: "WhatsApp", tg: "Telegram", ph: "Звонок", ig: "Instagram" };

  /* ---------- помощники ---------- */
  function h(tag, a, kids) {
    var e = document.createElement(tag);
    Object.keys(a || {}).forEach(function (k) { if (k === "text") e.textContent = a[k]; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), a[k]); else if (a[k] !== false && a[k] != null) e.setAttribute(k, a[k]); });
    (kids || []).forEach(function (n) { if (n != null) e.appendChild(typeof n === "string" ? document.createTextNode(n) : n); });
    return e;
  }
  function mark() { dirty = true; $("status").textContent = "Есть несохранённые изменения"; $("status").className = "status warn"; }
  function say(m, ok) { $("status").textContent = m; $("status").className = "status" + (ok ? " ok" : " warn"); }
  function field(label, input, hint) { return h("div", { class: "f" }, [h("label", { text: label }), input, hint ? h("small", { text: hint }) : null]); }
  function inp(label, val, set, multiLine, hint, type) {
    var i = h(multiLine ? "textarea" : "input", multiLine ? { rows: 3 } : { type: type || "text" }); i.value = val == null ? "" : val;
    i.addEventListener("input", function () { set(i.value); mark(); }); return field(label, i, hint);
  }
  function num(label, o, k, hint) { return inp(label, o[k], function (v) { o[k] = v === "" ? "" : +v; }, false, hint, "number"); }
  function csv(label, o, k) { return inp(label + " (через запятую)", (o[k] || []).join(", "), function (v) { o[k] = v.split(",").map(function (s) { return s.trim(); }).filter(Boolean); }, true); }
  function toggle(label, get, set) { var i = h("input", { type: "checkbox" }); i.checked = !!get(); i.addEventListener("change", function () { set(i.checked); mark(); }); return h("label", { class: "chk" }, [i, h("span", { text: label })]); }
  function card(title, kids, actions) { return h("div", { class: "box" }, [h("div", { class: "box-h" }, [h("h3", { text: title }), h("div", { class: "acts" }, actions || [])])].concat(kids)); }
  function btn(text, fn, cls) { return h("button", { type: "button", class: "btn " + (cls || ""), text: text, onclick: fn }); }
  function select(label, opts, val, set) { var s = h("select"); opts.forEach(function (a) { s.appendChild(h("option", { value: a[0], text: a[1] })); }); s.value = val == null ? "" : val; s.onchange = function () { set(s.value); mark(); }; return field(label, s); }
  function uid(p) { return (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  var nm = function (o, k) { var v = o[k]; return (v && (v.ru || v.en)) || "без названия"; };

  /* ---------- автоперевод ---------- */
  var autoVals = new WeakMap(), timers = new WeakMap();
  function isLangObj(n) { return n && typeof n === "object" && !Array.isArray(n) && typeof n.ru === "string" && Object.keys(n).every(function (k) { return LANGS.indexOf(k) >= 0; }); }
  function setAuto(o, l, v) { var m = autoVals.get(o) || {}; m[l] = v; autoVals.set(o, m); }
  function translateObj(o, onlyEmpty) {
    var src = o.ru; if (!src || !src.trim()) return Promise.resolve();
    var targets = ["en", "zh", "es"].filter(function (l) { var cur = o[l], last = (autoVals.get(o) || {})[l]; return !cur || (!onlyEmpty && cur === last); });
    return targets.reduce(function (p, l) { return p.then(function () { return Store.translate(src, l, "ru").then(function (tx) { if (tx) { o[l] = tx; setAuto(o, l, tx); } }, function () { throw new Error("tr"); }); }); }, Promise.resolve());
  }
  function scheduleTr(o, after) {
    if (!autoOn) return; clearTimeout(timers.get(o));
    timers.set(o, setTimeout(function () { say("Перевожу…"); translateObj(o, false).then(function () { say("Переведено (проверьте и поправьте при желании)", true); if (after) after(); }, function () { say("Автоперевод недоступен — заполните переводы вручную", false); }); }, 1400));
  }
  function multi(label, o, k, area) {
    if (!o[k] || typeof o[k] !== "object") o[k] = { ru: typeof o[k] === "string" ? o[k] : "" };
    var obj = o[k], boxes = {};
    var wrap = h("div", { class: "langs" }, LANGS.map(function (l) {
      var i = h(area ? "textarea" : "input", area ? { rows: l === "ru" ? 4 : 3 } : { type: "text" }); i.value = obj[l] || ""; boxes[l] = i;
      i.addEventListener("input", function () { obj[l] = i.value; mark(); if (l === "ru") scheduleTr(obj, function () { ["en", "zh", "es"].forEach(function (x) { boxes[x].value = obj[x] || ""; }); }); });
      return field(label + " · " + LN[l] + (l === "ru" ? " (основной)" : ""), i);
    }));
    var b = btn("Перевести с русского", function () { say("Перевожу…"); translateObj(obj, false).then(function () { ["en", "zh", "es"].forEach(function (x) { boxes[x].value = obj[x] || ""; }); mark(); say("Переведено", true); }, function () { say("Автоперевод недоступен", false); }); }, "ghost sm");
    return h("div", { class: "mlt" }, [wrap, h("div", { class: "acts" }, [b])]);
  }
  function walkLang(n, fn, skip) {
    if (!n || typeof n !== "object") return; if (isLangObj(n)) { fn(n); return; }
    Object.keys(n).forEach(function (k) { if (k === "ui" || k === skip) return; walkLang(n[k], fn); });
  }
  function translateAll() {
    var list = []; walkLang(c, function (o) { if (o.ru && ["en", "zh", "es"].some(function (l) { return !o[l]; })) list.push(o); });
    if (!list.length) { say("Все тексты уже переведены", true); return; }
    var i = 0; (function next() { if (i >= list.length) { mark(); say("Готово: переведено " + list.length + " текстов. Нажмите «Сохранить сайт».", true); render(); return; } say("Перевод " + (i + 1) + " из " + list.length + "…"); translateObj(list[i++], true).then(next, function () { say("Остановлено: автоперевод недоступен (нужен Worker, см. README)", false); }); })();
  }

  /* картинка: ссылка, загрузка, библиотека */
  function img(o, k, label) {
    var wrap = h("div", { class: "f imgf" }), url = h("input", { type: "text", placeholder: "img/lake.jpg или https://…" }), pv = h("div", { class: "pv" });
    function paint() { pv.innerHTML = ""; if (o[k]) pv.appendChild(h("img", { src: o[k], alt: "" })); else pv.appendChild(h("span", { text: "нет фото" })); }
    url.value = o[k] && o[k].indexOf("data:") === 0 ? "(загруженное фото)" : (o[k] || ""); url.addEventListener("input", function () { o[k] = url.value; mark(); paint(); });
    var file = h("input", { type: "file", accept: "image/*", hidden: "" });
    file.onchange = function () { if (!file.files[0]) return; say("Загрузка фото…"); Store.uploadImage(file.files[0]).then(function (u) { o[k] = u; url.value = u.length > 120 ? "(загруженное фото)" : u; mark(); paint(); say("Фото добавлено", true); }, function () { say("Не удалось загрузить фото", false); }); };
    var lib = h("div", { class: "lib", hidden: "" }, (window.WT_LIB || []).map(function (p) { return h("button", { type: "button", class: "libi", "aria-label": p, onclick: function () { o[k] = p; url.value = p; mark(); paint(); lib.hidden = true; } }, [h("img", { src: p, alt: "" })]); }));
    var acts = h("div", { class: "acts" }, [btn("Загрузить фото", function () { file.click(); }, "ghost sm"), btn("Из библиотеки", function () { lib.hidden = !lib.hidden; }, "ghost sm"), btn("Убрать", function () { o[k] = ""; url.value = ""; mark(); paint(); }, "ghost sm")]);
    paint(); wrap.appendChild(h("label", { text: label || "Фото" })); wrap.appendChild(h("div", { class: "imgrow" }, [pv, h("div", { class: "imgin" }, [url, acts])])); wrap.appendChild(file); wrap.appendChild(lib);
    return wrap;
  }
  /* список фото (добавить / удалить / заменить) */
  function imgs(o, k, label) {
    if (!Array.isArray(o[k])) o[k] = [];
    var box = h("div", { class: "imgs" }); box.appendChild(h("label", { text: label }));
    var rows = h("div", { class: "imgs-g" }); box.appendChild(rows);
    o[k].forEach(function (_, i) { rows.appendChild(h("div", { class: "imgs-i" }, [img(o[k], i, "Фото " + (i + 1)), btn("Удалить фото", function () { o[k].splice(i, 1); mark(); render(); }, "danger sm")])); });
    box.appendChild(btn("+ Добавить фото", function () { o[k].push(""); mark(); render(); }, "ghost sm")); return box;
  }

  /* список записей */
  function list(arr, blank, titleOf, form, addText) {
    var box = h("div");
    arr.forEach(function (o, i) {
      box.appendChild(card((i + 1) + ". " + titleOf(o), form(o), [
        btn("↑", function () { if (i) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); mark(); render(); } }, "ghost sm"),
        btn("↓", function () { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); mark(); render(); } }, "ghost sm"),
        btn("Удалить", function () { if (confirm("Удалить эту запись?")) { arr.splice(i, 1); mark(); render(); } }, "danger sm")]));
    });
    box.appendChild(btn("+ " + (addText || "Добавить"), function () { arr.push(blank()); mark(); render(); }));
    return box;
  }

  /* ---------- вкладки контента ---------- */
  var SEC = [["company", "О компании (цифры, почему мы)"], ["faq", "Вопросы и ответы"], ["history", "История Кыргызстана"], ["regions", "Области и карта"], ["tours", "Туры"], ["passport", "Дневник путешественника"], ["events", "События"], ["stories", "Моя страна и впечатления"], ["guide", "Свой путеводитель"], ["plan", "Форма заявки"]];
  function tabHome(P) {
    P.appendChild(card("Слайдшоу на главном экране", [h("p", { class: "mut", text: "Фото сменяют друг друга. «Положение» — какая часть фото видна: например 50% 70% (по центру, ближе к низу)." }),
      list(c.hero.slides, function () { return { img: "", pos: "50% 60%" }; }, function (o) { return o.img ? "фото" : "пусто"; }, function (o) { return [img(o, "img"), inp("Положение фото", o.pos, function (v) { o.pos = v; })]; }, "Добавить слайд")]));
    c.hero.dest = c.hero.dest || [];
    P.appendChild(card("Карточки областей на главном экране", [h("p", { class: "mut", text: "Четыре красивые карточки под заголовком. Выберите области." })].concat([0, 1, 2, 3].map(function (i) {
      return select("Карточка " + (i + 1), [["", "— нет —"]].concat(c.regions.map(function (r) { return [r.id, nm(r, "n")]; })), c.hero.dest[i] || "", function (v) { c.hero.dest[i] = v; c.hero.dest = c.hero.dest.filter(Boolean); });
    }))));
    P.appendChild(card("Блоки сайта", [h("p", { class: "mut", text: "Снимите галочку — раздел исчезнет с сайта." })].concat(SEC.map(function (a) { return toggle(a[1], function () { return c.sections[a[0]] !== false; }, function (v) { c.sections[a[0]] = v; }); }))));
    P.appendChild(card("Барс", [img(c.mascot, "head", "Мордочка (логотип и аватарка)"), img(c.mascot, "pair", "Барс с девочкой (для наград)"), h("p", { class: "mut", text: "Анимированный Барс нарисован кодом; его позы (машет, думает, говорит, радуется) работают сами." })]));
  }
  function tabHistory(P) {
    P.appendChild(card("Великие произведения", [list(c.works, function () { return { img: "", t: { ru: "Название" }, d: { ru: "" } }; }, function (o) { return nm(o, "t"); }, function (o) { return [img(o, "img"), multi("Название", o, "t"), multi("Текст", o, "d", true)]; }, "Добавить произведение")]));
    P.appendChild(card("Узоры и символы", [list(c.symbols, function () { return { img: "", t: { ru: "Узор" }, d: { ru: "" } }; }, function (o) { return nm(o, "t"); }, function (o) { return [img(o, "img"), multi("Название", o, "t"), multi("Текст", o, "d", true)]; }, "Добавить узор")]));
    P.appendChild(card("Хронология", [list(c.timeline, function () { return { y: { ru: "Год" }, t: { ru: "Событие" }, d: { ru: "" } }; }, function (o) { return nm(o, "y") + " — " + nm(o, "t"); }, function (o) { return [multi("Дата / год", o, "y"), multi("Событие", o, "t"), multi("Описание", o, "d", true)]; }, "Добавить дату")]));
    P.appendChild(h("p", { class: "mut", text: "Легенды и факты каждой области — на вкладке «Области и легенды»." }));
  }
  function mapPicker(r) {
    var M = window.WT_MAP, cur = (c.mapPins && c.mapPins[r.id]) || M.pins[r.id] || null;
    var box = h("div", { class: "mapedit" });
    function paint() { var p = (c.mapPins && c.mapPins[r.id]) || M.pins[r.id]; box.innerHTML = '<div style="position:relative"><img src="' + M.img + '" alt="" style="width:100%;display:block">' + (p ? '<i style="position:absolute;left:' + (p[0] / M.w * 100) + '%;top:' + (p[1] / M.h * 100) + '%;width:22px;height:22px;margin:-11px;border-radius:50%;background:#d9482f;border:3px solid #fff;box-shadow:0 2px 8px #0006"></i>' : "") + "</div>"; }
    box.addEventListener("click", function (e) { var im = box.querySelector("img"), b = im.getBoundingClientRect(); c.mapPins = c.mapPins || {}; c.mapPins[r.id] = [Math.round((e.clientX - b.left) / b.width * M.w), Math.round((e.clientY - b.top) / b.height * M.h)]; mark(); paint(); });
    paint(); return field("Точка на карте — нажмите на карту, чтобы поставить" + (cur ? "" : " (пока не поставлена)"), box);
  }
  function tabRegions(P) {
    P.appendChild(h("p", { class: "mut", text: "Здесь области, их легенды (окно с картинками), интересные факты и сезоны. Всё, что вы впишете по-русски, переведётся само." }));
    var TAGS = ["nature", "lakes", "horses", "culture", "food", "history", "hiking", "nomads", "quiet"];
    P.appendChild(list(c.regions, function () { return { id: uid("r"), img: "", n: { ru: "Новая область" }, d: { ru: "" }, food: { ru: "" }, see: { ru: "" }, tags: [], days: 2, order: c.regions.length + 1, months: [1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1], lat: 42, lon: 75, sea: { ru: "" }, lg: { t: { ru: "Легенда" }, d: { ru: "" }, f: { ru: "" }, imgs: [] } }; },
      function (o) { return nm(o, "n"); }, function (o) {
        o.lg = o.lg || { t: {}, d: {}, f: {}, imgs: [] }; o.months = o.months || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
        var tg = h("div", { class: "chips" }, TAGS.map(function (k) { return toggle(k, function () { return (o.tags || []).indexOf(k) >= 0; }, function (v) { o.tags = (o.tags || []).filter(function (x) { return x !== k; }); if (v) o.tags.push(k); }); }));
        var ms = h("div", { class: "months" }, o.months.map(function (v, i) { var s = h("select", { "aria-label": "месяц " + (i + 1) }, [["0", "0 — не лучшее"], ["1", "1 — можно"], ["2", "2 — хорошо"], ["3", "3 — лучшее"]].map(function (a) { return h("option", { value: a[0], text: a[1] }); })); s.value = String(v); s.onchange = function () { o.months[i] = +s.value; mark(); }; return h("label", { class: "mo" }, [h("span", { text: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][i] }), s]); }));
        return [img(o, "img", "Главное фото области"), multi("Название", o, "n"), multi("Короткое описание", o, "d", true), multi("Что попробовать (через запятую)", o, "food"), multi("Что посмотреть (через запятую)", o, "see"), h("div", { class: "see-slots" }, [h("h4", { text: "Фото мест (по порядку из списка «Что посмотреть»)" }), h("p", { class: "mut", text: "Когда гость нажмёт на место, на карточке области покажется это фото. Если фото нет, будет заглушка «Фото скоро появится». После изменения списка мест сохраните и откройте область заново." })].concat((o.seeImg = o.seeImg || {}, ((o.see && o.see.ru) || "").split(/\s*[,，、]\s*/).filter(Boolean).map(function (n, i) { return img(o.seeImg, String(i), "Фото: " + n); })))),
          h("div", { class: "grid3" }, [num("Порядок на маршруте (1…7)", o, "order"), num("Дней на область (для маршрута)", o, "days"), num("Широта (для погоды)", o, "lat"), num("Долгота (для погоды)", o, "lon")]),
          field("Интересы области (для конструктора маршрута)", tg), field("Сезоны по месяцам (для «Когда ехать»)", ms), multi("Комментарий про сезон", o, "sea", true), mapPicker(o),
          h("h4", { text: "Легенда области (открывается в окне)" }), multi("Название легенды", o.lg, "t"), multi("Текст легенды (абзацы — с новой строки)", o.lg, "d", true), multi("Интересные факты (по одному в строке)", o.lg, "f", true), imgs(o.lg, "imgs", "Картинки в окне легенды")];
      }, "Добавить область"));
  }
  function tabTours(P) {
    P.appendChild(list(c.tours, function () { return { id: uid("t"), img: "", imgs: [], r: "", days: "", k: "multi", o: "", p: "", t: { ru: "Новый тур" }, d: { ru: "" }, prog: { ru: "" }, inc: { ru: "" }, exc: { ru: "" } }; }, function (o) { return nm(o, "t"); }, function (o) {
      return [img(o, "img", "Главное фото"), imgs(o, "imgs", "Дополнительные фото (в окне тура)"), multi("Название", o, "t"), multi("Коротко (на карточке)", o, "d", true),
        select("Область", [["", "—"]].concat(c.regions.map(function (r) { return [r.id, nm(r, "n")]; })), o.r, function (v) { o.r = v; }), select("Тип", [["horse", "Конный трек"], ["multi", "Многодневный / другое"]], o.k, function (v) { o.k = v; }),
        h("div", { class: "grid3" }, [num("Дней", o, "days"), inp("Цена, $ (пусто = по запросу)", o.p, function (v) { o.p = v; })]),
        h("div", { class: "grid3" }, [inp("Размер группы (напр. до 12)", o.group, function (v) { o.group = v; }), inp("Сложность (напр. лёгкий)", o.level, function (v) { o.level = v; }), inp("Сезон (напр. июнь–сентябрь)", o.season, function (v) { o.season = v; })]), inp("Даты выездов — по одной в строке: ГГГГ-ММ-ДД, напр. 2027-07-12 (по ним работает фильтр дат)", o.dates, function (v) { o.dates = v; }, true),
        multi("Программа (по дням: каждая строка «День 1. …»)", o, "prog", true), multi("Что входит (по строкам)", o, "inc", true), multi("Что не входит (по строкам)", o, "exc", true)];
    }, "Добавить тур"));
  }
  function tabCompany(P) {
    var k = c.company = c.company || {}; k.stats = k.stats || []; k.why = k.why || []; k.faq = k.faq || [];
    P.appendChild(h("p", { class: "mut", text: "Сейчас здесь временные данные — замените на свои. Цифры (годы, гости, маршруты, оценка) впишите настоящие." }));
    P.appendChild(card("Название и слоган", [inp("Название компании", c.site.name, function (v) { c.site.name = v; }), multi("Слоган", k, "tag")]));
    P.appendChild(card("Цифры компании", [list(k.stats, function () { return { n: "", l: { ru: "" } }; }, function (o) { return (o.n || "") + " " + nm(o, "l"); }, function (o) { return [inp("Число (напр. 10+)", o.n, function (v) { o.n = v; }), multi("Подпись", o, "l")]; }, "Добавить цифру")]));
    P.appendChild(card("Почему выбирают нас", [list(k.why, function () { return { t: { ru: "" }, d: { ru: "" } }; }, function (o) { return nm(o, "t"); }, function (o) { return [multi("Заголовок", o, "t"), multi("Текст", o, "d", true)]; }, "Добавить причину")]));
    P.appendChild(card("Вопросы и ответы", [list(k.faq, function () { return { q: { ru: "" }, a: { ru: "" } }; }, function (o) { return nm(o, "q"); }, function (o) { return [multi("Вопрос", o, "q"), multi("Ответ", o, "a", true)]; }, "Добавить вопрос")]));
    P.appendChild(card("Оплата", [multi("Как проходит оплата (показывается на странице тура)", k, "pay", true)]));
  }
  function tabEvents(P) {
    P.appendChild(h("p", { class: "mut", text: "«Каждый год» — праздник повторяется в одну дату (месяц-день). Для разового события отключите и выберите дату. Даты фестивалей проверяйте на официальных сайтах." }));
    P.appendChild(list(c.events, function () { return { id: uid("e"), annual: false, md: "", date: "", img: "", place: { ru: "" }, url: "", t: { ru: "Событие" }, d: { ru: "" } }; }, function (o) { return nm(o, "t"); }, function (o) {
      return [img(o, "img"), multi("Название", o, "t"), multi("Описание", o, "d", true), multi("Место", o, "place"), toggle("Повторяется каждый год", function () { return o.annual; }, function (v) { o.annual = v; }),
        inp("Месяц-день для ежегодного (например 03-21)", o.md, function (v) { o.md = v; }), inp("Дата разового события", o.date, function (v) { o.date = v; }, false, "Если оставить пустым — «дата уточняется»", "date"), inp("Ссылка «Подробнее» (необязательно)", o.url, function (v) { o.url = v; })];
    }, "Добавить событие"));
  }

  /* ---------- Паспорт и QR ---------- */
  function siteBase() { var b = (c.site.url || "").trim().replace(/\/+$/, ""); if (b) return b + "/"; return location.href.replace(/admin\.html.*$/, "").replace(/[?#].*$/, ""); }
  function download(name, text, type) { var a = h("a", { href: URL.createObjectURL(new Blob([text], { type: type })), download: name }); document.body.appendChild(a); a.click(); a.remove(); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }
  function tabPassport(P) {
    var pp = c.passport;
    var dy = c.diary = c.diary || { pts: 10, ptsRegion: 20, rewards: [] };
    P.appendChild(h("div", { class: "note" }, [h("b", { text: "Как это работает. " }), "Турист создаёт дневник (имя, почта, пароль). В поездке он нажимает «Я здесь был!»: выбирает место (или определяет область по GPS), добавляет фото и заметку. За каждую отметку — баллы, а количество отметок открывает звания и подарки. ",
      h("b", { text: "Важно: " }), "отметки по GPS и вручную можно подделать, поэтому перед скидкой проверяйте фото и даты в разделе «Путешественники». "]));
    P.appendChild(card("Баллы и подарки", [h("div", { class: "grid3" }, [num("Баллов за отметку", dy, "pts"), num("Бонус за первую отметку в новой области", dy, "ptsRegion")]),
      h("p", { class: "mut", text: "Подарок открывается, когда у туриста набирается нужное число отметок. Если задать промокод — турист увидит его в дневнике и назовёт в заявке (он виден в карточке заявки). Тексты ниже — примеры, замените их своими условиями." }),
      list(dy.rewards, function () { return { n: 1, t: { ru: "Подарок" }, d: { ru: "" }, code: "" }; }, function (o) { return nm(o, "t") + " (от " + o.n + " отметок)"; }, function (o) { return [num("От скольки отметок", o, "n"), multi("Название", o, "t"), multi("Что получает турист", o, "d", true), inp("Промокод (необязательно)", o.code, function (v) { o.code = v.trim(); })]; }, "Добавить подарок")]));
    P.appendChild(card("Звания", [h("p", { class: "mut", text: "Звание зависит от числа отметок. «Снежный барс» выдаётся за отметки во всех областях." }),
      list(pp.ranks, function () { return { n: 1, name: { ru: "Звание" } }; }, function (o) { return nm(o, "name") + " (от " + o.n + ")"; }, function (o) { return [num("От скольки отметок", o, "n"), multi("Название звания", o, "name")]; }, "Добавить звание"),
      h("h4", { text: "Высшее звание" }), multi("Название", pp.topRank, "name"), img(pp.topRank, "img", "Картинка награды")]));
    P.appendChild(h("h3", { class: "sub", text: "Места для отметок (список в окне «Я здесь был!»)" }));
    P.appendChild(list(pp.places, function () { return { id: uid("p"), r: "", img: "", t: { ru: "Новое место" }, d: { ru: "" } }; }, function (o) { return nm(o, "t"); }, function (o) {
      return [img(o, "img"), multi("Название места", o, "t"), multi("Описание", o, "d", true), select("Область (для звания «Снежный барс»)", [["", "—"]].concat(c.regions.map(function (r) { return [r.id, nm(r, "n")]; })), o.r, function (v) { o.r = v; })];
    }, "Добавить место"));
  }
  function tabKyrgyz(P) {
    var cats = Object.keys(c.kyCats || { hi: 1, food: 1, nat: 1, num: 1, ph: 1 });
    P.appendChild(h("p", { class: "mut", text: "Слова и фразы для игры «Давай поговорим по-кыргызски». Проверьте написание у носителя языка. Перевод: русский и английский (для других языков показывается английский)." }));
    P.appendChild(list(c.kyrgyz, function () { return { c: "hi", ky: "", ru: "", en: "" }; }, function (o) { return o.ky + " — " + o.ru; }, function (o) {
      return [h("div", { class: "grid3" }, [inp("По-кыргызски", o.ky, function (v) { o.ky = v; }), inp("По-русски", o.ru, function (v) { o.ru = v; }), inp("English", o.en, function (v) { o.en = v; })]), select("Тема", cats.map(function (k) { return [k, k]; }), o.c, function (v) { o.c = v; })];
    }, "Добавить слово"));
  }
  function tabGuide(P) {
    var g = c.guide = c.guide || { cities: [], cats: [], currencies: "KGS, USD, EUR, RUB, KZT, CNY", banks: [], tips: { ru: "" } };
    P.appendChild(h("div", { class: "note" }, [h("b", { text: "2ГИС. " }), "Кнопки открывают поиск на 2gis.kg по выбранному городу. «Адрес города» — это часть ссылки после 2gis.kg/ (например bishkek). Проверьте её, открыв 2gis.kg в браузере и выбрав город."]));
    P.appendChild(card("Города", [list(g.cities, function () { return { n: { ru: "Город" }, slug: "" }; }, function (o) { return nm(o, "n"); }, function (o) { return [multi("Название", o, "n"), inp("Адрес города для 2ГИС (латиницей)", o.slug, function (v) { o.slug = v.trim().toLowerCase(); })]; }, "Добавить город")]));
    P.appendChild(card("Что искать (плитки)", [list(g.cats, function () { return { k: "see", q: { ru: "Запрос" }, t: "gSee" }; }, function (o) { return o.t + " — " + nm(o, "q"); }, function (o) { return [select("Значок", [["food", "Еда"], ["cafe", "Кафе"], ["atm", "Банкомат"], ["exch", "Обмен"], ["pharm", "Аптека"], ["hotel", "Отель"], ["taxi", "Такси"], ["see", "Достопримечательности"]], o.k, function (v) { o.k = v; }), inp("Ключ подписи (из «Все надписи», например gFood)", o.t, function (v) { o.t = v.trim(); }), multi("Что искать в 2ГИС", o, "q")]; }, "Добавить плитку")]));
    P.appendChild(card("Банки и валюты", [inp("Валюты калькулятора (коды через запятую)", g.currencies, function (v) { g.currencies = v; }, false, "Курсы берутся с open.er-api.com; бесплатно, нужна ссылка на источник (она уже есть на сайте)."),
      list(g.banks, function () { return { n: "" }; }, function (o) { return o.n || "банк"; }, function (o) { return [inp("Название банка или кошелька", o.n, function (v) { o.n = v; })]; }, "Добавить банк")]));
    P.appendChild(card("Полезно знать", [multi("Советы (каждый с новой строки)", g, "tips", true)]));
  }
  function tabAbout(P) { P.appendChild(h("p", { class: "mut", text: "Блок «Страна небесных гор» с большим Барсом. Тексты правятся во вкладке «Все надписи» (ключи aboutT, aboutQ, aboutD, aboutF1…aboutF4). Здесь можно включить или выключить блок на вкладке «Главная» → «Блоки сайта»." })); }
  function tabTravellers(P) {
    P.appendChild(h("p", { class: "mut", text: "Все, кто завёл дневник, и их отметки. Проверяйте фото и даты, прежде чем давать скидку. Почта нужна только для связи." }));
    var box = h("div"); P.appendChild(box); box.textContent = "Загружаю…";
    Store.getUsers().then(function (us) {
      box.innerHTML = ""; if (!us.length) { box.appendChild(h("p", { class: "mut", text: "Пока никто не зарегистрировался." })); return; }
      us.sort(function (a, b) { return (b.entries || []).length - (a.entries || []).length; });
      us.forEach(function (u) {
        var en = u.entries || [], pts = en.reduce(function (n, e) { return n + (e.pts || 0); }, 0);
        box.appendChild(card(u.name + " · " + en.length + " отметок · " + pts + " баллов", [h("p", { class: "mut", text: u.email + (u.at ? " · с " + fmt(u.at) : "") })].concat(en.map(function (e) {
          return h("div", { class: "box" }, [h("b", { text: e.title + " · " + fmt(e.at) + " · " + ({ qr: "по QR", gps: "по GPS", manual: "вручную" }[e.via] || "") }), e.note ? h("p", { text: e.note }) : null, e.img ? h("img", { src: e.img, alt: "", style: "max-width:220px;border-radius:10px" }) : null, e.lat ? h("small", { class: "mut", text: "Координаты: " + e.lat + ", " + e.lon }) : null]);
        }))));
      });
    }, function () { box.textContent = "Не удалось загрузить (нужен вход администратора)."; });
  }
  function tabGallery(P) { P.appendChild(list(c.gallery, function () { return { img: "", c: { ru: "Подпись" } }; }, function (o) { return nm(o, "c"); }, function (o) { return [img(o, "img"), multi("Подпись", o, "c")]; }, "Добавить фото")); }
  function tabContacts(P) {
    P.appendChild(card("Контакты", [inp("Телефон", c.phone, function (v) { c.phone = v; }), inp("Эл. почта", c.email, function (v) { c.email = v; }), inp("Адрес сайта (для QR-кодов и ссылок)", c.site.url, function (v) { c.site.url = v; }, false, "Например https://touristkg.example. Пока пусто — берётся адрес, с которого открыта админка.")]));
    P.appendChild(card("Соцсети (внизу сайта и в блоке заявки)", [list(c.socials, function () { return { kind: "ig", label: "Соцсеть", url: "https://", icon: "" }; }, function (o) { return o.label; }, function (o) {
      return [select("Значок", [["wa", "WhatsApp"], ["tg", "Telegram"], ["ig", "Instagram"], ["tt", "TikTok"], ["ph", "Телефон"], ["mail", "Почта"], ["globe", "Другое"]], o.kind, function (v) { o.kind = v; }), inp("Название", o.label, function (v) { o.label = v; }), inp("Ссылка", o.url, function (v) { o.url = v; }, false, "WhatsApp: https://wa.me/996555000000 · Telegram: https://t.me/имя"), img(o, "icon", "Своя иконка (необязательно)")];
    }, "Добавить соцсеть")]));
  }
  function tabTexts(P) {
    var q = h("input", { type: "search", placeholder: "Поиск по тексту или ключу…", "aria-label": "Поиск" }), box = h("div");
    P.appendChild(h("p", { class: "mut", text: "Здесь все надписи сайта на четырёх языках. Пустое поле = стандартный текст (показан серым). Любую надпись можно заменить." })); P.appendChild(q); P.appendChild(box);
    function paint() {
      box.innerHTML = ""; var s = q.value.trim().toLowerCase(), n = 0;
      Object.keys(L.en).forEach(function (k) {
        var hay = (k + " " + LANGS.map(function (l) { return L[l][k] || ""; }).join(" ")).toLowerCase(); if (s && hay.indexOf(s) < 0) return; if (++n > 80) return;
        box.appendChild(h("div", { class: "box tx" }, [h("div", { class: "box-h" }, [h("h3", { text: L.ru[k] || k }), h("code", { text: k })]), h("div", { class: "langs" }, LANGS.map(function (l) {
          var i = h("textarea", { rows: 2, placeholder: L[l][k] || "" }); i.value = (c.ui[l] && c.ui[l][k]) || "";
          i.addEventListener("input", function () { c.ui[l] = c.ui[l] || {}; if (i.value.trim()) c.ui[l][k] = i.value; else delete c.ui[l][k]; mark(); }); return field(LN[l], i);
        }))]));
      });
      if (!box.children.length) box.appendChild(h("p", { class: "mut", text: "Ничего не найдено." })); else if (n > 80) box.appendChild(h("p", { class: "mut", text: "Показаны первые 80 — уточните поиск." }));
    }
    q.addEventListener("input", paint); paint();
  }
  function tabTheme(P) {
    function color(label, k) { var i = h("input", { type: "color" }); i.value = c.theme[k] || "#000000"; i.addEventListener("input", function () { c.theme[k] = i.value; mark(); }); return field(label, i); }
    P.appendChild(card("Название и логотип", [inp("Название сайта", c.site.name, function (v) { c.site.name = v; }), img(c.site, "logo", "Логотип (круглая картинка)")]));
    P.appendChild(card("Цвета сайта", [color("Главный (кнопки, заголовки)", "c1"), color("Второй (бирюзовый, ссылки)", "c2"), color("Акцент (золотой, выделенные слова)", "c3"), color("Красный (флаг, метки)", "c4"), color("Цвет текста", "ink"), btn("Вернуть стандартные цвета", function () { c.theme = JSON.parse(JSON.stringify(window.WT_DEFAULT_CONTENT.theme)); mark(); render(); }, "ghost")]));
  }
  function tabData(P) {
    var t = h("textarea", { rows: 16, class: "mono" }); t.value = JSON.stringify(c, null, 1);
    P.appendChild(card("Весь контент сайта (JSON)", [h("p", { class: "mut", text: "Для резервной копии или переноса." }), t,
      h("div", { class: "acts" }, [btn("Применить JSON", function () { try { c = JSON.parse(t.value); mark(); render(); } catch (e) { alert("Ошибка в JSON"); } }), btn("Скачать файл", function () { download("touristkg-content.json", JSON.stringify(c, null, 1), "application/json"); }, "ghost"),
        Store.demo ? btn("Сбросить к стандартному", function () { if (confirm("Вернуть весь контент к стандартному? Заявки не удалятся.")) { Store.resetLocal(); Store.load().then(function (x) { c = x; dirty = false; say("Сброшено", true); render(); }); } }, "danger") : null])]));
  }

  /* ---------- впечатления гостей: модерация ---------- */
  function tabStories(P) {
    P.appendChild(h("p", { class: "mut", text: "Гости присылают фото и отзывы. Пока вы не нажмёте «Показать на сайте», отзыв никто не видит." }));
    var box = h("div"); P.appendChild(box);
    Store.getStories(true).then(function (a) {
      if (!a.length) { box.appendChild(h("div", { class: "empty" }, [h("p", { text: "Пока никто не поделился впечатлениями." })])); return; }
      a.forEach(function (s) {
        box.appendChild(h("article", { class: "lead " + (s.ok ? "s-done" : "s-new") }, [h("div", { class: "lead-h" }, [h("h3", { text: (s.name || "—") + (s.from ? " · " + s.from : "") }), h("time", { text: fmt(s.at) })]), s.rating ? h("p", { class: "wish", text: "★".repeat(s.rating) + "☆".repeat(5 - s.rating) }) : null, h("div", {}, (s.imgs && s.imgs.length ? s.imgs : (s.img ? [s.img] : [])).map(function (u) { return h("img", { src: u, alt: "", class: "st-img" }); })), h("p", { class: "wish", text: s.text }),
          h("div", { class: "lead-f" }, [btn(s.ok ? "Скрыть с сайта" : "Показать на сайте", function () { Store.updateStory(s.id, { ok: !s.ok }).then(function () { render(); }); }, s.ok ? "ghost sm" : "sm"), btn("Удалить", function () { if (confirm("Удалить?")) Store.deleteStory(s.id).then(render); }, "danger sm")])]));
      });
    }, function () { box.appendChild(h("p", { class: "err", text: "Нет доступа" })); });
  }

  /* ---------- статистика ---------- */
  function tally(a, f) { var m = {}; a.forEach(function (x) { var k = f(x) || "—"; m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return [k, m[k]]; }).sort(function (x, y) { return y[1] - x[1]; }); }
  function bars(title, rows, total) {
    var max = rows.length ? rows[0][1] : 1;
    return h("div", { class: "box" }, [h("div", { class: "box-h" }, [h("h3", { text: title })])].concat(rows.length ? rows.slice(0, 8).map(function (r) { return h("div", { class: "bar-r" }, [h("span", { text: r[0] }), h("div", { class: "pbar" }, [h("i", { style: "width:" + Math.max(4, r[1] / max * 100) + "%" })]), h("b", { text: String(r[1]) })]); }) : [h("p", { class: "mut", text: "Пока нет данных" })]));
  }
  function tabStats(P) {
    P.appendChild(h("p", { class: "mut", text: "Загрузка…" }));
    Promise.all([Store.getLeads(), Store.getStats()]).then(function (res) {
      var a = res[0], st = res[1] || {}; P.innerHTML = "";
      var tot = { view: 0, lead: 0, chat: 0, stamp: 0 }, days = Object.keys(st).sort();
      days.forEach(function (d) { Object.keys(tot).forEach(function (k) { tot[k] += (st[d][k] || 0); }); });
      var done = a.filter(function (l) { return l.status === "done"; }).length, newN = a.filter(function (l) { return !l.status || l.status === "new"; }).length;
      P.appendChild(h("div", { class: "kpis" }, [["Заявок", a.length], ["Новых", newN], ["Выполнено", done], ["Визитов", tot.view], ["Вопросов Барсу", tot.chat], ["Печатей получено", tot.stamp], ["Заявок / визитов", tot.view ? Math.round(tot.lead / tot.view * 100) + "%" : "—"]].map(function (k) { return h("div", { class: "kpi" }, [h("b", { text: String(k[1]) }), h("span", { text: k[0] })]); })));
      var grid = h("div", { class: "grid2" }); P.appendChild(grid);
      grid.appendChild(bars("Откуда гости (страны)", tally(a, function (l) { return l.country; })));
      grid.appendChild(bars("Как просят связаться", tally(a, function (l) { return APPN[l.app] || l.app; })));
      grid.appendChild(bars("На каком языке общаться", tally(a, function (l) { return LN[l.speak] || l.speak; })));
      grid.appendChild(bars("Интерес к турам", tally(a.filter(function (l) { return l.tour; }), function (l) { return l.tour; })));
      grid.appendChild(bars("Статусы", tally(a, function (l) { return (ST[l.status] || ST.new)[0]; })));
      var last = []; for (var i = 13; i >= 0; i--) { var d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); last.push([d.slice(5), a.filter(function (l) { return (l.at || "").slice(0, 10) === d; }).length]); }
      var mx = Math.max.apply(null, last.map(function (x) { return x[1]; }).concat([1]));
      P.appendChild(h("div", { class: "box" }, [h("div", { class: "box-h" }, [h("h3", { text: "Заявки за 14 дней" })]), h("div", { class: "spark" }, last.map(function (x) { return h("div", { class: "sp", title: x[0] + ": " + x[1] }, [h("i", { style: "height:" + Math.max(3, x[1] / mx * 100) + "%" }), h("small", { text: x[0].slice(3) })]); }))]));
      if (!days.length) P.appendChild(h("p", { class: "mut", text: "Счётчики визитов и вопросов начнут копиться после первых посещений сайта." }));
    }, function () { P.innerHTML = ""; P.appendChild(h("p", { class: "err", text: "Нет доступа. Войдите заново." })); });
  }

  /* ---------- заявки ---------- */
  var F = { status: "all", sort: "new", q: "" };
  function fmt(iso) { var d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  function sorted(a) {
    var s = F.sort, t = function (x) { return +new Date(x.at) || 0; };
    return a.slice().sort(function (x, y) {
      if (s === "old") return t(x) - t(y); if (s === "trip") return (x.from || "9999").localeCompare(y.from || "9999");
      if (s === "status") return (ORDER[x.status] - ORDER[y.status]) || (t(y) - t(x)); if (s === "status2") return (ORDER[y.status] - ORDER[x.status]) || (t(y) - t(x)); return t(y) - t(x);
    });
  }
  function tabLeads(P) {
    P.appendChild(h("p", { class: "mut", text: "Загрузка заявок…" }));
    Store.getLeads().then(function (a) { leads = a.map(function (l) { if (!ST[l.status]) l.status = "new"; return l; }); paintLeads(P); }, function () { P.innerHTML = ""; P.appendChild(h("p", { class: "err", text: "Нет доступа к заявкам. Войдите заново." })); });
  }
  function paintLeads(P) {
    P.innerHTML = "";
    var cnt = { all: leads.length, new: 0, progress: 0, done: 0 }; leads.forEach(function (l) { cnt[l.status]++; });
    var nb = $("tabs").querySelector("[data-t=leads] i"); if (nb) { nb.textContent = cnt.new || ""; nb.hidden = !cnt.new; }
    var chips = h("div", { class: "chips" }, [["all", "Все"], ["new", "Новые"], ["progress", "Выполняются"], ["done", "Выполнены"]].map(function (a) { return h("button", { type: "button", class: "chip " + (a[0] === "all" ? "" : ST[a[0]][1]) + (F.status === a[0] ? " on" : ""), onclick: function () { F.status = a[0]; paintLeads(P); } }, [a[1] + " ", h("b", { text: String(cnt[a[0]]) })]); }));
    var sort = h("select", { "aria-label": "Сортировка" }, [["new", "Дата заявки: сначала новые"], ["old", "Дата заявки: сначала старые"], ["status", "Статус: новые → выполненные"], ["status2", "Статус: выполненные → новые"], ["trip", "Дата поездки: ближайшие"]].map(function (a) { return h("option", { value: a[0], text: a[1] }); }));
    sort.value = F.sort; sort.onchange = function () { F.sort = sort.value; paintLeads(P); };
    var q = h("input", { type: "search", placeholder: "Поиск: имя, страна, контакт, пожелания…", "aria-label": "Поиск" }); q.value = F.q; q.addEventListener("input", function () { F.q = q.value; paintList(); });
    P.appendChild(h("div", { class: "toolbar" }, [chips, h("div", { class: "tb2" }, [q, sort, btn("Обновить", function () { P.innerHTML = ""; tabLeads(P); }, "ghost sm")])]));
    var box = h("div", { class: "leads" }); P.appendChild(box);
    function paintList() {
      box.innerHTML = ""; var s = F.q.trim().toLowerCase();
      var rows = sorted(leads).filter(function (l) { return (F.status === "all" || l.status === F.status) && (!s || [l.name, l.country, l.contact, l.wishes, l.tour, l.note].join(" ").toLowerCase().indexOf(s) > -1); });
      if (!rows.length) box.appendChild(h("div", { class: "empty" }, [h("img", { src: "img/bars-head.png", alt: "", width: 72, height: 72 }), h("p", { text: leads.length ? "По этим условиям заявок нет." : "Пока заявок нет. Когда турист отправит форму на сайте, она появится здесь." })]));
      rows.forEach(function (l) { box.appendChild(leadCard(l)); });
    }
    paintList();
  }
  function leadCard(l) {
    var link = l.link || Store.contactLink(l.app, l.contact), appN = APPN[l.app] || l.app || "";
    var seg = h("div", { class: "seg", role: "group", "aria-label": "Статус заявки" }, Object.keys(ST).map(function (k) { return h("button", { type: "button", class: "sg " + ST[k][1] + (l.status === k ? " on" : ""), "aria-pressed": String(l.status === k), text: ST[k][0], onclick: function () { l.status = k; Store.updateLead(l.id, { status: k }).then(function () { say("Статус обновлён", true); paintLeads($("panel")); }, function () { say("Не удалось сохранить", false); }); } }); }));
    var note = h("input", { type: "text", placeholder: "Заметка (например, «написал, жду ответа»)", "aria-label": "Заметка" }); note.value = l.note || "";
    note.addEventListener("change", function () { l.note = note.value; Store.updateLead(l.id, { note: note.value }).then(function () { say("Заметка сохранена", true); }); });
    var contactBtn = link ? h("a", { class: "btn contact " + (l.app || ""), href: link, target: l.app === "ph" ? "_self" : "_blank", rel: "noopener", text: ({ wa: "Написать в WhatsApp", tg: "Написать в Telegram", ph: "Позвонить" }[l.app] || "Связаться") + ": " + l.contact }) : h("span", { class: "mut", text: l.contact || "" });
    return h("article", { class: "lead " + ST[l.status][1] }, [
      h("div", { class: "lead-h" }, [h("h3", { text: (l.name || "—") + " · " + (l.country || "") }), l.urgent ? h("span", { class: "urg", text: "Срочно" }) : null, h("time", { text: fmt(l.at) })]),
      h("div", { class: "contact-row" }, [contactBtn, h("span", { class: "pill", text: "Канал: " + appN }), l.speak ? h("span", { class: "pill", text: "Язык общения: " + (LN[l.speak] || l.speak) }) : null]),
      h("div", { class: "meta" }, [l.from ? h("span", { text: "Поездка: " + l.from + (l.to ? " – " + l.to : "") }) : null, l.people ? h("span", { text: "Человек: " + l.people }) : null, l.tour ? h("span", { text: "Тур: " + l.tour }) : null, l.siteLang ? h("span", { text: "Язык сайта: " + String(l.siteLang).toUpperCase() }) : null]),
      l.promo ? h("p", { class: "mut", text: "Промокод: " + l.promo }) : null, l.wishes ? h("p", { class: "wish", text: l.wishes }) : null, (l.favs && l.favs.length) ? h("p", { class: "mut", text: "Избранное: " + l.favs.join(", ") }) : null,
      h("div", { class: "lead-f" }, [seg, note, btn("Удалить", function () { if (confirm("Удалить заявку насовсем?")) Store.deleteLead(l.id).then(function () { leads = leads.filter(function (x) { return x !== l; }); paintLeads($("panel")); }); }, "danger sm")])]);
  }

  /* ---------- каркас ---------- */
  var VIEW = { company: tabCompany, home: tabHome, history: tabHistory, regions: tabRegions, tours: tabTours, events: tabEvents, passport: tabPassport, kyrgyz: tabKyrgyz, gallery: tabGallery, about: tabAbout, travellers: tabTravellers, guide: tabGuide, contacts: tabContacts, texts: tabTexts, theme: tabTheme, data: tabData, stories: tabStories, stats: tabStats };
  function render() {
    var P = $("panel"), sc = window.scrollY; P.innerHTML = ""; clearInterval(refreshTimer);
    var cur = TABS.filter(function (t) { return t[0] === tab; })[0]; $("title").textContent = cur[1];
    $("tabs").innerHTML = ""; TABS.forEach(function (t) { $("tabs").appendChild(h("button", { type: "button", "data-t": t[0], class: "tab" + (t[0] === tab ? " on" : ""), onclick: function () { tab = t[0]; render(); window.scrollTo(0, 0); } }, [t[1], t[0] === "leads" ? h("i", { hidden: "" }) : null])); });
    var noSave = tab === "leads" || tab === "stats" || tab === "stories" || tab === "travellers"; $("save").hidden = noSave; $("trTools").hidden = noSave || ["texts", "data", "theme", "kyrgyz"].indexOf(tab) >= 0;
    if (tab === "leads") { tabLeads(P); if (!Store.demo) refreshTimer = setInterval(function () { Store.getLeads().then(function (a) { if (a.length !== leads.length) { leads = a; paintLeads(P); } }); }, 30000); } else VIEW[tab](P);
    refreshBadge(); if (sc) window.scrollTo(0, sc);
  }
  function refreshBadge() { if (tab === "leads") return; Store.getLeads().then(function (a) { var n = a.filter(function (l) { return !l.status || l.status === "new"; }).length, b = $("tabs").querySelector("[data-t=leads] i"); if (b) { b.textContent = n || ""; b.hidden = !n; } }, function () {}); }
  function show() {
    $("login").hidden = true; $("app").hidden = false; $("mode").textContent = Store.demo ? "Демо-режим: данные хранятся в этом браузере" : "Боевой режим";
    Store.load().then(function (x) { c = x; ["c4"].forEach(function (k) { if (!c.theme[k]) c.theme[k] = window.WT_DEFAULT_CONTENT.theme[k]; }); render(); });
  }
  $("loginForm").onsubmit = function (e) { e.preventDefault(); Store.login($("pass").value).then(show, function () { $("err").textContent = "Неверный пароль"; }); };
  $("demoHint").hidden = !Store.demo;
  $("save").onclick = function () { say("Сохраняю…"); Store.save(c).then(function () { dirty = false; say("Сохранено — сайт обновлён", true); }, function (e) { say(e.message === "auth" ? "Нет доступа: войдите заново" : e.message === "storage" ? "Не хватило места в браузере: загружайте меньше фото или подключите Worker" : "Ошибка сохранения", false); }); };
  $("out").onclick = function () { Store.logout(); location.reload(); };
  $("autoTr").onchange = function () { autoOn = this.checked; };
  $("trAll").onclick = translateAll;
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
  if (Store.isLoggedIn()) show();
})();
