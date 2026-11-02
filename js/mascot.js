/* Барс — анимированный маскот по вашему рисунку (барс в калпаке и национальном жилете).
   Картинка разрезана на слои (голова и тело), поэтому голова живёт отдельно: кивает, наклоняется, моргает.
   Состояния: idle, wave, think, talk, happy, oops. WTBars.mount(элемент, {face:true}) → { set(state, мс), state }. */
(function () {
  var FX = '<div class="fx fx-dots"><i></i><i></i><i></i></div>' +
    '<svg class="fx fx-spark" viewBox="0 0 100 100" aria-hidden="true"><path d="M20 14l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM82 30l2.500 6 6 2.500-6 2.500-2.500 6-2.500-6-6-2.500 6-2.500zM74 8l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#f2b84b"/></svg>' +
    '<svg class="fx fx-wave" viewBox="0 0 60 60" aria-hidden="true"><path d="M12 38c6-6 6-14 0-20M24 44c10-10 10-24 0-34M36 50c14-14 14-34 0-48" fill="none" stroke="#f2b84b" stroke-width="3.500" stroke-linecap="round"/></svg>' +
    '<svg class="fx fx-sound" viewBox="0 0 60 60" aria-hidden="true"><path d="M8 22c6 4 6 12 0 16M20 14c12 8 12 24 0 32M32 6c18 12 18 36 0 48" fill="none" stroke="#1b9aaa" stroke-width="3.500" stroke-linecap="round"/></svg>' +
    '<svg class="fx fx-sweat" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 3C9 14 4 20 4 27a11 11 0 0 0 22 0C26 20 21 14 15 3z" fill="#7cc7e8" stroke="#2f6f8f" stroke-width="2"/></svg>';
  var FULL = function () {
    return '<div class="b-stage"><div class="b-all"><img class="b-arm" src="img/bars-arm.webp" alt="" draggable="false"><img class="b-arm b-arml" src="img/bars-arml.webp" alt="" draggable="false"><img class="b-body" src="img/bars-body.webp" alt="" draggable="false"><div class="b-head"><img src="img/bars-head2.webp" alt="" draggable="false"><i class="lid l"></i><i class="lid r"></i><i class="brow l"></i><i class="brow r"></i><i class="mouth"></i></div><img class="b-fo b-fol" src="img/bars-fol.webp" alt="" draggable="false"><img class="b-fo b-for" src="img/bars-for.webp" alt="" draggable="false"></div>' + FX + "</div>";
  };
  var FACE = function () { return '<div class="b-stage face"><div class="b-all"><img class="b-faceimg" src="img/bars-face.webp" alt="" draggable="false"></div>' + FX + "</div>"; };

  window.WTBars = {
    mount: function (el, opts) {
      var face = opts && opts.face;
      el.innerHTML = '<div class="bars' + (face ? " is-face" : "") + '" role="img" aria-label="Барс">' + (face ? FACE() : FULL()) + "</div>";
      var root = el.firstChild, timer = null, cur = "idle";
      var api = {
        el: el, get state() { return cur; },
        set: function (s, ms) { clearTimeout(timer); cur = s; root.className = "bars" + (face ? " is-face" : "") + " s-" + s; if (ms) timer = setTimeout(function () { api.set("idle"); }, ms); return api; }
      };
      api.set("idle"); return api;
    }
  };
})();
