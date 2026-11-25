/**
 * Регистрация и вход с подтверждением почты (Cloudflare Worker + KV).
 *
 *   POST /api/auth          { mode: "register" | "login", name, email, password, lang }
 *   POST /api/auth/verify   { token }                 — подтверждение почты по ссылке из письма
 *   POST /api/auth/resend   { email, lang }           — повторно отправить письмо подтверждения
 *   POST /api/auth/forgot   { email, lang }           — письмо со ссылкой для нового пароля
 *   POST /api/auth/reset    { token, password }       — задать новый пароль
 *   POST /api/auth/logout   (заголовок X-Token)       — выйти
 *
 * Как проверяется почта:
 *   1. формат адреса, 2. одноразовые домены (mailinator и т.п.), 3. частые опечатки (gmial.com),
 *   4. домен реально принимает почту (DNS MX через Cloudflare DoH),
 *   5. главное: письмо со ссылкой. Пока человек не перешёл по ссылке, войти нельзя.
 *
 * Отправка писем: Brevo (бесплатно 300 писем в день, домен не нужен, достаточно подтвердить свой адрес-отправитель).
 *   Секреты/переменные: BREVO_API_KEY (Secret), MAIL_FROM (адрес-отправитель, подтверждён в Brevo),
 *   MAIL_FROM_NAME (Text, необязательно), SITE_URL (Text, адрес сайта со слэшем в конце).
 */

const LANGS = ["ru", "en", "zh", "es"];
const DISPOSABLE = new Set(("mailinator.com 10minutemail.com 10minutemail.net guerrillamail.com guerrillamail.net guerrillamail.org sharklasers.com grr.la " +
  "tempmail.com temp-mail.org temp-mail.io tempmail.net tempail.com tempr.email yopmail.com yopmail.net yopmail.fr trashmail.com trashmail.net " +
  "throwawaymail.com getnada.com nada.email maildrop.cc dispostable.com fakeinbox.com mohmal.com emailondeck.com mintemail.com moakt.com " +
  "mailnesia.com mytemp.email burnermail.io spamgourmet.com discard.email fakemail.net mailcatch.com inboxkitten.com mail.tm mailpoof.com " +
  "tmpmail.org tmpmail.net trashmail.de wegwerfmail.de einrot.com cuvox.de dayrep.com rhyta.com teleworm.us armyspy.com jourrapide.com").split(" "));
const TYPOS = { "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gamil.com": "gmail.com", "gnail.com": "gmail.com", "gmail.ru": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com", "outlok.com": "outlook.com", "mail.ry": "mail.ru", "mial.ru": "mail.ru",
  "yandex.ry": "yandex.ru", "yadex.ru": "yandex.ru", "icloud.con": "icloud.com" };

