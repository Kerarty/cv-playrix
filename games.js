/* ============================================================================
   games.js — мини-фреймворк и три механики для креатива.

   Никаких зависимостей. Всё, что нужно, описано ниже:
     · Stage        — канвас с учётом DPR, единым RAF-циклом и паузой вне экрана
     · твины, частицы, пул объектов
     · merge        — сетка со слиянием фигур
     · timing       — вращение стрелки и зоны попадания
     · order        — стена, которую разбирают по порядку

   Игра отдаёт наружу только числа (счёт, прогресс) — весь текст живёт в HTML
   рядом с канвасом, чтобы переключение языка ничего не ломало.

   ---------------------------------------------------------------------------
   Идея: игру можно запустить дважды. В режиме ожидания (attract) игра сама
   играет за игрока — это первые секунды, когда на странице ещё нет людей.
   ========================================================================== */

(function (global) {
  "use strict";

  /* ==========================================================================
     МЕЛОЧИ
     ====================================================================== */

  var TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Плавное приближение к цели, независимое от длины кадра.
     Именно им гоняются все «полёты»: и ход фигуры, и падение новых. */
  function approach(cur, target, rate, dt) {
    return cur + (target - cur) * (1 - Math.exp(-rate * dt));
  }

  function randInt(a, b) { return a + ((Math.random() * (b - a + 1)) | 0); }

  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  var Ease = {
    linear: function (t) { return t; },
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inCubic: function (t) { return t * t * t; },
    outQuint: function (t) { return 1 - Math.pow(1 - t, 5); },
    outBack: function (t) {
      var c = 1.70158, c3 = c + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    },
    outElastic: function (t) {
      if (t === 0 || t === 1) return t;
      var p = 0.35;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (TAU / p)) + 1;
    }
  };

  var reduceMotion = false;

  /* Сверху и снизу сцены лежат HTML-элементы: счёт сверху и подсказка
     снизу. Игра обязана их учитывать, иначе поле уезжает под интерфейс. */
  var INSET_TOP = 48;
  var INSET_BOTTOM = 50;

  /* Рабочая область сцены без этих полей */
  function box(w, h) {
    var top = INSET_TOP;
    var bottom = h - INSET_BOTTOM;
    return { top: top, h: Math.max(40, bottom - top) };
  }
  try {
    var mq = matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion = mq.matches;
    if (mq.addEventListener) {
      mq.addEventListener("change", function (e) { reduceMotion = e.matches; });
    }
  } catch (e) { /* старый браузер — просто не выключаем анимацию */ }

  /* Скруглённый прямоугольник — path2d есть не везде, рисуем руками */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ==========================================================================
     ТВИНЫ
     Кадронезависимые: хранят прошедшее время, а не число кадров.
     ====================================================================== */

  function Tweens() { this.items = []; }

  Tweens.prototype.add = function (o) {
    o.t = 0;
    o.ease = o.ease || Ease.outCubic;
    o.delay = o.delay || 0;
    this.items.push(o);
    return o;
  };

  Tweens.prototype.update = function (dt) {
    var alive = [], i, o;
    for (i = 0; i < this.items.length; i++) {
      o = this.items[i];
      if (o.delay > 0) { o.delay -= dt; alive.push(o); continue; }
      o.t += dt;
      var k = clamp(o.t / o.dur, 0, 1);
      var v = o.from + (o.to - o.from) * o.ease(k);
      if (o.onUpdate) o.onUpdate(v, k);
      if (k >= 1) { if (o.onDone) o.onDone(); }
      else { alive.push(o); }
    }
    this.items = alive;
  };

  Tweens.prototype.clear = function () { this.items.length = 0; };

  /* ==========================================================================
     ЧАСТИЦЫ
     Пул фиксированного размера: новые не аллоцируются, лишние переиспользуются.
     ====================================================================== */

  function Particles(max) {
    this.max = max || 160;
    this.pool = [];
    this.count = 0;
  }

  Particles.prototype.spawn = function (x, y, color, n, opts) {
    if (reduceMotion) n = Math.min(n, 6);
    opts = opts || {};
    var speed = opts.speed || 90;
    var spread = opts.spread == null ? TAU : opts.spread;
    var dir = opts.dir == null ? -Math.PI / 2 : opts.dir;
    var life = opts.life || 0.55;
    var size = opts.size || 3;
    for (var i = 0; i < n; i++) {
      var a = dir + (Math.random() - 0.5) * spread;
      var s = speed * (0.45 + Math.random() * 0.8);
      if (this.count >= this.max) {
        // переиспользуем самую старую, чтобы эффект не пропадал совсем
        this._recycle(0);
      }
      var p = this.pool[this.count] || (this.pool[this.count] = {});
      p.x = x; p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.life = life * (0.7 + Math.random() * 0.6);
      p.age = 0;
      p.r = size * (0.6 + Math.random() * 0.9);
      p.color = color;
      p.g = opts.gravity == null ? 340 : opts.gravity;
      this.count++;
    }
  };

  Particles.prototype._recycle = function (i) {
    var p = this.pool[i];
    if (!p) return;
    this.pool[i] = this.pool[this.count - 1];
    this.pool[this.count - 1] = p;
    this.count--;
  };

  Particles.prototype.update = function (dt) {
    for (var i = 0; i < this.count; i++) {
      var p = this.pool[i];
      p.age += dt;
      if (p.age >= p.life) { this._recycle(i); i--; continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.99;
    }
  };

  Particles.prototype.draw = function (ctx) {
    for (var i = 0; i < this.count; i++) {
      var p = this.pool[i];
      var k = 1 - p.age / p.life;
      ctx.globalAlpha = clamp(k, 0, 1) * 0.95;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + k * 0.8), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  Particles.prototype.clear = function () { this.count = 0; };

  /* ==========================================================================
     STAGE
     Канвас, который сам следит за размером, плотностью пикселей и тем,
     виден ли он. Игра получает api и пишет update/draw.
     ====================================================================== */

  function Stage(canvas, factory) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.visible = false;
    this.running = false;
    this.time = 0;
    /* Игра начинает играть сама за себя: первые секунды страницы
       рекрутер смотрит молча, и аттракт-режим держит экран живым. */
    this.autoplay = true;
    this.finished = false;

    this.tweens = new Tweens();
    this.parts = new Particles(180);

    var self = this;

    this._handlers = {
      down: [], move: [], up: [], tap: []
    };

    this.api = {
      get w() { return self.w; },
      get h() { return self.h; },
      get autoplay() { return self.autoplay; },
      set autoplay(v) { self.autoplay = v; },
      get finished() { return self.finished; },
      time: function () { return self.time; },
      tweens: this.tweens,
      parts: this.parts,
      ease: Ease,
      lerp: lerp,
      clamp: clamp,
      randInt: randInt,
      pick: pick,
      reduced: function () { return reduceMotion; },
      on: function (name, fn) { (self._handlers[name] || (self._handlers[name] = [])).push(fn); return self; },
      emit: function (name, payload) {
        var list = self._handlers[name] || [];
        for (var i = 0; i < list.length; i++) list[i](payload);
      },
      onScore: function (fn) { self._onScore = fn; return self; },
      onProgress: function (fn) { self._onProgress = fn; return self; },
      onStat: function (fn) { self._onStat = fn; return self; },
      score: function (v) { self.score(v); return self; },
      progress: function (v) { self.progress(v); return self; },
      stat: function (k, v) { self.stat(k, v); return self; },
      finish: function () { self.finish(); return self; },
      onFinish: function (fn) { self._onFinish = fn; return self; },
      onTakeover: function (fn) { self._onTakeover = fn; return self; }
    };

    this.game = factory(this.api);

    this._bindInput();
    this._bindObservers();
    this.resize();
  }

  Stage.prototype._local = function (e) {
    var r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  Stage.prototype._bindInput = function () {
    var self = this;
    var active = false, sx = 0, sy = 0, st = 0, moved = 0;

    this.canvas.style.touchAction = "none";

    this.canvas.addEventListener("pointerdown", function (e) {
      if (self.finished) return;
      active = true; moved = 0;
      var p = self._local(e);
      sx = p.x; sy = p.y; st = performance.now();
      if (self.canvas.setPointerCapture) {
        try { self.canvas.setPointerCapture(e.pointerId); } catch (err) {}
      }
      self._takeover();
      self.api.emit("down", p);
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener("pointermove", function (e) {
      if (!active) return;
      var p = self._local(e);
      moved = Math.max(moved, Math.hypot(p.x - sx, p.y - sy));
      self.api.emit("move", { x: p.x, y: p.y, dx: p.x - sx, dy: p.y - sy });
    });

    function end(e) {
      if (!active) return;
      active = false;
      var p = self._local(e);
      var dt = performance.now() - st;
      self.api.emit("up", { x: p.x, y: p.y, dx: p.x - sx, dy: p.y - sy, dist: moved, time: dt });
      if (moved < 12 && dt < 400) self.api.emit("tap", p);
    }

    this.canvas.addEventListener("pointerup", end);
    this.canvas.addEventListener("pointercancel", function () { active = false; });

    this.canvas.addEventListener("keydown", function (e) {
      if (self.finished) return;
      var r = self.canvas.getBoundingClientRect();
      var map = {
        ArrowLeft:  [-1, 0], ArrowRight: [1, 0],
        ArrowUp:    [0, -1], ArrowDown: [0, 1],
        a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1]
      };
      var v = map[e.key];
      if (v) {
        self._takeover();
        self.api.emit("move", { dx: v[0], dy: v[1], x: r.width / 2, y: r.height / 2, key: true });
        e.preventDefault();
      } else if (e.key === "Enter" || e.key === " ") {
        self._takeover();
        self.api.emit("tap", { x: r.width / 2, y: r.height / 2 });
        self.api.emit("key", e.key);
        e.preventDefault();
      }
    });
  };

  /* Первое касание — момент, когда зритель становится игроком. */
  Stage.prototype._takeover = function () {
    if (!this.autoplay) return;
    this.autoplay = false;
    if (this.game && this.game.onTakeover) this.game.onTakeover();
    if (this._onTakeover) this._onTakeover();
  };

  Stage.prototype._bindObservers = function () {
    var self = this;
    if (typeof IntersectionObserver === "function") {
      this._io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          self.visible = entries[i].isIntersecting;
          if (self.visible) self.play(); else self.stop();
        }
      }, { threshold: 0.12 });
      this._io.observe(this.canvas);
    } else {
      this.visible = true;
      this.play();
    }

    this._onVis = function () {
      self.visible = !document.hidden;
      if (self.visible) self.play(); else self.stop();
    };
    document.addEventListener("visibilitychange", this._onVis);

    if (typeof ResizeObserver === "function") {
      this._ro = new ResizeObserver(function () { self.resize(); });
      this._ro.observe(this.canvas);
    } else {
      window.addEventListener("resize", this._onVis);
    }
  };

  Stage.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var dpr = Math.min(global.devicePixelRatio || 1, 2.5);
    this.w = r.width;
    this.h = r.height;
    this.dpr = dpr;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    if (this.game && this.game.resize) this.game.resize(this.w, this.h);
    if (!this.running) this.render();
  };

  Stage.prototype.play = function () {
    if (this.running || this.finished) return;
    this.running = true;
    this._last = performance.now();
    var self = this;
    var tick = function (now) {
      if (!self.running) return;
      var dt = Math.min((now - self._last) / 1000, 0.05);
      self._last = now;
      self.time += dt;
      self.update(dt);
      self.render();
      self._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  };

  Stage.prototype.stop = function () {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  };

  Stage.prototype.update = function (dt) {
    this.tweens.update(dt);
    this.parts.update(dt);
    if (this.game && this.game.update) this.game.update(dt);
  };

  Stage.prototype.render = function () {
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    if (this.game && this.game.draw) this.game.draw(ctx, this.w, this.h);
    this.parts.draw(ctx);
  };

  Stage.prototype.score = function (v) { if (this._onScore) this._onScore(v); };

  Stage.prototype.progress = function (v) { if (this._onProgress) this._onProgress(v); };

  /* Побочные числа, которые не лезут в счёт: «лучшая фигура», «раунд».
     Игра сообщает, страница решает, где это нарисовать. */
  Stage.prototype.stat = function (k, v) { if (this._onStat) this._onStat(k, v); };

  /* Подписка страницы на события сцены. Зеркалит то, что игра зовёт у api. */
  Stage.prototype.onScore = function (fn) { this._onScore = fn; return this; };
  Stage.prototype.onProgress = function (fn) { this._onProgress = fn; return this; };
  Stage.prototype.onStat = function (fn) { this._onStat = fn; return this; };
  Stage.prototype.onFinish = function (fn) { this._onFinish = fn; return this; };
  Stage.prototype.onTakeover = function (fn) { this._onTakeover = fn; return this; };

  Stage.prototype.finish = function () {
    if (this.finished) return;
    this.finished = true;
    if (this._onFinish) this._onFinish();
  };

  Stage.prototype.reset = function () {
    this.finished = false;
    this.autoplay = true;
    this.time = 0;
    this.tweens.clear();
    this.parts.clear();
    if (this.game && this.game.reset) this.game.reset();
    this.render();
    if (this.visible) this.play();
  };

  Stage.prototype.destroy = function () {
    this.stop();
    if (this._io) this._io.disconnect();
    if (this._ro) this._ro.disconnect();
    document.removeEventListener("visibilitychange", this._onVis);
  };

  /* ==========================================================================
     ИГРА 1. MERGE — сетка со слиянием
     --------------------------------------------------------------------------
     Правило считывается без единого слова: у каждого уровня свой цвет И своя
     форма, поэтому поле читается даже боком на телефоне. Ход — свайп или
     стрелки, обратный ход отыгрывается сам, чтобы промах не был наказанием.
     ====================================================================== */

  function Merge(api) {
    var COLS = 6, ROWS = 7, MAX_TIER = 4;

    /* Ювелирная палитра в духе cozy-головоломок: у каждого уровня свой
       камень, и он же отвечает за свою форму — правило читается по цвету
       даже боком на телефоне. */
    var TIER_COLOR = ["#5CD98A", "#63B0FF", "#C08BFF", "#FFCF4D", "#FF7A88"];
    var TIER_DARK = ["#2E9C57", "#1E6FD0", "#7A3FC4", "#D9930A", "#CC3348"];

    var grid = [];      // [row][col] -> гем или null
    var cell = 0;       // пикселей на клетку
    var ox = 0, oy = 0; // отступы доска
    var score = 0, merges = 0, bestTier = 0;
    var shake = 0, flash = 0;
    var aiTimer = 0.6;
    var sel = null;     // выбранная клетка для тапа-тап-ввода
    var idle = 0;

    function newGem(tier, fromAbove) {
      return {
        tier: tier,
        r: 0, c: 0,
        pr: fromAbove ? -1.6 : 0,   // визуальная позиция: строки
        pc: 0,
        scale: fromAbove ? 0.6 : 1,
        pop: 0,
        dying: 0,
        bob: Math.random() * TAU
      };
    }

    function randomTier() {
      /* Тяжёлые уровни выпадают реже — иначе поле забивается максимумами
         на второй секунде и играть становится не о чем. */
      var r = Math.random();
      return r < 0.42 ? 0 : r < 0.74 ? 1 : r < 0.92 ? 2 : 3;
    }

    function fill() {
      for (var r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (var c = 0; c < COLS; c++) grid[r][c] = null;
      }
      /* Поле заполняется каскадом: верхний ряд стартует выше всех и падает
         последним. На первой секунде страница уже движется — это тот самый
         хук, ради которого игра стартует сама. */
      for (var r2 = 0; r2 < ROWS; r2++) {
        for (var c2 = 0; c2 < COLS; c2++) {
          var g = newGem(randomTier(), false);
          g.r = r2;
          g.c = c2;
          g.pr = -0.4 - (ROWS - r2) * 0.38;
          g.pc = c2;
          grid[r2][c2] = g;
        }
      }
    }

    /* ---- поиск групп: три и более в ряд по горизонтали или вертикали ---- */

    function findMatches() {
      var groups = [], seen = {}, r, c, i, run, key;

      for (r = 0; r < ROWS; r++) {
        run = [];
        for (c = 0; c <= COLS; c++) {
          var g = c < COLS ? grid[r][c] : null;
          if (g && (run.length === 0 || run[0].tier === g.tier)) {
            run.push(g);
          } else {
            if (run.length >= 3) {
              key = r + ":" + c;
              for (i = 0; i < run.length; i++) {
                var gk = run[i].r + ":" + run[i].c;
                if (!seen[gk]) { seen[gk] = 1; groups.push({ tier: run[i].tier, gems: run.slice() }); }
              }
            }
            run = g ? [g] : [];
          }
        }
      }

      for (c = 0; c < COLS; c++) {
        run = [];
        for (r = 0; r <= ROWS; r++) {
          var g2 = r < ROWS ? grid[r][c] : null;
          if (g2 && (run.length === 0 || run[0].tier === g2.tier)) {
            run.push(g2);
          } else {
            if (run.length >= 3) {
              for (i = 0; i < run.length; i++) {
                var gk2 = run[i].r + ":" + run[i].c;
                if (!seen[gk2]) { seen[gk2] = 1; groups.push({ tier: run[i].tier, gems: run.slice() }); }
              }
            }
            run = g2 ? [g2] : [];
          }
        }
      }

      /* Группа может пересечься с другой: сливаем их в одну, иначе гем
         попадёт в две группы и посчитается дважды. */
      var merged = {}, order = [];
      for (i = 0; i < groups.length; i++) {
        var grp = groups[i];
        var host = null, h, j;
        for (j = 0; j < grp.gems.length; j++) {
          h = merged[grp.gems[j].r + ":" + grp.gems[j].c];
          if (h) { host = h; break; }
        }
        if (host) {
          for (j = 0; j < grp.gems.length; j++) {
            var kk = grp.gems[j].r + ":" + grp.gems[j].c;
            if (host.gems.indexOf(grp.gems[j]) === -1) host.gems.push(grp.gems[j]);
          }
          if (grp.tier > host.tier) host.tier = grp.tier;
        } else {
          merged[grp.gems[0].r + ":" + grp.gems[0].c] = grp;
          order.push(grp);
        }
      }
      return order;
    }

    /* ---- ход: обмен, проверка, откат при неудаче ---- */

    function swap(a, b) {
      var ra = grid[a.r][a.c], rb = grid[b.r][b.c];
      grid[a.r][a.c] = rb; grid[b.r][b.c] = ra;
      if (ra) { ra.r = b.r; ra.c = b.c; }
      if (rb) { rb.r = a.r; rb.c = a.c; }
    }

    function at(c, r) {
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
      return grid[r][c];
    }

    function adjacent(a, b) {
      return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
    }

    function cellAtPoint(x, y) {
      var c = Math.floor((x - ox) / cell);
      var r = Math.floor((y - oy) / cell);
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
      return { c: c, r: r };
    }

    /* Пробуем обмен «в уме»: реальную доску трогать нельзя, поэтому
       запоминаем и возвращаем как было. */
    function trialScore(a, b) {
      swap(a, b);
      var m = findMatches();
      var best = 0, count = 0;
      for (var i = 0; i < m.length; i++) {
        var tier = Math.min(m[i].tier + 1, MAX_TIER);
        /* Квадрат от уровня: поднимать дорогую фигуру выгоднее, чем
           собирать три дешёвых. Поэтому авто-игра тоже играет осмысленно. */
        best = Math.max(best, Math.pow(tier + 1, 2) * 4 * m[i].gems.length);
        count += m[i].gems.length;
      }
      swap(a, b);
      return m.length ? { score: best + count } : { score: 0 };
    }

    function hasMoves() {
      var r, c, d, dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) {
          for (d = 0; d < dirs.length; d++) {
            var n = at(c + dirs[d][0], r + dirs[d][1]);
            if (!n) continue;
            var a = grid[r][c];
            if (!a || !adjacent(a, n)) continue;
            if (trialScore(a, n).score > 0) return true;
          }
        }
      }
      return false;
    }

    function bestMove() {
      var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      var best = null, r, c, d;
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) {
          for (d = 0; d < dirs.length; d++) {
            var n = at(c + dirs[d][0], r + dirs[d][1]);
            if (!n) continue;
            var a = grid[r][c];
            if (!a) continue;
            var t = trialScore(a, n);
            if (t.score > 0 && (!best || t.score > best.t.score)) best = { a: a, b: n, t: t };
          }
        }
      }
      return best;
    }

    function reshuffle() {
      var all = [], r, c;
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) if (grid[r][c]) all.push(grid[r][c]);
      for (var i = all.length - 1; i > 0; i--) {
        var j = randInt(0, i), tmp = all[i]; all[i] = all[j]; all[j] = tmp;
      }
      var k = 0;
      for (r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (c = 0; c < COLS; c++) {
          var g = all[k++] || newGem(randomTier(), false);
          g.r = r; g.c = c; g.scale = 0.3; g.dying = 0; g.pop = 0;
          grid[r][c] = g;
        }
      }
      api.parts.spawn(ox + cell * COLS / 2, oy + cell * ROWS / 2, "#FFC24B", 22, { speed: 150, life: 0.7 });
    }

    /* ---- разрешение цепочки: слияние, падение, добирание ---- */

    function resolve() {
      var gained = 0, steps = 0;

      function step() {
        var groups = findMatches();
        if (!groups.length) {
          if (!hasMoves()) {
            api.tweens.add({
              from: 0, to: 1, dur: 0.28, ease: Ease.outCubic,
              onDone: function () { reshuffle(); }
            });
          }
          if (steps) api.progress(Math.min(1, merges / 6));
          return;
        }

        steps++;
        var i, r, c;
        for (i = 0; i < groups.length; i++) {
          var grp = groups[i];
          /* Якорь — нижняя центральная клетка группы: слияние происходит
             там, куда игрок уже смотрит, а не в случайном месте. */
          var anchor = grp.gems[0];
          for (var j = 0; j < grp.gems.length; j++) {
            var g = grp.gems[j];
            var scoreAnchor = g.r * 2 + Math.abs(g.c - (COLS - 1) / 2);
            var scoreCur = anchor.r * 2 + Math.abs(anchor.c - (COLS - 1) / 2);
            if (scoreAnchor > scoreCur) anchor = g;
          }

          var tier = Math.min(grp.tier + 1, MAX_TIER);
          gained += Math.pow(tier + 1, 2) * 4 * grp.gems.length;

          for (j = 0; j < grp.gems.length; j++) {
            var gg = grp.gems[j];
            if (gg === anchor) continue;
            gg.dying = 0.001;
            grid[gg.r][gg.c] = null;
            api.parts.spawn(
              cellX(gg.c), cellY(gg.pr), TIER_COLOR[gg.tier],
              7, { speed: 120, life: 0.45, size: 2.6 }
            );
          }

          anchor.tier = tier;
          anchor.pop = 1;
          api.parts.spawn(cellX(anchor.c), cellY(anchor.pr), TIER_COLOR[tier], 12, { speed: 150, life: 0.5 });
          flash = 1;
        }

        merges++;
        applyGravity();

        api.tweens.add({
          from: 0, to: 1, dur: 0.2, delay: 0.14, ease: Ease.linear,
          onDone: step
        });
      }

      step();
      if (gained) {
        score += gained;
        api.score(score);
      }
      return gained;
    }

    /* Тяжесть и добирание: всё, что осталось, падает вниз, сверху падает новое. */
    function applyGravity() {
      for (var c = 0; c < COLS; c++) {
        var write = ROWS - 1, r;
        for (r = ROWS - 1; r >= 0; r--) {
          var g = grid[r][c];
          if (!g) continue;
          if (r !== write) {
            grid[r][c] = null;
            grid[write][c] = g;
            g.r = write;
          }
          write--;
        }
        for (r = write; r >= 0; r--) {
          var ng = newGem(randomTier(), true);
          ng.c = c; ng.r = r;
          /* Каскадом: чем выше клетка, тем выше старт — волна, а не залп */
          ng.pr = -(write - r + 1) * 0.9;
          ng.pc = c;
          grid[r][c] = ng;
        }
      }
    }

    function cellX(c) { return ox + c * cell + cell / 2; }
    function cellY(r) { return oy + r * cell + cell / 2; }

    /* ---- ввод ---- */

    function tryMove(a, b) {
      if (!a || !b || !adjacent(a, b)) return false;
      if (a.dying || b.dying) return false;
      swap(a, b);
      if (!findMatches().length) {
        swap(a, b);                       // откат: глазами видно, что фигуры вернулись
        shake = Math.min(shake + 0.5, 1);
        return false;
      }
      score += 10;
      api.score(score);
      resolve();
      return true;
    }

    api.on("down", function (p) {
      sel = cellAtPoint(p.x, p.y);
    });

    api.on("move", function (p) {
      if (!sel) return;
      var far = Math.max(Math.abs(p.dx), Math.abs(p.dy));
      if (far < cell * 0.55) return;
      var dir = Math.abs(p.dx) > Math.abs(p.dy)
        ? [p.dx > 0 ? 1 : -1, 0]
        : [0, p.dy > 0 ? 1 : -1];
      var target = at(sel.c + dir[0], sel.r + dir[1]);
      var from = at(sel.c, sel.r);
      tryMove(from, target);
      sel = null;
    });

    api.on("tap", function (p) {
      /* Тап-ввод для клавиатуры и для тех, кто жмёт вместо свайпа */
      var here = cellAtPoint(p.x, p.y);
      if (!here) return;
      if (!sel) { sel = here; return; }
      if (sel === here) { sel = null; return; }
      tryMove(at(sel.c, sel.r), at(here.c, here.r));
      sel = null;
    });

    function autoStep() {
      var mv = bestMove();
      if (mv) { tryMove(mv.a, mv.b); return; }
      if (!hasMoves()) reshuffle();
    }

    var apiMethods = {};

    apiMethods.resize = function (w, h) {
      var b = box(w, h);
      cell = Math.floor(Math.min(w / COLS, b.h / ROWS));
      ox = Math.round((w - cell * COLS) / 2);
      oy = Math.round(b.top + (b.h - cell * ROWS) / 2);
    };

    apiMethods.reset = function () {
      score = 0; merges = 0; shake = 0; flash = 0;
      sel = null; aiTimer = 0.6; bestTier = 0;
      fill();
      api.score(0);
      api.progress(0);
      api.stat("best", 1);
    };

    apiMethods.update = function (dt) {
      var r, c;
      for (r = 0; r < ROWS; r++) {
        for (c = 0; c < COLS; c++) {
          var g = grid[r][c];
          if (!g) continue;
          /* Позиция догоняет логическую сама: и ход, и падение — один код */
          g.pr = approach(g.pr, g.r, 13, dt);
          g.pc = approach(g.pc, g.c, 13, dt);
          if (g.pop > 0) {
            g.pop = Math.max(0, g.pop - dt * 3.4);
            g.scale = 1 + Math.sin(g.pop * Math.PI) * 0.38;
          } else if (g.scale !== 1) {
            g.scale = approach(g.scale, 1, 12, dt);
          }
          g.bob += dt * 1.7;
          /* Лучшая собранная фигура идёт в HUD: видно, что сетка
             работает даже у того, кто не понял правил слияния */
          if (g.tier > bestTier) { bestTier = g.tier; api.stat("best", bestTier + 1); }
        }
      }

      shake = Math.max(0, shake - dt * 4);
      flash = Math.max(0, flash - dt * 3.2);

      /* Авто-игра: живёт только в режиме ожидания, чтобы страница
         была живой до первого касания и не мешала игроку. */
      if (api.autoplay && !api.finished) {
        idle += dt;
        aiTimer -= dt;
        if (aiTimer <= 0 && idle > 0.35) {
          idle = 0;
          aiTimer = 0.34 + Math.random() * 0.22;
          autoStep();
        }
      } else {
        idle = 0;
      }
    };

    function gemPath(ctx, tier, x, y, r) {
      ctx.beginPath();
      if (tier === 0) {
        ctx.arc(x, y, r, 0, TAU);
      } else if (tier === 1) {
        roundRect(ctx, x - r, y - r, r * 2, r * 2, r * 0.34);
      } else if (tier === 2) {
        ctx.moveTo(x, y - r * 1.08);
        ctx.lineTo(x + r * 1.08, y);
        ctx.lineTo(x, y + r * 1.08);
        ctx.lineTo(x - r * 1.08, y);
        ctx.closePath();
      } else if (tier === 3) {
        for (var i = 0; i < 6; i++) {
          var a = -Math.PI / 2 + i * TAU / 6;
          var px = x + Math.cos(a) * r * 1.06;
          var py = y + Math.sin(a) * r * 1.06;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        for (var s = 0; s < 10; s++) {
          var ang = -Math.PI / 2 + s * TAU / 10;
          var rr = s % 2 ? r * 0.48 : r * 1.16;
          var x2 = x + Math.cos(ang) * rr;
          var y2 = y + Math.sin(ang) * rr;
          if (s === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
        }
        ctx.closePath();
      }
    }

    apiMethods.draw = function (ctx, w, h) {
      if (!cell) return;

      var sh = shake * 4;
      ctx.save();
      if (sh > 0.05 && !reduceMotion) {
        ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
      }

      /* Подложка */
      var pad = Math.round(cell * 0.14);
      ctx.save();
      ctx.shadowColor = "rgba(122,86,56,0.30)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "rgba(255,253,246,0.92)";
      roundRect(ctx, ox - pad, oy - pad, cell * COLS + pad * 2, cell * ROWS + pad * 2, cell * 0.34);
      ctx.fill();
      ctx.restore();

      /* Сетка — едва заметная, чтобы поле читалось как поле */
      ctx.strokeStyle = "rgba(168,124,72,0.14)";
      ctx.lineWidth = 1;
      for (var c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(ox + c * cell, oy + cell * 0.12);
        ctx.lineTo(ox + c * cell, oy + cell * ROWS - cell * 0.12);
        ctx.stroke();
      }
      for (var r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(ox + cell * 0.12, oy + r * cell);
        ctx.lineTo(ox + cell * COLS - cell * 0.12, oy + r * cell);
        ctx.stroke();
      }

      /* Фигуры */
      var rad = cell * 0.38;
      for (var rr = 0; rr < ROWS; rr++) {
        for (var cc = 0; cc < COLS; cc++) {
          var g = grid[rr][cc];
          if (!g) continue;
          var x = cellX(g.pc);
          var y = cellY(g.pr);
          var bobY = reduceMotion ? 0 : Math.sin(g.bob) * cell * 0.018;
          var s = g.scale;
          if (g.dying) continue;

          ctx.save();
          ctx.globalAlpha = s < 1 ? clamp(s, 0, 1) : 1;
          ctx.translate(x, y + bobY);
          ctx.scale(s, s);

          ctx.save();
          ctx.shadowColor = TIER_DARK[g.tier];
          ctx.shadowBlur = rad * 0.7;
          ctx.shadowOffsetY = rad * 0.16;
          gemPath(ctx, g.tier, 0, 0, rad);
          var grad = ctx.createLinearGradient(0, -rad, 0, rad);
          grad.addColorStop(0, TIER_COLOR[g.tier]);
          grad.addColorStop(1, TIER_DARK[g.tier]);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.restore();

          /* Блик сверху слева — дешёвый способ сделать фигуру объёмной */
          ctx.save();
          ctx.globalAlpha = 0.5;
          gemPath(ctx, g.tier, -rad * 0.16, -rad * 0.2, rad * 0.56);
          ctx.fillStyle = "rgba(255,255,255,0.72)";
          ctx.fill();
          ctx.restore();

          ctx.restore();
        }
      }

      /* Выбранная клетка */
      if (sel) {
        ctx.strokeStyle = "#F0A500";
        ctx.lineWidth = Math.max(2, cell * 0.05);
        roundRect(ctx, ox + sel.c * cell + cell * 0.09, oy + sel.r * cell + cell * 0.09,
                  cell * 0.82, cell * 0.82, cell * 0.22);
        ctx.stroke();
      }

      if (flash > 0.01) {
        ctx.fillStyle = "rgba(255,197,49," + (flash * 0.30) + ")";
        roundRect(ctx, ox - pad, oy - pad, cell * COLS + pad * 2, cell * ROWS + pad * 2, cell * 0.34);
        ctx.fill();
      }

      ctx.restore();
    };

    apiMethods.onTakeover = function () { idle = 0; };

    /* Сетка заполняется сразу, чтобы первый кадр не был пустым.
       Нули в HUD отдаёт reset() — он вызывается уже после того,
       как страница подписалась на события. */
    fill();

    return apiMethods;
  }

  /* ==========================================================================
     ИГРА 2. TIMING — поймай момент
     --------------------------------------------------------------------------
     Стрелка крутится, зона попадания сужается с каждым раундом, промах не
     отнимает очки, а просто обнуляет серию: наказание за ошибку убивает
     желание попробовать ещё раз, а это и есть удержание.
     ====================================================================== */

  function Timing(api) {
    var ROUNDS = 5;
    var angle = -Math.PI / 2;
    var speed = 1.5;
    var round = 0;
    var score = 0, combo = 0;
    var goodHalf = 0.34, perfectHalf = 0.13;
    var targetA = 0, targetSpin = 0;
    var flash = 0, flashColor = "#fff", shake = 0, floatT = 0;
    var aiTimer = 1.1;
    var trail = [];
    var lastResult = "";

    var EMERALD = "#2FB56B", GOLD = "#F0A500", RUBY = "#E23B4A";

    function arcDist(a, b) {
      var d = Math.abs(((a - b) % TAU + TAU + Math.PI) % TAU - Math.PI);
      return d;
    }

    function startRound() {
      if (round >= ROUNDS) return;
      var step = round / ROUNDS;
      speed = 1.7 + step * 2.9;
      goodHalf = lerp(0.38, 0.20, step);
      perfectHalf = lerp(0.15, 0.07, step);
      targetA = Math.random() * TAU;
      round++;
      lastResult = "";
      floatT = 0;
      api.stat("round", round);
      if (api.autoplay) aiTimer = 0.5 + Math.random() * 0.6;
    }

    function judge() {
      var d = arcDist(angle, targetA);
      var res, gain;
      if (d <= perfectHalf) {
        res = "perfect"; gain = 100 * (1 + combo * 0.5);
        flashColor = GOLD; combo++;
      } else if (d <= goodHalf) {
        res = "good"; gain = 50;
        flashColor = EMERALD; combo = 0;
      } else {
        res = "miss"; gain = 0;
        flashColor = RUBY; combo = 0; shake = 1;
      }
      flash = 1; floatT = 1;
      if (gain) score += Math.round(gain);
      api.score(score);
      lastResult = res;
      api.progress(round / ROUNDS);
      if (round >= ROUNDS) {
        api.tweens.add({
          from: 0, to: 1, dur: 0.5, delay: 0.45,
          onDone: function () { api.finish(); }
        });
      } else {
        startRound();
      }
    }

    api.on("tap", function () { if (round > 0 && !api.finished) judge(); });
    api.on("key", function (k) { if (k === "Enter" || k === " ") judge(); });

    function autoTap() {
      /* Играем в идеальное окно: ждём, пока стрелка вот-вот зайдёт в него */
      var d = arcDist(angle, targetA);
      var incoming = ((targetA - angle) % TAU + TAU) % TAU < (goodHalf * 2);
      if (incoming && d < goodHalf * 0.7) judge();
    }

    var m = {};

    var savedW = 320, savedH = 420;

    /* Кольцо считаем от свободной области, а не от всего холста:
       иначе верхний счёт и нижняя подсказка наезжают на зону попадания. */
    m.resize = function (w, h) {
      savedW = w;
      savedH = h;
    };

    function center() {
      var b = box(savedW, savedH);
      return { cx: savedW / 2, cy: b.top + b.h / 2 };
    }

    /* Стартовое состояние. Вызывается и при старте страницы, и по кнопке
       «ещё раз» — поэтому обязан быть полным, без наследия от прошлого. */
    m.reset = function () {
      angle = -Math.PI / 2;
      round = 0;
      score = 0; combo = 0;
      flash = 0; shake = 0; floatT = 0;
      trail = [];
      lastResult = "";
      api.score(0);
      api.progress(0);
      startRound();          // round становится 1, зона и скорость ставятся
    };

    m.update = function (dt) {
      if (api.finished) return;
      angle = (angle + speed * dt) % TAU;

      trail.push(angle);
      if (trail.length > 26) trail.shift();

      flash = Math.max(0, flash - dt * 2.6);
      shake = Math.max(0, shake - dt * 3.4);
      floatT = Math.max(0, floatT - dt * 1.4);

      if (api.autoplay) {
        aiTimer -= dt;
        if (aiTimer <= 0) {
          aiTimer = 0.18;
          autoTap();
        }
      }
    };

    m.draw = function (ctx, w, h) {
      var c = center();
      var cx = c.cx, cy = c.cy;
      var R = Math.min(w, h - INSET_TOP - INSET_BOTTOM) * 0.42;
      ctx.save();
      if (shake > 0.05 && !reduceMotion) ctx.translate((Math.random() - 0.5) * shake * 6, 0);

      /* Дорожка */
      ctx.lineCap = "round";
      ctx.lineWidth = R * 0.16;
      ctx.strokeStyle = "rgba(168,124,72,0.16)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();

      /* Зона «хорошо» */
      ctx.lineWidth = R * 0.16;
      ctx.strokeStyle = EMERALD;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(cx, cy, R, targetA - goodHalf, targetA + goodHalf);
      ctx.stroke();

      /* Зона «идеально» — золотая, узкая, в центре зелёной */
      ctx.globalAlpha = 1;
      ctx.lineWidth = R * 0.22;
      ctx.strokeStyle = GOLD;
      ctx.beginPath();
      ctx.arc(cx, cy, R, targetA - perfectHalf, targetA + perfectHalf);
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* Деления по кругу: глазу есть за что цепляться, скорость читается */
      ctx.strokeStyle = "rgba(122,86,56,0.34)";
      ctx.lineWidth = Math.max(1.5, R * 0.02);
      for (var i = 0; i < 24; i++) {
        var a = i * TAU / 24;
        var long = i % 6 === 0;
        var r1 = R * (long ? 0.86 : 0.9), r2 = R * 0.97;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }

      /* След стрелки */
      ctx.lineWidth = R * 0.05;
      ctx.strokeStyle = "rgba(168,124,72,0.42)";
      ctx.beginPath();
      for (var t = 0; t < trail.length; t++) {
        var x = cx + Math.cos(trail[t]) * R;
        var y = cy + Math.sin(trail[t]) * R;
        if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      /* Стрелка — тёмная, на светлой сцене белая была бы не видна */
      var tipX = cx + Math.cos(angle) * R * 1.02;
      var tipY = cy + Math.sin(angle) * R * 1.02;
      ctx.strokeStyle = flash > 0.05 ? flashColor : "#4A2B18";
      ctx.lineWidth = Math.max(3, R * 0.045);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();

      ctx.fillStyle = flash > 0.05 ? flashColor : "#4A2B18";
      ctx.beginPath();
      ctx.arc(tipX, tipY, R * 0.055, 0, TAU);
      ctx.fill();

      /* Центр */
      ctx.fillStyle = "#FFFDF6";
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.46, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(168,124,72,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      /* Итог последнего нажатия — точка в центре, не текст поверх игры */
      if (floatT > 0) {
        var k = 1 - floatT;
        ctx.globalAlpha = clamp(floatT, 0, 1);
        ctx.beginPath();
        ctx.arc(cx, cy, R * (0.2 + k * 0.4), 0, TAU);
        ctx.fillStyle = lastResult === "miss" ? "rgba(226,59,74,0.26)"
                      : lastResult === "good" ? "rgba(47,181,107,0.24)"
                      : "rgba(240,165,0,0.3)";
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    };

    /* Стартовое состояние выставит reset() из createStage — когда страница
       уже подписалась на счёт и прогресс. */
    return m;
  }

  /* ==========================================================================
     ИГРА 3. ORDER — разрушь стену
     --------------------------------------------------------------------------
     Двенадцать кирпичей с номерами. Порядок считывается с самих кирпичей:
     ни подсказок, ни туториала. Ошибка не сбрасывает прогресс — стена просто
     вздрагивает. Наказание за ошибку здесь означало бы «начни заново».
     ====================================================================== */

  function Order(api) {
    var COLS = 3, ROWS = 4, TOTAL = COLS * ROWS;
    var blocks = [];
    var next = 1;
    var cell = 0, ox = 0, oy = 0, brickH = 0;
    var shakeBlock = null, shakeT = 0;
    var cheer = 0;

    /* Тот же набор камней, что и в merge: язык одного экрана переносится
       на второй, и считывается он быстрее. */
    var PALETTE = ["#FFC531", "#FF9A3C", "#E23B4A", "#9B51E0", "#2F80ED", "#2FB56B"];

    function layout() {
      var order = [];
      for (var i = 0; i < TOTAL; i++) order.push(i + 1);
      for (var j = order.length - 1; j > 0; j--) {
        var k = randInt(0, j), t = order[j]; order[j] = order[k]; order[k] = t;
      }
      /* Первый кирпич всегда сверху слева: страница обязана начинаться
         с примера, который читается без догадок. */
      order[0] = 1;

      blocks = [];
      for (var n = 0; n < TOTAL; n++) {
        var row = Math.floor(n / COLS), col = n % COLS;
        blocks.push({
          num: order[n],
          row: row,
          col: col,
          x: 0, y: 0,
          scale: 1,
          dead: false,
          flash: 0,
          pop: 0
        });
      }
      sortBlocks();
    }

    function sortBlocks() {
      /* Рисуем снизу вверх, чтобы число 1 всегда было на виду */
      blocks.sort(function (a, b) { return b.row - a.row || a.col - b.col; });
    }

    function find(n) {
      for (var i = 0; i < blocks.length; i++) if (blocks[i].num === n && !blocks[i].dead) return blocks[i];
      return null;
    }

    function hit(b) {
      if (!b || b.dead || api.finished) return;
      b.dead = true;
      b.pop = 1;
      next++;
      api.parts.spawn(b.x, b.y, PALETTE[(b.num - 1) % PALETTE.length], 10, { speed: 130, life: 0.5 });
      api.stat("step", next - 1);
      api.progress(Math.min(1, (next - 1) / TOTAL));
      if (next > TOTAL) {
        cheer = 1;
        api.parts.spawn(api.w / 2, api.h / 2, "#FFC24B", 40, { speed: 240, life: 1, gravity: 200 });
        api.tweens.add({ from: 0, to: 1, dur: 0.7, delay: 0.35, onDone: function () { api.finish(); } });
      }
    }

    api.on("tap", function (p) {
      if (api.finished) return;
      var best = null, bestD = 1e9;
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.dead) continue;
        var d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < cell * 0.62 && d < bestD) { bestD = d; best = b; }
      }
      if (!best) return;
      if (best.num === next) hit(best);
      else {
        shakeBlock = best; shakeT = 1;
        api.parts.spawn(best.x, best.y, "#E23B4A", 5, { speed: 70, life: 0.3 });
      }
    });
    api.on("key", function (k) { if (k === "Enter" || k === " ") api.emit("tap", { x: api.w / 2, y: api.h / 2 }); });

    var aiTimer = 0.7;

    function autoStep() {
      var b = find(next);
      if (b) hit(b);
    }

    var m = {};

    m.resize = function (w, h) {
      var b = box(w, h);
      cell = Math.floor(Math.min(w / (COLS + 0.5), b.h / (ROWS + 0.6)));
      brickH = cell * 0.78;
      ox = Math.round((w - cell * COLS) / 2);
      oy = Math.round(b.top + (b.h - cell * ROWS) / 2);
      var i;
      for (i = 0; i < blocks.length; i++) place(blocks[i]);
    };

    function place(b) {
      b.x = ox + b.col * cell + cell / 2 + (b.row % 2 ? cell * 0.14 : 0);
      b.y = oy + b.row * cell + brickH / 2 + cell * 0.12;
    }

    m.reset = function () {
      next = 1; cheer = 0; aiTimer = 0.7;
      shakeBlock = null; shakeT = 0;
      layout();
      m.resize(api.w || 320, api.h || 420);
      api.stat("step", 0);
      api.progress(0);
    };

    m.update = function (dt) {
      var i;
      for (i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        if (b.pop > 0) {
          b.pop = Math.max(0, b.pop - dt * 3.6);
          b.scale = 1 + Math.sin(b.pop * Math.PI) * 0.45;
        } else if (b.scale !== 1) {
          b.scale = approach(b.scale, 1, 12, dt);
        }
        if (b.flash > 0) b.flash = Math.max(0, b.flash - dt * 3);
      }
      if (shakeT > 0) shakeT = Math.max(0, shakeT - dt * 4);
      cheer = Math.max(0, cheer - dt * 0.8);

      if (api.autoplay && !api.finished) {
        aiTimer -= dt;
        if (aiTimer <= 0) { aiTimer = 0.34; autoStep(); }
      }
    };

    m.draw = function (ctx, w, h) {
      if (!cell) return;
      var i;

      /* Проём за стеной — глубина без единого ассета */
      ctx.save();
      ctx.fillStyle = "rgba(232,205,160,0.55)";
      roundRect(ctx, ox - cell * 0.16, oy - cell * 0.1,
                cell * COLS + cell * 0.32, cell * ROWS + cell * 0.24, cell * 0.26);
      ctx.fill();
      ctx.restore();

      for (i = blocks.length - 1; i >= 0; i--) {
        var b = blocks[i];
        if (b.dead) continue;

        var k = b.scale;
        var sx = 0;
        if (shakeBlock === b && shakeT > 0) sx = Math.sin(shakeT * 34) * shakeT * cell * 0.07;

        var bw = cell * 0.9, bh = brickH;
        var x = b.x - bw / 2 + sx, y = b.y - bh / 2;
        var color = PALETTE[(b.num - 1) % PALETTE.length];

        ctx.save();
        ctx.globalAlpha = clamp(k, 0, 1);

        ctx.save();
        ctx.shadowColor = "rgba(122,86,56,0.40)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = color;
        roundRect(ctx, x, y, bw, bh, bh * 0.22);
        ctx.fill();
        ctx.restore();

        /* Верхняя грань светлее — кирпич выглядит объёмным */
        ctx.globalAlpha = clamp(k, 0, 1) * 0.38;
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, x, y, bw, bh * 0.34, bh * 0.22);
        ctx.fill();

        /* Раствор */
        ctx.globalAlpha = clamp(k, 0, 1) * 0.55;
        ctx.strokeStyle = "rgba(122,86,56,0.38)";
        ctx.lineWidth = Math.max(1.5, cell * 0.022);
        roundRect(ctx, x, y, bw, bh, bh * 0.22);
        ctx.stroke();

        /* Номер — часть правила, а не подпись, поэтому он в самой игре */
        ctx.globalAlpha = clamp(k, 0, 1);
        ctx.fillStyle = "rgba(255,255,255,0.96)";
        ctx.font = "800 " + Math.round(bh * 0.52) + "px system-ui, -apple-system, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(b.num), b.x + sx, b.y + bh * 0.03);

        /* Подсказка «сейчас твой» — только на следующем кирпиче,
           иначе игрок гадает вместо того, чтобы пробовать */
        if (b.num === next && !api.finished) {
          var pulse = 0.5 + 0.5 * Math.sin(api.time() * 4);
          ctx.globalAlpha = 0.35 + pulse * 0.55;
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = Math.max(3, cell * 0.045);
          roundRect(ctx, x - cell * 0.04, y - cell * 0.04, bw + cell * 0.08, bh + cell * 0.08, bh * 0.28);
          ctx.stroke();
        }

        ctx.restore();
      }

      if (cheer > 0) {
        ctx.globalAlpha = cheer * 0.16;
        ctx.fillStyle = "#FFC531";
        roundRect(ctx, ox - cell * 0.16, oy - cell * 0.1,
                  cell * COLS + cell * 0.32, cell * ROWS + cell * 0.24, cell * 0.26);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    return m;
  }

  /* ==========================================================================
     РЕЕСТР
     ====================================================================== */

  var REGISTRY = {
    merge: { factory: Merge, name: "merge" },
    timing: { factory: Timing, name: "timing" },
    order: { factory: Order, name: "order" }
  };

  function createStage(canvas, kind, handlers) {
    if (!REGISTRY[kind]) throw new Error("Нет такой механики: " + kind);
    var stage = new Stage(canvas, REGISTRY[kind].factory);
    if (handlers) {
      if (handlers.score) stage.onScore(handlers.score);
      if (handlers.progress) stage.onProgress(handlers.progress);
      if (handlers.stat) stage.onStat(handlers.stat);
      if (handlers.finish) stage.onFinish(handlers.finish);
      if (handlers.takeover) stage.onTakeover(handlers.takeover);
    }
    /* Стартовые числа уходят только теперь: до подписки они были бы
       отброшены, и HUD остался бы с нулями из разметки. */
    if (stage.game && stage.game.reset) stage.game.reset();
    stage.play();
    return stage;
  }

  global.GAMES = {
    Stage: Stage,
    create: createStage,
    kinds: Object.keys(REGISTRY),
    palette: {
      mint: "#5FE3C0", blue: "#63B4FF", violet: "#B98CFF",
      amber: "#FFC24B", coral: "#FF6F8B"
    },
    clamp: clamp, lerp: lerp, Ease: Ease
  };

})(window);
