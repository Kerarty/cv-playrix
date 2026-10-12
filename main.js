/* ============================================================================
   main.js — страница: язык, карусель, подключение механик, замеры.

   Здесь нет ни одного слова резюме — весь текст лежит в content.js.
   Здесь нет ни одного правила механики — всё это в games.js.
   Файл занимается только тем, что связывает одно с другим.
   ========================================================================== */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     Контакты. Вынесены отдельно от текста, потому что это данные, а не слова:
     их нужно и в разметке печатать, и в ссылках использовать.
     -------------------------------------------------------------------------- */
  var CONTACTS = [
    { k: "contacts.telegram", value: "@Kerarty",  href: "https://t.me/Kerarty" },
    { k: "contacts.email",    value: "kukar.yar@gmail.com", href: "mailto:kukar.yar@gmail.com" },
    { k: "contacts.phone",    value: "+375 44 783-84-89",  href: "tel:+375447838489" },
    { k: "contacts.github",   value: "github.com/Kerarty", href: "https://github.com/Kerarty" }
  ];

  /* Запасной размер сборки на случай, когда страницу открыли с диска,
     а fetch() по file:// не работает. Складывается при сборке из пяти
     файлов: index.html, styles.css, content.js, games.js, main.js. */
  var FALLBACK_SIZE = 136;

  var DICT = window.CONTENT;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ---- язык ------------------------------------------------------------- */

  var lang = "ru";
  try {
    var saved = localStorage.getItem("cv-lang");
    if (saved === "ru" || saved === "en") lang = saved;
    else if ((navigator.language || "").toLowerCase().indexOf("en") === 0) lang = "en";
  } catch (e) { /* приватный режим — просто остаёмся на русском */ }

  function get(path) {
    var parts = path.split(".");
    var node = DICT[lang];
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return undefined;
      node = node[parts[i]];
    }
    return node;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---- применение текста ------------------------------------------------ */

  function applyI18n() {
    var dict = DICT[lang];

    $$("[data-i18n]").forEach(function (node) {
      var v = get(node.getAttribute("data-i18n"));
      if (typeof v === "string") node.textContent = v;
    });

    $$("[data-i18n-aria]").forEach(function (node) {
      var v = get(node.getAttribute("data-i18n-aria"));
      if (typeof v === "string") node.setAttribute("aria-label", v);
    });

    document.documentElement.lang = dict.htmlLang;
    document.title = dict.meta.title;

    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", dict.meta.description);

    var ogT = $('meta[property="og:title"]');
    if (ogT) ogT.setAttribute("content", dict.meta.title);
    var ogD = $('meta[property="og:description"]');
    if (ogD) ogD.setAttribute("content", dict.meta.description);

    var btn = $("#langBtn");
    if (btn) {
      btn.textContent = dict.langButton;
      btn.setAttribute("aria-label", lang === "ru" ? "Switch to English" : "Переключить на русский");
    }
  }

  /* ---- списки, которые собираются из данных ----------------------------- */

  function renderLists() {
    // факты в карточках проектов
    $$("[data-facts]").forEach(function (ul) {
      ul.textContent = "";
      var items = get("projects.items." + ul.getAttribute("data-facts") + ".facts") || [];
      items.forEach(function (f) { ul.appendChild(el("li", null, f)); });
    });

    // навыки
    var grid = $("#skillsGrid");
    if (grid) {
      grid.textContent = "";
      (get("skills.groups") || []).forEach(function (g) {
        var box = el("div", "skill");
        box.appendChild(el("p", "skill__name", g.name));
        var ul = el("ul");
        g.items.forEach(function (i) { ul.appendChild(el("li", null, i)); });
        box.appendChild(ul);
        grid.appendChild(box);
      });
    }

    // правила принятия решений
    var rules = $("#rulesList");
    if (rules) {
      rules.textContent = "";
      (get("decision.rules") || []).forEach(function (r) {
        var li = el("li");
        li.appendChild(el("b", null, r.t));
        li.appendChild(el("span", null, r.d));
        rules.appendChild(li);
      });
    }

    // строки техспеки
    var rows = $("#specRows");
    if (rows) {
      rows.textContent = "";
      (get("spec.rows") || []).forEach(function (r) {
        var row = el("div", "spec__row");
        row.appendChild(el("dt", null, r.k));
        row.appendChild(el("dd", null, r.v));
        rows.appendChild(row);
      });
    }

    // метрики сборки
    var metrics = $("#metrics");
    if (metrics) {
      metrics.textContent = "";
      (get("spec.metrics") || []).forEach(function (m) {
        var box = el("div", "metric");
        box.appendChild(el("span", "metric__v", metric(m.v)));
        box.appendChild(el("span", "metric__k", m.k));
        box.appendChild(el("span", "metric__note", m.note));
        metrics.appendChild(box);
      });
    }

    // что бы я тестировал дальше
    var next = $("#nextList");
    if (next) {
      next.textContent = "";
      (get("spec.next") || []).forEach(function (n) { next.appendChild(el("li", null, n)); });
    }

    // языки
    var langs = $("#langs");
    if (langs) {
      langs.textContent = "";
      (get("education.langs") || []).forEach(function (l) {
        var chip = el("span", "lang");
        chip.appendChild(el("b", null, l.name));
        chip.appendChild(el("span", null, l.level));
        langs.appendChild(chip);
      });
    }

    // контакты
    var contacts = $("#contactsGrid");
    if (contacts) {
      contacts.textContent = "";
      CONTACTS.forEach(function (c) {
        var a = el("a", "contact");
        a.href = c.href;
        var box = el("span");
        box.appendChild(el("span", "contact__k", get(c.k)));
        box.appendChild(document.createElement("br"));
        box.appendChild(el("span", "contact__v", c.value));
        a.appendChild(box);
        contacts.appendChild(a);
      });
    }
  }

  /* ---- замеры этой сборки ----------------------------------------------- */

  /* Храним числа, а не готовые строки: язык переключается уже после того,
     как замеры сняты, и единицы измерения должны меняться вместе с ним. */
  var MEASURED = { size: FALLBACK_SIZE, ttf: null };

  /* Подставить значение в шаблон метрики вида "{{size}}" */
  function metric(v) {
    if (v.indexOf("{{size}}") !== -1) {
      return MEASURED.size == null ? "—"
        : MEASURED.size + (lang === "ru" ? " КБ" : " KB");
    }
    if (v.indexOf("{{ttf}}") !== -1) {
      return MEASURED.ttf == null ? "—" : MEASURED.ttf + (lang === "ru" ? " мс" : " ms");
    }
    return v;
  }

  /* Время до первого кадра: от старта навигации до момента, когда первая
     сцена реально отрисовалась, а не когда пришёл ответ сервера. */
  function measureTTF() {
    if (!performance || !performance.now) return;
    var t = Math.round(performance.now());
    if (t > 0 && t < 5000) MEASURED.ttf = t;
  }

  /* Размер: складываем реальные файлы. На file:// fetch не пройдёт —
     там останется число, вписанное при сборке. */
  var ASSETS = ["index.html", "styles.css", "content.js", "games.js", "main.js"];

  function measureSize() {
    if (location.protocol === "file:") return;
    var done = 0, total = 0, any = false;
    ASSETS.forEach(function (file) {
      fetch(file, { cache: "force-cache" })
        .then(function (r) { return r.blob(); })
        .then(function (b) { total += b.size; any = true; })
        .catch(function () { /* файл не нужен — молча пропускаем */ })
        .then(function () {
          done++;
          if (done === ASSETS.length && any) MEASURED.size = Math.round(total / 1024);
        });
    });
  }

  /* ---- карусель --------------------------------------------------------- */

  var Carousel = {
    index: 0,
    width: 0,
    slides: [],
    dots: [],
    dragging: false,
    startX: 0,
    startY: 0,
    dx: 0,
    axis: null,
    track: null,
    viewport: null,

    init: function () {
      var self = this;
      this.viewport = $("#viewport");
      this.track = $("#track");
      if (!this.viewport || !this.track) return;

      this.slides = $$(".slide", this.track);
      this.buildDots();

      var w = function () { self.width = self.viewport.clientWidth; self.go(self.index, true); };
      w();
      window.addEventListener("resize", w);
      if (typeof ResizeObserver === "function") new ResizeObserver(w).observe(this.viewport);

      this.bindDrag();
      this.bindArrows();
    },

    buildDots: function () {
      var self = this;
      var box = $("#dots");
      if (!box) return;
      box.textContent = "";
      this.slides.forEach(function (slide, i) {
        var b = el("button", "dot");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("data-i18n-aria", "nav.case" + (i + 1));
        b.addEventListener("click", function () { self.go(i); });
        box.appendChild(b);
        self.dots.push(b);
      });
      this.syncDots();
    },

    bindArrows: function () {
      var self = this;
      var prev = $("#prevBtn"), next = $("#nextBtn");
      if (prev) prev.addEventListener("click", function () { self.go(self.index - 1); });
      if (next) next.addEventListener("click", function () { self.go(self.index + 1); });
    },

    bindDrag: function () {
      var self = this;
      var vp = this.viewport;
      if (!vp) return;

      vp.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button, a")) return;
        self.dragging = true;
        self.axis = null;
        self.dx = 0;
        self.startX = e.clientX;
        self.startY = e.clientY;
      });

      window.addEventListener("pointermove", function (e) {
        if (!self.dragging) return;
        var mx = e.clientX - self.startX;
        var my = e.clientY - self.startY;

        /* Ось определяется один раз, на первых шести пикселях: иначе
           диагональное движение дёргает карусель туда-сюда. */
        if (self.axis === null && Math.abs(mx) + Math.abs(my) > 6) {
          self.axis = Math.abs(mx) > Math.abs(my) * 1.15 ? "x" : "y";
          if (self.axis === "x" && vp.setPointerCapture) {
            try { vp.setPointerCapture(e.pointerId); } catch (err) {}
          }
        }
        if (self.axis !== "x") return;

        e.preventDefault();
        self.dx = mx;
        var base = -self.index * self.width;
        /* Резинка на краях: список не уезжает за пределы экрана */
        if ((self.index === 0 && mx > 0) || (self.index === self.slides.length - 1 && mx < 0)) {
          mx *= 0.32;
        }
        self.track.style.transform = "translate3d(" + (base + mx) + "px,0,0)";
      }, { passive: false });

      function end() {
        if (!self.dragging) return;
        self.dragging = false;
        if (self.axis !== "x") { self.axis = null; return; }
        var far = Math.abs(self.dx) > self.width * 0.2;
        if (far) self.go(self.index + (self.dx < 0 ? 1 : -1));
        else self.go(self.index);
        self.axis = null;
      }

      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    },

    go: function (i, instant) {
      var n = this.slides.length || 1;
      var next = Math.max(0, Math.min(n - 1, i));
      this.index = next;

      if (!instant) {
        this.track.style.transition = "transform 0.42s cubic-bezier(0.22,1,0.36,1)";
      } else {
        this.track.style.transition = "none";
      }
      this.track.style.transform = "translate3d(" + (-next * this.width) + "px,0,0)";

      this.slides.forEach(function (s, k) { s.classList.toggle("active", k === next); });
      this.syncDots();

      var prev = $("#prevBtn"), after = $("#nextBtn");
      if (prev) prev.disabled = next === 0;
      if (after) after.disabled = next === n - 1;
    },

    syncDots: function () {
      var self = this;
      this.dots.forEach(function (d, i) {
        var on = i === self.index;
        d.setAttribute("aria-current", on ? "true" : "false");
        var label = get("nav.case" + (i + 1));
        if (typeof label === "string") d.setAttribute("aria-label", label);
      });
    },

    current: function () { return this.slides[this.index]; }
  };

  /* ---- механики --------------------------------------------------------- */

  var stages = [];
  var installShown = false;

  function setHud(slide, name, value) {
    var node = $('[data-hud="' + name + '"]', slide);
    if (!node) return;
    if (node.textContent !== String(value)) {
      node.textContent = value;
      node.classList.add("bump");
      setTimeout(function () { node.classList.remove("bump"); }, 190);
    }
  }

  function revealInstall() {
    if (installShown) return;
    installShown = true;
    var box = $("#install");
    if (!box) return;
    box.classList.add("show");

    /* Прокручиваем только если панель реально за пределами экрана:
       дёргать вьюпорт без надобности — дурной тон. */
    var r = box.getBoundingClientRect();
    if (r.bottom > innerHeight || r.top < 0) {
      box.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function initGames() {
    $$(".slide[data-game]").forEach(function (slide) {
      var kind = slide.getAttribute("data-game");
      var canvas = $("canvas", slide);
      var prompt = $(".prompt", slide);
      if (!canvas || !window.GAMES) return;

      var totals = { merge: { best: 1 }, timing: { round: 0 }, order: { step: 0 } };

      var stage = window.GAMES.create(canvas, kind, {
        score: function (v) { setHud(slide, "score", v); },

        stat: function (k, v) {
          totals[kind][k] = v;
          if (kind === "timing") setHud(slide, "round", v + "/5");
          if (kind === "order") setHud(slide, "step", v + "/12");
          if (kind === "merge") setHud(slide, "best", v);
        },

        /* Прогресс не рисуется: он живёт в подсветке «сейчас твой» внутри
           механики. Наружу отдаём только финальное событие. */
        progress: function () {},

        takeover: function () { if (prompt) prompt.classList.add("hide"); },

        finish: function () {
          slide.classList.add("finished");
          revealInstall();
        }
      });

      stages.push({ slide: slide, stage: stage, kind: kind });
    });
  }

  /* Подпись под экраном Install работает как кнопка «ещё раз»:
     перезапускает ту механику, которую сейчас видно. */
  function initRestart() {
    var hint = $(".install__hint");
    if (!hint) return;
    hint.setAttribute("role", "button");
    hint.setAttribute("tabindex", "0");

    function restart() {
      var cur = Carousel.current();
      var found = stages.filter(function (s) { return s.slide === cur; })[0] || stages[0];
      if (!found) return;
      found.stage.reset();
      found.slide.classList.remove("finished");
      var prompt = $(".prompt", found.slide);
      if (prompt) prompt.classList.add("hide");
    }

    hint.addEventListener("click", restart);
    hint.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); restart(); }
    });
  }

  /* ---- печать ----------------------------------------------------------- */

  function initPrint() {
    var btn = $("#printBtn");
    if (btn) btn.addEventListener("click", function () { window.print(); });
  }

  /* ---- переключение языка ----------------------------------------------- */

  function initLang() {
    var btn = $("#langBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      lang = lang === "ru" ? "en" : "ru";
      try { localStorage.setItem("cv-lang", lang); } catch (e) {}
      applyI18n();
      renderLists();
      Carousel.syncDots();
    });
  }

  /* ---- старт ------------------------------------------------------------ */

  function boot() {
    applyI18n();
    renderLists();
    Carousel.init();
    initGames();
    initRestart();
    initPrint();
    initLang();
    measureSize();
    /* Замер ставится после отрисовки первого кадра: перерисовываем список
       только когда число уже известно, иначе в разметке останется прочерк. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        measureTTF();
        renderLists();
      });
    });

    document.body.classList.add("ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* Отладочный доступ: смотреть состояние из консоли удобнее, чем гадать */
  window.__cv = { stages: stages, carousel: Carousel, measured: MEASURED };

})();