const T = {
  ru: { vSub: "Подтвердите почту: Travel Horizon", vH: "Подтвердите почту", vP: "Вы создали дневник путешественника. Нажмите кнопку, чтобы подтвердить адрес и войти. Ссылка действует 24 часа.", vB: "Подтвердить почту", vIgn: "Если это были не вы, просто проигнорируйте письмо: аккаунт не будет активирован.",
    wSub: "Добро пожаловать в Travel Horizon", wH: "Почта подтверждена", wP: "Ваш дневник путешественника готов. Отмечайтесь в местах поездки, добавляйте фото и получайте подарки.", wB: "Открыть дневник", wSec: "Если вы не создавали этот аккаунт, напишите нам в ответ на это письмо.",
    rSub: "Новый пароль: Travel Horizon", rH: "Сброс пароля", rP: "Мы получили просьбу задать новый пароль. Нажмите кнопку. Ссылка действует 1 час.", rB: "Задать новый пароль", rIgn: "Если вы не просили сброс, ничего делать не нужно: пароль остался прежним.",
    cSub: "Пароль изменён: Travel Horizon", cH: "Пароль изменён", cP: "Пароль от вашего дневника только что был изменён. Если это были не вы, срочно сбросьте пароль ещё раз на сайте.", hi: "Здравствуйте" },
  en: { vSub: "Confirm your email: Travel Horizon", vH: "Confirm your email", vP: "You created a traveller diary. Press the button to confirm your address and sign in. The link works for 24 hours.", vB: "Confirm email", vIgn: "If this wasn’t you, just ignore this email: the account will not be activated.",
    wSub: "Welcome to Travel Horizon", wH: "Email confirmed", wP: "Your traveller diary is ready. Check in at places on your trip, add photos and earn gifts.", wB: "Open the diary", wSec: "If you did not create this account, reply to this email and tell us.",
    rSub: "New password: Travel Horizon", rH: "Password reset", rP: "We received a request to set a new password. Press the button. The link works for 1 hour.", rB: "Set a new password", rIgn: "If you didn’t ask for this, do nothing: your password stays the same.",
    cSub: "Password changed: Travel Horizon", cH: "Password changed", cP: "The password of your diary was just changed. If this wasn’t you, reset it again on the site right away.", hi: "Hello" },
  es: { vSub: "Confirma tu correo: Travel Horizon", vH: "Confirma tu correo", vP: "Has creado un diario de viajero. Pulsa el botón para confirmar tu dirección e iniciar sesión. El enlace funciona 24 horas.", vB: "Confirmar correo", vIgn: "Si no fuiste tú, ignora este mensaje: la cuenta no se activará.",
    wSub: "Bienvenido a Travel Horizon", wH: "Correo confirmado", wP: "Tu diario de viajero está listo. Marca los lugares de tu viaje, añade fotos y gana regalos.", wB: "Abrir el diario", wSec: "Si no creaste esta cuenta, responde a este correo.",
    rSub: "Nueva contraseña: Travel Horizon", rH: "Restablecer contraseña", rP: "Recibimos una solicitud para crear una nueva contraseña. Pulsa el botón. El enlace funciona 1 hora.", rB: "Crear nueva contraseña", rIgn: "Si no lo pediste, no hagas nada: tu contraseña sigue igual.",
    cSub: "Contraseña cambiada: Travel Horizon", cH: "Contraseña cambiada", cP: "La contraseña de tu diario se acaba de cambiar. Si no fuiste tú, restablécela de nuevo en el sitio.", hi: "Hola" },
  zh: { vSub: "请确认邮箱：Travel Horizon", vH: "确认您的邮箱", vP: "您创建了旅行者日记。请点击按钮确认邮箱并登录。链接 24 小时内有效。", vB: "确认邮箱", vIgn: "如果不是您本人操作，请忽略此邮件，账号不会被激活。",
    wSub: "欢迎来到 Travel Horizon", wH: "邮箱已确认", wP: "您的旅行者日记已就绪。在旅途中打卡、添加照片并获得礼物。", wB: "打开日记", wSec: "如果您没有创建此账号，请直接回复此邮件。",
    rSub: "新密码：Travel Horizon", rH: "重置密码", rP: "我们收到了设置新密码的请求。请点击按钮，链接 1 小时内有效。", rB: "设置新密码", rIgn: "如果不是您申请的，无需任何操作，密码保持不变。",
    cSub: "密码已更改：Travel Horizon", cH: "密码已更改", cP: "您的日记密码刚刚被更改。如果不是您本人操作，请立即在网站上重新重置密码。", hi: "您好" },
};

