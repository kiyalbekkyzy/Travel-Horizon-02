/**
 * web-touristKG API — Cloudflare Worker (версия 3).
 *   POST /api/lead         — заявка с сайта: сохраняется, уведомление владельцу в Telegram, (по желанию) автоответ клиенту в WhatsApp
 *   GET  /api/content      — контент сайта;  PUT /api/content — сохранить (админ)
 *   POST /api/login        — проверка пароля админки
 *   POST /api/upload       — загрузка картинки (админ);  GET /api/img/:id — отдать картинку
 *   GET  /api/leads        — заявки (админ);  PATCH/DELETE /api/leads/:id — статус new|progress|done, заметка, удаление
 *   POST /api/translate    — автоперевод текста ru → en/zh/es (админ), через Workers AI
 *   POST /api/story        — впечатление гостя (фото + отзыв), попадает на модерацию
 *   GET  /api/stories      — одобренные; с ?all=1 и паролем — все (админ);  PATCH/DELETE /api/stories/:id (админ)
 *   POST /api/auth, GET/POST/DELETE /api/diary — регистрация и дневник путешественника; GET /api/users (админ)
 *   POST /api/track        — счётчик событий (view, chat, lead, stamp);  GET /api/stats (админ)
 *
 * Переменные (Settings → Variables and Secrets):
 *   ADMIN_PASSWORD  (Secret)  пароль админки
 *   BOT_TOKEN, CHAT_ID (Secret)  Telegram-бот и ваш chat_id: сюда придут новые заявки
 *   ALLOWED_ORIGIN  (Text)    адрес сайта, например https://mysite.pages.dev  (или * при тестировании)
 *   Необязательно, автоответ клиенту в WhatsApp (нужен платный WhatsApp Business API от Meta и одобренный шаблон):
 *   WA_TOKEN (Secret), WA_PHONE_ID (Text), WA_TEMPLATE (Text, имя шаблона), WA_TEMPLATE_LANG (Text, по умолчанию ru)
 * Привязки (Settings → Bindings): KV namespace с именем  DB ;  Workers AI с именем  AI  (для автоперевода)
 */

