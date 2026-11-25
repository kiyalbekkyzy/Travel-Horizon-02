// Сквозная проверка в браузере: настоящий worker + сайт на одном адресе, почта перехватывается.
// Запуск: node test/e2e.mjs
import http from "http"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { createRequire } from "module"; const { chromium } = createRequire(import.meta.url)(process.env.PW || "playwright");
import worker from "../worker/worker.js";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const kv = new Map(); const DB = { get: async (k) => (kv.has(k) ? kv.get(k) : null), put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); } };
const mails = []; const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opt) => { url = String(url);
  if (url.includes("cloudflare-dns.com")) { const n = new URL(url).searchParams.get("name"); return n === "fake-domain-xyz.test" ? Response.json({ Status: 3 }) : Response.json({ Status: 0, Answer: [{ type: 15, data: "10 mx." }] }); }
  if (url.includes("api.brevo.com")) { mails.push(JSON.parse(opt.body)); return Response.json({}, { status: 201 }); }
  return realFetch(url, opt); };
let base = ""; const env = { DB, ALLOWED_ORIGIN: "*", BREVO_API_KEY: "k", MAIL_FROM: "x@gmail.com", get SITE_URL() { return base + "/"; } };
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname.startsWith("/api/")) { const chunks = []; for await (const c of req) chunks.push(c); const r = await worker.fetch(new Request(base + req.url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer())); }
  if (u.pathname === "/js/config.js") { res.writeHead(200, { "content-type": "text/javascript" }); return res.end('window.WT_CONFIG={API_URL:"' + base + '"};'); }
  let f = path.join(root, u.pathname === "/" ? "index.html" : u.pathname); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": mime[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => srv.listen(0, r)); base = "http://localhost:" + srv.address().port;
