// Запуск: node test/account.test.mjs — личный кабинет: профиль, поездки, история, пароль, почта, удаление, уведомления
import worker from "../worker/worker.js";
const kv = new Map();
const DB = { get: async (k) => (kv.has(k) ? kv.get(k) : null), put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); }, list: async ({ prefix }) => ({ keys: [...kv.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }) };
const sent = [];
globalThis.fetch = async (url, opt) => { url = String(url);
  if (url.includes("cloudflare-dns")) return Response.json({ Status: 0, Answer: [{ type: 15, data: "1 mx." }] });
  if (url.includes("brevo")) { sent.push(JSON.parse(opt.body)); return Response.json({}, { status: 201 }); }
  throw new Error("fetch " + url); };
const env = { DB, ALLOWED_ORIGIN: "*", BREVO_API_KEY: "k", MAIL_FROM: "m@x.com", ADMIN_PASSWORD: "adm", SITE_URL: "https://s.test/" };
const call = async (method, path, body, token, hdr = {}) => { const r = await worker.fetch(new Request("https://api.test" + path, { method, headers: { "content-type": "application/json", ...(token ? { "X-Token": token } : {}), ...hdr }, body: body ? JSON.stringify(body) : undefined }), env); return [r.status, await r.json()]; };
let fail = 0; const ok = (c, m) => { console.log(c ? "ok  " : "FAIL", m); if (!c) fail++; };
// регистрация + подтверждение
await call("POST", "/api/auth", { mode: "register", name: "Aigerim", email: "ai@gmail.com", password: "Qwerty123", lang: "ru" });
let [s, j] = await call("POST", "/api/auth/verify", { token: sent[0].htmlContent.match(/verify=([0-9a-f]+)/)[1] });
const tok = j.token; ok(j.user.diary === false && j.user.notify === true, "new account: diary off by default, notifications on");
[s, j] = await call("GET", "/api/me"); ok(s === 401, "profile needs token");
[s, j] = await call("GET", "/api/me", null, tok); ok(s === 200 && j.email === "ai@gmail.com" && !j.hash && !j.salt, "profile has no secrets");
[s, j] = await call("PATCH", "/api/me", { name: "Aigerim T", phone: "+996 555 123 456", country: "Kyrgyzstan", about: "Люблю горы" }, tok); ok(s === 200 && j.name === "Aigerim T" && j.phone.startsWith("+996"), "profile updated");
[s, j] = await call("PATCH", "/api/me", { phone: "abc" }, tok); ok(j.error === "phone", "bad phone rejected");
[s, j] = await call("PATCH", "/api/me", { name: "" }, tok); ok(j.error === "name", "empty name rejected");
[s, j] = await call("PATCH", "/api/me", { diary: true }, tok); ok(j.diary === true, "diary switched on by the user");
// diary works with account
[s, j] = await call("GET", "/api/diary", null, tok); ok(s === 200, "diary opens");
// поездки
[s, j] = await call("POST", "/api/trips", { title: "" }, tok); ok(s === 400, "trip needs a title");
[s, j] = await call("POST", "/api/trips", { title: "Song-Kol", from: "2027-07-10", to: "2027-07-17", people: 2, note: "Верхом" }, tok); ok(s === 200 && j.status === "planned" && j.people === 2, "trip added");
const tid = j.id;
[s, j] = await call("PATCH", "/api/trips/" + tid, { note: "Верхом и юрта", status: "done" }, tok); ok(j.status === "done" && j.note === "Верхом и юрта" && j.title === "Song-Kol", "trip edited, keeps other fields");
[s, j] = await call("GET", "/api/trips", null, tok); ok(j.length === 1, "trips listed");
// заявка из кабинета → история + письма
sent.length = 0;
[s, j] = await call("POST", "/api/lead", { name: "Aigerim", country: "KG", app: "wa", contact: "+996555123456", tour: "Issyk-Kul", siteLang: "ru" }, tok); ok(s === 200, "request sent while logged in");
ok(sent.length === 1 && /принята/.test(sent[0].subject), "request-received email");
[s, j] = await call("GET", "/api/history", null, tok); ok(j.requests.length === 1 && j.requests[0].tour === "Issyk-Kul" && !("contact" in j.requests[0]), "request in history (no contact data)");
ok(j.events.some((e) => e.type === "trip") && j.events.some((e) => e.type === "request") && j.events.some((e) => e.type === "signup"), "events logged");
const [, leads] = await call("GET", "/api/leads", null, null, { "X-Admin-Password": "adm" }); const lid = leads[0].id;
sent.length = 0; await call("PATCH", "/api/leads/" + lid, { status: "progress" }, null, { "X-Admin-Password": "adm" });
ok(sent.length === 1 && /в работе/.test(sent[0].htmlContent), "status-change email to the owner");
await call("PATCH", "/api/me", { notify: false }, tok); sent.length = 0; await call("PATCH", "/api/leads/" + lid, { status: "done" }, null, { "X-Admin-Password": "adm" });
ok(sent.length === 0, "no email when notifications are off");
[s, j] = await call("GET", "/api/history", null, tok); ok(j.requests[0].status === "done", "status visible in history");
sent.length = 0; await call("POST", "/api/lead", { name: "Anon", country: "KG", app: "wa", contact: "+996555000111", siteLang: "ru" }); ok(sent.length === 0, "anonymous request: no user email");
// пароль
[s, j] = await call("POST", "/api/me/password", { old: "wrong", password: "NewPass456" }, tok); ok(s === 401, "wrong old password");
[s, j] = await call("POST", "/api/me/password", { old: "Qwerty123", password: "weak" }, tok); ok(j.error === "pass", "weak new password");
sent.length = 0; [s, j] = await call("POST", "/api/me/password", { old: "Qwerty123", password: "NewPass456" }, tok); ok(s === 200 && sent.length === 1, "password changed + notification email");
[s, j] = await call("POST", "/api/auth", { mode: "login", email: "ai@gmail.com", password: "NewPass456" }); ok(s === 200, "login with new password");
// почта
[s, j] = await call("POST", "/api/me/email", { email: "new@gmail.com", password: "bad" }, tok); ok(s === 401, "email change needs password");
[s, j] = await call("POST", "/api/me/email", { email: "x@mailinator.com", password: "NewPass456" }, tok); ok(j.error === "disposable", "email change: disposable rejected");
sent.length = 0; [s, j] = await call("POST", "/api/me/email", { email: "new@gmail.com", password: "NewPass456", lang: "ru" }, tok); ok(s === 200 && sent[0].to[0].email === "new@gmail.com", "confirmation goes to the NEW address");
ok((await call("GET", "/api/me", null, tok))[1].email === "ai@gmail.com", "email unchanged until confirmed");
const ct = sent[0].htmlContent.match(/confirm=([0-9a-f]+)/)[1]; sent.length = 0;
[s, j] = await call("POST", "/api/auth/confirm-email", { token: ct }); ok(s === 200 && j.user.email === "new@gmail.com", "email changed after link");
ok(sent.length === 1 && sent[0].to[0].email === "ai@gmail.com", "old address notified");
[s, j] = await call("POST", "/api/auth/confirm-email", { token: ct }); ok(s === 400, "link is one-time");
[s, j] = await call("POST", "/api/auth", { mode: "login", email: "new@gmail.com", password: "NewPass456" }); ok(s === 200, "login with new email");
[s, j] = await call("POST", "/api/auth", { mode: "login", email: "ai@gmail.com", password: "NewPass456" }); ok(s === 401, "old email no longer logs in");
ok((await call("GET", "/api/history", null, tok))[1].requests.length === 1, "data kept after email change");
// удаление
[s, j] = await call("DELETE", "/api/me", { password: "bad" }, tok); ok(s === 401, "delete needs password");
[s, j] = await call("DELETE", "/api/me", { password: "NewPass456" }, tok); ok(s === 200, "account deleted");
ok((await call("GET", "/api/me", null, tok))[0] === 401 && (await call("GET", "/api/diary", null, tok))[0] === 401, "token dead after deletion");
ok(!kv.has("u:new@gmail.com") && !kv.has("tr:" + [...kv.keys()].find((k) => k.startsWith("tr:"))?.slice(3)) , "user data removed");
console.log(fail ? fail + " FAILED" : "all passed"); process.exit(fail ? 1 : 0);