const hex = (b) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
const clean = (s, max) => String(s == null ? "" : s).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rnd = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
async function sha(s) { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))); }
async function hashPw(pw, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, k, 256));
}
function same(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

/** Проверка адреса без отправки письма. Возвращает код ошибки или "" если всё в порядке. */
export async function checkEmail(email) {
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email)) return "mail";
  const [local, domain] = email.split("@");
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..") || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return "mail";
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i.test(domain)) return "mail";
  const d = domain.toLowerCase();
  if (TYPOS[d]) return "typo";
  if (DISPOSABLE.has(d) || [...DISPOSABLE].some((x) => d.endsWith("." + x))) return "disposable";
  return (await hasMail(d)) ? "" : "nomx";
}
async function dns(name, type) {
  const r = await fetch("https://cloudflare-dns.com/dns-query?name=" + encodeURIComponent(name) + "&type=" + type, { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(4000) });
  if (!r.ok) throw new Error("dns");
  return r.json();
}
/** true, если у домена есть почтовый сервер. При сбое DNS-проверки пропускаем: окончательно адрес проверит письмо. */
async function hasMail(domain) {
  try {
    const mx = await dns(domain, "MX");
    if (mx.Status === 3) return false; // такого домена нет
    const rec = (mx.Answer || []).filter((a) => a.type === 15);
    if (rec.length) return !rec.every((a) => /^\d+\s+\.?$/.test(String(a.data).trim())); // «0 .» = домен явно не принимает почту
    const a = await dns(domain, "A"); // без MX почту принимает сам домен, если у него есть адрес
    return a.Status === 0 && (a.Answer || []).some((x) => x.type === 1 || x.type === 28) || ((await dns(domain, "AAAA")).Answer || []).length > 0;
  } catch (e) { return true; }
}
function pwProblem(pw, email) {
  if (pw.length < 8 || pw.length > 100) return "pass";
  if (!/[A-Za-zЀ-ӿ]/.test(pw) || !/\d/.test(pw)) return "pass";
  if (pw.toLowerCase() === email) return "pass";
  return "";
}

function mailHtml(l, kind, link, name, site) {
  const t = T[l], h = t[kind + "H"], p = t[kind + "P"], b = t[kind + "B"], ign = t[kind + "Ign"] || t[kind + "Sec"] || "";
  return '<!doctype html><html><body style="margin:0;background:#eef6f4;font-family:Arial,Helvetica,sans-serif;color:#0b2c3a">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef6f4;padding:28px 12px"><tr><td align="center">' +
    '<table width="100%" style="max-width:520px;background:#fff;border-radius:18px;overflow:hidden" cellpadding="0" cellspacing="0">' +
    '<tr><td style="background:#0e7c86;color:#fff;padding:22px 28px;font-size:20px;font-weight:bold">Travel Horizon</td></tr>' +
    '<tr><td style="padding:28px"><h1 style="margin:0 0 12px;font-size:22px">' + esc(h) + '</h1>' +
    '<p style="margin:0 0 6px;font-size:15px;line-height:1.55">' + esc(t.hi) + ", " + esc(name) + '!</p>' +
    '<p style="margin:0 0 22px;font-size:15px;line-height:1.55">' + esc(p) + '</p>' +
    (link ? '<p style="margin:0 0 22px"><a href="' + esc(link) + '" style="display:inline-block;background:#ff6b4a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px;font-size:15px">' + esc(b) + '</a></p>' +
      '<p style="margin:0 0 18px;font-size:12px;color:#5b7480;word-break:break-all">' + esc(link) + '</p>' : "") +
    '<p style="margin:0;font-size:13px;color:#5b7480;line-height:1.5">' + esc(ign) + '</p></td></tr></table>' +
    '<p style="font-size:12px;color:#7b9099;margin:14px 0 0">' + esc(site) + '</p></td></tr></table></body></html>';
}
async function sendMail(env, to, name, l, kind, link) {
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) throw new Error("mail_off");
  const site = env.SITE_URL || "https://kiyalbekkyzy.github.io/Travel-Horizon-02/";
  const t = T[l];
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: env.MAIL_FROM, name: env.MAIL_FROM_NAME || "Travel Horizon" }, to: [{ email: to, name }], subject: t[kind + "Sub"],
      htmlContent: mailHtml(l, kind, link, name, site), textContent: t[kind + "H"] + "\n\n" + t[kind + "P"] + (link ? "\n\n" + link : "") + "\n\n" + (t[kind + "Ign"] || t[kind + "Sec"] || ""),
    }),
  });
  if (!r.ok) throw new Error("mail_fail");
}