let fail = 0; const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", m); if (!c) fail++; };
const SH = process.env.SHOTS || "/tmp";
const br = await chromium.launch(); const ctx = await br.newContext({ viewport: { width: 1280, height: 900 }, locale: "ru-RU" }); const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("dialog", (d) => d.accept());
await page.goto(base + "/"); await page.waitForSelector("#accBtn:not([hidden])");
ok(/Войти/.test(await page.textContent("#accBtn")), "header shows Log in");
await page.click("#accBtn"); await page.waitForSelector("#aForm"); await page.click('.auth [data-act="dauth"][data-m="register"]');
ok(/Создать аккаунт/.test(await page.textContent(".auth h2")), "site-level registration says 'Create account'");
await page.fill('#aForm [name="name"]', "Айгерим Т"); await page.fill('#aForm [name="email"]', "aigerim@gmail.com"); await page.fill('#aForm [name="password"]', "Qwerty123"); await page.click('#aForm button[type="submit"]');
await page.waitForSelector(".ok-screen"); const okt = await page.textContent(".ok-screen"); ok(/Регистрация прошла успешно/.test(okt) && /aigerim@gmail\.com/.test(okt) && /Подтвердить почту/.test(okt), "success screen explains the email step");
await page.screenshot({ path: SH + "/acc-success.png" });
const link = mails[0].htmlContent.match(/href="([^"]*\?verify=[0-9a-f]+[^"]*)"/)[1].replace(/&amp;/g, "&");
await page.goto(link); await page.waitForFunction(() => /Почта подтверждена/.test(document.body.innerText)); await page.click('[data-act="mclose"].btn');
await page.waitForSelector("#accBtn.in"); ok(/Айгерим/.test(await page.textContent("#accBtn")), "header shows the avatar and name");
// дневник выключен по умолчанию
await page.goto(base + "/#passport"); await page.waitForSelector(".diary.off"); ok(true, "diary is OFF for a new account (user decides)"); await page.screenshot({ path: SH + "/acc-diary-off.png" });
// кабинет
await page.click("#accBtn"); await page.waitForSelector(".acct"); ok(/Почта подтверждена/.test(await page.textContent(".ac-head")), "account panel opens");
await page.fill('#acForm [name="phone"]', "+996 555 123 456"); await page.fill('#acForm [name="country"]', "Кыргызстан"); await page.fill('#acForm [name="about"]', "Люблю горы"); await page.click('#acForm button'); await page.waitForFunction(() => /Сохранено/.test(document.querySelector("#acMsg").textContent)); ok(true, "profile saved"); await page.screenshot({ path: SH + "/acc-profile.png" });
await page.click('[data-tab="t"]'); await page.fill('#acTripF [name="title"]', "Сон-Куль верхом"); await page.fill('#acTripF [name="from"]', "2027-07-10"); await page.fill('#acTripF [name="to"]', "2027-07-17"); await page.click('#acTripF button'); await page.waitForSelector(".trip.planned"); ok(true, "trip planned");
await page.fill('#acTripF [name="title"]', "Иссык-Куль"); await page.click('#acTripF button'); await page.waitForFunction(() => document.querySelectorAll(".trip").length === 2); await page.click('[data-act="actrset"][data-s="done"]'); await page.waitForSelector(".trip.done"); ok(true, "trip marked as done"); await page.screenshot({ path: SH + "/acc-trips.png" });
await page.click('[data-tab="h"]'); await page.waitForSelector(".ac-stats"); ok(/Сон-Куль/.test(await page.textContent(".hist.ev")) || /Запланирована поездка/.test(await page.textContent(".hist.ev")), "history lists activity"); await page.screenshot({ path: SH + "/acc-history.png" });
await page.click('[data-tab="s"]'); await page.waitForSelector("#acPwF");
await page.fill('#acPwF [name="old"]', "Qwerty123"); await page.fill('#acPwF [name="pw"]', "NewPass456"); await page.click('#acPwF button'); await page.waitForFunction(() => /Пароль изменён/.test(document.querySelector("#acPwMsg").textContent)); ok(true, "password changed in settings"); ok(mails.some((m) => /Пароль изменён/.test(m.subject)), "security email sent");
await page.fill('#acMailF [name="email"]', "new.mail@gmail.com"); await page.fill('#acMailF [name="pw"]', "NewPass456"); await page.click('#acMailF button'); await page.waitForFunction(() => /Мы отправили письмо на новый адрес/.test(document.querySelector("#acMailMsg").textContent)); ok(true, "email change asks to confirm the new address"); await page.screenshot({ path: SH + "/acc-settings.png", fullPage: false });
await page.check("#acDiaryT"); await page.waitForFunction(() => /включён/.test(document.querySelector(".acct .sw:nth-of-type(2) small")?.textContent || document.body.innerText)); ok(true, "user turns the diary on");
// дневник включён
await page.click('.m-x'); await page.goto(base + "/#passport"); await page.reload(); await page.waitForSelector(".diary.in"); ok(true, "diary now active");
// письмо о новом адресе
const cl = mails.filter((m) => m.to[0].email === "new.mail@gmail.com")[0].htmlContent.match(/href="([^"]*\?confirm=[0-9a-f]+[^"]*)"/)[1].replace(/&amp;/g, "&");
await page.goto(cl); await page.waitForFunction(() => /Почта изменена/.test(document.body.innerText)); ok(true, "link from the email confirms the new address"); await page.click('[data-act="mclose"].btn');
await page.click("#accBtn"); await page.waitForSelector(".acct"); ok(/new\.mail@gmail\.com/.test(await page.textContent(".ac-head")), "panel shows the new email");
// выход
await page.click('[data-tab="s"]'); await page.click('.acct [data-act="dout"]'); await page.waitForSelector("#accBtn.out"); ok(true, "sign out works");
// мобильный вид
const mp = await br.newPage({ viewport: { width: 390, height: 800 }, locale: "ru-RU" }); await mp.goto(base + "/"); await mp.waitForSelector("#accBtn");
await mp.click("#accBtn"); await mp.fill('#aForm [name="email"]', "new.mail@gmail.com"); await mp.fill('#aForm [name="password"]', "NewPass456"); await mp.click('#aForm button[type="submit"]'); await mp.waitForSelector("#accBtn.in");
await mp.click("#accBtn"); await mp.waitForSelector(".acct"); await mp.click('[data-tab="t"]'); await mp.waitForSelector("#acTripF"); await mp.screenshot({ path: SH + "/acc-mobile.png" });
ok(await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "no horizontal scroll on mobile");
ok(errs.length === 0, "no page errors " + errs.join("|"));
await br.close(); srv.close(); console.log(fail ? fail + " FAILED" : "all passed"); process.exit(fail ? 1 : 0);
