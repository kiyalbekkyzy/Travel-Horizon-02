/* Мини-генератор QR-кодов (байтовый режим, коррекция M, версии 1–10 → ссылки до ~210 символов). Без зависимостей. */
(function () {
  var EC = { // версия: [всего слов, ec-слов на блок, [блоки1, данные1], [блоки2, данные2]]
    1: [26, 10, [1, 16], [0, 0]], 2: [44, 16, [1, 28], [0, 0]], 3: [70, 26, [1, 44], [0, 0]], 4: [100, 18, [2, 32], [0, 0]], 5: [134, 24, [2, 43], [0, 0]],
    6: [172, 16, [4, 27], [0, 0]], 7: [196, 18, [4, 31], [0, 0]], 8: [242, 22, [2, 38], [2, 39]], 9: [292, 22, [3, 36], [2, 37]], 10: [346, 26, [4, 43], [1, 44]]
  };
  var ALIGN = { 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };
  var EXP = [], LOG = [], i, x = 1;
  for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
  function genPoly(n) { var p = [1], j, k; for (j = 0; j < n; j++) { var q = new Array(p.length + 1).fill(0); for (k = 0; k < p.length; k++) { q[k] ^= p[k]; q[k + 1] ^= mul(p[k], EXP[j]); } p = q; } return p; }
  function ecc(data, n) { var g = genPoly(n), r = new Array(n).fill(0), k, j; data.forEach(function (d) { var f = d ^ r.shift(); r.push(0); if (f) for (j = 0; j < n; j++) r[j] ^= mul(g[j + 1], f); }); return r; }
  function dataCap(v) { var e = EC[v]; return e[2][0] * e[2][1] + e[3][0] * e[3][1]; }
  function bch(v, poly, bits) { var d = v << bits; var db = Math.floor(Math.log2(poly)); while (d && Math.floor(Math.log2(d)) >= db) d ^= poly << (Math.floor(Math.log2(d)) - db); return (v << bits) | d; }

  function encode(text) {
    var bytes = Array.prototype.slice.call(unescape(encodeURIComponent(text))).map(function (c) { return c.charCodeAt(0); });
    var v = 1; while (v <= 10 && dataCap(v) < bytes.length + 2) v++;
    if (v > 10) throw new Error("QR: ссылка слишком длинная");
    var bits = []; function put(val, n) { for (var k = n - 1; k >= 0; k--) bits.push((val >> k) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCap(v) * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    var words = []; for (i = 0; i < bits.length; i += 8) { var w = 0; for (var k = 0; k < 8; k++) w = (w << 1) | bits[i + k]; words.push(w); }
    for (var pad = 0xec; words.length < dataCap(v); pad ^= 0xec ^ 0x11) words.push(pad);
    var e = EC[v], blocks = [], pos = 0;
    [e[2], e[3]].forEach(function (g) { for (var b = 0; b < g[0]; b++) { var d = words.slice(pos, pos + g[1]); pos += g[1]; blocks.push({ d: d, e: ecc(d, e[1]) }); } });
    var out = [], maxD = Math.max.apply(null, blocks.map(function (b) { return b.d.length; }));
    for (i = 0; i < maxD; i++) blocks.forEach(function (b) { if (i < b.d.length) out.push(b.d[i]); });
    for (i = 0; i < e[1]; i++) blocks.forEach(function (b) { out.push(b.e[i]); });
    return { v: v, words: out };
  }

  function build(text) {
    var enc = encode(text), v = enc.v, n = 17 + 4 * v, M = [], F = []; // M — модули, F — функциональные
    for (i = 0; i < n; i++) { M.push(new Array(n).fill(0)); F.push(new Array(n).fill(false)); }
    function set(r, c, val) { if (r >= 0 && c >= 0 && r < n && c < n) { M[r][c] = val ? 1 : 0; F[r][c] = true; } }
    function finder(r, c) { for (var a = -1; a <= 7; a++) for (var b = -1; b <= 7; b++) { var on = a >= 0 && a <= 6 && b >= 0 && b <= 6 && (a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4)); set(r + a, c + b, on); } }
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
    for (i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    var al = ALIGN[v] || []; al.forEach(function (r) { al.forEach(function (c) { if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (c === 6 && r === al[al.length - 1])) return; for (var a = -2; a <= 2; a++) for (var b = -2; b <= 2; b++) set(r + a, c + b, Math.max(Math.abs(a), Math.abs(b)) !== 1); }); });
    set(n - 8, 8, 1);
    for (i = 0; i < 9; i++) { F[8][i] = F[i][8] = true; } for (i = 0; i < 8; i++) { F[8][n - 1 - i] = F[n - 1 - i][8] = true; }
    if (v >= 7) { var vi = bch(v, 0x1f25, 12); for (i = 0; i < 18; i++) { var bit = (vi >> i) & 1, a = Math.floor(i / 3), b = i % 3 + n - 11; set(a, b, bit); set(b, a, bit); } }
    // данные зигзагом
    var bi = 0, total = enc.words.length * 8, up = true, c, r;
    function bitAt(k) { return k < total ? (enc.words[k >> 3] >> (7 - (k & 7))) & 1 : 0; }
    for (c = n - 1; c > 0; c -= 2) { if (c === 6) c--; for (var step = 0; step < n; step++) { r = up ? n - 1 - step : step; for (var d = 0; d < 2; d++) { var cc = c - d; if (!F[r][cc]) { M[r][cc] = bitAt(bi++); } } } up = !up; }
    var masks = [function (r, c) { return (r + c) % 2 === 0; }, function (r) { return r % 2 === 0; }, function (r, c) { return c % 3 === 0; }, function (r, c) { return (r + c) % 3 === 0; }, function (r, c) { return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; }, function (r, c) { return (r * c) % 2 + (r * c) % 3 === 0; }, function (r, c) { return ((r * c) % 2 + (r * c) % 3) % 2 === 0; }, function (r, c) { return ((r + c) % 2 + (r * c) % 3) % 2 === 0; }];
    function withMask(m) {
      var Q = M.map(function (row) { return row.slice(); }), r2, c2;
      for (r2 = 0; r2 < n; r2++) for (c2 = 0; c2 < n; c2++) if (!F[r2][c2] && masks[m](r2, c2)) Q[r2][c2] ^= 1;
      var f = bch((0 << 3) | m, 0x537, 10) ^ 0x5412; // уровень M = 00
      function sf(r3, c3, b) { Q[r3][c3] = b; }
      for (i = 0; i < 15; i++) { var bt = (f >> i) & 1;
        if (i < 6) sf(i, 8, bt); else if (i < 8) sf(i + 1, 8, bt); else sf(n - 15 + i, 8, bt);
        if (i < 8) sf(8, n - 1 - i, bt); else if (i < 9) sf(8, 15 - i, bt); else sf(8, 15 - i - 1, bt); }
      Q[n - 8][8] = 1; return Q;
    }
    function penalty(Q) {
      var p = 0, r2, c2, run, k;
      for (var t = 0; t < 2; t++) for (r2 = 0; r2 < n; r2++) { run = 1; for (c2 = 1; c2 < n; c2++) { var a = t ? Q[c2][r2] : Q[r2][c2], b = t ? Q[c2 - 1][r2] : Q[r2][c2 - 1]; if (a === b) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (r2 = 0; r2 < n - 1; r2++) for (c2 = 0; c2 < n - 1; c2++) { var s = Q[r2][c2]; if (s === Q[r2][c2 + 1] && s === Q[r2 + 1][c2] && s === Q[r2 + 1][c2 + 1]) p += 3; }
      var dark = 0; Q.forEach(function (row) { row.forEach(function (x2) { dark += x2; }); }); p += Math.floor(Math.abs(dark * 100 / (n * n) - 50) / 5) * 10; return p;
    }
    var best = null, bp = 1e9; for (var m = 0; m < 8; m++) { var Q = withMask(m), pe = penalty(Q); if (pe < bp) { bp = pe; best = Q; } }
    return best;
  }

  window.WTQR = {
    matrix: build,
    /* SVG-строка; size — сторона в px, margin — тихая зона в модулях */
    svg: function (text, size, margin, fg, bg) {
      var Q = build(text), n = Q.length, m = margin == null ? 4 : margin, d = "";
      Q.forEach(function (row, r) { row.forEach(function (v, c) { if (v) d += "M" + (c + m) + " " + (r + m) + "h1v1h-1z"; }); });
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + 2 * m) + " " + (n + 2 * m) + '" width="' + (size || 220) + '" height="' + (size || 220) + '" shape-rendering="crispEdges" role="img"><rect width="100%" height="100%" fill="' + (bg || "#fff") + '"/><path d="' + d + '" fill="' + (fg || "#000") + '"/></svg>';
    }
  };
})();