export async function handleAuth(path, request, env, ctx) {
  const { json, readList, bump } = ctx;
  if (!path.startsWith("/api/auth")) return null;
  if (request.method !== "POST") return json({ error: "bad request" }, 405);
  const ip = request.headers.get("CF-Connecting-IP") || "x";
  const limit = async (key, max, ttl) => { const k = "rl:" + key; const n = parseInt((await env.DB.get(k)) || "0", 10); if (n >= max) return false; await env.DB.put(k, String(n + 1), { expirationTtl: Math.max(60, ttl) }); return true; };
  const d = (await request.json().catch(() => null)) || {};
  const lang = LANGS.includes(d.lang) ? d.lang : "en";
  const site = (env.SITE_URL || "https://kiyalbekkyzy.github.io/Travel-Horizon-02/");
  const getUser = async (email) => JSON.parse((await env.DB.get("u:" + email)) || "null");
  const saveUser = (u, ttl) => env.DB.put("u:" + u.email, JSON.stringify(u), ttl ? { expirationTtl: ttl } : undefined);
  const newToken = async (prefix, email, ttl) => { const raw = rnd(24); await env.DB.put(prefix + (await sha(raw)), email, { expirationTtl: ttl }); return raw; };
  const takeToken = async (prefix, raw) => { const key = prefix + (await sha(String(raw || ""))); const email = await env.DB.get(key); return { key, email }; };
  const session = async (u) => { const token = rnd(24); await env.DB.put("tok:" + token, u.id, { expirationTtl: 60 * 86400 }); await env.DB.put("uid:" + u.id, u.email); return { token, user: { id: u.id, name: u.name, email: u.email } }; };
  const mailErr = (e) => json({ error: e.message === "mail_off" ? "mail_off" : "mail_fail" }, e.message === "mail_off" ? 503 : 502);
  const sendVerify = async (u) => sendMail(env, u.email, u.name, lang, "v", site + "?verify=" + (await newToken("vt:", u.email, 86400)) + "#passport");

  // ---------- подтверждение почты ----------
  if (path === "/api/auth/verify") {
    if (!(await limit("verify:" + ip, 30, 3600))) return json({ error: "too many" }, 429);
    const { key, email } = await takeToken("vt:", d.token);
    if (!email) return json({ error: "token" }, 400);
    const u = await getUser(email); if (!u) return json({ error: "token" }, 400);
    await env.DB.delete(key);
    if (u.verified === false) {
      u.verified = true; u.verifiedAt = new Date().toISOString(); await saveUser(u); // без TTL: аккаунт сохраняется
      const idx = await readList("uidx"); if (!idx.includes(u.email)) { idx.push(u.email); await env.DB.put("uidx", JSON.stringify(idx)); }
      await bump(env, "signup");
      await sendMail(env, u.email, u.name, lang, "w", site + "#passport").catch(() => {}); // уведомление «добро пожаловать»
      if (env.BOT_TOKEN && env.CHAT_ID) await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: env.CHAT_ID, text: "👤 Новый пользователь дневника: " + u.name + " (" + u.email + ")" }) }).catch(() => {});
    }
    return json(await session(u));
  }

  // ---------- повторное письмо ----------
  if (path === "/api/auth/resend") {
    const email = clean(d.email, 254).toLowerCase();
    if (!(await limit("resend:" + ip, 8, 3600)) || !(await limit("resend:" + email, 3, 3600))) return json({ error: "too many" }, 429);
    const u = email && (await getUser(email));
    if (u && u.verified === false) { try { await sendVerify(u); } catch (e) { return mailErr(e); } }
    return json({ ok: true }); // не раскрываем, есть ли такой адрес
  }

  // ---------- сброс пароля ----------
  if (path === "/api/auth/forgot") {
    const email = clean(d.email, 254).toLowerCase();
    if (!(await limit("forgot:" + ip, 8, 3600)) || !(await limit("forgot:" + email, 3, 3600))) return json({ error: "too many" }, 429);
    const u = email && (await getUser(email));
    if (u && u.verified !== false) { try { await sendMail(env, u.email, u.name, lang, "r", site + "?reset=" + (await newToken("rt:", u.email, 3600)) + "#passport"); } catch (e) { return mailErr(e); } }
    return json({ ok: true });
  }
  if (path === "/api/auth/reset") {
    if (!(await limit("reset:" + ip, 20, 3600))) return json({ error: "too many" }, 429);
    const { key, email } = await takeToken("rt:", d.token); if (!email) return json({ error: "token" }, 400);
    const u = await getUser(email); if (!u) return json({ error: "token" }, 400);
    const pass = String(d.password || ""); const pe = pwProblem(pass, email); if (pe) return json({ error: pe }, 400);
    await env.DB.delete(key);
    u.salt = rnd(16); u.hash = await hashPw(pass, u.salt); u.pwAt = new Date().toISOString(); await saveUser(u);
    await sendMail(env, u.email, u.name, lang, "c", "").catch(() => {});
    return json(await session(u));
  }
  if (path === "/api/auth/logout") { const t = request.headers.get("X-Token"); if (t) await env.DB.delete("tok:" + t); return json({ ok: true }); }

  // ---------- регистрация и вход ----------
  if (path !== "/api/auth") return json({ error: "not found" }, 404);
  const email = clean(d.email, 254).toLowerCase(), pass = String(d.password || ""), name = clean(d.name, 60);
  const mailBad = await (async () => (d.mode === "register" ? await checkEmail(email) : /^[^\s@]+@[^\s@]+$/.test(email) ? "" : "mail"))();
  if (mailBad) return json({ error: mailBad, ...(mailBad === "typo" ? { hint: email.split("@")[0] + "@" + TYPOS[email.split("@")[1]] } : {}) }, 400);

  if (d.mode === "register") {
    if (!name) return json({ error: "name" }, 400);
    const pe = pwProblem(pass, email); if (pe) return json({ error: pe }, 400);
    if (!env.BREVO_API_KEY || !env.MAIL_FROM) return json({ error: "mail_off" }, 503); // без почты регистрацию не открываем: подтвердить адрес нечем
    if (!(await limit("reg:" + ip, 10, 3600))) return json({ error: "too many" }, 429);
    let u = await getUser(email);
    if (u && u.verified !== false) return json({ error: "used" }, 409);
    if (!(await limit("resend:" + email, 3, 3600))) return json({ error: "too many" }, 429);
    const salt = rnd(16);
    u = { id: (u && u.id) || crypto.randomUUID().replace(/-/g, "").slice(0, 14), name, email, salt, hash: await hashPw(pass, salt), at: (u && u.at) || new Date().toISOString(), verified: false };
    await saveUser(u, 7 * 86400); // неподтверждённая запись сама удаляется через 7 дней
    try { await sendVerify(u); } catch (e) { return mailErr(e); }
    return json({ pending: true, email });
  }

  // вход
  if (!(await limit("login:" + ip, 30, 3600)) || !(await limit("login:" + email, 10, 900))) return json({ error: "too many" }, 429);
  const u = await getUser(email);
  const ok = u ? same(await hashPw(pass, u.salt), u.hash) : (await hashPw(pass, "00".repeat(16)), false); // одинаковое время ответа
  if (!u || !ok) return json({ error: "auth" }, 401);
  if (u.verified === false) return json({ error: "unverified" }, 403);
  return json(await session(u));
}