const APPS = { wa: "WhatsApp", tg: "Telegram", ph: "Звонок" };
const LANG_OK = ["ru", "en", "zh", "es"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": allowed === "*" ? "*" : (origin === allowed ? origin : allowed),
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password, X-Token",
      "Vary": "Origin",
    };
    const json = (data, status = 200, extra = {}) =>
      new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors, ...extra } });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const path = url.pathname.replace(/\/+$/, "");
    const readList = async (key) => JSON.parse((await env.DB.get(key)) || "[]");
    const rate = async (name, max, ttl) => {
      const ip = request.headers.get("CF-Connecting-IP") || "x", key = "rl:" + name + ":" + ip;
      const n = parseInt((await env.DB.get(key)) || "0", 10); if (n >= max) return false;
      await env.DB.put(key, String(n + 1), { expirationTtl: ttl }); return true;
    };
    try {
      // ---------- заявка туриста ----------
      if (path === "/api/lead" && request.method === "POST") {
        const d = await request.json().catch(() => null);
        if (!d) return json({ error: "bad request" }, 400);
        const lead = {
          name: clean(d.name, 80), country: clean(d.country, 60), countryCode: clean(d.countryCode, 3).toUpperCase(),
          app: APPS[d.app] ? d.app : "wa", contact: clean(d.contact, 80), speak: LANG_OK.includes(d.speak) ? d.speak : "en",
          from: clean(d.from, 10), to: clean(d.to, 10), people: clean(d.people, 3), tour: clean(d.tour, 120), tourId: clean(d.tourId, 40),
          wishes: clean(d.wishes, 1500), promo: clean(d.promo, 40), favs: Array.isArray(d.favs) ? d.favs.slice(0, 20).map((x) => clean(x, 80)) : [], siteLang: LANG_OK.includes(d.siteLang) ? d.siteLang : "en",
        };
        const digits = lead.contact.replace(/\D/g, "");
        if (lead.name.length < 2 || lead.country.length < 2 || (lead.app === "tg" ? lead.contact.replace(/^@/, "").length < 3 : digits.length < 7)) return json({ error: "invalid" }, 400);
        if (!(await rate("lead", 5, 3600))) return json({ error: "too many" }, 429);
        lead.link = contactLink(lead.app, lead.contact);
        lead.urgent = /^\d{4}-\d{2}-\d{2}$/.test(lead.from) && (new Date(lead.from) - Date.now()) / 864e5 <= 14;
        lead.id = crypto.randomUUID().replace(/-/g, "").slice(0, 12); lead.at = new Date().toISOString(); lead.status = "new"; lead.note = "";

        const list = await readList("leads"); list.unshift(lead); await env.DB.put("leads", JSON.stringify(list.slice(0, 1000)));
        await bump(env, "lead");

        // уведомление владельцу (не блокирует ответ клиенту)
        if (env.BOT_TOKEN && env.CHAT_ID) {
          const text = (lead.urgent ? "🔥 <b>СРОЧНАЯ заявка</b>" : "🏔 <b>Новая заявка</b>") + "\n\n👤 " + esc(lead.name) + " · " + esc(lead.country) + "\n📲 <b>" + APPS[lead.app] + ":</b> " + esc(lead.contact) + (lead.link ? "\n" + esc(lead.link) : "") +
            "\n🗣 Язык общения: " + lead.speak.toUpperCase() + (lead.from ? "\n📅 " + esc(lead.from) + (lead.to ? " – " + esc(lead.to) : "") : "") + (lead.people ? "\n👥 " + esc(lead.people) : "") + (lead.tour ? "\n🧭 " + esc(lead.tour) : "") + (lead.wishes ? "\n📝 " + esc(lead.wishes) : "") + (lead.favs.length ? "\n♥ " + esc(lead.favs.join(", ")) : "");
          await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: env.CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }) }).catch(() => {});
        }
        // автоответ клиенту в WhatsApp (только если подключён WhatsApp Business API)
        if (lead.app === "wa" && env.WA_TOKEN && env.WA_PHONE_ID && env.WA_TEMPLATE && digits) {
          await fetch("https://graph.facebook.com/v20.0/" + env.WA_PHONE_ID + "/messages", {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.WA_TOKEN },
            body: JSON.stringify({ messaging_product: "whatsapp", to: digits, type: "template", template: { name: env.WA_TEMPLATE, language: { code: env.WA_TEMPLATE_LANG || lead.speak || "ru" } } }),
          }).catch(() => {});
        }
        return json({ ok: true });
      }

      // ---------- дневник путешественника ----------
      if (path === "/api/auth" && request.method === "POST") {
        const d = await request.json().catch(() => null); if (!d) return json({ error: "bad request" }, 400);
        const email = clean(d.email, 120).toLowerCase(), pass = String(d.password || ""), name = clean(d.name, 60);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "mail" }, 400);
        if (pass.length < 6 || pass.length > 100) return json({ error: "pass" }, 400);
        if (!(await rate("auth", 15, 3600))) return json({ error: "too many" }, 429);
        let user = JSON.parse((await env.DB.get("u:" + email)) || "null");
        if (d.mode === "register") {
          if (user) return json({ error: "used" }, 409); if (name.length < 1) return json({ error: "name" }, 400);
          const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
          user = { id: crypto.randomUUID().replace(/-/g, "").slice(0, 14), name, email, salt, hash: await hashPw(pass, salt), at: new Date().toISOString() };
          await env.DB.put("u:" + email, JSON.stringify(user));
          const idx = await readList("uidx"); idx.push(email); await env.DB.put("uidx", JSON.stringify(idx));
        } else if (!user || (await hashPw(pass, user.salt)) !== user.hash) return json({ error: "auth" }, 401);
        const token = hex(crypto.getRandomValues(new Uint8Array(24)));
        await env.DB.put("tok:" + token, user.id, { expirationTtl: 60 * 86400 }); await env.DB.put("uid:" + user.id, user.email);
        return json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
      if (path === "/api/diary" || path.startsWith("/api/diary/")) {
        const uid = await env.DB.get("tok:" + (request.headers.get("X-Token") || "-"));
        if (!uid) return json({ error: "auth" }, 401);
        let list = await readList("d:" + uid);
        if (request.method === "GET") return json(list);
        if (request.method === "DELETE") { const id = decodeURIComponent(path.split("/").pop()); list = list.filter((e) => e.id !== id); await env.DB.put("d:" + uid, JSON.stringify(list)); await env.DB.delete("dimg:" + uid + ":" + id); return json({ ok: true }); }
        if (request.method === "POST") {
          const d = await request.json().catch(() => null); if (!d) return json({ error: "bad request" }, 400);
          const e = { id: crypto.randomUUID().replace(/-/g, "").slice(0, 12), at: new Date().toISOString(), placeId: clean(d.placeId, 40), title: clean(d.title, 100), regionId: clean(d.regionId, 40), note: clean(d.note, 500), via: ["qr", "gps", "manual"].includes(d.via) ? d.via : "manual", pts: Math.min(100, Math.max(0, parseInt(d.pts, 10) || 0)) };
          if (typeof d.lat === "number" && typeof d.lon === "number" && Math.abs(d.lat) <= 90 && Math.abs(d.lon) <= 180) { e.lat = +d.lat.toFixed(4); e.lon = +d.lon.toFixed(4); }
          if (!e.title) return json({ error: "invalid" }, 400);
          const today = e.at.slice(0, 10); if (e.placeId && list.some((x) => x.placeId === e.placeId && (x.at || "").slice(0, 10) === today)) return json({ error: "dup" }, 409);
          if (typeof d.img === "string" && /^data:image\/jpeg;base64,/.test(d.img) && d.img.length < 450000 && list.filter((x) => x.img).length < 60) { await env.DB.put("dimg:" + uid + ":" + e.id, d.img); e.img = "/api/dimg/" + uid + "/" + e.id; }
          list.unshift(e); await env.DB.put("d:" + uid, JSON.stringify(list.slice(0, 300))); await bump(env, "checkin");
          return json(e);
        }
      }
      if (path.startsWith("/api/dimg/") && request.method === "GET") {
        const p = path.split("/"), v = await env.DB.get("dimg:" + p[3] + ":" + p[4]); if (!v) return new Response("Not found", { status: 404, headers: cors });
        const bin = Uint8Array.from(atob(v.split(",")[1]), (c) => c.charCodeAt(0));
        return new Response(bin, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable", ...cors } });
      }
      if (path === "/api/users" && request.method === "GET") {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        const out = []; for (const em of (await readList("uidx")).slice(-300)) { const u = JSON.parse((await env.DB.get("u:" + em)) || "null"); if (u) out.push({ id: u.id, name: u.name, email: u.email, at: u.at, entries: await readList("d:" + u.id) }); }
        return json(out);
      }

      // ---------- контент ----------
      if (path === "/api/content" && request.method === "GET") {
        const v = await env.DB.get("content");
        return v ? new Response(v, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors } }) : json({ error: "empty" }, 404);
      }
      if (path === "/api/content" && request.method === "PUT") {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        const body = await request.text();
        if (body.length > 2_000_000) return json({ error: "too big" }, 413);
        JSON.parse(body);
        await env.DB.put("content", body);
        return json({ ok: true });
      }

      // ---------- админ ----------
      if (path === "/api/login" && request.method === "POST") {
        const d = await request.json().catch(() => ({}));
        return env.ADMIN_PASSWORD && safeEqual(String(d.password || ""), String(env.ADMIN_PASSWORD)) ? json({ ok: true }) : json({ error: "auth" }, 401);
      }
      if (path === "/api/leads" && request.method === "GET") {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        return json(await readList("leads"));
      }
      if (path.startsWith("/api/leads/") && (request.method === "PATCH" || request.method === "DELETE")) {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        const id = decodeURIComponent(path.split("/").pop());
        let list = await readList("leads");
        if (request.method === "DELETE") list = list.filter((l) => l.id !== id);
        else {
          const d = await request.json().catch(() => ({}));
          list.forEach((l) => { if (l.id !== id) return; if (["new", "progress", "done"].includes(d.status)) l.status = d.status; if (typeof d.note === "string") l.note = clean(d.note, 500); });
        }
        await env.DB.put("leads", JSON.stringify(list));
        return json({ ok: true });
      }

      // ---------- автоперевод ----------
      if (path === "/api/translate" && request.method === "POST") {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        if (!env.AI) return json({ error: "no AI binding" }, 501);
        const d = await request.json().catch(() => ({}));
        const map = { ru: "russian", en: "english", zh: "chinese", es: "spanish" };
        if (!d.text || !map[d.from] || !map[d.to] || String(d.text).length > 4000) return json({ error: "bad request" }, 400);
        const lines = String(d.text).split("\n"), out = [];
        for (const line of lines) {
          if (!line.trim()) { out.push(""); continue; }
          const r = await env.AI.run("@cf/meta/m2m100-1.2b", { text: line, source_lang: map[d.from], target_lang: map[d.to] });
          out.push((r && r.translated_text) || line);
        }
        return json({ text: out.join("\n") });
      }

      // ---------- впечатления гостей ----------
      if (path === "/api/story" && request.method === "POST") {
        const d = await request.json().catch(() => null); if (!d) return json({ error: "bad request" }, 400);
        const s = { name: clean(d.name, 60), from: clean(d.from, 60), text: clean(d.text, 600), imgs: (Array.isArray(d.imgs) ? d.imgs : []).filter((u) => typeof u === "string" && /^data:image\/jpeg;base64,/.test(u) && u.length < 150000).slice(0, 3), rating: Math.min(5, Math.max(0, Math.round(Number(d.rating)) || 0)), lang: clean(d.lang, 2) };
        if (s.name.length < 2 || s.text.length < 3) return json({ error: "invalid" }, 400);
        if (!(await rate("story", 3, 3600))) return json({ error: "too many" }, 429);
        s.id = crypto.randomUUID().replace(/-/g, "").slice(0, 12); s.at = new Date().toISOString(); s.ok = false;
        const list = await readList("stories"); list.unshift(s); await env.DB.put("stories", JSON.stringify(list.slice(0, 60)));
        return json({ ok: true });
      }
      if (path === "/api/stories" && request.method === "GET") {
        const all = url.searchParams.get("all") === "1";
        if (all && !isAdmin(request, env)) return json({ error: "auth" }, 401);
        const list = await readList("stories"); return json(all ? list : list.filter((s) => s.ok).map(({ name, from, text, img, imgs, rating, at, id }) => ({ name, from, text, img, imgs, rating, at, id })));
      }
      if (path.startsWith("/api/stories/") && (request.method === "PATCH" || request.method === "DELETE")) {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        const id = decodeURIComponent(path.split("/").pop()); let list = await readList("stories");
        if (request.method === "DELETE") list = list.filter((s) => s.id !== id);
        else { const d = await request.json().catch(() => ({})); list.forEach((s) => { if (s.id === id && typeof d.ok === "boolean") s.ok = d.ok; }); }
        await env.DB.put("stories", JSON.stringify(list)); return json({ ok: true });
      }

      // ---------- простая статистика ----------
      if (path === "/api/track" && request.method === "POST") {
        const d = await request.json().catch(() => ({}));
        if (["view", "chat", "lead", "stamp", "checkin"].includes(d.ev) && (await rate("track", 120, 3600))) await bump(env, d.ev);
        return json({ ok: true });
      }
      if (path === "/api/stats" && request.method === "GET") {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        return json(JSON.parse((await env.DB.get("stats")) || "{}"));
      }

      // ---------- картинки ----------
      if (path === "/api/upload" && request.method === "POST") {
        if (!isAdmin(request, env)) return json({ error: "auth" }, 401);
        const type = (request.headers.get("Content-Type") || "").split(";")[0];
        if (!/^image\/(webp|jpeg|png|gif)$/.test(type)) return json({ error: "type" }, 415);
        const buf = await request.arrayBuffer();
        if (buf.byteLength > 5_000_000) return json({ error: "too big" }, 413);
        const id = crypto.randomUUID().replace(/-/g, "");
        await env.DB.put("img:" + id, buf, { metadata: { type } });
        return json({ url: "/api/img/" + id });
      }
      if (path.startsWith("/api/img/") && request.method === "GET") {
        const { value, metadata } = await env.DB.getWithMetadata("img:" + path.split("/").pop(), "arrayBuffer");
        if (!value) return new Response("Not found", { status: 404, headers: cors });
        return new Response(value, { headers: { "Content-Type": (metadata && metadata.type) || "image/webp", "Cache-Control": "public, max-age=31536000, immutable", ...cors } });
      }

      return json({ ok: true, service: "web-touristKG API v3" });
    } catch (e) {
      return json({ error: "server" }, 500);
    }
  },
};

