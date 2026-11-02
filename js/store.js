/* Хранилище: контент сайта, заявки, загрузка картинок.
   Если в config.js указан API_URL — всё идёт через Cloudflare Worker (боевой режим).
   Если пусто — демо-режим: всё лежит в localStorage этого браузера. */
(function () {
  var CFG = window.WT_CONFIG || {};
  var API = (CFG.API_URL || "").replace(/\/+$/, "");
  var LS_CONTENT = "wt_content_v3", LS_LEADS = "wt_leads_v2", SS_PASS = "wt_admin_pass";

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
  function headers(extra) {
    var h = extra || {}, p = ""; try { p = sessionStorage.getItem(SS_PASS) || ""; } catch (e) {}
    h["X-Admin-Password"] = p; return h;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* Подмешиваем недостающие поля из контента по умолчанию (рекурсивно по объектам). */
  function fill(c, d) {
    Object.keys(d).forEach(function (k) {
      if (c[k] === undefined) c[k] = clone(d[k]);
      else if (isObj(d[k]) && isObj(c[k])) fill(c[k], d[k]);
    });
    return c;
  }
  function withDefaults(c) {
    var d = clone(window.WT_DEFAULT_CONTENT);
    if (c && typeof c === "object" && c.v !== 3) { /* контент старой версии сайта: берём только контакты */
      ["phone", "email", "banks"].forEach(function (k) { if (c[k]) d[k] = c[k]; }); return d;
    }
    return (c && typeof c === "object") ? fill(c, d) : d;
  }

  function jsonLs(k) { var l = []; try { l = JSON.parse(lsGet(k) || "[]"); } catch (e) {} return l; }
  function usersLocal() { var o = {}; try { o = JSON.parse(lsGet("wt_users_v3") || "{}"); } catch (e) {} return o; }
  function sha(t) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }); }
  function leadsLocal() { var l = []; try { l = JSON.parse(lsGet(LS_LEADS) || "[]"); } catch (e) {} return l; }

  /* ссылка для связи с клиентом: WhatsApp / Telegram / звонок */
  function contactLink(app, contact) {
    contact = String(contact || "").trim(); var digits = contact.replace(/[^\d]/g, "");
    if (app === "wa") return digits ? "https://wa.me/" + digits : "";
    if (app === "ph") return digits ? "tel:+" + digits : "";
    if (app === "tg") { if (/^\+?[\d\s()-]{7,}$/.test(contact)) return "https://t.me/+" + digits; var u = contact.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""); return u ? "https://t.me/" + u : ""; }
    return "";
  }
  var Store = {
    contactLink: contactLink,
    demo: !API, apiUrl: API,
    STATUSES: [["new", "Новая"], ["progress", "Выполняется"], ["done", "Выполнена"]],

    load: function () {
      if (API) {
        return fetch(API + "/api/content", { cache: "no-store" })
          .then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(withDefaults)
          .catch(function () { return clone(window.WT_DEFAULT_CONTENT); });
      }
      var raw = lsGet(LS_CONTENT), parsed = null;
      if (raw) { try { parsed = JSON.parse(raw); } catch (e) {} }
      return Promise.resolve(withDefaults(parsed));
    },
    save: function (content) {
      if (API) {
        return fetch(API + "/api/content", { method: "PUT", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify(content) })
          .then(function (r) { if (!r.ok) throw new Error(r.status === 401 ? "auth" : "save"); });
      }
      return lsSet(LS_CONTENT, JSON.stringify(content)) ? Promise.resolve() : Promise.reject(new Error("storage"));
    },
    resetLocal: function () { try { localStorage.removeItem(LS_CONTENT); } catch (e) {} },

    login: function (password) {
      if (API) {
        return fetch(API + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: password }) })
          .then(function (r) { if (!r.ok) throw new Error("auth"); try { sessionStorage.setItem(SS_PASS, password); } catch (e) {} });
      }
      if (password === (CFG.ADMIN_DEMO_PASSWORD || "admin")) { try { sessionStorage.setItem(SS_PASS, password); } catch (e) {} return Promise.resolve(); }
      return Promise.reject(new Error("auth"));
    },
    isLoggedIn: function () { try { return !!sessionStorage.getItem(SS_PASS); } catch (e) { return false; } },
    logout: function () { try { sessionStorage.removeItem(SS_PASS); } catch (e) {} },

    /* ---------- заявки: статус new → progress → done ---------- */
    submitLead: function (lead) {
      if (API) {
        return fetch(API + "/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) })
          .then(function (r) { if (!r.ok) throw new Error("send"); });
      }
      var list = leadsLocal();
      list.unshift(Object.assign({ id: uid(), at: new Date().toISOString(), status: "new", note: "" }, lead));
      lsSet(LS_LEADS, JSON.stringify(list.slice(0, 1000)));
      return Promise.resolve();
    },
    getLeads: function () {
      if (API) return fetch(API + "/api/leads", { headers: headers() }).then(function (r) { if (!r.ok) throw new Error("auth"); return r.json(); });
      return Promise.resolve(leadsLocal());
    },
    updateLead: function (id, patch) {
      if (API) {
        return fetch(API + "/api/leads/" + encodeURIComponent(id), { method: "PATCH", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify(patch) })
          .then(function (r) { if (!r.ok) throw new Error("save"); });
      }
      var l = leadsLocal(); l.forEach(function (x) { if (x.id === id) Object.assign(x, patch); });
      lsSet(LS_LEADS, JSON.stringify(l)); return Promise.resolve();
    },
    deleteLead: function (id) {
      if (API) return fetch(API + "/api/leads/" + encodeURIComponent(id), { method: "DELETE", headers: headers() }).then(function (r) { if (!r.ok) throw new Error("save"); });
      lsSet(LS_LEADS, JSON.stringify(leadsLocal().filter(function (x) { return x.id !== id; }))); return Promise.resolve();
    },

    /* ---------- дневник путешественника: регистрация, отметки ---------- */
    me: function () {
      if (API) { try { return JSON.parse(lsGet("wt_user") || "null"); } catch (e) { return null; } }
      var id = lsGet("wt_session"); if (!id) return null; var u = usersLocal()[id]; return u ? { id: u.id, name: u.name, email: u.email } : null;
    },
    auth: function (mode, d) {
      var email = String(d.email || "").trim().toLowerCase(), pass = String(d.password || ""), name = String(d.name || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return Promise.reject(new Error("mail"));
      if (pass.length < 6) return Promise.reject(new Error("pass"));
      if (mode === "register" && name.length < 1) return Promise.reject(new Error("name"));
      if (API) {
        return fetch(API + "/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: mode, name: name, email: email, password: pass }) })
          .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "auth"); return j; }); })
          .then(function (j) { lsSet("wt_token", j.token); lsSet("wt_user", JSON.stringify(j.user)); return j.user; });
      }
      var users = usersLocal(), found = null; Object.keys(users).forEach(function (k) { if (users[k].email === email) found = users[k]; });
      if (mode === "register") {
        if (found) return Promise.reject(new Error("used"));
        var salt = uid(), u = { id: uid(), name: name, email: email, salt: salt, at: new Date().toISOString() };
        return sha(salt + pass).then(function (h) { u.hash = h; users[u.id] = u; lsSet("wt_users_v3", JSON.stringify(users)); lsSet("wt_session", u.id); return { id: u.id, name: u.name, email: u.email }; });
      }
      if (!found) return Promise.reject(new Error("auth"));
      return sha(found.salt + pass).then(function (h) { if (h !== found.hash) throw new Error("auth"); lsSet("wt_session", found.id); return { id: found.id, name: found.name, email: found.email }; });
    },
    signOut: function () { try { localStorage.removeItem("wt_session"); localStorage.removeItem("wt_token"); localStorage.removeItem("wt_user"); } catch (e) {} },
    getDiary: function () {
      if (API) return fetch(API + "/api/diary", { headers: { "X-Token": lsGet("wt_token") || "" } }).then(function (r) { if (!r.ok) throw new Error("auth"); return r.json(); });
      var u = Store.me(); return Promise.resolve(u ? jsonLs("wt_diary_" + u.id) : []);
    },
    addEntry: function (e) {
      if (API) return fetch(API + "/api/diary", { method: "POST", headers: { "Content-Type": "application/json", "X-Token": lsGet("wt_token") || "" }, body: JSON.stringify(e) }).then(function (r) { if (!r.ok) throw new Error("save"); return r.json(); });
      var u = Store.me(); if (!u) return Promise.reject(new Error("auth")); var l = jsonLs("wt_diary_" + u.id); e = Object.assign({ id: uid(), at: new Date().toISOString() }, e); l.unshift(e);
      return lsSet("wt_diary_" + u.id, JSON.stringify(l.slice(0, 300))) ? Promise.resolve(e) : Promise.reject(new Error("storage"));
    },
    deleteEntry: function (id) {
      if (API) return fetch(API + "/api/diary/" + encodeURIComponent(id), { method: "DELETE", headers: { "X-Token": lsGet("wt_token") || "" } }).then(function (r) { if (!r.ok) throw new Error("save"); });
      var u = Store.me(); if (u) lsSet("wt_diary_" + u.id, JSON.stringify(jsonLs("wt_diary_" + u.id).filter(function (x) { return x.id !== id; }))); return Promise.resolve();
    },
    getUsers: function () { /* для админа: путешественники и их отметки */
      if (API) return fetch(API + "/api/users", { headers: headers() }).then(function (r) { if (!r.ok) throw new Error("auth"); return r.json(); });
      var us = usersLocal(); return Promise.resolve(Object.keys(us).map(function (k) { var u = us[k]; return { id: u.id, name: u.name, email: u.email, at: u.at, entries: jsonLs("wt_diary_" + u.id) }; }));
    },

    /* ---------- истории гостей (фото + отзыв): сначала на модерации ---------- */
    submitStory: function (s) {
      if (API) return fetch(API + "/api/story", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }).then(function (r) { if (!r.ok) throw new Error("send"); });
      var l = jsonLs("wt_stories_v2"); l.unshift(Object.assign({ id: uid(), at: new Date().toISOString(), ok: false }, s)); lsSet("wt_stories_v2", JSON.stringify(l.slice(0, 40))); return Promise.resolve();
    },
    getStories: function (all) { /* all=true — для админа (включая непроверенные) */
      if (API) return fetch(API + "/api/stories" + (all ? "?all=1" : ""), { headers: all ? headers() : {} }).then(function (r) { if (!r.ok) throw new Error("auth"); return r.json(); }).catch(function () { return []; });
      var l = jsonLs("wt_stories_v2"); return Promise.resolve(all ? l : l.filter(function (x) { return x.ok; }));
    },
    updateStory: function (id, patch) {
      if (API) return fetch(API + "/api/stories/" + encodeURIComponent(id), { method: "PATCH", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify(patch) }).then(function (r) { if (!r.ok) throw new Error("save"); });
      var l = jsonLs("wt_stories_v2"); l.forEach(function (x) { if (x.id === id) Object.assign(x, patch); }); lsSet("wt_stories_v2", JSON.stringify(l)); return Promise.resolve();
    },
    deleteStory: function (id) {
      if (API) return fetch(API + "/api/stories/" + encodeURIComponent(id), { method: "DELETE", headers: headers() }).then(function (r) { if (!r.ok) throw new Error("save"); });
      lsSet("wt_stories_v2", JSON.stringify(jsonLs("wt_stories_v2").filter(function (x) { return x.id !== id; }))); return Promise.resolve();
    },

    /* ---------- автоперевод: ru → en/zh/es ----------
       Боевой режим: Worker AI (/api/translate). Демо: бесплатный MyMemory (лимитирован). */
    translate: function (text, to, from) {
      from = from || "ru"; if (!text || !text.trim()) return Promise.resolve("");
      if (API) return fetch(API + "/api/translate", { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify({ text: text, from: from, to: to }) })
        .then(function (r) { if (!r.ok) throw new Error("tr"); return r.json(); }).then(function (j) { return j.text; });
      var pair = from + "|" + (to === "zh" ? "zh-CN" : to);
      var parts = text.split(/\n/), out = [];
      return parts.reduce(function (p, line) {
        return p.then(function () {
          if (!line.trim()) { out.push(""); return; }
          return fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(line.slice(0, 480)) + "&langpair=" + encodeURIComponent(pair))
            .then(function (r) { return r.json(); }).then(function (j) { out.push((j.responseData && j.responseData.translatedText) || line); });
        });
      }, Promise.resolve()).then(function () { return out.join("\n"); });
    },

    /* ---------- простая статистика просмотров ---------- */
    track: function (ev) {
      if (API) { try { navigator.sendBeacon(API + "/api/track", new Blob([JSON.stringify({ ev: ev })], { type: "application/json" })); } catch (e) {} return; }
      var s = {}; try { s = JSON.parse(lsGet("wt_stats_v2") || "{}"); } catch (e) {}
      var d = new Date().toISOString().slice(0, 10); s[d] = s[d] || {}; s[d][ev] = (s[d][ev] || 0) + 1; lsSet("wt_stats_v2", JSON.stringify(s));
    },
    getStats: function () {
      if (API) return fetch(API + "/api/stats", { headers: headers() }).then(function (r) { if (!r.ok) throw new Error("auth"); return r.json(); }).catch(function () { return {}; });
      var s = {}; try { s = JSON.parse(lsGet("wt_stats_v2") || "{}"); } catch (e) {} return Promise.resolve(s);
    },

    /* Сжимает картинку в браузере (WebP/JPEG) и возвращает URL:
       в боевом режиме загружает в Worker, в демо — возвращает data:-ссылку. */
    uploadImage: function (file, maxSide) {
      maxSide = maxSide || (API ? 1800 : 1400);
      return new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onerror = reject;
        fr.onload = function () {
          var img = new Image();
          img.onerror = reject;
          img.onload = function () {
            var k = Math.min(1, maxSide / Math.max(img.width, img.height));
            var c = document.createElement("canvas");
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            function done(b) {
              if (!API) { var r2 = new FileReader(); r2.onload = function () { resolve(r2.result); }; r2.onerror = reject; r2.readAsDataURL(b); return; }
              fetch(API + "/api/upload", { method: "POST", headers: headers({ "Content-Type": b.type }), body: b })
                .then(function (r) { if (!r.ok) throw new Error("upload"); return r.json(); })
                .then(function (j) { resolve(j.url.indexOf("http") === 0 ? j.url : API + j.url); }, reject);
            }
            c.toBlob(function (blob) {
              if (blob && blob.type === "image/webp") done(blob); else c.toBlob(done, "image/jpeg", 0.85);
            }, "image/webp", 0.82);
          };
          img.src = fr.result;
        };
        fr.readAsDataURL(file);
      });
    }
  };
  window.WTStore = Store;
})();
