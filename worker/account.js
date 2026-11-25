/**
 * Личный кабинет (нужен заголовок X-Token, который выдаётся при входе).
 *
 *   GET    /api/me                 — профиль
 *   PATCH  /api/me                 — имя, телефон, страна, о себе, дневник вкл/выкл, уведомления, язык
 *   POST   /api/me/password        — { old, password } сменить пароль (приходит письмо-уведомление)
 *   POST   /api/me/email           — { email, password } письмо со ссылкой на НОВЫЙ адрес; смена только после перехода по ссылке
 *   POST   /api/auth/confirm-email — { token } подтверждение нового адреса (ссылка ?confirm=… из письма)
 *   DELETE /api/me                 — { password } удалить аккаунт и все данные
 *   GET/POST /api/trips, PATCH/DELETE /api/trips/:id — запланированные поездки
 *   GET    /api/history            — события аккаунта и отправленные заявки
 */
import { pub, logEv, sha, hashPw, rnd, same, clean, checkEmail, pwProblem, sendMail } from "./auth.js";

const LANGS = ["ru", "en", "zh", "es"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUS = ["planned", "done", "cancelled"];

export async function handleAccount(path, request, env, ctx) {
  const { json, readList } = ctx;
  const isConfirm = path === "/api/auth/confirm-email";
  if (!isConfirm && !(path === "/api/me" || path.startsWith("/api/me/") || path === "/api/trips" || path.startsWith("/api/trips/") || path === "/api/history")) return null;

  const body = request.method === "GET" || request.method === "DELETE" && !request.headers.get("content-type") ? {} : (await request.json().catch(() => null)) || {};
  const lang = LANGS.includes(body.lang) ? body.lang : "en";
  const site = env.SITE_URL || "https://kiyalbekkyzy.github.io/Travel-Horizon-02/";
  const limit = async (key, max, ttl) => { const k = "rl:" + key; const n = parseInt((await env.DB.get(k)) || "0", 10); if (n >= max) return false; await env.DB.put(k, String(n + 1), { expirationTtl: Math.max(60, ttl) }); return true; };
  const ip = request.headers.get("CF-Connecting-IP") || "x";
  const getUser = async (email) => JSON.parse((await env.DB.get("u:" + email)) || "null");
  const saveUser = (u) => env.DB.put("u:" + u.email, JSON.stringify(u));
  const session = async (u) => { const token = rnd(24); await env.DB.put("tok:" + token, u.id, { expirationTtl: 60 * 86400 }); await env.DB.put("uid:" + u.id, u.email); return { token, user: pub(u) }; };

  // ---------- подтверждение нового адреса (по ссылке, без входа) ----------
  if (isConfirm) {
    if (request.method !== "POST") return json({ error: "bad request" }, 405);
    if (!(await limit("cfm:" + ip, 20, 3600))) return json({ error: "too many" }, 429);
    const key = "et:" + (await sha(String(body.token || ""))), raw = await env.DB.get(key); if (!raw) return json({ error: "token" }, 400);
    const { uid, email: next } = JSON.parse(raw);
    const old = await env.DB.get("uid:" + uid), u = old && (await getUser(old)); if (!u) return json({ error: "token" }, 400);
    if (await getUser(next)) { await env.DB.delete(key); return json({ error: "used" }, 409); }
    await env.DB.delete(key);
    const prev = u.email; u.email = next; await saveUser(u); await env.DB.delete("u:" + prev); await env.DB.put("uid:" + uid, next);
    const idx = await readList("uidx"); await env.DB.put("uidx", JSON.stringify(idx.map((e) => (e === prev ? next : e))));
    await logEv(env, uid, "email", next);
    await sendMail(env, prev, u.name, u.lang || lang, "n", "").catch(() => {}); // уведомление на старый адрес
    return json(await session(u));
  }

  // ---------- всё остальное только для вошедших ----------
  const uid = await env.DB.get("tok:" + (request.headers.get("X-Token") || "-"));
  const email = uid && (await env.DB.get("uid:" + uid)), u = email && (await getUser(email));
  if (!u || u.verified === false) return json({ error: "auth" }, 401);
  const pwOk = async (p) => same(await hashPw(String(p || ""), u.salt), u.hash);

  if (path === "/api/me") {
    if (request.method === "GET") return json(pub(u));
    if (request.method === "PATCH") {
      const d = body, out = {};
      if ("name" in d) { out.name = clean(d.name, 60); if (!out.name) return json({ error: "name" }, 400); }
      if ("phone" in d) { out.phone = clean(d.phone, 24); if (out.phone && !/^\+?[\d\s()-]{7,24}$/.test(out.phone)) return json({ error: "phone" }, 400); }
      if ("country" in d) out.country = clean(d.country, 60);
      if ("about" in d) out.about = clean(d.about, 400);
      if ("diary" in d) out.diary = !!d.diary;
      if ("notify" in d) out.notify = !!d.notify;
      if ("lang" in d && LANGS.includes(d.lang)) out.lang = d.lang;
      Object.assign(u, out); await saveUser(u);
      if ("diary" in out) await logEv(env, u.id, "diary", out.diary ? "on" : "off");
      if (Object.keys(out).some((k) => !["diary", "notify", "lang"].includes(k))) await logEv(env, u.id, "profile", "");
      return json(pub(u));
    }
    if (request.method === "DELETE") {
      if (!(await limit("del:" + u.email, 5, 3600))) return json({ error: "too many" }, 429);
      if (!(await pwOk(body.password))) return json({ error: "auth" }, 401);
      await env.DB.delete("u:" + u.email); await env.DB.delete("uid:" + u.id);
      for (const k of ["d:", "tr:", "hv:"]) await env.DB.delete(k + u.id);
      const idx = await readList("uidx"); await env.DB.put("uidx", JSON.stringify(idx.filter((e) => e !== u.email)));
      try { const l = await env.DB.list({ prefix: "dimg:" + u.id + ":" }); for (const k of l.keys) await env.DB.delete(k.name); } catch (e) { /* фото могут остаться, они недоступны без записи дневника */ }
      return json({ ok: true });
    }
  }

  if (path === "/api/me/password" && request.method === "POST") {
    if (!(await limit("pw:" + u.email, 8, 3600))) return json({ error: "too many" }, 429);
    if (!(await pwOk(body.old))) return json({ error: "auth" }, 401);
    const pass = String(body.password || ""), pe = pwProblem(pass, u.email); if (pe) return json({ error: pe }, 400);
    u.salt = rnd(16); u.hash = await hashPw(pass, u.salt); u.pwAt = new Date().toISOString(); await saveUser(u);
    await logEv(env, u.id, "password", "");
    await sendMail(env, u.email, u.name, u.lang || lang, "c", "").catch(() => {}); // письмо о смене пароля шлём всегда: это безопасность
    return json({ ok: true });
  }

  if (path === "/api/me/email" && request.method === "POST") {
    if (!(await limit("em:" + u.email, 5, 3600))) return json({ error: "too many" }, 429);
    if (!(await pwOk(body.password))) return json({ error: "auth" }, 401);
    const next = clean(body.email, 254).toLowerCase();
    if (next === u.email) return json({ error: "same" }, 400);
    const bad = await checkEmail(next); if (bad) return json({ error: bad }, 400);
    if (await getUser(next)) return json({ error: "used" }, 409);
    const raw = rnd(24); await env.DB.put("et:" + (await sha(raw)), JSON.stringify({ uid: u.id, email: next }), { expirationTtl: 86400 });
    try { await sendMail(env, next, u.name, lang, "e", site + "?confirm=" + raw + "#account"); } catch (e) { return json({ error: e.message === "mail_off" ? "mail_off" : "mail_fail" }, e.message === "mail_off" ? 503 : 502); }
    return json({ ok: true, email: next });
  }

  // ---------- поездки ----------
  if (path === "/api/trips" || path.startsWith("/api/trips/")) {
    const key = "tr:" + u.id; let list = await readList(key);
    if (path === "/api/trips" && request.method === "GET") return json(list);
    if (path === "/api/trips" && request.method === "POST") {
      const t = tripFrom(body); if (!t.title) return json({ error: "invalid" }, 400);
      if (list.length >= 50) return json({ error: "limit" }, 400);
      t.id = crypto.randomUUID().replace(/-/g, "").slice(0, 10); t.at = new Date().toISOString(); t.status = "planned";
      list.unshift(t); await env.DB.put(key, JSON.stringify(list)); await logEv(env, u.id, "trip", t.title); return json(t);
    }
    const id = decodeURIComponent(path.split("/").pop()), i = list.findIndex((x) => x.id === id); if (i < 0) return json({ error: "not found" }, 404);
    if (request.method === "DELETE") { list.splice(i, 1); await env.DB.put(key, JSON.stringify(list)); return json({ ok: true }); }
    if (request.method === "PATCH") {
      const t = tripFrom(body, list[i]); if (!t.title) return json({ error: "invalid" }, 400);
      const was = list[i].status; list[i] = { ...list[i], ...t }; if (STATUS.includes(body.status)) list[i].status = body.status;
      await env.DB.put(key, JSON.stringify(list));
      if (list[i].status !== was) await logEv(env, u.id, "trip_" + list[i].status, list[i].title);
      return json(list[i]);
    }
  }

  // ---------- история ----------
  if (path === "/api/history" && request.method === "GET") {
    const events = await readList("hv:" + u.id);
    const leads = (await readList("leads")).filter((l) => l.uid === u.id).slice(0, 50).map((l) => ({ id: l.id, at: l.at, tour: l.tour || "", from: l.from || "", to: l.to || "", people: l.people || "", status: l.status }));
    return json({ events, requests: leads, diaryEntries: (await readList("d:" + u.id)).length, joined: u.at });
  }
  return json({ error: "not found" }, 404);
}

function tripFrom(d, base = {}) {
  const num = parseInt(d.people, 10);
  return {
    title: clean("title" in d ? d.title : base.title, 100), tourId: clean("tourId" in d ? d.tourId : base.tourId, 40),
    from: DATE.test(d.from) ? d.from : "from" in d ? "" : base.from || "", to: DATE.test(d.to) ? d.to : "to" in d ? "" : base.to || "",
    people: num > 0 && num <= 50 ? num : base.people || 1, note: clean("note" in d ? d.note : base.note, 500),
  };
}

/** Пользователь по id (для уведомлений) */
export async function userById(env, uid) { const em = uid && (await env.DB.get("uid:" + uid)); return em ? JSON.parse((await env.DB.get("u:" + em)) || "null") : null; }