function hex(b) { return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); }
async function hashPw(pw, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, k, 256));
}
async function bump(env, ev) { // дневные счётчики (хранятся последние 60 дней)
  try {
    const s = JSON.parse((await env.DB.get("stats")) || "{}"), d = new Date().toISOString().slice(0, 10);
    s[d] = s[d] || {}; s[d][ev] = (s[d][ev] || 0) + 1;
    Object.keys(s).sort().slice(0, -60).forEach((k) => delete s[k]);
    await env.DB.put("stats", JSON.stringify(s));
  } catch (e) { /* счётчики не должны ломать заявку */ }
}
function contactLink(app, contact) {
  const digits = contact.replace(/\D/g, "");
  if (app === "wa") return digits ? "https://wa.me/" + digits : "";
  if (app === "ph") return digits ? "tel:+" + digits : "";
  if (/^\+?[\d\s()-]{7,}$/.test(contact)) return "https://t.me/+" + digits;
  const u = contact.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""); return /^\w{3,}$/.test(u) ? "https://t.me/" + u : "";
}
function clean(s, max) { return String(s == null ? "" : s).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, max); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function isAdmin(request, env) { const p = request.headers.get("X-Admin-Password") || ""; return !!env.ADMIN_PASSWORD && safeEqual(p, env.ADMIN_PASSWORD); }
function safeEqual(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
