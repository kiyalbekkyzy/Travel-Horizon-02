/* Контент по умолчанию. ВСЁ это редактируется в админке (admin.html) — код трогать не нужно.
   ВАЖНО: тексты легенд, фактов и описаний туров — черновики. Проверьте их и замените своими. */
(function () {
  function L(ru, en, zh, es) { var o = { ru: ru, en: en }; if (zh) o.zh = zh; if (es) o.es = es; return o; }
  window.WT_LIB = ["lake", "herd", "tunduk", "issykkul", "flag", "valley", "eagle", "rider", "ornament", "peak", "mascot-sky", "mascot-pastel"].map(function (k) { return "img/" + k + ".jpg"; }).concat(["img/bars-head.png"]);

  window.WT_DEFAULT_CONTENT = {
    v: 3, mapPins: {},
    site: { name: "Kyrgyz Trails", logo: "img/bars-head.png", url: "" },
    /* ВРЕМЕННЫЕ данные турфирмы: названия, цифры и ответы замените в админке (вкладка «О компании») */
    company: {
      tag: L("Туристическая компания в Кыргызстане", "Travel company in Kyrgyzstan", "吉尔吉斯斯坦旅行社", "Agencia de viajes en Kirguistán"),
      stats: [
        { n: "10+", l: L("лет на рынке", "years in business", "年经验", "años de experiencia") },
        { n: "3 500", l: L("довольных гостей", "happy guests", "满意游客", "viajeros felices") },
        { n: "40+", l: L("маршрутов", "routes", "条路线", "rutas") },
        { n: "4.9", l: L("средняя оценка", "average rating", "平均评分", "valoración media") }],
      why: [
        { t: L("Местные гиды", "Local guides", "本地向导", "Guías locales"), d: L("Гиды родом из этих мест знают тропы, людей и историю.", "Guides from these very places know the trails, people and history.", "", "") },
        { t: L("Прозрачная цена", "Clear price", "价格透明", "Precio claro"), d: L("В цену тура входит всё, что указано в программе. Без скрытых платежей.", "The tour price includes everything listed in the programme. No hidden fees.", "", "") },
        { t: L("Небольшие группы", "Small groups", "小团出行", "Grupos pequeños"), d: L("До 12 человек, чтобы вас видели и слышали, а природа оставалась тихой.", "Up to 12 people, so everyone is heard and nature stays quiet.", "", "") },
        { t: L("Помощь 24/7", "Support 24/7", "全天支持", "Ayuda 24/7"), d: L("Менеджер на связи в WhatsApp и Telegram до конца поездки.", "A manager is available on WhatsApp and Telegram throughout the trip.", "", "") },
        { t: L("Свой маршрут", "Your own route", "定制路线", "Tu propia ruta"), d: L("Изменим даты, длительность и состав тура под вас.", "We adapt dates, length and content to you.", "", "") },
        { t: L("Безопасность", "Safety", "安全保障", "Seguridad"), d: L("Проверенный транспорт и жильё, аптечка и связь на маршруте.", "Checked transport and lodging, a first-aid kit and communication on the route.", "", "") }],
      faq: [
        { q: L("Как забронировать тур?", "How do I book a tour?", "", ""), a: L("Нажмите «Забронировать» на странице тура или оставьте заявку внизу сайта. Менеджер свяжется с вами и подтвердит детали.", "Press “Book” on the tour page or leave a request at the bottom of the site. A manager will contact you and confirm the details.", "", "") },
        { q: L("Как проходит оплата?", "How does payment work?", "", ""), a: L("Условия оплаты и предоплата согласуются с менеджером после заявки. Онлайн-оплата на сайте пока не подключена.", "Payment terms and the deposit are agreed with a manager after your request. Online payment on the site is not connected yet.", "", "") },
        { q: L("Можно ли изменить даты или программу?", "Can I change the dates or programme?", "", ""), a: L("Да. Мы подстроим маршрут под ваши даты, интересы и бюджет.", "Yes. We will adapt the route to your dates, interests and budget.", "", "") },
        { q: L("Что взять с собой?", "What should I bring?", "", ""), a: L("Тёплую одежду даже летом (в горах прохладно), удобную обувь, солнцезащитный крем и документы. Точный список пришлём после брони.", "Warm clothes even in summer (the mountains are cool), comfortable shoes, sunscreen and documents. We will send an exact list after booking.", "", "") },
        { q: L("Нужна ли виза?", "Do I need a visa?", "", ""), a: L("Для многих стран въезд безвизовый или по e-визе. Правила меняются, проверьте на официальном сайте перед поездкой.", "Many countries have visa-free entry or an e-visa. Rules change, so check the official website before travelling.", "", "") },
        { q: L("Есть ли страховка?", "Is insurance included?", "", ""), a: L("Страховка не входит в цену тура. Мы рекомендуем оформить её до поездки.", "Insurance is not included in the tour price. We recommend getting it before the trip.", "", "") }],
      pay: L("Оплата согласуется с менеджером: перевод, карта или наличные. Предоплата подтверждает бронь.", "Payment is agreed with a manager: transfer, card or cash. A deposit confirms the booking.", "", "")
    },
    theme: { c1: "#0b2a3a", c2: "#1aa6a0", c3: "#e0a93b", ink: "#14232d", c4: "#d9482f" },
    sections: { history: true, regions: true, tours: true, season: true, route: true, passport: true, translator: true, company: true, faq: true, events: true, stories: true, guide: true, helper: true, plan: true },
    hero: { dest: ["issykkul", "naryn", "osh", "jalalabad"], slides: [
      { img: "img/lake.jpg", pos: "50% 72%" }, { img: "img/herd.jpg", pos: "50% 88%" },
      { img: "img/issykkul.jpg", pos: "50% 62%" }, { img: "img/flag.jpg", pos: "50% 55%" }] },
    mascot: { head: "img/bars-head.png", pair: "img/mascot-sky.jpg" },
    ui: { ru: {}, en: {}, zh: {}, es: {} },

    phone: "+996 555 000 000", wa: "996555000000", tg: "webtouristkg", ig: "webtouristkg", tt: "webtouristkg", email: "hello@webtouristkg.demo",
    socials: [
      { kind: "wa", label: "WhatsApp", url: "https://wa.me/996555000000", icon: "" },
      { kind: "tg", label: "Telegram", url: "https://t.me/webtouristkg", icon: "" },
      { kind: "ig", label: "Instagram", url: "https://instagram.com/webtouristkg", icon: "" },
      { kind: "tt", label: "TikTok", url: "https://www.tiktok.com/@webtouristkg", icon: "" }],
    guide: {
      cities: [
        { n: L("Бишкек", "Bishkek", "比什凯克", "Bishkek"), slug: "bishkek" }, { n: L("Каракол", "Karakol", "卡拉科尔", "Karakol"), slug: "karakol" },
        { n: L("Ош", "Osh", "奥什", "Osh"), slug: "osh" }, { n: L("Нарын", "Naryn", "纳伦", "Naryn"), slug: "naryn" }, { n: L("Джалал-Абад", "Jalal-Abad", "贾拉拉巴德", "Jalal-Abad"), slug: "jalal-abad" }],
      cats: [
        { k: "food", q: L("Ресторан", "Restaurant", "餐厅", "Restaurante"), t: "gFood" }, { k: "cafe", q: L("Кафе", "Cafe", "咖啡馆", "Cafe"), t: "gCafe" }, { k: "atm", q: L("Банкомат", "ATM", "取款机", "Cajero"), t: "gAtm" },
        { k: "exch", q: L("Обмен валюты", "Currency exchange", "货币兑换", "Cambio de divisas"), t: "gExch" }, { k: "pharm", q: L("Аптека", "Pharmacy", "药店", "Farmacia"), t: "gPharm" },
        { k: "hotel", q: L("Гостиница", "Hotel", "酒店", "Hotel"), t: "gHotel" }, { k: "taxi", q: L("Такси", "Taxi", "出租车", "Taxi"), t: "gTaxi" }, { k: "see", q: L("Достопримечательности", "Sights", "景点", "Lugares de interes"), t: "gSee" }],
      currencies: "KGS, USD, EUR, RUB, KZT, CNY",
      banks: [{ n: "Optima Bank" }, { n: "MBank" }, { n: "Demir Bank" }, { n: "KICB" }, { n: "O!Dengi" }, { n: "Elcart" }],
      tips: L("В городах чаще принимают карты, в сёлах и юртовых лагерях лучше иметь наличные.\nПеред поездкой в горы снимите деньги заранее: банкоматы есть не везде.\nКурсы обмена в разных пунктах отличаются, сравните два-три.", "Cards are accepted more often in cities; in villages and yurt camps it is better to have cash.\nWithdraw money before going to the mountains: ATMs are not everywhere.\nExchange rates differ between offices, so compare two or three.")
    },
    diary: {
      pts: 10, ptsRegion: 20,
      rewards: [
        { n: 1, t: L("Первая отметка", "First check-in", "首次打卡", "Primera marca"), d: L("Пример подарка: электронный значок путешественника. Измените в админке.", "Example gift: a digital traveller badge. Change it in the admin panel."), code: "" },
        { n: 3, t: L("Три отметки", "Three check-ins", "三次打卡", "Tres marcas"), d: L("Пример подарка: скидка 5% на следующий тур. Условия задайте сами.", "Example gift: 5% off your next tour. Set the terms yourself."), code: "KG5" },
        { n: 5, t: L("Пять отметок", "Five check-ins", "五次打卡", "Cinco marcas"), d: L("Пример подарка: скидка 10% и фирменный сувенир.", "Example gift: 10% off and a branded souvenir."), code: "KG10" },
        { n: 7, t: L("Семь отметок", "Seven check-ins", "七次打卡", "Siete marcas"), d: L("Пример подарка: скидка 15% и звание «Снежный барс».", "Example gift: 15% off and the Snow Leopard title."), code: "KG15" }]
    },

    /* ---------- История ---------- */
    works: [
      { img: "img/rider.jpg", t: L("Эпос «Манас»", "The epic “Manas”", "史诗《玛纳斯》", "La epopeya «Manas»"),
        d: L("Героический эпос о Манасе, объединившем кыргызские роды. В самых полных вариантах — более полумиллиона строк, его исполняют сказители-манасчи. Эпос включён в список нематериального наследия ЮНЕСКО (2013).\n\nТрилогия продолжается рассказами о сыне Семетее и внуке Сейтеке.", "A heroic epic about Manas, who united the Kyrgyz tribes. In its fullest versions it runs to more than half a million lines and is performed by storytellers called manaschi. It is on UNESCO's intangible heritage list (2013).\n\nThe trilogy continues with the stories of his son Semetey and grandson Seytek.") },
      { img: "img/tunduk.jpg", t: L("Чингиз Айтматов", "Chingiz Aitmatov", "钦吉兹·艾特玛托夫", "Chingiz Aitmatov"),
        d: L("Писатель (1928–2008), которого читают во всём мире. Самые известные произведения: «Джамиля» (1958), «Прощай, Гульсары!» (1966), «Белый пароход» (1970), «И дольше века длится день» (1980).\n\nВ его книгах — горы, кони, память и совесть, а повесть «Джамиля» называют одной из самых красивых историй о любви.", "A writer (1928–2008) read all over the world. Best known: “Jamilya” (1958), “Farewell, Gulsary!” (1966), “The White Ship” (1970), “The Day Lasts More Than a Hundred Years” (1980).\n\nHis books are full of mountains, horses, memory and conscience, and “Jamilya” is often called one of the most beautiful love stories.") },
      { img: "img/eagle.jpg", t: L("Токтогул Сатылганов", "Toktogul Satylganov", "托克托古尔·萨特尔加诺夫", "Toktogul Satylganov"),
        d: L("Народный акын и композитор (1864–1933), певец комуза. Его песни о свободе и справедливости до сих пор поют на праздниках. В честь акына названы посёлок и большое водохранилище.", "A folk poet-singer and composer (1864–1933) who played the komuz. His songs about freedom and justice are still sung at celebrations. A town and a large reservoir are named after him.") },
      { img: "img/ornament.jpg", t: L("Комуз и кыргызская музыка", "The komuz and Kyrgyz music", "楚姆兹与吉尔吉斯音乐", "El komuz y la música kirguisa"),
        d: L("Комуз — трёхструнный инструмент из цельного куска дерева. Под него исполняют кюю — инструментальные пьесы, которые рассказывают истории без слов: о скачке, дожде, птицах и людях.", "The komuz is a three-string instrument carved from a single piece of wood. It plays küü — instrumental pieces that tell stories without words: a gallop, rain, birds and people.") }
    ],
    symbols: [
      { img: "img/ornament.jpg", t: L("Кошкар-муйуз — рога барана", "Koshkar-muiz — the ram's horns", "科什卡尔-木伊兹——羊角纹", "Koshkar-muiz — los cuernos del carnero"),
        d: L("Самый узнаваемый узор. Рога барана — символ богатства, силы и благополучия скота. Его вышивают на одежде, вырезают на дереве и вшивают в войлок.", "The most recognisable pattern. The ram's horns stand for wealth, strength and healthy herds. They are embroidered on clothes, carved in wood and sewn into felt.") },
      { img: "img/flag.jpg", t: L("Тундук на флаге", "The tündük on the flag", "国旗上的天窗", "El tündük en la bandera"),
        d: L("На красном флаге — солнце с сорока лучами, а в центре — тундук, верхний круг юрты. Он напоминает о доме и единстве; сорок лучей связывают с сорока родами из эпоса «Манас».", "The red flag shows a sun with forty rays and, at its centre, the tündük — the top ring of a yurt. It stands for home and unity; the forty rays are linked to the forty tribes of the “Manas” epic.") },
      { img: "img/tunduk.jpg", t: L("Ширдак и ала-кийиз", "Shyrdak and ala-kiyiz", "毡毯", "Shyrdak y ala-kiyiz"),
        d: L("Войлочные ковры: узор из цветных кусков войлока вшивают друг в друга (ширдак) или валяют из шерсти (ала-кийиз). Это искусство включено в список нематериального наследия ЮНЕСКО.", "Felt carpets: a pattern of coloured felt pieces stitched into each other (shyrdak) or rolled from wool (ala-kiyiz). The craft is on UNESCO's intangible heritage list.") },
      { img: "img/eagle.jpg", t: L("Ак-калпак — белая шапка", "Ak-kalpak — the white hat", "白毡帽", "Ak-kalpak — el sombrero blanco"),
        d: L("Высокая шапка из белого войлока с чёрной отделкой. Белый цвет — чистота и честь. День ак-калпака отмечают 5 марта.", "A tall white felt hat with black trim. White stands for purity and honour. Ak-kalpak Day is celebrated on 5 March.") }
    ],
    timeline: [
      { y: L("II–I вв. до н. э.", "2nd–1st c. BC"), t: L("Первые упоминания", "First mentions"), d: L("В китайских хрониках появляются названия народов, которых связывают с предками кыргызов.", "Chinese chronicles mention peoples linked to the ancestors of the Kyrgyz.") },
      { y: L("IX век", "9th century"), t: L("Кыргызский каганат", "The Kyrgyz Khaganate"), d: L("Кыргызы на Енисее создают сильное государство и побеждают уйгурский каганат.", "The Kyrgyz on the Yenisei build a powerful state and defeat the Uyghur Khaganate.") },
      { y: L("XI век", "11th century"), t: L("Эпоха Караханидов", "The Karakhanid era"), d: L("В Чуйской долине процветает город Баласагун, остатки которого — Башня Бурана.", "The city of Balasagun flourishes in the Chui Valley; the Burana Tower is what remains of it.") },
      { y: L("1876", "1876"), t: L("В составе Российской империи", "Part of the Russian Empire"), d: L("Территория современного Кыргызстана входит в состав Российской империи.", "The territory of present-day Kyrgyzstan becomes part of the Russian Empire.") },
      { y: L("1936", "1936"), t: L("Киргизская ССР", "The Kirghiz SSR"), d: L("Образована Киргизская Советская Социалистическая Республика.", "The Kirghiz Soviet Socialist Republic is established.") },
      { y: L("2009", "2009"), t: L("Сулайман-Тоо", "Sulaiman-Too"), d: L("Священная гора в Оше попадает в список Всемирного наследия ЮНЕСКО.", "The sacred mountain in Osh is added to the UNESCO World Heritage List.") },
      { y: L("31 августа 1991", "31 August 1991"), t: L("Независимость", "Independence"), d: L("Кыргызстан провозглашает независимость. Этот день — главный государственный праздник.", "Kyrgyzstan declares independence. The day is the main national holiday.") }
    ],

    /* ---------- Области ---------- */
    regions: [
      { id: "issykkul", img: "img/issykkul.jpg", lat: 42.49, lon: 78.39, order: 3, days: 3, tags: ["lakes", "nature", "hiking", "food"],
        n: L("Иссык-Кульская", "Issyk-Kul", "伊塞克湖州", "Issyk-Kul"), d: L("Горное озеро, которое не замерзает.", "A warm alpine lake that never freezes.", "终年不冻的高山大湖。", "Un lago alpino que nunca se congela."),
        food: L("Жареная форель, Боорсоки, Ашлян-фу", "Fried trout, Boorsok, Ashlyan-fu", "烤鳟鱼, 波尔索克, 阿什良福", "Trucha frita, Boorsok, Ashlyan-fu"), see: L("Джеты-Огуз, Каньон Сказка, Каракол, Алтын-Арашан", "Jeti-Oguz, Fairy Tale Canyon, Karakol, Altyn-Arashan", "", "Jeti-Oguz, Cañón del Cuento, Karakol, Altyn-Arashan"),
        months: [1, 1, 1, 2, 2, 3, 3, 3, 3, 2, 1, 1],
        sea: L("Лучше всего с июня по сентябрь: тёплая вода и ясные дни. Зимой — лыжи у Каракола.", "Best from June to September: warm water and clear days. Winter brings skiing near Karakol."),
        lg: { t: L("Тёплое озеро и «Разбитое сердце»", "The warm lake and the “Broken Heart”"),
          d: L("Иссык-Куль в переводе значит «тёплое озеро»: вода здесь не замерзает даже в сильные морозы. Старые предания говорят о городах, ушедших под воду, а учёные действительно находили у берегов остатки древних поселений.\n\nВ ущелье Джеты-Огуз стоят красные скалы «Семь быков», а рядом — «Разбитое сердце». По одному из преданий, скала раскололась из-за любви и ревности двух ханов.", "Issyk-Kul means “warm lake”: the water does not freeze even in hard frosts. Old tales speak of cities that sank beneath it, and scientists have indeed found the remains of ancient settlements near the shore.\n\nIn the Jeti-Oguz gorge stand the red rocks called “Seven Bulls” and, beside them, the “Broken Heart”. By one legend the rock split because of the love and jealousy of two khans."),
          f: L("Высота над уровнем моря — около 1 600 м\nДлина озера — около 180 км\nОдно из крупнейших горных озёр мира", "Altitude about 1,600 m\nThe lake is about 180 km long\nOne of the largest mountain lakes in the world"),
          imgs: ["img/issykkul.jpg", "img/lake.jpg"] } },
      { id: "chui", img: "img/flag.jpg", lat: 42.87, lon: 74.59, order: 1, days: 2, tags: ["culture", "history", "food", "hiking"],
        n: L("Чуйская", "Chui", "楚河州", "Chui"), d: L("Столица Бишкек и зелёные долины.", "Capital Bishkek and green valleys.", "首都比什凯克与绿色山谷。", "Bishkek y valles verdes."),
        food: L("Бешбармак, Манты, Лагман", "Beshbarmak, Manti, Lagman", "", "Beshbarmak, Manti, Lagman"), see: L("Ала-Арча, Башня Бурана, Ошский базар в Бишкеке", "Ala-Archa, Burana Tower, Osh Bazaar in Bishkek", "", "Ala-Archa, Torre Burana, Bazar Osh en Bishkek"),
        months: [1, 1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1],
        sea: L("Хорошо с апреля по октябрь. Летом в горах Ала-Арчи прохладно, в городе жарко.", "Good from April to October. Summers are cool in the Ala-Archa mountains and hot in the city."),
        lg: { t: L("Башня Бурана и паук", "The Burana Tower and the spider"),
          d: L("Недалеко от Бишкека поднимается Башня Бурана — минарет XI века из древнего города Баласагун. По легенде, хану предсказали, что дочь умрёт от укуса паука. Он спрятал её в высокой башне, но паук всё же оказался в корзине с фруктами.\n\nРядом стоят балбалы — каменные фигуры тюркской эпохи, а в горах за городом открывается парк Ала-Арча.", "Not far from Bishkek rises the Burana Tower — an 11th-century minaret of the ancient city of Balasagun. By legend, a khan was told his daughter would die from a spider's bite. He hid her in a tall tower, yet the spider arrived in a basket of fruit.\n\nNearby stand balbals — stone figures of the Turkic era — and in the mountains beyond the city lies Ala-Archa park."),
          f: L("Первоначальная высота башни — около 45 м, сегодня сохранилось около 25 м\nБурана входит в объект ЮНЕСКО «Шёлковый путь: коридор Чанъань — Тянь-Шань»\nВ советские годы Бишкек назывался Фрунзе", "The tower was about 45 m tall; roughly 25 m survives today\nBurana belongs to the UNESCO site “Silk Roads: the Chang'an–Tianshan corridor”\nIn Soviet times Bishkek was called Frunze"),
          imgs: ["img/flag.jpg", "img/valley.jpg"] } },
      { id: "naryn", img: "img/herd.jpg", lat: 41.43, lon: 76.0, order: 4, days: 3, tags: ["nomads", "horses", "nature", "hiking", "history"],
        n: L("Нарынская", "Naryn", "纳伦州", "Naryn"), d: L("Дикое нагорье и пастбища кочевников.", "Wild highlands and nomad pastures.", "荒野高地与游牧牧场。", "Tierras altas y pastos nómadas."),
        food: L("Куурдак, Кымыз, Каймак", "Kuurdak, Kymyz, Kaimak", "", "Kuurdak, Kymyz, Kaimak"), see: L("Сон-Куль, Таш-Рабат, Чатыр-Куль", "Song-Kol, Tash-Rabat, Chatyr-Kol", "", "Song-Kol, Tash-Rabat, Chatyr-Kol"),
        months: [0, 0, 1, 1, 2, 3, 3, 3, 3, 2, 1, 0],
        sea: L("Джайлоо открыты с июня по сентябрь. В остальные месяцы дороги к озёрам могут быть закрыты.", "The summer pastures are open from June to September. At other times roads to the lakes may be closed."),
        lg: { t: L("Таш-Рабат — камень, который помнит караваны", "Tash-Rabat — the stone that remembers caravans"),
          d: L("Высоко в горах стоит каменное здание Таш-Рабат. По одной из версий, это был монастырь, позже — караван-сарай на пути из Китая в Фергану. Толстые стены и купола защищали путников от ветра и мороза.\n\nМестные жители до сих пор рассказывают о нём разные истории — спросите их у хозяина юрты, у которого остановитесь на ночь.", "High in the mountains stands the stone building of Tash-Rabat. By one account it was a monastery, later a caravanserai on the route from China to Fergana. Thick walls and domes protected travellers from wind and frost.\n\nLocals still tell different stories about it — ask the host of the yurt where you spend the night."),
          f: L("Озеро Сон-Куль лежит почти на высоте 3 000 м\nНарын — главный регион джайлоо и конного туризма\nУ озера летом ставят юртовые лагеря", "Song-Kol lies at almost 3,000 m above sea level\nNaryn is the heart of jailoo summer pastures and horse trekking\nYurt camps stand by the lake in summer"),
          imgs: ["img/herd.jpg", "img/tunduk.jpg"] } },
      { id: "talas", img: "img/rider.jpg", lat: 42.52, lon: 72.24, order: 2, days: 2, tags: ["history", "culture", "nature"],
        n: L("Таласская", "Talas", "塔拉斯州", "Talas"), d: L("Край эпоса «Манас».", "Land of the Manas epic.", "《玛纳斯》史诗之乡。", "Tierra de la epopeya de Manas."),
        food: L("Бешбармак, Оромо, Куурдак", "Beshbarmak, Oromo, Kuurdak", "", "Beshbarmak, Oromo, Kuurdak"), see: L("Манас Ордо, Долина Кара-Буура, Нацпарк Беш-Таш", "Manas Ordo, Kara-Buura valley, Besh-Tash National Park", "", "Manas Ordo, Valle Kara-Buura, Parque Nacional Besh-Tash"),
        months: [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 1, 0],
        sea: L("Приятно с апреля по октябрь. Зимой на перевалах бывает снег.", "Pleasant from April to October. Passes can be snowy in winter."),
        lg: { t: L("Манас и сорок родов", "Manas and the forty tribes"),
          d: L("Талас называют землёй Манаса. Эпос рассказывает о богатыре, который объединил сорок родов. По народному объяснению, слово «кыргыз» происходит от «кырк» — «сорок».\n\nВ комплексе Манас Ордо стоит мавзолей с надписью, где указан 1334 год. А ещё в долине реки Талас в 751 году столкнулись армии Арабского халифата и империи Тан.", "Talas is called the land of Manas. The epic tells of a hero who united forty tribes. According to a popular explanation, the word “Kyrgyz” comes from “kyrk” — “forty”.\n\nIn the Manas Ordo complex stands a mausoleum with an inscription giving the year 1334. And in 751 the armies of the Abbasid Caliphate and Tang China met in the Talas river valley."),
          f: L("Национальный парк Беш-Таш — «пять камней»\nМанас Ордо — мемориальный комплекс\nБитва при Таласе, 751 год", "Besh-Tash National Park — “five stones”\nManas Ordo — a memorial complex\nThe Battle of Talas, 751"),
          imgs: ["img/rider.jpg", "img/ornament.jpg"] } },
      { id: "osh", img: "img/ornament.jpg", lat: 40.53, lon: 72.8, order: 5, days: 2, tags: ["history", "culture", "food"],
        n: L("Ошская", "Osh", "奥什州", "Osh"), d: L("3000 лет истории Шёлкового пути.", "3,000 years of Silk Road history.", "三千年丝路历史。", "3000 años de Ruta de la Seda."),
        food: L("Ошский плов, Самса, Хунон", "Osh plov, Samsa, Hunon", "", "Plov de Osh, Samsa, Hunon"), see: L("Сулайман-Тоо, Ошский базар, Алайская долина, Базовый лагерь пика Ленина", "Sulaiman-Too, Osh Bazaar, Alay Valley, Lenin Peak base camp", "", "Sulaiman-Too, Bazar de Osh, Valle de Alay, Campo base del pico Lenin"),
        months: [1, 1, 3, 3, 3, 3, 2, 2, 3, 3, 2, 1],
        sea: L("Лучшие месяцы — апрель–июнь и сентябрь–октябрь. В июле и августе жарко.", "Best in April–June and September–October. July and August are hot."),
        lg: { t: L("Трон Сулеймана", "The Throne of Solomon"),
          d: L("Над Ошем возвышается гора Сулайман-Тоо — «Трон Сулеймана». По преданию, на ней молился пророк Сулейман, и веками сюда приходят паломники. Тропы ведут мимо пещер, мечетей и древних рисунков на камне.\n\nГород считают одним из древнейших на Шёлковом пути — его возраст оценивают примерно в три тысячи лет.", "Above Osh rises Sulaiman-Too — the “Throne of Solomon”. By tradition the prophet Suleiman prayed here, and pilgrims have come for centuries. Paths lead past caves, mosques and ancient rock carvings.\n\nThe city is considered one of the oldest on the Silk Road — its age is put at about three thousand years."),
          f: L("Сулайман-Тоо — объект Всемирного наследия ЮНЕСКО (2009)\nНа склонах — множество петроглифов\nОшский базар — один из старейших в регионе", "Sulaiman-Too is a UNESCO World Heritage Site (2009)\nThe slopes hold many petroglyphs\nOsh Bazaar is one of the oldest in the region"),
          imgs: ["img/ornament.jpg", "img/eagle.jpg"] } },
      { id: "jalalabad", img: "img/valley.jpg", lat: 41.3, lon: 72.9, order: 6, days: 3, tags: ["nature", "hiking", "food"],
        n: L("Джалал-Абадская", "Jalal-Abad", "贾拉拉巴德州", "Jalal-Abad"), d: L("Ореховые леса и скрытые озёра.", "Walnut forests and hidden lakes.", "核桃林与秘境湖泊。", "Bosques de nogales y lagos ocultos."),
        food: L("Ореховый мёд, Кесме, Плов", "Walnut honey, Kesme, Plov", "", "Miel de nuez, Kesme, Plov"), see: L("Арсланбоб, Сары-Челек, Казарман", "Arslanbob, Sary-Chelek, Kazarman", "", "Arslanbob, Sary-Chelek, Kazarman"),
        months: [0, 1, 2, 3, 3, 3, 2, 2, 3, 3, 2, 0],
        sea: L("Красиво с мая по октябрь, а в сентябре–октябре — пора орехов.", "Lovely from May to October; September–October is walnut harvest time."),
        lg: { t: L("Орехи Александра Македонского", "The walnuts of Alexander the Great"),
          d: L("Арсланбоб славится ореховыми лесами — одними из самых больших в мире. Местная легенда говорит, что первые ореховые деревья здесь посадили воины Александра Македонского.\n\nСреди леса — каскады водопадов, а в другой части области лежит озеро Сары-Челек, окружённое заповедником.", "Arslanbob is famed for its walnut forests — among the largest in the world. A local legend says the first walnut trees here were planted by the soldiers of Alexander the Great.\n\nIn the forest there are cascading waterfalls, and elsewhere in the region lies Lake Sary-Chelek, surrounded by a nature reserve."),
          f: L("Сары-Челек — биосферный заповедник ЮНЕСКО\nУ Арсланбоба два каскада водопадов\nСбор орехов — осенью", "Sary-Chelek is a UNESCO biosphere reserve\nArslanbob has two waterfall cascades\nThe walnut harvest is in autumn"),
          imgs: ["img/valley.jpg", "img/lake.jpg"] } },
      { id: "batken", img: "img/lake.jpg", lat: 40.06, lon: 70.82, order: 7, days: 2, tags: ["nature", "quiet", "food", "culture"],
        n: L("Баткенская", "Batken", "巴特肯州", "Batken"), d: L("Тихие долины на краю Ферганы.", "Quiet valleys on the Fergana edge.", "费尔干纳边缘的宁静山谷。", "Valles tranquilos al borde de Fergana."),
        food: L("Курага, Самса, Плов", "Dried apricots, Samsa, Plov", "", "Orejones, Samsa, Plov"), see: L("Долины Баткена, Сёла области (уточняется)", "Batken valleys, Local villages (to be confirmed)", "", "Valles de Batken, Pueblos locales (por confirmar)"),
        months: [1, 1, 3, 3, 3, 2, 1, 1, 3, 3, 2, 1],
        sea: L("Весна и осень — лучшее время. Летом бывает жарко.", "Spring and autumn are the best seasons. Summers can be hot."),
        lg: { t: L("Сорок девушек", "The forty maidens"),
          d: L("В Баткене, как и по всей стране, рассказывают легенду о сорока девушках. По народной версии, слово «кыргыз» происходит от «кырк кыз» — «сорок девушек»: они стали матерями народа.\n\nЭто западная область, граничащая с Ферганской долиной: здесь проходили ветки Шёлкового пути, а сегодня выращивают абрикосы и сушат фрукты.", "In Batken, as across the country, people tell the legend of the forty maidens. By the popular version the word “Kyrgyz” comes from “kyrk kyz” — “forty girls” — who became the mothers of the people.\n\nThis western region borders the Fergana Valley: branches of the Silk Road ran here, and today apricots are grown and fruit is dried."),
          f: L("Одна из самых тихих и малолюдных областей\nСлавится абрикосами и сухофруктами\nРядом проходили маршруты Шёлкового пути", "One of the quietest, least crowded regions\nKnown for apricots and dried fruit\nSilk Road routes passed nearby"),
          imgs: ["img/lake.jpg", "img/herd.jpg"] } }
    ],

    /* ---------- Туры ---------- */
    tours: [
      { id: "t1", dates: "2027-06-12\n2027-07-10\n2027-08-07", img: "img/herd.jpg", imgs: ["img/herd.jpg", "img/tunduk.jpg", "img/lake.jpg"], r: "naryn", days: 3, k: "horse", o: "Kyrgyzstan Tourism", p: "$280",
        t: L("Конный трек на Сон-Куль, 3 дня", "Song-Kol horse trek, 3 days"),
        d: L("Три дня верхом к высокогорному озеру Сон-Куль с ночёвкой в юрте.", "Three days on horseback to the high-mountain Lake Song-Kol with a night in a yurt."),
        prog: L("День 1. Трансфер к началу маршрута, знакомство с лошадьми, первый переход.\nДень 2. Подъём к озеру Сон-Куль, ночёвка в юртовом лагере.\nДень 3. Возвращение и трансфер.", "Day 1. Transfer to the trailhead, meeting the horses, first ride.\nDay 2. Ride up to Lake Song-Kol, night in a yurt camp.\nDay 3. Return and transfer."),
        inc: L("Лошади и проводник\nНочёвка в юрте\nПитание по программе", "Horses and a guide\nA night in a yurt\nMeals as per programme"),
        exc: L("Перелёт\nСтраховка\nЛичные расходы", "Flights\nInsurance\nPersonal expenses") },
      { id: "t2", dates: "2027-07-05\n2027-08-02", img: "img/issykkul.jpg", imgs: ["img/issykkul.jpg", "img/herd.jpg"], r: "naryn", days: 3, k: "horse", o: "Kyrgyzstan Tourism", p: "$220",
        t: L("Зимний Сон-Куль верхом, 3 дня", "Winter Song-Kol on horseback, 3 days"),
        d: L("Зимняя версия маршрута: снежные просторы и тишина высокогорья.", "A winter version of the route: snowy expanses and highland silence."),
        prog: L("День 1. Трансфер, инструктаж, выезд.\nДень 2. Зимний переход к озеру.\nДень 3. Возвращение.", "Day 1. Transfer, briefing, departure.\nDay 2. Winter ride to the lake.\nDay 3. Return."),
        inc: L("Лошади и проводник\nТёплое размещение", "Horses and a guide\nWarm accommodation"), exc: L("Перелёт\nСтраховка\nЛичная одежда для зимы", "Flights\nInsurance\nPersonal winter clothing") },
      { id: "t3", dates: "2027-06-20\n2027-07-18\n2027-08-15", img: "img/lake.jpg", imgs: ["img/lake.jpg", "img/herd.jpg"], r: "naryn", days: 5, k: "horse", o: "Kyrgyzstan Tourism", p: "$450",
        t: L("Конная экспедиция Арабель, 5 дней", "Arabel Plateau horse expedition, 5 days"),
        d: L("Пять дней в седле по плато Арабель — для тех, кто любит простор и дикую природу.", "Five days in the saddle across the Arabel Plateau for lovers of space and wild nature."),
        prog: L("Программа уточняется у организатора.", "The programme is confirmed by the operator."), inc: L("Лошади и проводник\nПитание и ночёвки по программе", "Horses and a guide\nMeals and overnights as per programme"), exc: L("Перелёт\nСтраховка", "Flights\nInsurance") },
      { id: "t4", dates: "2027-07-03\n2027-08-14", img: "img/valley.jpg", imgs: ["img/valley.jpg", "img/lake.jpg"], r: "naryn", days: 9, k: "multi", o: "Visit Alay", p: "$1,550",
        t: L("Сон-Куль и Кель-Суу, 9 дней", "Song-Kul & Kel-Suu, 9 days"),
        d: L("Девять дней по высокогорным озёрам и перевалам.", "Nine days across high-mountain lakes and passes."),
        prog: L("Программа уточняется у организатора.", "The programme is confirmed by the operator."), inc: L("Сопровождение\nРазмещение и питание по программе", "Guiding\nAccommodation and meals as per programme"), exc: L("Перелёт\nСтраховка", "Flights\nInsurance") },
      { id: "t5", dates: "2027-05-22\n2027-09-04", img: "img/tunduk.jpg", imgs: ["img/tunduk.jpg", "img/herd.jpg"], r: "naryn", days: 3, k: "multi", o: "Nomadsland", p: "$440 /2 pax",
        t: L("Кочевники Сон-Куля, 3 дня (индивидуально)", "Song Kul nomads, 3 days (private)"),
        d: L("Индивидуальная поездка к кочевникам: жизнь в юрте, кумыс и разговоры с хозяевами.", "A private trip to the nomads: life in a yurt, kymyz and conversations with the hosts."),
        prog: L("Программа составляется индивидуально.", "The programme is arranged individually."), inc: L("Транспорт\nРазмещение в юрте\nПитание", "Transport\nYurt accommodation\nMeals"), exc: L("Перелёт\nСтраховка", "Flights\nInsurance") },
      { id: "t6", img: "img/flag.jpg", imgs: ["img/flag.jpg"], r: "", days: "", k: "multi", o: "Kettik", p: "",
        t: L("Пешие и многодневные туры", "Hiking & multi-day trips"), d: L("Пешие маршруты и многодневные поездки по стране.", "Hiking routes and multi-day trips across the country."),
        prog: L("Программа составляется индивидуально.", "The programme is arranged individually."), inc: L("Уточняйте у организатора", "Ask the operator"), exc: L("Уточняйте у организатора", "Ask the operator") },
      { id: "t7", img: "img/eagle.jpg", imgs: ["img/eagle.jpg", "img/rider.jpg"], r: "", days: "", k: "multi", o: "Ulush Travel", p: "",
        t: L("Походы, конные прогулки, культурные туры", "Hiking, horse rides, cultural tours"), d: L("Походы, конные прогулки и знакомство с культурой.", "Hikes, horse rides and an introduction to local culture."),
        prog: L("Программа составляется индивидуально.", "The programme is arranged individually."), inc: L("Уточняйте у организатора", "Ask the operator"), exc: L("Уточняйте у организатора", "Ask the operator") },
      { id: "t8", img: "img/ornament.jpg", imgs: ["img/ornament.jpg"], r: "", days: "", k: "multi", o: "Ak-Sai Travel", p: "",
        t: L("Индивидуальные туры с 1998 года", "Custom tours since 1998"), d: L("Туры, собранные под ваши пожелания.", "Tours built around your wishes."),
        prog: L("Программа составляется индивидуально.", "The programme is arranged individually."), inc: L("Уточняйте у организатора", "Ask the operator"), exc: L("Уточняйте у организатора", "Ask the operator") },
      { id: "t9", img: "img/rider.jpg", imgs: ["img/rider.jpg", "img/herd.jpg"], r: "", days: "", k: "horse", o: "CBT Kyrgyzstan", p: "≈20,000 KGS",
        t: L("Конный трек через местный туристический офис", "Horse trek via local CBT office"), d: L("Конный трек, организованный местным офисом общинного туризма.", "A horse trek arranged by the local community-based tourism office."),
        prog: L("Программа уточняется в местном туристическом офисе.", "The programme is confirmed by the CBT office."), inc: L("Лошади и проводник", "Horses and a guide"), exc: L("Перелёт\nСтраховка", "Flights\nInsurance") }
    ],

    /* ---------- События (annual:true — повторяется каждый год, md = месяц-день) ---------- */
    events: [
      { id: "e1", annual: true, md: "03-05", date: "", img: "img/eagle.jpg", place: L("По всей стране", "Nationwide"), url: "",
        t: L("День ак-калпака", "Ak-kalpak Day"), d: L("Праздник национальной белой шапки: люди надевают ак-калпак, проходят выставки и концерты.", "A celebration of the national white hat: people wear the ak-kalpak, with exhibitions and concerts.") },
      { id: "e2", annual: true, md: "03-21", date: "", img: "img/herd.jpg", place: L("По всей стране", "Nationwide"), url: "",
        t: L("Нооруз", "Nooruz"), d: L("Праздник весны и обновления: народные гуляния, конные игры и традиционные угощения.", "The spring festival of renewal: folk celebrations, horse games and traditional treats.") },
      { id: "e3", annual: true, md: "05-05", date: "", img: "img/flag.jpg", place: L("По всей стране", "Nationwide"), url: "",
        t: L("День Конституции", "Constitution Day"), d: L("Государственный праздник; в городах проходят праздничные мероприятия.", "A national holiday with celebrations in the cities.") },
      { id: "e4", annual: true, md: "08-31", date: "", img: "img/flag.jpg", place: L("Бишкек и вся страна", "Bishkek and nationwide"), url: "",
        t: L("День независимости", "Independence Day"), d: L("Главный государственный праздник: концерты, салют и праздничные программы.", "The main national holiday: concerts, fireworks and festive programmes.") },
      { id: "e5", annual: false, md: "", date: "", img: "img/ornament.jpg", place: L("По всей стране", "Nationwide"), url: "",
        t: L("Курман-айт", "Kurman Ait"), d: L("Религиозный праздник; дата каждый год меняется — уточняйте перед поездкой.", "A religious holiday; the date changes each year — check before you travel.") }
    ],

    /* ---------- Моя страна (галерея) ---------- */
    gallery: [
      { img: "img/lake.jpg", c: L("Горные озёра", "Alpine lakes", "高山湖泊", "Lagos alpinos") },
      { img: "img/herd.jpg", c: L("Табуны в горах", "Herds in the highlands", "高原上的马群", "Manadas en las alturas") },
      { img: "img/tunduk.jpg", c: L("Внутри юрты", "Inside a yurt", "毡房之内", "Dentro de una yurta") },
      { img: "img/issykkul.jpg", c: L("Зима на озере", "Winter on the lake", "湖上的冬天", "Invierno en el lago") },
      { img: "img/flag.jpg", c: L("Под флагом", "Under the flag", "旗帜之下", "Bajo la bandera") },
      { img: "img/valley.jpg", c: L("Туманные леса", "Misty forests", "云雾森林", "Bosques de niebla") },
      { img: "img/eagle.jpg", c: L("Беркутчи", "Eagle hunters", "猎鹰人", "Cazadores con águila") },
      { img: "img/rider.jpg", c: L("Всадники степи", "Steppe riders", "草原骑手", "Jinetes de la estepa") }
    ],

    /* ---------- Паспорт путешественника ---------- */
    passport: {
      places: [
        { id: "p1", r: "issykkul", img: "img/issykkul.jpg", code: "demo-jeti-oguz", t: L("Джеты-Огуз", "Jeti-Oguz"), d: L("Красные скалы «Семь быков» и «Разбитое сердце».", "The red rocks “Seven Bulls” and the “Broken Heart”.") },
        { id: "p2", r: "chui", img: "img/flag.jpg", code: "demo-burana", t: L("Башня Бурана", "Burana Tower"), d: L("Минарет XI века и каменные балбалы.", "An 11th-century minaret and stone balbals.") },
        { id: "p3", r: "naryn", img: "img/herd.jpg", code: "demo-tash-rabat", t: L("Таш-Рабат", "Tash-Rabat"), d: L("Каменный караван-сарай высоко в горах.", "A stone caravanserai high in the mountains.") },
        { id: "p4", r: "talas", img: "img/rider.jpg", code: "demo-manas-ordo", t: L("Манас Ордо", "Manas Ordo"), d: L("Мемориальный комплекс в Таласе.", "A memorial complex in Talas.") },
        { id: "p5", r: "osh", img: "img/ornament.jpg", code: "demo-sulaiman-too", t: L("Сулайман-Тоо", "Sulaiman-Too"), d: L("Священная гора в центре Оша.", "The sacred mountain in the centre of Osh.") },
        { id: "p6", r: "jalalabad", img: "img/valley.jpg", code: "demo-arslanbob", t: L("Арсланбоб", "Arslanbob"), d: L("Ореховые леса и водопады.", "Walnut forests and waterfalls.") },
        { id: "p7", r: "batken", img: "img/lake.jpg", code: "demo-batken", t: L("Баткен (точка уточняется)", "Batken (location to be confirmed)"), d: L("Выберите место в админке.", "Choose the place in the admin panel.") }
      ],
      ranks: [{ n: 0, name: L("Новичок", "Newcomer", "新手", "Novato") }, { n: 1, name: L("Путник", "Wayfarer", "旅人", "Caminante") }, { n: 3, name: L("Следопыт", "Trailfinder", "探路者", "Rastreador") }, { n: 5, name: L("Покоритель троп", "Trail conqueror", "征途者", "Conquistador de sendas") }],
      topRank: { name: L("Снежный барс", "Snow Leopard", "雪豹", "Leopardo de las nieves"), img: "img/mascot-sky.jpg" }
    },

    /* ---------- Барс учит кыргызскому ---------- */
    kyrgyz: [
      { c: "hi", ky: "Салам", ru: "Привет", en: "Hello" },
      { c: "hi", ky: "Саламатсызбы", ru: "Здравствуйте", en: "Hello (polite)" },
      { c: "hi", ky: "Кош болуңуз", ru: "До свидания", en: "Goodbye" },
      { c: "hi", ky: "Рахмат", ru: "Спасибо", en: "Thank you" },
      { c: "hi", ky: "Ооба", ru: "Да", en: "Yes" },
      { c: "hi", ky: "Жок", ru: "Нет", en: "No" },
      { c: "hi", ky: "Кечиресиз", ru: "Извините", en: "Excuse me" },
      { c: "hi", ky: "Кандайсыз?", ru: "Как у вас дела?", en: "How are you?" },
      { c: "hi", ky: "Жакшы", ru: "Хорошо", en: "Good" },
      { c: "hi", ky: "Дос", ru: "Друг", en: "Friend" },
      { c: "food", ky: "Нан", ru: "Хлеб", en: "Bread" },
      { c: "food", ky: "Суу", ru: "Вода", en: "Water" },
      { c: "food", ky: "Чай", ru: "Чай", en: "Tea" },
      { c: "food", ky: "Эт", ru: "Мясо", en: "Meat" },
      { c: "food", ky: "Сүт", ru: "Молоко", en: "Milk" },
      { c: "food", ky: "Даамдуу", ru: "Вкусно", en: "Delicious" },
      { c: "nat", ky: "Тоо", ru: "Гора", en: "Mountain" },
      { c: "nat", ky: "Көл", ru: "Озеро", en: "Lake" },
      { c: "nat", ky: "Ат", ru: "Лошадь", en: "Horse" },
      { c: "nat", ky: "Кар", ru: "Снег", en: "Snow" },
      { c: "nat", ky: "Күн", ru: "Солнце", en: "Sun" },
      { c: "num", ky: "Бир", ru: "Один", en: "One" },
      { c: "num", ky: "Эки", ru: "Два", en: "Two" },
      { c: "num", ky: "Үч", ru: "Три", en: "Three" },
      { c: "num", ky: "Төрт", ru: "Четыре", en: "Four" },
      { c: "num", ky: "Беш", ru: "Пять", en: "Five" },
      { c: "ph", ky: "Канча турат?", ru: "Сколько стоит?", en: "How much is it?" },
      { c: "ph", ky: "Менин атым …", ru: "Меня зовут …", en: "My name is …" },
      { c: "ph", ky: "Чоң рахмат!", ru: "Большое спасибо!", en: "Thank you very much!" },
      { c: "ph", ky: "Мен түшүнбөйм", ru: "Я не понимаю", en: "I don't understand" },
      { c: "ph", ky: "Жардам бериңиз", ru: "Помогите, пожалуйста", en: "Please help me" },
      { c: "ph", ky: "Туалет кайда?", ru: "Где туалет?", en: "Where is the toilet?" },
      { c: "ph", ky: "Мейманкана кайда?", ru: "Где гостиница?", en: "Where is the hotel?" },
      { c: "ph", ky: "Суу берип коюңуз", ru: "Дайте воды, пожалуйста", en: "Water, please" },
      { c: "ph", ky: "Эсепти алып келиңиз", ru: "Принесите счёт", en: "The bill, please" },
      { c: "ph", ky: "Тамак даамдуу экен", ru: "Еда очень вкусная", en: "The food is delicious" },
      { c: "ph", ky: "Бул жерде сүрөткө тартууга болобу?", ru: "Здесь можно фотографировать?", en: "May I take photos here?" },
      { c: "ph", ky: "Дарыгер керек", ru: "Нужен врач", en: "I need a doctor" }
    ],
    kyCats: { hi: { ru: "Приветствия", en: "Greetings" }, food: { ru: "Еда", en: "Food" }, nat: { ru: "Природа", en: "Nature" }, num: { ru: "Числа", en: "Numbers" }, ph: { ru: "Фразы", en: "Phrases" } }
  };
})();
