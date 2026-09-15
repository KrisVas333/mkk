/* MKK v0.2.0 — Mokymosi Meistrų Klubas. Plain JS, no framework, no build.
   Design system: DESIGN.md (Endel logic · per-topic tone · low stimulation). */
(function () {
  'use strict';

  var VERSION = 'v0.2.0';
  var C = null;            // content
  var KEY = 'mkk.v2';
  var OLDKEY = 'mkk.v1';
  var S = {};              // state
  var P = null;            // active profile (reference into S.profiles)

  var ACCENTS = [
    { id: 'raudona', name: 'Raudona', v: '#D90429' },
    { id: 'melyna', name: 'Mėlyna', v: '#0057B8' },
    { id: 'zalia', name: 'Žalia', v: '#0B7A45' },
    { id: 'violetine', name: 'Violetinė', v: '#6B21A8' },
    { id: 'oranzine', name: 'Oranžinė', v: '#B84A00' },
    { id: 'kontrastas', name: 'Didelis kontrastas', v: '#000000', hc: true }
  ];
  var AMBIENTS = [
    { id: 'off', name: 'Išjungta' },
    { id: 'pink', name: 'Rausvas triukšmas' },
    { id: 'rain', name: 'Lietaus tipo' },
    { id: 'pulse', name: 'Lėtas pulsas' }
  ];

  /* ---------- per-topic design path: tone fallback (illustrations.json wins) ---------- */
  var TONE = {
    hero: '#5B6B8C',
    'brain-learns': '#5B6B8C',
    top3: '#7A6A9E',
    memory: '#2F7A66',
    attention: '#A06A34',
    focus: '#8C4F55',
    concentration: '#66754A',
    myths: '#6E6E6E',
    sleep: '#4A5585',
    movement: '#3E7F8C',
    reading: '#8A6440',
    'phone-grayscale': '#6E6E6E',
    'game-recall': '#2F7A66',
    'game-timer': '#8C4F55',
    'game-teach': '#7A6A9E',
    'age-4-5': '#7A6A9E',
    'age-6-7': '#3E7F8C',
    'age-8-9': '#2F7A66',
    'age-10-11': '#66754A',
    'age-12': '#A06A34',
    'age-13': '#8C4F55',
    'age-14': '#5B6B8C'
  };
  /* techniques.json category id -> illustration slug */
  var CAT_SLUG = {
    smegenys: 'brain-learns', top3: 'top3', atmintis: 'memory',
    demesys: 'attention', fokusas: 'focus', koncentracija: 'concentration', mitai: 'myths'
  };
  var GAME_SLUG = { atsimink: 'game-recall', laikmatis: 'game-timer', ismokyk: 'game-teach' };
  var LIB_SLUG = {
    knygos: 'reading', dokumentika: 'attention', podkastai: 'brain-learns',
    tyrimai: 'brain-learns', bureliai: 'movement', irankiai: 'phone-grayscale'
  };
  /* the 6 daily "modes" — everything else is a sub-screen */
  var MODES = ['smegenys', 'top3', 'atmintis', 'demesys', 'fokusas', 'koncentracija'];

  /* Illustration tones are pastel — lovely inside artwork, invisible as a 3px UI rule on
     white and unreadable as a dot. toneUI() keeps the HUE (so each topic stays distinct)
     and clamps lightness/saturation into a band that reads in BOTH themes.
     A tone too close to the action red is rejected outright: #D90429 belongs to buttons. */
  function hex2rgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function clampTone(hex) {
    var c = hex2rgb(hex);
    if (!c) return null;
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, hh = 0, d = mx - mn;
    if (d) {
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) hh = ((g - b) / d + (g < b ? 6 : 0));
      else if (mx === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
      hh /= 6;
    }
    /* reject anything sitting on the action red (hue ~350–360/0–8° with real saturation) */
    var deg = hh * 360;
    if (s > .5 && (deg > 344 || deg < 10) && l < .6) return null;
    /* a true grey has no hue — forcing saturation onto it would invent a red */
    s = s < .06 ? 0 : Math.min(.55, Math.max(.18, s));
    l = Math.min(.50, Math.max(.34, l));
    function h2(pp, qq, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return pp + (qq - pp) * 6 * t;
      if (t < 1 / 2) return qq;
      if (t < 2 / 3) return pp + (qq - pp) * (2 / 3 - t) * 6;
      return pp;
    }
    var q = l < .5 ? l * (1 + s) : l + s - l * s, pq = 2 * l - q;
    var out = [h2(pq, q, hh + 1 / 3), h2(pq, q, hh), h2(pq, q, hh - 1 / 3)].map(function (v) {
      var n = Math.round(v * 255).toString(16);
      return n.length < 2 ? '0' + n : n;
    });
    return '#' + out.join('');
  }
  var _toneCache = {};
  function tone(slug) {
    if (_toneCache[slug]) return _toneCache[slug];
    var I = C && C.illustrations && C.illustrations[slug];
    var t = (I && I.tone) ? clampTone(I.tone) : null;
    if (!t) t = TONE[slug] || TONE.hero;
    _toneCache[slug] = t;
    return t;
  }

  /* ---------- state ---------- */
  function uid() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function newProfile(band, name, parent) {
    return {
      id: uid(), name: (name || '').slice(0, 24), band: band || null,
      parent: parent === true, streak: 0, lastDone: '', days: {}, games: {}
    };
  }
  function loadState() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    if (!d) d = migrate();
    S = {
      profiles: (d && d.profiles && d.profiles.length) ? d.profiles : [],
      active: d ? d.active || '' : '',
      onboarded: d ? d.onboarded === true : false,
      remind: d ? d.remind || '' : '',
      theme: (d && d.theme) || 'light',
      accent: (d && d.accent) || 'raudona',
      ambient: (d && d.ambient) || 'off',
      plus: d ? d.plus === true : false,
      code: (d && d.code) || '',
      iosHint: d ? d.iosHint === true : false
    };
    S.profiles.forEach(function (p) {
      if (!p.days) p.days = {};
      if (!p.games) p.games = {};
      if (typeof p.streak !== 'number') p.streak = 0;
    });
    pickActive();
  }
  /* v0.1.x stored one anonymous child at mkk.v1 — carry the streak over, never drop it */
  function migrate() {
    var o = null;
    try { o = JSON.parse(localStorage.getItem(OLDKEY)); } catch (e) { return null; }
    if (!o || !o.band) return null;
    var p = newProfile(o.band, '', o.parent === true);
    p.streak = o.streak || 0; p.lastDone = o.lastDone || '';
    p.days = o.days || {}; p.games = o.games || {};
    return {
      profiles: [p], active: p.id, onboarded: true, remind: '',
      theme: o.theme || 'light', accent: o.accent || 'raudona',
      ambient: o.ambient || 'off', plus: o.plus === true, code: o.code || ''
    };
  }
  function pickActive() {
    P = null;
    var i;
    for (i = 0; i < S.profiles.length; i++) if (S.profiles[i].id === S.active) P = S.profiles[i];
    if (!P && S.profiles.length) { P = S.profiles[0]; S.active = P.id; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function dayKey(dt) {
    dt = dt || new Date();
    var m = dt.getMonth() + 1, d = dt.getDate();
    return dt.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
  }
  function today() { return dayKey(); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }
  function dayState() {
    var k = today();
    if (!P.days[k]) P.days[k] = { p: 0, x: 0, c: 0, r: 0 };
    if (P.days[k].r === undefined) P.days[k].r = 0;
    return P.days[k];
  }
  /* reading minute is step 4 and deliberately OPTIONAL — it never gates the streak */
  function dayDone() { var d = dayState(); return !!(d.p && d.x && d.c); }
  function checkStreak() {
    if (!dayDone()) return false;
    if (P.lastDone === today()) return false;
    P.streak = (P.lastDone === yesterday()) ? P.streak + 1 : 1;
    P.lastDone = today();
    save();
    return true;
  }
  function totalSessions() {
    var n = 0, k;
    for (k in P.days) if (P.days[k] && P.days[k].p && P.days[k].x && P.days[k].c) n++;
    return n;
  }
  function totalReading() {
    var n = 0, k;
    for (k in P.days) if (P.days[k] && P.days[k].r) n++;
    return n;
  }

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function seed(str) { var h = 0, i; for (i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; } return h; }
  function shuffle(a, rnd) {
    var arr = a.slice(), i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor((rnd ? rnd() : Math.random()) * (i + 1));
      t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function bandObj() {
    var i, b = C.config.bands;
    if (!P || !P.band) return b[0];
    for (i = 0; i < b.length; i++) if (b[i].id === P.band) return b[i];
    return b[0];
  }
  function bandMinAge() { return parseInt(String(P && P.band).split('-')[0], 10) || 8; }
  function isYoung() { return bandMinAge() <= 7; }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  function evBadge(ev) {
    var e = ev === '✗' ? 'X' : (ev || 'C');
    var lbl = e === 'X' ? '✗' : e;
    return '<button class="ev" data-ev="' + esc(e) + '" data-act="method" type="button" aria-label="Įrodymų lygis ' + esc(lbl) + ' — kaip vertinam">' + esc(lbl) + '</button>';
  }
  /* every evidence-badged card must show where the claim comes from (critic 🟠4) */
  function srcLine(src) {
    if (src && String(src).trim()) return '<p class="src"><b>Šaltinis</b> · ' + esc(src) + '</p>';
    return '<p class="src"><b>Šaltinis</b> · ⚠️ tikslinamas — kol kas ženklelis C</p>';
  }
  function evOf(o) { return (o && o.src && String(o.src).trim()) ? (o.ev || 'C') : 'C'; }

  var LTDAYS = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];
  var LTMON = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio',
    'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
  function niceDate(dt) { return dt.getDate() + ' ' + LTMON[dt.getMonth()]; }
  function mondayOf(dt) {
    var d = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    var w = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - w);
    return d;
  }

  /* ---------- illustrations ---------- */
  function svgPlaceholder(t, cls) {
    var r = seed(String(t)), pts = [], i, x, y;
    for (i = 0; i < 7; i++) {
      r = (r * 1103515245 + 12345) >>> 0; x = 30 + (r % 240);
      r = (r * 1103515245 + 12345) >>> 0; y = 28 + (r % 144);
      pts.push([x, y]);
    }
    var lines = '', j, d;
    for (i = 0; i < pts.length; i++) {
      for (j = i + 1; j < pts.length; j++) {
        d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d < 95) lines += '<line x1="' + pts[i][0] + '" y1="' + pts[i][1] + '" x2="' + pts[j][0] + '" y2="' + pts[j][1] + '" stroke="' + t + '" stroke-opacity=".3" stroke-width="1"/>';
      }
    }
    var dots = pts.map(function (p, k) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (k === 0 ? 5 : 3) + '" fill="' + t + '" fill-opacity="' + (k === 0 ? '.85' : '.5') + '"/>';
    }).join('');
    return '<svg class="' + esc(cls || 'ill') + '" viewBox="0 0 300 200" role="img" aria-label="Ramus tos temos ženklas" preserveAspectRatio="xMidYMid slice">' +
      '<rect width="300" height="200" rx="4" fill="' + t + '" fill-opacity=".09"/>' + lines + dots + '</svg>';
  }
  function ill(slug, cls) {
    var t = tone(slug);
    var I = C && C.illustrations && C.illustrations[slug];
    var k = cls || 'ill';
    if (I && I.file) {
      return '<div class="illwrap"><img class="' + esc(k) + '" src="' + esc(I.file) + '" alt="' + esc(I.alt || '') +
        '" width="1200" height="800" loading="lazy" decoding="async" data-tone="' + esc(t) + '" data-cls="' + esc(k) + '"></div>';
    }
    return '<div class="illwrap">' + svgPlaceholder(t, k) + '</div>';
  }
  /* a missing/broken file must never show a broken image icon */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && /(^|\s)ill/.test(t.className) && !t._fb) {
      t._fb = 1;
      var w = t.parentNode;
      if (w) w.innerHTML = svgPlaceholder(t.getAttribute('data-tone') || TONE.hero, t.getAttribute('data-cls') || 'ill');
    }
  }, true);

  function scr(slug, html) {
    return '<div class="scr" style="--tone:' + tone(slug) + '">' + html + '</div>';
  }

  /* ---------- theme ---------- */
  function applyTheme() {
    var root = document.documentElement;
    if (S.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', S.theme);
    var a = ACCENTS[0], i;
    for (i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === S.accent) a = ACCENTS[i];
    root.style.setProperty('--accent', a.v);
    if (a.hc) root.setAttribute('data-contrast', '1'); else root.removeAttribute('data-contrast');
  }

  /* ---------- ambient sound (Web Audio, generated) ---------- */
  var AU = { ctx: null, src: null, gain: null, lfo: null };
  function noiseBuffer(ctx) {
    var len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, i, w;
    for (i = 0; i < len; i++) {
      w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }
  function ambientStop() {
    try { if (AU.src) AU.src.stop(); } catch (e) {}
    try { if (AU.lfo) AU.lfo.stop(); } catch (e) {}
    AU.src = null; AU.lfo = null;
  }
  function ambientStart(kind) {
    ambientStop();
    if (kind === 'off') return;
    try {
      if (!AU.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        AU.ctx = new AC();
      }
      if (AU.ctx.state === 'suspended') AU.ctx.resume();
      var ctx = AU.ctx;
      var src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx); src.loop = true;
      var f = ctx.createBiquadFilter();
      var g = ctx.createGain();
      if (kind === 'rain') { f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6; g.gain.value = 0.5; }
      else if (kind === 'pulse') { f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.22; }
      else { f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = 0.3; }
      src.connect(f); f.connect(g); g.connect(ctx.destination);
      if (kind === 'pulse') {
        var lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 0.12; lg.gain.value = 0.16;
        lfo.connect(lg); lg.connect(g.gain); lfo.start();
        AU.lfo = lfo;
      }
      src.start();
      AU.src = src; AU.gain = g;
    } catch (e) { /* audio is optional */ }
  }
  function beep() {
    try {
      if (!AU.ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; AU.ctx = new AC(); }
      var ctx = AU.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 528; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  }

  /* ---------- neuron canvas (low stimulation: 18 nodes, ~30fps, static if reduced) ---------- */
  function neurons() {
    var cv = $('#net'); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), N = [], i, W, H;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function size() {
      W = cv.width = Math.round(cv.clientWidth * dpr);
      H = cv.height = Math.round(cv.clientHeight * dpr);
    }
    size();
    for (i = 0; i < 18; i++) N.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22 });
    function col() {
      var c = getComputedStyle(document.documentElement).getPropertyValue('--net').trim();
      return c || '10,10,10';
    }
    var last = 0, cache = col(), cacheAt = 0;
    function frame(ts) {
      if (!reduce) {
        if (ts - last < 33) { requestAnimationFrame(frame); return; }  /* ~30fps */
        last = ts;
      }
      if (ts - cacheAt > 1000) { cache = col(); cacheAt = ts; }
      var a, b, d, j;
      ctx.clearRect(0, 0, W, H);
      for (i = 0; i < N.length; i++) {
        a = N[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; }
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        ctx.fillStyle = 'rgba(' + cache + ',1)';
        ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, 6.3); ctx.fill();
      }
      for (i = 0; i < N.length; i++) {
        for (j = i + 1; j < N.length; j++) {
          a = N[i]; b = N[j];
          d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < W / 4) {
            ctx.strokeStyle = 'rgba(' + cache + ',' + (1 - d / (W / 4)) * 0.5 + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); if (reduce) requestAnimationFrame(frame); }, 150);
    });
  }

  /* ---------- sheet ---------- */
  function sheet(title, html, slug) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheet').style.setProperty('--tone', tone(slug || 'hero'));
    $('#sheet').hidden = false; $('#scrim').hidden = false;
    $('#sheet').scrollTop = 0;
  }
  function closeSheet() { $('#sheet').hidden = true; $('#scrim').hidden = true; stopReading(); }

  function methodSheet() {
    var m = C.config.method, e = C.config.evidence, h = '', k;
    for (k = 0; k < m.intro.length; k++) h += '<p class="sm">' + esc(m.intro[k]) + '</p>';
    h += '<div class="spacer"></div>';
    ['A', 'B', 'C', 'X'].forEach(function (id) {
      h += '<div class="item"><h3><span>' + evBadge(id) + ' ' + esc(e[id].name) + '</span></h3>' +
        '<p class="sm muted" style="margin:0">' + esc(e[id].desc) + '</p></div>';
    });
    h += '<p class="lbl" style="margin-top:24px">Taisyklės</p><ul class="plain">';
    m.rules.forEach(function (r) { h += '<li>' + esc(r) + '</li>'; });
    h += '</ul><p class="lbl" style="margin-top:24px">Šaltiniai</p><ul class="plain">';
    m.sources.forEach(function (r) { h += '<li class="xs">' + esc(r) + '</li>'; });
    h += '</ul><p class="note">' + esc(m.note) + '</p>';
    sheet(m.title, h, 'brain-learns');
  }

  /* ---------- podcast + daily picks ---------- */
  function podcastFor(band) {
    var p = C.podcasts, i;
    if (!p || !p.length) return null;
    for (i = 0; i < p.length; i++) if (p[i].band === band) return p[i];
    return null;
  }
  function practiceToday() {
    var list = C.practices.practices.filter(function (p) { return p.minAge <= bandMinAge() + 2; });
    if (!list.length) list = C.practices.practices;
    return list[seed(today() + P.band) % list.length];
  }
  function checkToday() {
    var list = C.practices.checks.filter(function (p) { return p.minAge <= bandMinAge() + 2; });
    if (!list.length) list = C.practices.checks;
    return list[seed('c' + today() + P.band) % list.length];
  }
  /* today's "mode" — the one thing the home screen is about */
  function modeToday() {
    var id = MODES[seed('m' + today()) % MODES.length], i;
    for (i = 0; i < C.techniques.categories.length; i++) {
      if (C.techniques.categories[i].id === id) return C.techniques.categories[i];
    }
    return C.techniques.categories[0];
  }
  function bookOfWeek() {
    var b = C.library.knygos;
    var mon = mondayOf(new Date());
    return b[seed('b' + dayKey(mon)) % b.length];
  }

  /* ---------- onboarding (3 screens) ---------- */
  var OB = { step: 1, band: null, name: '', time: '' };
  function scrOnboard() {
    var o = C.config.onboarding, h = '';
    var slug = OB.band ? ('age-' + OB.band) : 'hero';
    h += '<div class="dots" aria-hidden="true">' +
      [1, 2, 3].map(function (n) { return '<i class="' + (n === OB.step ? 'on' : '') + '"></i>'; }).join('') + '</div>';

    if (OB.step === 1) {
      h += ill('hero', 'ill');
      h += '<span class="lbl">' + esc(C.config.name) + ' · ' + esc(C.config.nameNote) + '</span>';
      h += '<p class="big">' + esc(o.s1title) + '</p>';
      h += '<p class="muted sm">' + esc(o.s1sub) + '</p><div class="spacer"></div>';
      h += '<div class="ob">';
      C.config.bands.forEach(function (b) {
        h += '<button class="catrow" style="--tone:' + tone('age-' + b.id) + '" data-act="ob-band" data-band="' + esc(b.id) + '" type="button" aria-pressed="' + (OB.band === b.id) + '">' +
          '<span class="ic">' + illMini('age-' + b.id) + '</span>' +
          '<span class="tx"><b>' + esc(b.label) + '</b><span>' + esc(b.note) + '</span></span>' +
          '<span class="ar">' + (OB.band === b.id ? '✓' : '→') + '</span></button>';
      });
      h += '</div>';
      h += '<p class="lbl" style="margin-top:22px">' + esc(o.s1name) + '</p>' +
        '<input type="text" id="obName" value="' + esc(OB.name) + '" placeholder="pvz. Emilija" autocomplete="off" maxlength="24">' +
        '<p class="xs muted" style="margin-top:8px">' + esc(o.s1namehelp) + '</p>';
      h += '<div class="spacer"></div><button class="btn" data-act="ob-next" type="button"' + (OB.band ? '' : ' disabled') + '>Toliau</button>';
      h += '<p class="foot">' + esc(C.config.disclaimerShort) + '</p>';
      return scr(slug, h);
    }

    if (OB.step === 2) {
      h += ill('sleep', 'ill');
      h += '<span class="lbl">2 iš 3</span><p class="big">' + esc(o.s2title) + '</p>';
      h += '<p class="muted sm">' + esc(o.s2sub) + '</p><div class="spacer"></div>';
      h += '<div class="chips">';
      C.config.times.forEach(function (t) {
        h += '<button class="chip" data-act="ob-time" data-time="' + esc(t) + '" aria-pressed="' + (OB.time === t) + '" type="button">' + esc(t) + '</button>';
      });
      h += '</div>';
      h += '<p class="note warn">' + esc(o.s2note) + '</p>';
      h += '<div class="spacer"></div><button class="btn" data-act="ob-next" type="button">Toliau</button>' +
        '<button class="btn ghost" data-act="ob-skip" type="button">' + esc(o.s2skip) + '</button>';
      return scr('sleep', h);
    }

    var b = null, i;
    for (i = 0; i < C.config.bands.length; i++) if (C.config.bands[i].id === OB.band) b = C.config.bands[i];
    h += ill('age-' + OB.band, 'ill');
    h += '<span class="lbl">3 iš 3</span><p class="big">' + esc(o.s3title) + '</p>';
    h += '<p class="muted sm">' + esc(o.s3sub) + '</p>';
    h += '<div class="card flat"><p class="lbl" style="margin:0 0 10px">Ką pasirinkai</p>' +
      '<p class="sm" style="margin:0 0 6px"><b>' + esc(OB.name || 'Be vardo') + '</b> · ' + esc(b ? b.label : '') + '</p>' +
      '<p class="sm muted" style="margin:0">Priminimas: ' + esc(OB.time || 'be priminimo') + '</p></div>';
    h += '<button class="btn" data-act="ob-done" type="button">' + esc(o.s3go) + '</button>';
    h += '<div class="coi tight" style="margin-top:18px">' + esc(C.config.coiLong) + '</div>';
    h += '<p class="foot">' + esc(C.config.disclaimerShort) + '</p>';
    return scr(slug, h);
  }
  function illMini(slug) {
    var I = C && C.illustrations && C.illustrations[slug];
    if (I && I.file) {
      return '<img class="ill-mini ill" src="' + esc(I.file) + '" alt="" width="88" height="88" loading="lazy" decoding="async" data-tone="' + esc(tone(slug)) + '" data-cls="ill-mini ill">';
    }
    return svgPlaceholder(tone(slug), 'ill-mini');
  }

  /* ---------- Šiandien — Endel: one card, one action ---------- */
  function scrToday() {
    if (!S.onboarded || !P || !P.band) return scrOnboard();
    var b = bandObj(), d = dayState(), pc = podcastFor(P.band), pr = practiceToday(), ck = checkToday();
    var m = modeToday(), slug = CAT_SLUG[m.id] || 'hero';
    var g = C.games.games[seed('g' + today()) % C.games.games.length];
    var now = new Date();
    var h = '';

    /* THE day card */
    h += '<div class="mode">' + ill(slug, 'ill') +
      '<div class="body">' +
      '<span class="lbl">' + esc(LTDAYS[(now.getDay() + 6) % 7]) + ' · ' + esc(niceDate(now)) + ' · ' + esc(b.label) + (P.name ? ' · ' + esc(P.name) : '') + '</span>' +
      '<p class="big">' + esc(m.label) + '</p>' +
      '<p class="why">' + esc(m.blurb) + '</p>' +
      (dayDone()
        ? '<button class="btn ghost" data-act="start-now" type="button">✓ Diena uždaryta · 🔥 ' + P.streak + '</button>'
        : '<button class="btn" data-act="start-now" type="button">▶ Pradėti · 3 min</button>') +
      '</div></div>';

    /* disclosure without a scroll — personas panel's single biggest lever (14/40) */
    h += '<div class="coi tight">' + esc(C.config.coiLong) + '<br>' + esc(C.config.voiceNote) + '</div>';

    h += '<p class="h2">Trys žingsniai</p>';
    h += '<button class="step' + (d.p ? ' done' : '') + '" data-act="open-pod" type="button">' +
      '<span class="n">' + (d.p ? '✓' : '1') + '</span><span><span class="t">🎙 Vienos minutės podcast\'as</span>' +
      '<span class="s">' + (pc ? esc(pc.title) : 'Šiandienos mintis') + '</span></span></button>';
    h += '<button class="step' + (d.x ? ' done' : '') + '" data-act="open-prac" type="button">' +
      '<span class="n">' + (d.x ? '✓' : '2') + '</span><span><span class="t">🎯 Dviejų minučių praktika</span>' +
      '<span class="s">' + esc(pr.title) + '</span></span></button>';
    h += '<button class="step' + (d.c ? ' done' : '') + '" data-act="tick" type="button">' +
      '<span class="n">' + (d.c ? '✓' : '3') + '</span><span><span class="t">✅ Vienas varnelės klausimas</span>' +
      '<span class="s">' + esc(ck.text) + '</span></span></button>';

    /* step 4 — reading minute, optional on purpose */
    var R = C.config.reading;
    h += '<button class="step opt' + (d.r ? ' done' : '') + '" data-act="open-read" type="button">' +
      '<span class="n">' + (d.r ? '✓' : '4') + '</span><span><span class="t">📖 ' + esc(R.title) + '</span>' +
      '<span class="s">' + esc(R.sub) + ' · ' + esc(R.optional) + '</span></span></button>';

    /* book of the week */
    var bk = bookOfWeek();
    h += '<p class="h2" style="--tone:' + tone('reading') + '">' + esc(R.weekTitle) + '</p>';
    h += '<div class="card" style="--tone:' + tone('reading') + '">' +
      '<p class="lbl">' + esc(bk.who) + '</p>' +
      '<h3 style="font-size:19px;margin:0 0 6px">' + esc(bk.title) + '</h3>' +
      '<p class="sm muted" style="margin:0 0 10px">' + esc(bk.author) + '</p>' +
      '<p class="sm" style="margin:0 0 10px">' + esc(bk.why) + '</p>' +
      '<p class="src"><b>Leidimas</b> · ' + esc(bk.lt) + '</p></div>';

    /* today's game */
    h += '<p class="h2" style="--tone:' + tone(GAME_SLUG[g.id]) + '">Šiandienos žaidimas</p>' +
      '<a class="catrow" style="--tone:' + tone(GAME_SLUG[g.id]) + '" href="#/zaidimai/' + esc(g.id) + '">' +
      '<span class="ic">' + illMini(GAME_SLUG[g.id]) + '</span>' +
      '<span class="tx"><b>' + esc(g.name) + '</b><span>' + esc(g.sub) + (!g.free && !S.plus ? ' · 🔒 MKK+' : '') + '</span></span>' +
      '<span class="ar">→</span></a>';

    /* ambient */
    h += '<p class="h2">Fono garsas</p><div class="chips">';
    AMBIENTS.forEach(function (a) {
      h += '<button class="chip" data-act="amb" data-amb="' + esc(a.id) + '" aria-pressed="' + (S.ambient === a.id) + '" type="button">' + esc(a.name) + '</button>';
    });
    h += '</div><p class="xs muted">Fono garsas — be mokslinių pažadų. Kai kam padeda uždengti triukšmą, ir tiek.</p>';

    h += '<p class="foot">' + esc(C.config.disclaimerShort) + '</p>';
    return scr(slug, h);
  }

  /* ---------- Treniruotės ---------- */
  function scrTechniques(cat) {
    var T = C.techniques, h = '';
    if (!cat) {
      h += '<span class="lbl">Treniruotės</span><p class="big">Ką iš tikrųjų verta daryti.</p>' +
        '<p class="muted sm">' + T.techniques.length + ' technikos ir ' + T.myths.length + ' mitai. Kiekviena su įrodymų ženkleliu ir šaltiniu — paspausk ženklelį.</p><div class="spacer"></div>';
      T.categories.forEach(function (c) {
        var n = c.id === 'mitai' ? T.myths.length : T.techniques.filter(function (t) { return t.cat === c.id; }).length;
        var s = CAT_SLUG[c.id];
        h += '<a class="catrow" style="--tone:' + tone(s) + '" href="#/treniruotes/' + esc(c.id) + '">' +
          '<span class="ic">' + illMini(s) + '</span>' +
          '<span class="tx"><b>' + esc(c.label) + '</b><span>' + esc(c.blurb) + '</span></span>' +
          '<span class="ar">' + n + ' →</span></a>';
      });
      h += '<p class="note">Nemokamai matai 5 technikas ir VISUS mitus. Likusios — MKK+.</p>';
      return scr('brain-learns', h);
    }
    var c = null, i;
    for (i = 0; i < T.categories.length; i++) if (T.categories[i].id === cat) c = T.categories[i];
    if (!c) return scrTechniques(null);
    var slug = CAT_SLUG[c.id];
    h += '<a class="chip" href="#/treniruotes">← Atgal</a><div class="spacer"></div>';
    h += ill(slug, 'ill');
    h += '<span class="lbl">' + esc(c.icon) + ' ' + esc(c.label) + '</span><p class="muted sm">' + esc(c.blurb) + '</p>';
    h += '<div class="card">';
    if (cat === 'mitai') {
      T.myths.forEach(function (m) {
        h += '<div class="item"><h3><span>' + esc(m.name) + '</span>' + evBadge('X') + '</h3>' +
          '<p class="how muted">' + esc(m.claim) + '</p>' +
          '<p class="how">' + esc(m.truth) + '</p>' +
          '<div class="prac"><b>Vietoj to:</b> ' + esc(m.instead) + '</div>' +
          srcLine(m.src) + '</div>';
      });
    } else {
      var list = T.techniques.filter(function (t) { return t.cat === cat; });
      var free = freeTechIds();
      list.forEach(function (t) {
        var locked = !S.plus && free.indexOf(t.id) < 0;
        h += '<div class="item"><h3><span>' + esc(t.name) + '</span>' + evBadge(evOf(t)) + '</h3>';
        h += '<p class="how">' + esc(t.how) + '</p>';
        if (locked) {
          h += '<div class="prac muted">🔒 Praktika — MKK+ dalis. <a href="#/as">Žiūrėti planus</a></div>';
        } else {
          h += '<div class="prac"><b>2 min:</b> ' + esc(t.practice) + '</div>';
        }
        h += '<p class="meta">Nuo ' + t.age + ' m.</p>' + srcLine(t.src) + '</div>';
      });
    }
    h += '</div>';
    return scr(slug, h);
  }
  function freeTechIds() { return ['retrieval', 'spacing', 'success', 'wm4', 'feedback-work']; }

  /* ---------- Žaidimai ---------- */
  function scrGames(id) {
    var G = C.games.games, h = '';
    if (!id) {
      h += '<span class="lbl">Žaidimai</span><p class="big">Trys žaidimai. Nulis pažadų.</p>' +
        '<p class="muted sm">Kiekvienas sako, ką jis treniruoja — ir ko NE.</p><div class="spacer"></div>';
      G.forEach(function (g) {
        var s = GAME_SLUG[g.id];
        h += '<a class="catrow" style="--tone:' + tone(s) + '" href="#/zaidimai/' + esc(g.id) + '">' +
          '<span class="ic">' + illMini(s) + '</span>' +
          '<span class="tx"><b>' + esc(g.name) + '</b><span>' + esc(g.sub) + (!g.free && !S.plus ? ' · 🔒 MKK+' : '') + '</span></span>' +
          '<span class="ar">→</span></a>';
      });
      h += '<p class="note warn">Bendri „smegenų treniruokliai“ neperkelia įgūdžio: 2024 m. tyrimas su 235 vaikais (6–13 m.) rado pagerėjimą tik treniruotoje užduotyje. Todėl čia nėra nė vieno žaidimo, kuris žadėtų „lavinti smegenis“.</p>';
      return scr('game-recall', h);
    }
    var g = null, i;
    for (i = 0; i < G.length; i++) if (G[i].id === id) g = G[i];
    if (!g) return scrGames(null);
    var slug = GAME_SLUG[g.id];
    h += '<a class="chip" href="#/zaidimai">← Atgal</a><div class="spacer"></div>';
    h += ill(slug, 'ill');
    h += '<span class="lbl">' + esc(g.icon) + ' ' + esc(g.name) + ' ' + evBadge(evOf(g)) + '</span>';
    h += '<p class="muted sm">' + esc(g.rule) + '</p>';
    if (!g.free && !S.plus) {
      h += '<div class="card center"><p class="big">🔒</p><p class="sm">Šis žaidimas — MKK+ dalis.</p>' +
        '<a class="btn" href="#/as">Žiūrėti planus</a></div>';
      h += '<p class="note">' + esc(g.honest) + '</p>';
      return scr(slug, h);
    }
    h += '<div class="card" id="gameBox"></div>';
    h += '<p class="note warn"><b>Sąžiningai:</b> ' + esc(g.honest) + '</p>';
    h += '<div class="card flat">' + srcLine(g.src) + '</div>';
    return scr(slug, h);
  }

  /* ---------- Biblioteka ---------- */
  function scrLibrary(seg) {
    var L = C.library, h = '';
    if (!seg) {
      h += '<span class="lbl">Biblioteka</span><p class="big">Kur ieškoti toliau.</p>' +
        '<p class="muted sm">Knygos, filmai, tyrimai ir tai, ką galima padaryti namuose šįvakar.</p><div class="spacer"></div>';
      L.segments.forEach(function (s) {
        var sl = LIB_SLUG[s.id] || 'hero';
        h += '<a class="catrow" style="--tone:' + tone(sl) + '" href="#/biblioteka/' + esc(s.id) + '">' +
          '<span class="ic">' + illMini(sl) + '</span><span class="tx"><b>' + esc(s.label) + '</b></span><span class="ar">→</span></a>';
      });
      return scr('reading', h);
    }
    var s = null, i;
    for (i = 0; i < L.segments.length; i++) if (L.segments[i].id === seg) s = L.segments[i];
    if (!s) return scrLibrary(null);
    var slug = LIB_SLUG[seg] || 'hero';
    /* bureliai stays FREE on purpose: it carries the conflict-of-interest disclosure. */
    var locked = !S.plus && seg === 'irankiai';
    h = '<a class="chip" href="#/biblioteka">← Atgal</a><div class="spacer"></div>' +
      ill(slug, 'ill') +
      '<span class="lbl">' + esc(s.icon) + ' ' + esc(s.label) + '</span>';

    if (locked) {
      h += '<div class="card center"><p class="big">🔒</p><p class="sm">Ši skiltis — MKK+ dalis.</p><a class="btn" href="#/as">Žiūrėti planus</a></div>';
      return scr(slug, h);
    }
    if (seg === 'bureliai') h += '<p class="muted sm">' + esc(L.bureliaiIntro) + '</p>';
    h += '<div class="card">';
    if (seg === 'knygos') {
      L.knygos.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.title) + '</span></h3>' +
          '<p class="how muted sm">' + esc(b.author) + ' · ' + esc(b.who) + '</p>' +
          '<p class="how">' + esc(b.why) + '</p><p class="meta">' + esc(b.lt) + '</p></div>';
      });
    } else if (seg === 'dokumentika') {
      L.dokumentika.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.title) + '</span></h3>' +
          '<p class="how muted sm">' + esc(b.who) + '</p><p class="how">' + esc(b.why) + '</p>' +
          (b.note ? '<p class="meta">' + esc(b.note) + '</p>' : '') + '</div>';
      });
    } else if (seg === 'podkastai') {
      L.podkastai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.title) + '</span></h3>' +
          '<p class="how muted sm">' + esc(b.who) + '</p><p class="how">' + esc(b.why) + '</p></div>';
      });
    } else if (seg === 'tyrimai') {
      L.tyrimai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.title) + '</span>' + evBadge(evOf(b)) + '</h3>' +
          '<p class="meta" style="margin:0 0 8px">' + esc(b.year) + '</p>' +
          '<p class="how">' + esc(b.finding) + '</p>' +
          '<div class="prac"><b>Ką tai reiškia:</b> ' + esc(b.means) + '</div>' +
          srcLine(b.src) + '</div>';
      });
    } else if (seg === 'bureliai') {
      L.bureliai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.icon) + ' ' + esc(b.label) + '</span>' + evBadge(evOf(b)) + '</h3>' +
          '<p class="how">' + esc(b.trains) + '</p>' +
          '<div class="prac"><b>Namuose:</b><br>· ' + esc(b.home[0]) + '<br>· ' + esc(b.home[1]) + '</div>' +
          '<p class="meta">' + esc(b.evNote) + '</p>' + srcLine(b.src) + '</div>';
      });
      h += '<div class="item"><p class="how muted">' + esc(L.bureliaiKita) + '</p></div>';
    } else if (seg === 'irankiai') {
      L.irankiai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.icon) + ' ' + esc(b.title) + '</span>' + evBadge(evOf(b)) + '</h3><ol class="plain">';
        b.steps.forEach(function (st) { h += '<li>' + esc(st) + '</li>'; });
        h += '</ol><p class="meta">' + esc(b.evNote) + '</p>' + srcLine(b.src) + '</div>';
      });
    }
    h += '</div>';
    return scr(slug, h);
  }

  /* ---------- Aš ---------- */
  function weekHTML() {
    var mon = mondayOf(new Date()), tk = today(), h = '<div class="week">', i, d, k, done;
    for (i = 0; i < 7; i++) {
      d = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i);
      k = dayKey(d);
      done = P.days[k] && P.days[k].p && P.days[k].x && P.days[k].c;
      h += '<span class="wd' + (done ? ' on' : '') + (k === tk ? ' today' : '') + '">' +
        '<span class="d"></span><span class="n">' + LTDAYS[i] + '</span></span>';
    }
    return h + '</div>';
  }
  function historyHTML() {
    var keys = Object.keys(P.days).filter(function (k) {
      var d = P.days[k]; return d && (d.p || d.x || d.c || d.r);
    }).sort().reverse().slice(0, 30);
    if (!keys.length) {
      return '<div class="card flat"><div class="empty">' + ill('memory', 'ill') +
        '<p>Istorija tuščia. Po pirmos treniruotės čia atsiras pirma eilutė — ir nuo tada matysi, ką iš tikrųjų padarei.</p>' +
        '<a class="btn" href="#/siandien">Pradėti šiandien</a></div></div>';
    }
    var h = '<div class="card">';
    keys.forEach(function (k) {
      var d = P.days[k], marks = (d.p ? '🎙' : '·') + ' ' + (d.x ? '🎯' : '·') + ' ' + (d.c ? '✅' : '·') + ' ' + (d.r ? '📖' : '·');
      var parts = k.split('-'), dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      h += '<div class="hrow"><span class="hd">' + LTDAYS[(dt.getDay() + 6) % 7] + ' ' + niceDate(dt) + '</span>' +
        '<span class="hm">' + marks + '</span></div>';
    });
    return h + '</div>';
  }

  function scrMe() {
    if (!S.onboarded || !P) return scrOnboard();
    var cfg = C.config, b = bandObj(), h = '';
    h += '<span class="lbl">Aš</span><p class="big">' + esc(P.name || b.label) + (S.plus ? ' · MKK+' : '') + '</p>';
    h += '<p class="muted sm">' + esc(b.label) + (b.parentMode ? ' · su tėvais' : '') + '</p><div class="spacer"></div>';

    /* week + stats */
    h += '<div class="card"><p class="lbl">Ši savaitė</p>' + weekHTML() +
      '<div class="stats">' +
      '<div class="stat"><div class="v">' + P.streak + '</div><div class="k">serija</div></div>' +
      '<div class="stat"><div class="v">' + totalSessions() + '</div><div class="k">iš viso treniruočių</div></div>' +
      '<div class="stat"><div class="v">' + totalReading() + '</div><div class="k">skaitymo min.</div></div>' +
      '</div>' +
      '<p class="xs muted" style="margin:16px 0 0">Nepertraukiamas dalyvavimas siejasi su 70 % mažesne tikimybe mesti. Pertrauktas — atrodo taip pat kaip nedalyvavimas. ' + evBadge('B') + '</p></div>';

    /* profiles */
    h += '<p class="h2">Kas mokosi</p>';
    S.profiles.forEach(function (p) {
      var bb = null, i;
      for (i = 0; i < cfg.bands.length; i++) if (cfg.bands[i].id === p.band) bb = cfg.bands[i];
      h += '<button class="catrow" style="--tone:' + tone('age-' + p.band) + '" data-act="switch" data-id="' + esc(p.id) + '" type="button" aria-pressed="' + (p.id === S.active) + '">' +
        '<span class="ic">' + illMini('age-' + p.band) + '</span>' +
        '<span class="tx"><b>' + esc(p.name || (bb ? bb.label : '—')) + '</b><span>' + esc(bb ? bb.label : '') + ' · 🔥 ' + p.streak + '</span></span>' +
        '<span class="ar">' + (p.id === S.active ? '✓' : '→') + '</span></button>';
    });
    h += '<div class="btnrow"><button class="btn ghost sm" data-act="add-child" type="button">+ Pridėti vaiką</button>';
    if (S.profiles.length > 1) h += '<button class="btn ghost sm" data-act="del-child" type="button">Pašalinti šitą</button>';
    h += '</div>';

    h += '<p class="h2">Amžius</p><div class="chips">';
    cfg.bands.forEach(function (x) {
      h += '<button class="chip" data-act="band" data-band="' + esc(x.id) + '" aria-pressed="' + (P.band === x.id) + '" type="button">' + esc(x.label) + '</button>';
    });
    h += '</div>';
    h += '<button class="check' + (P.parent ? ' on' : '') + '" data-act="parent" type="button"><span class="bx">' + (P.parent ? '✓' : '') + '</span>' +
      '<span><b>Tėvų režimas</b><br><span class="xs muted">4–7 m. — suaugęs skaito ir klausia. Rekomenduojama.</span></span></button>';

    /* history */
    h += '<p class="h2">Istorija</p>' + historyHTML();

    /* reminder */
    h += '<p class="h2" style="--tone:' + tone('sleep') + '">Priminimas</p><div class="chips">';
    cfg.times.forEach(function (t) {
      h += '<button class="chip" data-act="remind" data-time="' + esc(t) + '" aria-pressed="' + (S.remind === t) + '" type="button">' + esc(t) + '</button>';
    });
    h += '<button class="chip" data-act="remind" data-time="" aria-pressed="' + (!S.remind) + '" type="button">Be priminimo</button></div>' +
      '<p class="xs muted">' + esc(cfg.onboarding.s2note) + '</p>';

    h += '<p class="h2">Spalvos</p><div class="chips">';
    [['auto', 'Sistema'], ['light', 'Šviesi'], ['dark', 'Tamsi']].forEach(function (t) {
      h += '<button class="chip" data-act="theme" data-theme="' + t[0] + '" aria-pressed="' + (S.theme === t[0]) + '" type="button">' + t[1] + '</button>';
    });
    h += '</div><span class="lbl">Keisti spalvą</span><div class="swatches">';
    ACCENTS.forEach(function (a) {
      h += '<button class="sw" data-act="accent" data-accent="' + a.id + '" aria-pressed="' + (S.accent === a.id) + '" style="background:' + a.v + '" title="' + esc(a.name) + '" aria-label="' + esc(a.name) + '" type="button"></button>';
    });
    h += '</div>';

    h += '<p class="h2">Fono garsas</p><div class="chips">';
    AMBIENTS.forEach(function (a) {
      h += '<button class="chip" data-act="amb" data-amb="' + esc(a.id) + '" aria-pressed="' + (S.ambient === a.id) + '" type="button">' + esc(a.name) + '</button>';
    });
    h += '</div>';

    /* plans — 3,99 primary, 6,99 secondary, no "⚠️ tikslinama" */
    h += '<p class="h2">Planai</p><div class="card"><p class="lbl">' + esc(cfg.plans.free.name) + '</p>' +
      '<p class="price">' + esc(cfg.plans.free.price) + '</p><ul class="plain">';
    cfg.plans.free.items.forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
    h += '</ul></div>';

    h += '<div class="card">' + (S.plus ? '<span class="pill">✓ Aktyvus</span>' : '') +
      '<p class="lbl">' + esc(cfg.plans.plus.name) + '</p>' +
      '<p class="price">' + esc(cfg.plans.plus.priceA) + '</p>' +
      '<p class="price2">arba ' + esc(cfg.plans.plus.priceB) + '</p><ul class="plain">';
    cfg.plans.plus.items.forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
    h += '</ul>' + (S.plus
      ? '<p class="sm"><b>MKK+ jau įjungtas</b>' + (S.code ? ' · kodas ' + esc(S.code) : '') + '</p>'
      : '<button class="btn" data-act="pay" type="button">Užsisakyti MKK+</button>') + '</div>';

    /* gift */
    h += '<div class="card"><p class="lbl">🎁 ' + esc(cfg.plans.gift.title) + '</p>' +
      '<p class="sm">' + esc(cfg.plans.gift.help) + '</p>' +
      '<div class="coi">' + esc(cfg.plans.gift.coi) + '</div>';
    if (S.plus) {
      h += '<p class="sm"><b>✓ MKK+ aktyvus</b>' + (S.code ? ' · kodas ' + esc(S.code) : '') + '</p>' +
        '<button class="btn ghost sm" data-act="unplus" type="button">Išjungti (prototipo testui)</button>';
    } else {
      h += '<input type="text" id="code" placeholder="' + esc(cfg.plans.gift.placeholder) + '" autocapitalize="characters" autocomplete="off">' +
        '<div class="spacer"></div><button class="btn" data-act="code" type="button">Įvesti kodą</button>';
    }
    h += '</div>';

    /* install */
    if (isIOS() && !isStandalone()) {
      h += '<p class="h2">Programėlė telefone</p><div class="card flat">' +
        '<p class="sm" style="margin:0 0 12px">MKK veikia kaip įprasta programėlė — tik reikia įsidėti į pradžios ekraną.</p>' +
        '<button class="btn ghost sm" data-act="ios" type="button">Kaip pridėti į pradžios ekraną</button></div>';
    }

    /* guests */
    h += '<p class="h2">Kviestiniai svečiai</p>';
    cfg.guests.forEach(function (g) {
      h += '<div class="card flat"><p class="lbl" style="margin:0 0 6px">' + esc(g.name) + ' · ' + esc(g.status) + '</p>' +
        '<p class="sm" style="margin:0">' + esc(g.topic) + '</p></div>';
    });

    /* courses */
    h += '<p class="h2">Kursai</p>';
    [cfg.courses.today, cfg.courses.course].forEach(function (c) {
      h += '<div class="card"><p class="lbl">' + esc(c.title) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 8px">' + esc(c.name) + ' ' + evBadge(c.evidence) + '</h3>' +
        '<p class="sm" style="margin:0">' + esc(c.body) + '</p></div>';
    });
    h += '<div class="card flat"><p class="lbl">Būsimi kursai</p><ul class="plain">';
    cfg.courses.next.forEach(function (x) { h += '<li class="muted">' + esc(x) + '</li>'; });
    h += '</ul></div>';

    /* about */
    h += '<p class="h2">Apie</p><div class="card">' +
      '<p class="lbl">' + esc(cfg.author) + '</p>';
    cfg.story.forEach(function (l) { h += '<p class="sm">' + esc(l) + '</p>'; });
    h += '<hr class="sep"><div class="coi">' + esc(cfg.coiLong) + '</div>' +
      '<button class="btn ghost sm" data-act="method" type="button">Kaip vertinam įrodymus</button>' +
      '<p class="meta" style="margin-top:16px">' + esc(cfg.version) + ' · ' + esc(cfg.build) + '</p></div>';

    h += '<div class="card flat">';
    cfg.disclaimerFull.forEach(function (l, i) { h += '<p class="' + (i === 0 ? 'lbl' : 'xs') + '">' + esc(l) + '</p>'; });
    h += '</div>';

    h += '<p class="h2">Duomenys</p><div class="card flat"><p class="xs">Nulis analitikos, nulis slapukų, nulis serverio. Viskas, ką čia pažymi, lieka šitame telefone.</p>' +
      '<button class="btn ghost sm" data-act="reset" type="button">Ištrinti viską</button></div>';

    return scr('hero', h);
  }

  /* ---------- podcast · practice · reading sheets ---------- */
  function openPodcast(auto) {
    var pc = podcastFor(P.band), h = '';
    if (!pc) {
      h = '<p class="sm">Šiam amžiui podcast\'as dar rašomas.</p><p class="big">🎙 įrašoma</p>' +
        '<p class="muted sm">Tuo tarpu žingsnis 2 veikia — pradėk nuo praktikos.</p>';
    } else {
      h = '<span class="lbl">' + esc(bandObj().label) + ' · ' + (pc.minutes || 1) + ' min</span>' +
        '<h3 style="font-size:21px">' + esc(pc.title) + '</h3>';
      if (pc.audio) {
        h += '<div class="audio-wrap"><audio id="pod" controls preload="auto" src="' + esc(pc.audio) + '"></audio>' +
          '<p class="meta">' + esc(C.config.voiceNote) + '</p></div>';
      } else {
        h += '<p class="big">🎙 įrašoma</p>';
      }
      h += '<hr class="sep"><span class="lbl">Tekstas</span><p class="sm" style="white-space:pre-line">' + esc(pc.script || '') + '</p>';
      if (pc.status === 'needs-ear-check') h += '<p class="meta">⚠️ Įrašą dar tikrina Kristijonas — balsas gali skambėti nelygiai.</p>';
    }
    h += '<hr class="sep"><span class="lbl">Ką prisimeni?</span>' +
      '<p class="xs muted">Vienas paspaudimas. Ne pažymys — tik tavo paties patikrinimas.</p><div class="btnrow">' +
      '<button class="btn ghost" data-act="recall" data-n="1" type="button">1</button>' +
      '<button class="btn ghost" data-act="recall" data-n="2" type="button">2</button>' +
      '<button class="btn ghost" data-act="recall" data-n="3" type="button">3</button></div>';
    h += '<div class="spacer"></div><button class="btn ok" data-act="did-pod" type="button">Perklausiau ✓</button>';
    sheet('🎙 Podcast\'as', h, CAT_SLUG[modeToday().id]);
    if (auto) {
      var a = $('#pod');
      if (a) { var p = a.play(); if (p && p.catch) p.catch(function () {}); }
    }
  }
  function openPractice() {
    var p = practiceToday(), h = '';
    h += '<span class="lbl">2 minutės ' + evBadge(evOf(p)) + '</span><h3 style="font-size:21px">' + esc(p.title) + '</h3>' +
      '<p class="sm muted">' + esc(p.why) + '</p><ol class="plain">';
    p.steps.forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
    h += '</ol><p class="meta">Nuo ' + p.minAge + ' m.</p>' + srcLine(p.src) +
      '<div class="spacer"></div><button class="btn ok" data-act="did-prac" type="button">Padaryta ✓</button>';
    sheet('🎯 Praktika', h, CAT_SLUG[modeToday().id]);
  }

  /* reading minute — the feature Kris asked for and v0.1 silently skipped (critic 🟠7) */
  var RD = { t: null, left: 60 };
  function stopReading() { clearInterval(RD.t); RD.t = null; }
  function openReading() {
    var R = C.config.reading, h = '';
    RD.left = 60;
    h += '<span class="lbl">' + esc(R.sub) + ' ' + evBadge(evOf(R)) + '</span>';
    h += '<p class="sm muted">' + esc(R.why) + '</p>';
    h += '<div class="clock" id="rclk">1:00</div><div class="bar"><i id="rbar"></i></div>';
    h += '<div class="btnrow"><button class="btn" data-act="read-go" id="rgo" type="button">▶ Pradėti minutę</button></div>';
    h += '<ol class="plain" style="margin-top:20px">';
    R.steps.forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
    h += '</ol>';
    h += '<p class="note warn">' + esc(R.honest) + '</p>' + srcLine(R.src);
    h += '<div class="spacer"></div><button class="btn ok" data-act="did-read" type="button">' + esc(R.done) + '</button>';
    h += '<p class="xs muted center" style="margin-top:10px">' + esc(R.optional) + '</p>';
    sheet('📖 ' + R.title, h, 'reading');
  }
  /* update in place — never re-render the sheet on a tick (60fps rule) */
  function readingTick() {
    RD.left--;
    var c = $('#rclk'), b = $('#rbar');
    if (!c) { stopReading(); return; }
    var m = Math.floor(RD.left / 60), s = RD.left % 60;
    c.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    if (b) b.style.width = ((60 - RD.left) / 60 * 100) + '%';
    if (RD.left <= 0) {
      stopReading(); beep();
      var g = $('#rgo'); if (g) { g.textContent = 'Minutė baigta'; g.disabled = true; }
      toast('Minutė baigta. Dabar pasakyk vieną dalyką iš to, ką perskaitei.');
    }
  }

  /* ---------- games ---------- */
  var GM = {};
  function gameMount(id) {
    var box = $('#gameBox'); if (!box) return;
    if (id === 'atsimink') gAtsimink(box);
    else if (id === 'laikmatis') gLaikmatis(box);
    else if (id === 'ismokyk') gIsmokyk(box);
  }

  function gAtsimink(box) {
    var pools = C.games.memoryPools;
    var pool = isYoung() ? pools.young : pools.old;
    var st = P.games.atsimink || {};
    var repeatAvail = st.date && st.date !== today() && st.items && st.items.length === 5;
    GM.sel = [];

    function intro() {
      var h = '<span class="lbl">Prisiminimo praktika</span>';
      if (repeatAvail) {
        h += '<p class="sm">Vakar buvai įsiminęs penkis. Patikrinkim, ar liko — tai ir yra išskirstytas kartojimas.</p>' +
          '<button class="btn" data-g="repeat" type="button">🔁 Vakar dienos patikrinimas</button>' +
          '<button class="btn ghost" data-g="new" type="button">Nauji penki</button>';
      } else {
        h += '<p class="sm">5 daiktai · 10 sekundžių · paskui juos rasi tarp dešimties.</p>' +
          '<button class="btn" data-g="new" type="button">Pradėti</button>';
      }
      box.innerHTML = h;
    }
    function show(items) {
      GM.items = items;
      var left = 10, h = '<span class="lbl">Įsimink</span><div class="clock" id="gclk">10</div><div class="bar"><i id="gbar"></i></div><div class="grid5">';
      items.forEach(function (x) { h += '<div class="cell">' + esc(x) + '</div>'; });
      h += '</div><button class="btn ghost" data-g="hide" type="button">Jau įsiminiau</button>';
      box.innerHTML = h;
      clearInterval(GM.t);
      GM.t = setInterval(function () {
        left--;
        var c = $('#gclk'), b = $('#gbar');
        if (!c) { clearInterval(GM.t); return; }
        c.textContent = left;
        if (b) b.style.width = ((10 - left) * 10) + '%';
        if (left <= 0) { clearInterval(GM.t); quiz(); }
      }, 1000);
    }
    function quiz() {
      clearInterval(GM.t);
      var rest = pool.filter(function (x) { return GM.items.indexOf(x) < 0; });
      var decoys = shuffle(rest).slice(0, 5);
      GM.board = shuffle(GM.items.concat(decoys));
      GM.sel = [];
      render();
    }
    function render() {
      var h = '<span class="lbl">Rask tuos penkis · pažymėta <span id="gsel">0</span>/5</span><div class="grid5">';
      GM.board.forEach(function (x, i) {
        h += '<button class="cell" data-g="pick" data-i="' + i + '" aria-pressed="false" type="button">' + esc(x) + '</button>';
      });
      h += '</div><button class="btn" id="gsub" disabled data-g="submit" type="button">Patikrinti</button>';
      box.innerHTML = h;
    }
    /* update in place — re-rendering the whole grid on every tap flickers on a phone */
    function refresh() {
      var n = box.querySelector('#gsel'), sub = box.querySelector('#gsub');
      if (n) n.textContent = GM.sel.length;
      if (sub) sub.disabled = GM.sel.length !== 5;
    }
    function result() {
      var right = 0, missed = [], h = '';
      GM.sel.forEach(function (i) { if (GM.items.indexOf(GM.board[i]) >= 0) right++; });
      GM.items.forEach(function (it) {
        var idx = GM.board.indexOf(it);
        if (GM.sel.indexOf(idx) < 0) missed.push(it);
      });
      P.games.atsimink = { date: today(), items: GM.items, missed: missed };
      save();
      h += '<span class="lbl">Rezultatas</span><div class="clock">' + right + '/5</div>';
      h += '<div class="grid5">';
      GM.board.forEach(function (x, i) {
        var was = GM.items.indexOf(x) >= 0, pick = GM.sel.indexOf(i) >= 0;
        var cls = was ? 'right' : (pick ? 'wrong' : '');
        h += '<div class="cell ' + cls + '">' + esc(x) + '</div>';
      });
      h += '</div>';
      h += '<p class="sm">' + (right === 5 ? 'Visi penki. Jei taip bus ir rytoj — laikas sunkesnio lygio: treniruotė veikia, kai pataikai 70–90 %, ne 100 %.' :
        right === 4 ? 'Geras lygis. Tarp 70 ir 90 % teisingų — ten, kur treniruotė dar yra treniruotė.' :
          right >= 2 ? 'Normalu. Rytoj tie patys penki bus lengvesni — tai ir yra visa technika.' :
            'Per sunku. Rytoj bandom vėl — ir tai ne apie gabumus, o apie kartojimą.') + '</p>';
      if (missed.length) h += '<p class="meta">Nepataikei: ' + esc(missed.join(' · ')) + ' — jie grįš rytoj.</p>';
      h += '<div class="spacer"></div><button class="btn ghost" data-g="new" type="button">Dar kartą</button>';
      box.innerHTML = h;
    }
    box.onclick = function (e) {
      var b = e.target.closest ? e.target.closest('[data-g]') : null;
      if (!b) return;
      var g = b.getAttribute('data-g');
      if (g === 'new') show(shuffle(pool).slice(0, 5));
      else if (g === 'repeat') show(st.items.slice());
      else if (g === 'hide') { clearInterval(GM.t); quiz(); }
      else if (g === 'pick') {
        var i = parseInt(b.getAttribute('data-i'), 10), at = GM.sel.indexOf(i);
        if (at >= 0) { GM.sel.splice(at, 1); b.setAttribute('aria-pressed', 'false'); }
        else if (GM.sel.length < 5) { GM.sel.push(i); b.setAttribute('aria-pressed', 'true'); }
        refresh();
      } else if (g === 'submit') result();
    };
    intro();
  }

  function gLaikmatis(box) {
    GM.left = 0; GM.run = false; GM.checks = {};
    function fmt(s) { var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
    function draw() {
      var h = '';
      if (!GM.run && !GM.left) {
        h += '<span class="lbl">Kiek minučių?</span><div class="btnrow">' +
          '<button class="btn" data-g="start" data-m="2" type="button">2</button>' +
          '<button class="btn" data-g="start" data-m="5" type="button">5</button>' +
          '<button class="btn" data-g="start" data-m="10" type="button">10</button></div>';
      } else {
        h += '<span class="lbl" id="tst">' + (GM.run ? 'Vienas darbas. Nieko kito.' : 'Pauzė') + '</span>' +
          '<div class="clock" id="tclk">' + fmt(GM.left) + '</div>' +
          '<div class="bar"><i id="tbar" style="width:' + (100 - Math.round(GM.left / GM.total * 100)) + '%"></i></div>' +
          '<div class="btnrow"><button class="btn ghost" data-g="toggle" type="button" id="ttog">' + (GM.run ? 'Pauzė' : 'Tęsti') + '</button>' +
          '<button class="btn ghost" data-g="stop" type="button">Baigti</button></div>';
      }
      h += '<hr class="sep"><span class="lbl">Prieš pradedant</span>';
      C.games.timerChecklist.forEach(function (t, i) {
        h += '<button class="check' + (GM.checks[i] ? ' on' : '') + '" data-g="chk" data-i="' + i + '" type="button">' +
          '<span class="bx">' + (GM.checks[i] ? '✓' : '') + '</span><span>' + esc(t) + '</span></button>';
      });
      h += '<div class="spacer"></div><button class="btn ghost sm" data-g="gray" type="button">' +
        (document.body.classList.contains('grayscale') ? 'Grąžinti spalvas' : '⚫ Pilko ekrano iššūkis') + '</button>';
      box.innerHTML = h;
    }
    /* 60fps: a tick touches two nodes, never innerHTML */
    function paint() {
      var c = box.querySelector('#tclk'), b = box.querySelector('#tbar');
      if (c) c.textContent = fmt(GM.left);
      if (b) b.style.width = (100 - Math.round(GM.left / GM.total * 100)) + '%';
    }
    function tick() {
      if (!GM.run) return;
      GM.left--;
      if (GM.left <= 0) {
        GM.run = false; GM.left = 0; clearInterval(GM.t); beep(); draw();
        toast('Laikas. Dabar pasakyk vieną dalyką iš atminties.'); return;
      }
      paint();
    }
    box.onclick = function (e) {
      var b = e.target.closest ? e.target.closest('[data-g]') : null;
      if (!b) return;
      var g = b.getAttribute('data-g');
      if (g === 'start') {
        GM.total = parseInt(b.getAttribute('data-m'), 10) * 60;
        GM.left = GM.total; GM.run = true;
        clearInterval(GM.t); GM.t = setInterval(tick, 1000); draw();
      } else if (g === 'toggle') {
        GM.run = !GM.run;
        clearInterval(GM.t); if (GM.run) GM.t = setInterval(tick, 1000);
        draw();
      } else if (g === 'stop') { GM.run = false; GM.left = 0; clearInterval(GM.t); draw(); }
      else if (g === 'chk') { var i = b.getAttribute('data-i'); GM.checks[i] = !GM.checks[i]; draw(); }
      else if (g === 'gray') { document.body.classList.toggle('grayscale'); draw(); }
    };
    draw();
  }

  function gIsmokyk(box) {
    var topics = C.games.teachTopics.filter(function (t) { return t.minAge <= bandMinAge() + 2; });
    if (!topics.length) topics = C.games.teachTopics;
    GM.left = 60; GM.run = false;
    function pick() { GM.topic = topics[Math.floor(Math.random() * topics.length)].t; }
    pick();
    function draw(phase) {
      var h = '<span class="lbl">Tema</span><p class="big sm2">' + esc(GM.topic) + '</p>';
      if (phase === 'run') {
        h += '<div class="clock" id="iclk">' + GM.left + '</div><div class="bar"><i id="ibar" style="width:' + ((60 - GM.left) / 60 * 100) + '%"></i></div>' +
          '<p class="sm muted">Kalbėk garsiai. Be užrašų. Jei sustoji — vis tiek kalbėk.</p>' +
          '<button class="btn ghost" data-g="stop" type="button">Baigiau</button>';
      } else if (phase === 'rate') {
        h += '<span class="lbl">Kaip sekėsi?</span>';
        C.games.teachRates.forEach(function (r) {
          h += '<button class="btn ghost" data-g="rate" data-n="' + r.n + '" type="button">' + esc(r.icon) + ' ' + esc(r.label) + '</button>';
        });
      } else if (phase === 'done') {
        var r = C.games.teachRates[GM.rate - 1];
        h += '<div class="clock">' + esc(r.icon) + '</div><p class="sm"><b>' + esc(r.label) + '</b></p>' +
          '<div class="prac">' + esc(r.tip) + '</div><div class="spacer"></div>' +
          '<button class="btn ghost" data-g="again" type="button">Kita tema</button>';
      } else {
        h += '<p class="sm muted">60 sekundžių. Aiškini garsiai — žmogui, meškiukui ar sienai. Be užrašų.</p>' +
          '<button class="btn" data-g="go" type="button">Pradedu</button>' +
          '<button class="btn ghost" data-g="again" type="button">Kita tema</button>';
      }
      box.innerHTML = h;
    }
    function tick() {
      GM.left--;
      if (GM.left <= 0) { clearInterval(GM.t); GM.run = false; beep(); draw('rate'); return; }
      var c = box.querySelector('#iclk'), b = box.querySelector('#ibar');
      if (c) c.textContent = GM.left;
      if (b) b.style.width = ((60 - GM.left) / 60 * 100) + '%';
    }
    box.onclick = function (e) {
      var b = e.target.closest ? e.target.closest('[data-g]') : null;
      if (!b) return;
      var g = b.getAttribute('data-g');
      if (g === 'go') { GM.left = 60; GM.run = true; clearInterval(GM.t); GM.t = setInterval(tick, 1000); draw('run'); }
      else if (g === 'stop') { clearInterval(GM.t); GM.run = false; draw('rate'); }
      else if (g === 'rate') { GM.rate = parseInt(b.getAttribute('data-n'), 10); draw('done'); }
      else if (g === 'again') { clearInterval(GM.t); GM.left = 60; pick(); draw(); }
    };
    draw();
  }

  /* ---------- install / platform ---------- */
  function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; }
  function isStandalone() {
    return window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }
  function iosSheet() {
    sheet('📲 Pridėti į pradžios ekraną',
      '<p class="sm">MKK veikia be parduotuvės — įsidedi tiesiai iš naršyklės ir ji atsidaro kaip įprasta programėlė.</p>' +
      '<ol class="plain"><li>Apačioje paspausk <b>Dalintis</b> (kvadratas su rodykle ↑).</li>' +
      '<li>Slink žemyn iki <b>„Į pradžios ekraną“ / „Add to Home Screen“</b>.</li>' +
      '<li>Paspausk <b>Pridėti</b>. Ikona atsiras šalia kitų programėlių.</li></ol>' +
      '<p class="note">Veikia ir be interneto: podcast\'ai ir turinys lieka telefone.</p>', 'hero');
  }

  /* ---------- profile sheets ---------- */
  function profileSheet() {
    var h = '<p class="sm muted">Kiekvienas vaikas turi savo seriją, savo dienas ir savo amžiaus juostą.</p>';
    S.profiles.forEach(function (p) {
      var bb = null, i;
      for (i = 0; i < C.config.bands.length; i++) if (C.config.bands[i].id === p.band) bb = C.config.bands[i];
      h += '<button class="catrow" style="--tone:' + tone('age-' + p.band) + '" data-act="switch" data-id="' + esc(p.id) + '" type="button">' +
        '<span class="ic">' + illMini('age-' + p.band) + '</span>' +
        '<span class="tx"><b>' + esc(p.name || (bb ? bb.label : '—')) + '</b><span>' + esc(bb ? bb.label : '') + ' · 🔥 ' + p.streak + '</span></span>' +
        '<span class="ar">' + (p.id === S.active ? '✓' : '→') + '</span></button>';
    });
    h += '<div class="spacer"></div><button class="btn ghost" data-act="add-child" type="button">+ Pridėti vaiką</button>';
    sheet('👤 Kas mokosi', h, 'hero');
  }
  function addChildSheet() {
    var h = '<p class="sm muted">Vardas nebūtinas. Viskas lieka šitame telefone.</p>' +
      '<input type="text" id="newName" placeholder="Vardas (nebūtina)" autocomplete="off" maxlength="24">' +
      '<p class="lbl" style="margin-top:18px">Amžius</p><div class="chips" id="newBands">';
    C.config.bands.forEach(function (b) {
      h += '<button class="chip" data-act="new-band" data-band="' + esc(b.id) + '" aria-pressed="false" type="button">' + esc(b.label) + '</button>';
    });
    h += '</div><div class="spacer"></div><button class="btn" data-act="new-save" type="button" disabled id="newSave">Pridėti</button>';
    sheet('+ Pridėti vaiką', h, 'hero');
  }

  /* ---------- router ---------- */
  function route() {
    clearInterval(GM.t);
    var hash = location.hash.replace(/^#\/?/, '') || 'siandien';
    var parts = hash.split('/');
    var tab = parts[0] || 'siandien', sub = parts[1] || '';
    var v = $('#view'), html;

    if (!S.onboarded || !P || !P.band) { html = scrOnboard(); tab = 'siandien'; }
    else if (tab === 'treniruotes') html = scrTechniques(sub);
    else if (tab === 'zaidimai') html = scrGames(sub);
    else if (tab === 'biblioteka') html = scrLibrary(sub);
    else if (tab === 'as') html = scrMe();
    else html = scrToday();

    v.innerHTML = html;
    window.scrollTo(0, 0);
    var tabs = document.querySelectorAll('#tabs .tab'), i;
    for (i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-t') === tab) tabs[i].setAttribute('aria-current', 'page');
      else tabs[i].removeAttribute('aria-current');
    }
    paintHeader();
    if (tab === 'zaidimai' && sub) gameMount(sub);
  }
  function paintHeader() {
    var btn = $('#profileBtn');
    $('#streakN').textContent = P ? P.streak : 0;
    if (!P || !S.onboarded) { btn.hidden = true; return; }
    var b = bandObj();
    btn.hidden = false;
    $('#profileAv').textContent = (P.name ? P.name.trim().charAt(0) : b.label.charAt(0)).toUpperCase();
    $('#profileAv').style.background = tone('age-' + P.band);
    $('#profileName').textContent = P.name || b.label;
  }

  /* ---------- actions ---------- */
  function markDone(field) {
    var d = dayState();
    d[field] = 1; save();
    var gained = checkStreak();
    closeSheet(); route();
    toast(gained ? '🔥 Serija: ' + P.streak : 'Pažymėta ✓');
  }

  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return;
    var a = el.getAttribute('data-act');

    /* --- onboarding --- */
    if (a === 'ob-band') {
      var nm = $('#obName');
      if (nm) OB.name = nm.value;
      OB.band = el.getAttribute('data-band'); route(); return;
    }
    if (a === 'ob-time') { OB.time = el.getAttribute('data-time'); route(); return; }
    if (a === 'ob-next') {
      if (OB.step === 1) {
        var n2 = $('#obName'); if (n2) OB.name = n2.value.trim();
        if (!OB.band) { toast('Pirma pasirink amžių.'); return; }
      }
      OB.step = Math.min(3, OB.step + 1); route(); return;
    }
    if (a === 'ob-skip') { OB.time = ''; OB.step = 3; route(); return; }
    if (a === 'ob-done') {
      var band = null, i;
      for (i = 0; i < C.config.bands.length; i++) if (C.config.bands[i].id === OB.band) band = C.config.bands[i];
      var p = newProfile(OB.band, OB.name, band ? band.parentMode === true : false);
      S.profiles.push(p); S.active = p.id; S.onboarded = true; S.remind = OB.time;
      pickActive(); save();
      location.hash = '#/siandien'; route();
      toast('Pradedam. Trys minutės — ir diena uždaryta.');
      return;
    }

    /* --- profiles --- */
    if (a === 'profile') { profileSheet(); return; }
    if (a === 'switch') {
      S.active = el.getAttribute('data-id'); pickActive(); save(); closeSheet();
      location.hash = '#/siandien'; route();
      toast('Mokosi: ' + (P.name || bandObj().label)); return;
    }
    if (a === 'add-child') { addChildSheet(); return; }
    if (a === 'new-band') {
      var chips = document.querySelectorAll('#newBands .chip'), k;
      for (k = 0; k < chips.length; k++) chips[k].setAttribute('aria-pressed', chips[k] === el ? 'true' : 'false');
      var sv = $('#newSave'); if (sv) sv.disabled = false;
      return;
    }
    if (a === 'new-save') {
      var sel = document.querySelector('#newBands .chip[aria-pressed="true"]');
      if (!sel) { toast('Pasirink amžių.'); return; }
      var bid = sel.getAttribute('data-band'), bo = null, j;
      for (j = 0; j < C.config.bands.length; j++) if (C.config.bands[j].id === bid) bo = C.config.bands[j];
      var np = newProfile(bid, ($('#newName') ? $('#newName').value.trim() : ''), bo ? bo.parentMode === true : false);
      S.profiles.push(np); S.active = np.id; pickActive(); save(); closeSheet();
      location.hash = '#/siandien'; route();
      toast('Pridėta: ' + (np.name || bo.label)); return;
    }
    if (a === 'del-child') {
      if (S.profiles.length < 2) return;
      sheet('Pašalinti šitą profilį?',
        '<p class="sm">Dings <b>' + esc(P.name || bandObj().label) + '</b> serija, dienos ir žaidimų istorija. Atgal nebus.</p>' +
        '<button class="btn" data-act="del-child2" type="button">Taip, pašalinti</button>', 'hero');
      return;
    }
    if (a === 'del-child2') {
      S.profiles = S.profiles.filter(function (p) { return p.id !== S.active; });
      S.active = S.profiles.length ? S.profiles[0].id : '';
      pickActive(); save(); closeSheet(); route(); toast('Pašalinta'); return;
    }

    /* --- settings --- */
    if (a === 'method') { methodSheet(); return; }
    if (a === 'ios') { iosSheet(); return; }
    if (a === 'band') {
      P.band = el.getAttribute('data-band');
      var b2 = bandObj();
      if (b2.parentMode) P.parent = true;
      save(); route(); toast('Amžius: ' + b2.label); return;
    }
    if (a === 'parent') { P.parent = !P.parent; save(); route(); return; }
    if (a === 'remind') { S.remind = el.getAttribute('data-time'); save(); route(); toast(S.remind ? 'Priminimas: ' + S.remind : 'Be priminimo'); return; }
    if (a === 'theme') { S.theme = el.getAttribute('data-theme'); save(); applyTheme(); route(); return; }
    if (a === 'accent') { S.accent = el.getAttribute('data-accent'); save(); applyTheme(); route(); return; }
    if (a === 'amb') {
      S.ambient = el.getAttribute('data-amb'); save(); ambientStart(S.ambient); route();
      toast(S.ambient === 'off' ? 'Garsas išjungtas' : 'Fono garsas įjungtas'); return;
    }

    /* --- daily loop --- */
    if (a === 'start-now') { openPodcast(true); return; }
    if (a === 'open-pod') { openPodcast(false); return; }
    if (a === 'recall') {
      var n = parseInt(el.getAttribute('data-n'), 10);
      var au = $('#pod'); if (au) { try { au.pause(); } catch (er2) {} }
      markDone('p');
      toast(n >= 3 ? 'Trys iš trijų. Rytoj tas pats klausimas bus dar lengvesnis.' :
        n === 2 ? 'Du. Normalu — prisiminti sunkiau nei perskaityti, ir būtent todėl tai veikia.' :
          'Vienas. Tai ne gabumai, o kartojimas. Rytoj vėl.');
      return;
    }
    if (a === 'open-prac') { openPractice(); return; }
    if (a === 'open-read') { openReading(); return; }
    if (a === 'read-go') {
      stopReading(); RD.left = 60;
      el.textContent = 'Skaitom…'; el.disabled = true;
      RD.t = setInterval(readingTick, 1000);
      return;
    }
    if (a === 'did-read') {
      stopReading();
      var dd = dayState(); dd.r = 1; save(); closeSheet(); route();
      toast('📖 Minutė užskaityta. Serijos neskaičiuoja — ir taip ir turi būti.');
      return;
    }
    if (a === 'did-pod') { markDone('p'); return; }
    if (a === 'did-prac') { markDone('x'); return; }
    if (a === 'tick') { markDone('c'); return; }

    /* --- money --- */
    if (a === 'pay') {
      sheet('Netrukus', '<p class="sm">Mokėjimų dar nėra — MKK yra prototipas, ne parduotuvė.</p>' +
        '<p class="sm">MKK+ kainuos <b>' + esc(C.config.plans.plus.priceA) + '</b>; yra ir ' + esc(C.config.plans.plus.priceB) + ' variantas.</p>' +
        '<div class="coi">' + esc(C.config.plans.gift.coi) + '</div>' +
        '<p class="sm">Turi nuomonę apie kainą? Parašyk: krisvas.lt</p>', 'hero');
      return;
    }
    if (a === 'code') {
      var v = ($('#code') ? $('#code').value : '').trim().toUpperCase();
      if (/^(EXO|BUR)/.test(v) && v.length >= 4) {
        S.plus = true; S.code = v; save(); route(); toast(C.config.plans.gift.ok);
      } else { toast(C.config.plans.gift.bad); }
      return;
    }
    if (a === 'unplus') { S.plus = false; S.code = ''; save(); route(); toast('MKK+ išjungtas'); return; }
    if (a === 'reset') {
      sheet('Ištrinti viską?', '<p class="sm">Dings visi profiliai, serijos, spalvos ir kodas. Atgal nebus.</p>' +
        '<button class="btn" data-act="reset2" type="button">Taip, ištrinti</button>', 'hero');
      return;
    }
    if (a === 'reset2') {
      try { localStorage.removeItem(KEY); localStorage.removeItem(OLDKEY); } catch (er) {}
      OB = { step: 1, band: null, name: '', time: '' };
      loadState(); applyTheme(); closeSheet(); location.hash = '#/siandien'; route(); toast('Ištrinta'); return;
    }
  }

  /* ---------- offline ---------- */
  function paintNet() { $('#offline').hidden = navigator.onLine !== false; }

  /* ---------- boot ---------- */
  function start() {
    loadState();
    applyTheme();
    document.addEventListener('click', onClick);
    $('#sheetClose').addEventListener('click', closeSheet);
    $('#scrim').addEventListener('click', closeSheet);
    $('#profileBtn').addEventListener('click', profileSheet);
    $('#streakBtn').addEventListener('click', function () {
      sheet('🔥 Serija', '<p class="big">' + (P ? P.streak : 0) + '</p><p class="sm">Dienų iš eilės, kai užbaigei tris žingsnius. Skaitymo minutė neskaičiuojama — ji nebūtina.</p>' +
        '<p class="sm muted">Nepertraukiamas dalyvavimas siejasi su 70 % mažesne tikimybe mesti. Pertrauktas dalyvavimas atrodo taip pat kaip nedalyvavimas. ' + evBadge('B') + '</p>' +
        '<p class="meta">Serija skaičiuojama tik šitame telefone.</p>', 'hero');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    window.addEventListener('hashchange', route);
    window.addEventListener('online', paintNet);
    window.addEventListener('offline', paintNet);
    paintNet();
    if (S.ambient && S.ambient !== 'off') {
      document.addEventListener('click', function once() {
        ambientStart(S.ambient);
        document.removeEventListener('click', once);
      }, { once: true });
    }
    neurons();
    route();
  }

  function boot() {
    if (window.MKK_CONTENT) { C = window.MKK_CONTENT; start(); return; }
    var names = ['config', 'techniques', 'practices', 'library', 'games', 'podcasts', 'illustrations'];
    Promise.all(names.map(function (n) {
      return fetch('./content/' + n + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    })).then(function (a) {
      C = {
        config: a[0], techniques: a[1], practices: a[2], library: a[3],
        games: a[4], podcasts: a[5], illustrations: a[6] || {}
      };
      if (!C.config || !C.techniques || !C.practices || !C.library || !C.games) {
        document.getElementById('view').innerHTML =
          '<div class="card"><p class="lbl">Klaida</p><p class="sm">Nepavyko įkelti turinio. Paleisk per serverį: <code>python3 bin/serve.py 8765</code></p></div>';
        return;
      }
      start();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
