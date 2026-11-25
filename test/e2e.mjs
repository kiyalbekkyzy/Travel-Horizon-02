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
const br = await chromium.launch(); const page = await br.newPage({ viewport: { width: 1280, height: 900 } });
const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(base + "/#passport"); await page.waitForSelector('[data-act="dauth"][data-m="register"]');
await page.click('[data-act="dauth"][data-m="register"]');
const fill = async (n, v) => page.fill('#aForm [name="' + n + '"]', v);
// плохие данные
await fill("name", "Айгерим"); await fill("email", "aigerim@gmial.com"); await fill("password", "Qwerty123"); await page.click('#aForm button[type="submit"]');
await page.waitForSelector("#aErr:not([hidden])"); let e = await page.textContent("#aErr"); ok(/aigerim@gmail\.com/.test(e), "typo suggestion shown: " + e);
await fill("email", "a@fake-domain-xyz.test"); await page.click('#aForm button[type="submit"]'); await page.waitForFunction(() => /нет почтового|mail server/i.test(document.querySelector("#aErr").textContent)); ok(true, "non-existent domain message");
await fill("email", "a@mailinator.com"); await page.click('#aForm button[type="submit"]'); await page.waitForFunction(() => /Одноразов|Disposable/i.test(document.querySelector("#aErr").textContent)); ok(true, "disposable message");
await fill("email", "aigerim@gmail.com"); await fill("password", "short"); await page.click('#aForm button[type="submit"]'); await page.waitForFunction(() => /8 символов|8 characters/.test(document.querySelector("#aErr").textContent)); ok(true, "weak password message");
// успешная регистрация
await fill("password", "Qwerty123"); await page.click('#aForm button[type="submit"]');
await page.waitForSelector("#aResend"); ok(/aigerim@gmail\.com/.test(await page.textContent(".auth")), "check-your-mail screen");
ok(mails.length === 1, "one email sent"); const link = mails[0].htmlContent.match(/href="([^"]*\?verify=[0-9a-f]+[^"]*)"/)[1].replace(/&amp;/g, "&");
await page.screenshot({ path: process.env.SHOTS + "/auth-check.png" });
// вход до подтверждения
await page.reload(); await page.click('[data-act="dauth"][data-m="login"]'); await fill("email", "aigerim@gmail.com"); await fill("password", "Qwerty123"); await page.click('#aForm button[type="submit"]');
await page.waitForFunction(() => /не подтверждена|not confirmed/i.test(document.querySelector("#aErr").textContent)); ok(true, "login blocked until confirmation"); ok(await page.isVisible("#aResend2"), "resend link offered");
// переход по ссылке из письма
await page.goto(link); await page.waitForFunction(() => /Почта подтверждена|Email confirmed/.test(document.body.innerText)); ok(true, "link confirms email");
await page.screenshot({ path: process.env.SHOTS + "/auth-ok.png" });
ok(mails.length === 2 && /Добро пожаловать|Welcome/.test(mails[1].subject), "welcome email sent"); ok(!/verify=/.test(page.url()), "token removed from URL");
await page.click('[data-act="mclose"].btn').catch(() => {}); await page.waitForSelector("#accBtn.in"); ok(true, "signed in after confirmation");
// выход, вход, сброс пароля
await page.click("#accBtn"); await page.click('[data-tab="s"]'); await page.click('.acct [data-act="dout"]'); await page.waitForSelector("#accBtn.out"); await page.click("#accBtn"); await page.click('[data-act="dforgot"]'); await fill("email", "aigerim@gmail.com"); await page.click('#aForm button[type="submit"]');
await page.waitForFunction(() => document.querySelector("#aOk").textContent.length > 3); ok(mails.length === 3, "reset email sent");
const rl = mails[2].htmlContent.match(/href="([^"]*\?reset=[0-9a-f]+[^"]*)"/)[1].replace(/&amp;/g, "&");
await page.goto(rl); await page.waitForSelector('#aForm [name="password"]'); await fill("password", "BrandNew789"); await page.click('#aForm button[type="submit"]'); await page.waitForSelector("#accBtn.in"); ok(true, "password reset signs in");
ok(errs.length === 0, "no page errors " + errs.join("|"));
await br.close(); srv.close(); console.log(fail ? fail + " FAILED" : "all passed"); process.exit(fail ? 1 : 0);
