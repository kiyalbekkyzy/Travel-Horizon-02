// Запуск: node test/auth.test.mjs  (KV, DNS и Brevo подменены, ничего не уходит в сеть)
import worker from "../worker/worker.js";
const kv = new Map();
const DB = { get: async (k) => (kv.has(k) ? kv.get(k) : null), put: async (k, v) => { kv.set(k, v); }, delete: async (k) => { kv.delete(k); } };
const sent = [];
globalThis.fetch = async (url, opt) => {
  url = String(url);
  if (url.includes("cloudflare-dns.com")) {
    const q = new URL(url).searchParams, n = q.get("name"), t = q.get("type");
    if (n === "nodomain.example") return Response.json({ Status: 3 });
    if (n === "gmail.com" && t === "MX") return Response.json({ Status: 0, Answer: [{ type: 15, data: "5 gmail-smtp-in.l.google.com." }] });
    if (n === "nullmx.test" && t === "MX") return Response.json({ Status: 0, Answer: [{ type: 15, data: "0 ." }] });
    return Response.json({ Status: 0, Answer: [] });
  }
  if (url.includes("api.brevo.com")) { sent.push(JSON.parse(opt.body)); return Response.json({ messageId: "x" }, { status: 201 }); }
  throw new Error("unexpected fetch " + url);
};
const env = { DB, ALLOWED_ORIGIN: "*", BREVO_API_KEY: "k", MAIL_FROM: "me@gmail.com", SITE_URL: "https://site.test/" };
const call = async (path, body, e = env, headers = {}) => { const r = await worker.fetch(new Request("https://api.test" + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }), e); return [r.status, await r.json()]; };
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log("FAIL", m); } else console.log("ok  ", m); };
const reg = (o) => call("/api/auth", { mode: "register", name: "Aigerim", email: "aigerim@gmail.com", password: "Qwerty123", lang: "ru", ...o });

let [s, j] = await reg({ email: "bad@@mail" }); ok(s === 400 && j.error === "mail", "bad format rejected");
[s, j] = await reg({ email: "a@mailinator.com" }); ok(j.error === "disposable", "disposable rejected");
[s, j] = await reg({ email: "a@gmial.com" }); ok(j.error === "typo" && j.hint === "a@gmail.com", "typo hint");
[s, j] = await reg({ email: "a@nodomain.example" }); ok(j.error === "nomx", "non-existent domain rejected");
[s, j] = await reg({ email: "a@nullmx.test" }); ok(j.error === "nomx", "null MX rejected");
[s, j] = await reg({ password: "short1" }); ok(j.error === "pass", "short password rejected");
[s, j] = await reg({ password: "onlyletters" }); ok(j.error === "pass", "no digit rejected");
[s, j] = await reg({ name: "" }); ok(j.error === "name", "empty name rejected");
[s, j] = await call("/api/auth", { mode: "register", name: "A", email: "aigerim@gmail.com", password: "Qwerty123" }, { ...env, BREVO_API_KEY: "" }); ok(s === 503 && j.error === "mail_off", "no mail config -> 503, nothing created");
ok(!kv.has("u:aigerim@gmail.com"), "no user created without mail config");

[s, j] = await reg(); ok(s === 200 && j.pending && !j.token, "register -> pending, no token");
ok(sent.length === 1 && sent[0].to[0].email === "aigerim@gmail.com" && /\?verify=[0-9a-f]{48}/.test(sent[0].htmlContent), "verification email sent with link");
const link = sent[0].htmlContent.match(/\?verify=([0-9a-f]{48})/)[1];
[s, j] = await call("/api/auth", { mode: "login", email: "aigerim@gmail.com", password: "Qwerty123" }); ok(s === 403 && j.error === "unverified", "login blocked before confirmation");
[s, j] = await call("/api/auth/verify", { token: "0".repeat(48) }); ok(s === 400, "bad token rejected");
[s, j] = await call("/api/auth/verify", { token: link, lang: "ru" }); ok(s === 200 && j.token && j.user.email === "aigerim@gmail.com", "verify -> logged in");
ok(sent.length === 2 && /Добро пожаловать/.test(sent[1].subject), "welcome email sent");
[s, j] = await call("/api/auth/verify", { token: link }); ok(s === 400, "token is one-time");
ok(JSON.parse(kv.get("uidx")).includes("aigerim@gmail.com"), "user listed only after verification");
[s, j] = await call("/api/auth", { mode: "login", email: "aigerim@gmail.com", password: "wrong" }); ok(s === 401, "wrong password -> 401");
[s, j] = await call("/api/auth", { mode: "login", email: "aigerim@gmail.com", password: "Qwerty123" }); ok(s === 200 && j.token, "login after confirmation");
const tok = j.token;
const d = await worker.fetch(new Request("https://api.test/api/diary", { headers: { "X-Token": tok } }), env); ok(d.status === 200, "token opens diary");
[s, j] = await reg(); ok(s === 409 && j.error === "used", "duplicate registration -> 409");

// повторная отправка и сброс пароля
[s, j] = await reg({ email: "second@gmail.com" }); ok(j.pending, "second user pending");
const n0 = sent.length; [s, j] = await call("/api/auth/resend", { email: "second@gmail.com", lang: "en" }); ok(s === 200 && sent.length === n0 + 1, "resend sends a new email");
[s, j] = await call("/api/auth/resend", { email: "nobody@gmail.com" }); ok(s === 200 && sent.length === n0 + 1, "resend for unknown address: same answer, no email");
const n1 = sent.length; [s, j] = await call("/api/auth/forgot", { email: "aigerim@gmail.com", lang: "ru" }); ok(s === 200 && sent.length === n1 + 1, "reset email sent");
const rt = sent[sent.length - 1].htmlContent.match(/\?reset=([0-9a-f]{48})/)[1];
[s, j] = await call("/api/auth/reset", { token: rt, password: "weak" }); ok(j.error === "pass", "weak new password rejected");
[s, j] = await call("/api/auth/reset", { token: rt, password: "NewPass456" }); ok(s === 200 && j.token, "password reset");
[s, j] = await call("/api/auth", { mode: "login", email: "aigerim@gmail.com", password: "Qwerty123" }); ok(s === 401, "old password no longer works");
[s, j] = await call("/api/auth", { mode: "login", email: "aigerim@gmail.com", password: "NewPass456" }); ok(s === 200, "new password works");
[s, j] = await call("/api/auth/forgot", { email: "ghost@gmail.com" }); ok(s === 200, "forgot for unknown address: same answer");
// legacy-пользователь (без поля verified) входит как раньше
kv.set("u:old@gmail.com", JSON.stringify({ id: "old1", name: "Old", email: "old@gmail.com", salt: "00".repeat(16), hash: "x", at: "2025-01-01" }));
// брутфорс
let last; for (let i = 0; i < 12; i++) [last] = await call("/api/auth", { mode: "login", email: "victim@gmail.com", password: "x" + i });
ok(last === 429, "login brute force throttled");
console.log(fail ? "\n" + fail + " FAILED" : "\nall passed"); process.exit(fail ? 1 : 0);
