/* MKK v0.3.0 — Mokymosi Meistrų Klubas. Plain JS, no framework, no build.
   Design system: DESIGN.md (Endel logic · per-topic tone · low stimulation). */
(function () {
  'use strict';

  var VERSION = 'v0.3.0';
  var C = null;            // content
  var KEY = 'mkk.v2';
  var OLDKEY = 'mkk.v1';
  var S = {};              // state
  var P = null;            // active profile (reference into S.profiles)
  var I18 = { lt: {}, en: {} };   // content/i18n.json — every UI string
  var LANG = 'lt';                // LT is the default and the complete version

  /* t('key') — UI string in the active language, LT as the always-present fallback. */
  function t(k) {
    var v = I18[LANG] && I18[LANG][k];
    if (v === undefined || v === '') v = I18.lt && I18.lt[k];
    return v === undefined ? k : v;
  }
  /* LX(obj,'field') — content field in the active language: `field_en` when we have it,
     otherwise the Lithuanian original (content is LT-first on purpose). */
  function LX(o, f) {
    if (!o) return '';
    if (LANG !== 'lt') {
      var e = o[f + '_en'];
      if (e !== undefined && e !== null && e !== '') return e;
    }
    return o[f];
  }
  /* LXA — same for an array field */
  function LXA(o, f) { var v = LX(o, f); return (v && v.length) ? v : (o[f] || []); }
  function isEN() { return LANG === 'en'; }

  var ACCENTS = [
    { id: 'raudona', name: 'Raudona', en: 'Red', v: '#D90429' },
    { id: 'melyna', name: 'Mėlyna', en: 'Blue', v: '#0057B8' },
    { id: 'zalia', name: 'Žalia', en: 'Green', v: '#0B7A45' },
    { id: 'violetine', name: 'Violetinė', en: 'Purple', v: '#6B21A8' },
    { id: 'oranzine', name: 'Oranžinė', en: 'Orange', v: '#B84A00' },
    { id: 'kontrastas', name: 'Didelis kontrastas', en: 'High contrast', v: '#000000', hc: true }
  ];
  var AMBIENTS = [
    { id: 'off', name: 'Išjungta', en: 'Off' },
    { id: 'pink', name: 'Rausvas triukšmas', en: 'Pink noise' },
    { id: 'rain', name: 'Lietaus tipo', en: 'Rain-like' },
    { id: 'pulse', name: 'Lėtas pulsas', en: 'Slow pulse' }
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
      iosHint: d ? d.iosHint === true : false,
      lang: (d && d.lang === 'en') ? 'en' : 'lt'
    };
    LANG = S.lang;
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
    return '<button class="ev" data-ev="' + esc(e) + '" data-act="method" type="button" aria-label="' + esc(t('sh.evidenceAria')) + esc(lbl) + esc(t('sh.evidenceAria2')) + '">' + esc(lbl) + '</button>';
  }
  /* every evidence-badged card must show where the claim comes from (critic 🟠4) */
  function srcLine(src, techId) {
    var h;
    if (src && String(src).trim()) h = '<p class="src"><b>' + esc(t('bl.source')) + '</b> · ' + esc(src) + '</p>';
    else h = '<p class="src"><b>' + esc(t('bl.source')) + '</b> · ' + esc(t('sh.srcPending')) + '</p>';
    return h + ltSrcLine(techId);
  }
  /* 🇱🇹 LT šaltinis — rendered from content/sources-lt.json under the existing ŠALTINIS line */
  function ltSrcLine(techId) {
    if (!techId || !C.sourcesLt || !C.sourcesLt.length) return '';
    var out = '', i, r;
    for (i = 0; i < C.sourcesLt.length; i++) {
      r = C.sourcesLt[i];
      if (!r || r.technique_id !== techId) continue;
      out += '<p class="src lt"><b>' + esc(t('sh.ltSource')) + '</b> · ' +
        (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.name) + '</a>' : esc(r.name)) +
        (r.note ? ' — ' + esc(r.note) : '') + '</p>';
    }
    return out;
  }
  function evOf(o) { return (o && o.src && String(o.src).trim()) ? (o.ev || 'C') : 'C'; }

  var LTDAYS = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];
  var LTMON = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio',
    'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
  var ENDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var ENMON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dayName(i) { return isEN() ? ENDAYS[i] : LTDAYS[i]; }
  function niceDate(dt) {
    return isEN() ? (ENMON[dt.getMonth()] + ' ' + dt.getDate()) : (dt.getDate() + ' ' + LTMON[dt.getMonth()]);
  }
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
        '" width="1200" height="800" loading="' + (k.indexOf('hero') >= 0 ? 'eager' : 'lazy') + '" decoding="async" data-tone="' + esc(t) + '" data-cls="' + esc(k) + '"></div>';
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
  /* what the user actually SEES right now — 'auto' resolves through the media query */
  function effTheme() {
    if (S.theme === 'light' || S.theme === 'dark') return S.theme;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches) ? 'dark' : 'light';
  }
  function paintThemeBtn() {
    var b = document.getElementById('themeBtn');
    if (!b) return;
    var dark = effTheme() === 'dark';
    b.textContent = dark ? '☀️' : '🌙';
    b.setAttribute('aria-label', dark ? t('hdr.themeLight') : t('hdr.themeDark'));
    b.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }
  function applyTheme() {
    var root = document.documentElement;
    if (S.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', S.theme);
    paintThemeBtn();
    var a = ACCENTS[0], i;
    for (i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === S.accent) a = ACCENTS[i];
    root.style.setProperty('--accent', a.v);
    if (a.hc) root.setAttribute('data-contrast', '1'); else root.removeAttribute('data-contrast');
  }
  /* the flip Kris asked for: one tap in the top bar, light <-> dark, persisted */
  function toggleTheme() {
    S.theme = effTheme() === 'dark' ? 'light' : 'dark';
    save(); applyTheme(); route();
    toast(S.theme === 'dark' ? t('sh.themeToastDark') : t('sh.themeToast'));
  }
  /* language: the document lang attribute follows, tab labels + static chrome repaint */
  function applyLang() {
    LANG = S.lang === 'en' ? 'en' : 'lt';
    document.documentElement.setAttribute('lang', LANG);
    var map = { siandien: 'tab.today', treniruotes: 'tab.training', zaidimai: 'tab.games',
      tinklarastis: 'tab.blog', as: 'tab.me' };
    var tabs = document.querySelectorAll('#tabs .tab'), i, k, lbl;
    for (i = 0; i < tabs.length; i++) {
      k = map[tabs[i].getAttribute('data-t')];
      lbl = tabs[i].querySelector('.tl');
      if (k && lbl) lbl.textContent = t(k);
    }
    var nav = document.getElementById('tabs');
    if (nav) nav.setAttribute('aria-label', t('nav.aria'));
    var off = document.getElementById('offline');
    if (off) off.textContent = t('offline');
    var sb = document.getElementById('streakBtn');
    if (sb) sb.setAttribute('aria-label', t('hdr.streak'));
    var pb = document.getElementById('profileBtn');
    if (pb) pb.setAttribute('aria-label', t('hdr.profile'));
    var sx = document.getElementById('sheetClose');
    if (sx) sx.setAttribute('aria-label', t('close'));
    paintThemeBtn();
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

  /* ---------- parental gate for external links (Apple Kids Category 1.3 / Google Families) ---------- */
  var GATE = { url: null, a: 0, b: 0 };
  function openGate(url) {
    GATE.url = url; GATE.a = 3 + Math.floor(Math.random() * 7); GATE.b = 3 + Math.floor(Math.random() * 7);
    var q = t('gate.q').replace('{a}', GATE.a).replace('{b}', GATE.b);
    sheet(t('gate.title'),
      '<p class="sm">' + esc(t('gate.text')) + '</p>' +
      '<p class="lbl" style="margin-top:14px">' + esc(q) + '</p>' +
      '<input id="gateIn" class="input" type="number" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="' + esc(q) + '">' +
      '<p id="gateMsg" class="meta" aria-live="polite"></p>' +
      '<div class="row" style="margin-top:12px"><button class="btn" id="gateGo">' + esc(t('gate.btn')) + '</button>' +
      '<button class="btn ghost" id="gateNo">' + esc(t('gate.cancel')) + '</button></div>' +
      '<p class="xs muted" style="margin-top:12px">' + esc(url) + '</p>', 'hero');
    setTimeout(function () { var i = $('#gateIn'); if (i) i.focus(); }, 50);
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[target="_blank"]');
    if (a && a.href && /^https?:/.test(a.href) && a.getAttribute('data-gated') !== 'no') {
      ev.preventDefault(); openGate(a.href); return;
    }
    if (ev.target.id === 'gateGo') {
      var v = parseInt(($('#gateIn') || {}).value, 10);
      if (v === GATE.a * GATE.b) { var u = GATE.url; closeSheet(); window.open(u, '_blank', 'noopener'); }
      else { $('#gateMsg').textContent = t('gate.wrong'); $('#gateIn').value = ''; $('#gateIn').focus(); }
    }
    if (ev.target.id === 'gateNo') closeSheet();
  }, true);

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
    function O(k) { return LX(o, k); }
    var slug = OB.band ? ('age-' + OB.band) : 'hero';
    h += '<div class="dots" aria-hidden="true">' +
      [1, 2, 3].map(function (n) { return '<i class="' + (n === OB.step ? 'on' : '') + '"></i>'; }).join('') + '</div>';

    if (OB.step === 1) {
      h += ill('hero', 'ill');
      h += '<span class="lbl">' + esc(C.config.name) + ' · ' + esc(LX(C.config, 'nameNote')) + '</span>';
      h += '<p class="big">' + esc(O('s1title')) + '</p>';
      h += '<p class="muted sm">' + esc(O('s1sub')) + '</p><div class="spacer"></div>';
      h += '<div class="ob">';
      C.config.bands.forEach(function (b) {
        h += '<button class="catrow" style="--tone:' + tone('age-' + b.id) + '" data-act="ob-band" data-band="' + esc(b.id) + '" type="button" aria-pressed="' + (OB.band === b.id) + '">' +
          '<span class="ic">' + illMini('age-' + b.id) + '</span>' +
          '<span class="tx"><b>' + esc(LX(b, 'label')) + '</b><span>' + esc(LX(b, 'note')) + '</span></span>' +
          '<span class="ar">' + (OB.band === b.id ? '✓' : '→') + '</span></button>';
      });
      h += '</div>';
      h += '<p class="lbl" style="margin-top:22px">' + esc(O('s1name')) + '</p>' +
        '<input type="text" id="obName" value="' + esc(OB.name) + '" placeholder="' + esc(t('ob.namePlaceholder')) + '" autocomplete="off" maxlength="24">' +
        '<p class="xs muted" style="margin-top:8px">' + esc(O('s1namehelp')) + '</p>';
      h += '<div class="spacer"></div><button class="btn" data-act="ob-next" type="button"' + (OB.band ? '' : ' disabled') + '>' + esc(t('next')) + '</button>';
      h += '<p class="foot">' + esc(LX(C.config, 'disclaimerShort')) + '</p>';
      return scr(slug, h);
    }

    if (OB.step === 2) {
      h += ill('sleep', 'ill');
      h += '<span class="lbl">2 / 3</span><p class="big">' + esc(O('s2title')) + '</p>';
      h += '<p class="muted sm">' + esc(O('s2sub')) + '</p><div class="spacer"></div>';
      h += '<div class="chips">';
      C.config.times.forEach(function (t) {
        h += '<button class="chip" data-act="ob-time" data-time="' + esc(t) + '" aria-pressed="' + (OB.time === t) + '" type="button">' + esc(t) + '</button>';
      });
      h += '</div>';
      h += '<p class="note warn">' + esc(O('s2note')) + '</p>';
      h += '<div class="spacer"></div><button class="btn" data-act="ob-next" type="button">' + esc(t('next')) + '</button>' +
        '<button class="btn ghost" data-act="ob-skip" type="button">' + esc(O('s2skip')) + '</button>';
      return scr('sleep', h);
    }

    var b = null, i;
    for (i = 0; i < C.config.bands.length; i++) if (C.config.bands[i].id === OB.band) b = C.config.bands[i];
    h += ill('age-' + OB.band, 'ill');
    h += '<span class="lbl">3 / 3</span><p class="big">' + esc(O('s3title')) + '</p>';
    h += '<p class="muted sm">' + esc(O('s3sub')) + '</p>';
    h += '<div class="card flat"><p class="lbl" style="margin:0 0 10px">' + esc(t('ob.picked')) + '</p>' +
      '<p class="sm" style="margin:0 0 6px"><b>' + esc(OB.name || t('ob.noname')) + '</b> · ' + esc(b ? LX(b, 'label') : '') + '</p>' +
      '<p class="sm muted" style="margin:0">' + esc(t('ob.reminder')) + esc(OB.time || t('ob.noreminder')) + '</p></div>';
    h += '<button class="btn" data-act="ob-done" type="button">' + esc(O('s3go')) + '</button>';
    h += '<div class="coi tight" style="margin-top:18px">' + esc(LX(C.config, 'coiLong')) + '</div>';
    h += '<p class="foot">' + esc(LX(C.config, 'disclaimerShort')) + '</p>';
    return scr(slug, h);
  }
  function illMini(slug) {
    var I = C && C.illustrations && C.illustrations[slug];
    if (I && I.file) {
      return '<img class="ill-mini ill" src="' + esc(I.file) + '" alt="" width="88" height="88" loading="eager" decoding="async" data-tone="' + esc(tone(slug)) + '" data-cls="ill-mini ill">';
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
      '<span class="lbl">' + esc(dayName((now.getDay() + 6) % 7)) + ' · ' + esc(niceDate(now)) + ' · ' + esc(LX(b, 'label')) + (P.name ? ' · ' + esc(P.name) : '') + '</span>' +
      '<p class="big">' + esc(LX(m, 'label')) + '</p>' +
      '<p class="why">' + esc(LX(m, 'blurb')) + '</p>' +
      (dayDone()
        ? '<button class="btn ghost" data-act="start-now" type="button">' + esc(t('today.dayClosed')) + P.streak + '</button>'
        : '<button class="btn" data-act="start-now" type="button">' + esc(t('today.start')) + '</button>') +
      '</div></div>';

    /* disclosure without a scroll — personas panel's single biggest lever (14/40) */
    h += '<div class="coi tight">' + esc(LX(C.config, 'coiLong')) + '<br>' + esc(LX(C.config, 'voiceNote')) + '</div>';

    h += '<p class="h2">' + esc(t('today.threeSteps')) + '</p>';
    h += '<button class="step' + (d.p ? ' done' : '') + '" data-act="open-pod" type="button">' +
      '<span class="n">' + (d.p ? '✓' : '1') + '</span><span><span class="t">' + esc(t('today.step1')) + '</span>' +
      '<span class="s">' + (pc ? esc(pc.title) : t('today.step1sub')) + '</span></span></button>';
    h += '<button class="step' + (d.x ? ' done' : '') + '" data-act="open-prac" type="button">' +
      '<span class="n">' + (d.x ? '✓' : '2') + '</span><span><span class="t">' + esc(t('today.step2')) + '</span>' +
      '<span class="s">' + esc(LX(pr, 'title')) + '</span></span></button>';
    h += '<button class="step' + (d.c ? ' done' : '') + '" data-act="tick" type="button">' +
      '<span class="n">' + (d.c ? '✓' : '3') + '</span><span><span class="t">' + esc(t('today.step3')) + '</span>' +
      '<span class="s">' + esc(LX(ck, 'text')) + '</span></span></button>';

    /* step 4 — reading minute, optional on purpose */
    var R = C.config.reading;
    h += '<button class="step opt' + (d.r ? ' done' : '') + '" data-act="open-read" type="button">' +
      '<span class="n">' + (d.r ? '✓' : '4') + '</span><span><span class="t">📖 ' + esc(LX(R, 'title')) + '</span>' +
      '<span class="s">' + esc(LX(R, 'sub')) + ' · ' + esc(LX(R, 'optional')) + '</span></span></button>';

    /* book of the week */
    var bk = bookOfWeek();
    h += '<p class="h2" style="--tone:' + tone('reading') + '">' + esc(LX(R, 'weekTitle')) + '</p>';
    h += '<div class="card" style="--tone:' + tone('reading') + '">' +
      '<p class="lbl">' + esc(bk.who) + '</p>' +
      '<h3 style="font-size:19px;margin:0 0 6px">' + esc(bk.title) + '</h3>' +
      '<p class="sm muted" style="margin:0 0 10px">' + esc(bk.author) + '</p>' +
      '<p class="sm" style="margin:0 0 10px">' + esc(bk.why) + '</p>' +
      '<p class="src"><b>' + esc(t('bl.edition')) + '</b> · ' + esc(bk.lt) + '</p></div>';

    /* today's game */
    h += '<p class="h2" style="--tone:' + tone(GAME_SLUG[g.id]) + '">' + esc(t('today.game')) + '</p>' +
      '<a class="catrow" style="--tone:' + tone(GAME_SLUG[g.id]) + '" href="#/zaidimai/' + esc(g.id) + '">' +
      '<span class="ic">' + illMini(GAME_SLUG[g.id]) + '</span>' +
      '<span class="tx"><b>' + esc(LX(g, 'name')) + '</b><span>' + esc(LX(g, 'sub')) + (!g.free && !S.plus ? ' · 🔒 MKK+' : '') + '</span></span>' +
      '<span class="ar">→</span></a>';

    /* ambient */
    h += '<p class="h2">' + esc(t('today.ambient')) + '</p><div class="chips">';
    AMBIENTS.forEach(function (a) {
      h += '<button class="chip" data-act="amb" data-amb="' + esc(a.id) + '" aria-pressed="' + (S.ambient === a.id) + '" type="button">' + esc(isEN() ? a.en : a.name) + '</button>';
    });
    h += '</div><p class="xs muted">' + esc(t('today.ambientNote')) + '</p>';

    h += '<p class="foot">' + esc(LX(C.config, 'disclaimerShort')) + '</p>';
    return scr(slug, h);
  }

  /* ---------- Treniruotės ---------- */
  function scrTechniques(cat) {
    var T = C.techniques, h = '';
    if (!cat) {
      h += '<span class="lbl">' + esc(t('tab.training')) + '</span><p class="big">' + esc(t('tr.title')) + '</p>' +
        '<p class="muted sm">' + T.techniques.length + esc(t('tr.sub1')) + T.myths.length + esc(t('tr.sub2')) + '</p><div class="spacer"></div>';
      T.categories.forEach(function (c) {
        var n = c.id === 'mitai' ? T.myths.length : T.techniques.filter(function (t) { return t.cat === c.id; }).length;
        var s = CAT_SLUG[c.id];
        h += '<a class="catrow" style="--tone:' + tone(s) + '" href="#/treniruotes/' + esc(c.id) + '">' +
          '<span class="ic">' + illMini(s) + '</span>' +
          '<span class="tx"><b>' + esc(LX(c, 'label')) + '</b><span>' + esc(LX(c, 'blurb')) + '</span></span>' +
          '<span class="ar">' + n + ' →</span></a>';
      });
      h += '<p class="note">' + esc(t('tr.freeNote')) + '</p>';
      return scr('brain-learns', h);
    }
    var c = null, i;
    for (i = 0; i < T.categories.length; i++) if (T.categories[i].id === cat) c = T.categories[i];
    if (!c) return scrTechniques(null);
    var slug = CAT_SLUG[c.id];
    h += '<a class="chip" href="#/treniruotes">' + esc(t('back')) + '</a><div class="spacer"></div>';
    h += ill(slug, 'ill');
    h += '<span class="lbl">' + esc(c.icon) + ' ' + esc(LX(c, 'label')) + '</span><p class="muted sm">' + esc(LX(c, 'blurb')) + '</p>';
    h += '<div class="card">';
    if (cat === 'mitai') {
      T.myths.forEach(function (m) {
        h += '<div class="item"><h3><span>' + esc(LX(m, 'name')) + '</span>' + evBadge('X') + '</h3>' +
          '<p class="how muted">' + esc(LX(m, 'claim')) + '</p>' +
          '<p class="how">' + esc(LX(m, 'truth')) + '</p>' +
          '<div class="prac"><b>' + esc(t('tr.instead')) + '</b> ' + esc(LX(m, 'instead')) + '</div>' +
          srcLine(m.src, m.id) + '</div>';
      });
    } else {
      var list = T.techniques.filter(function (t) { return t.cat === cat; });
      var free = freeTechIds();
      list.forEach(function (tq) {
        var locked = !S.plus && free.indexOf(tq.id) < 0;
        h += '<div class="item"><h3><span>' + esc(LX(tq, 'name')) + '</span>' + evBadge(evOf(tq)) + '</h3>';
        h += '<p class="how">' + esc(LX(tq, 'how')) + '</p>';
        if (locked) {
          h += '<div class="prac muted">' + esc(t('tr.lockedPractice')) + '<a href="#/as">' + esc(t('tr.seePlans')) + '</a></div>';
        } else {
          h += '<div class="prac"><b>' + esc(t('tr.twoMin')) + '</b> ' + esc(tq.practice) + '</div>';
          if (isEN() && !tq.practice_en) h += '<p class="meta">beta: practice text in LT for now</p>';
        }
        h += '<p class="meta">' + esc(t('tr.fromAge')) + tq.age + esc(t('tr.years')) + '</p>' + srcLine(tq.src, tq.id) + '</div>';
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
      h += '<span class="lbl">' + esc(t('tab.games')) + '</span><p class="big">' + esc(t('gm.title')) + '</p>' +
        '<p class="muted sm">' + esc(t('gm.sub')) + '</p><div class="spacer"></div>';
      G.forEach(function (g) {
        var s = GAME_SLUG[g.id];
        h += '<a class="catrow" style="--tone:' + tone(s) + '" href="#/zaidimai/' + esc(g.id) + '">' +
          '<span class="ic">' + illMini(s) + '</span>' +
          '<span class="tx"><b>' + esc(LX(g, 'name')) + '</b><span>' + esc(LX(g, 'sub')) + (!g.free && !S.plus ? ' · 🔒 MKK+' : '') + '</span></span>' +
          '<span class="ar">→</span></a>';
      });
      h += '<p class="note warn">' + esc(t('gm.note')) + '</p>';
      return scr('game-recall', h);
    }
    var g = null, i;
    for (i = 0; i < G.length; i++) if (G[i].id === id) g = G[i];
    if (!g) return scrGames(null);
    var slug = GAME_SLUG[g.id];
    h += '<a class="chip" href="#/zaidimai">' + esc(t('back')) + '</a><div class="spacer"></div>';
    h += ill(slug, 'ill');
    h += '<span class="lbl">' + esc(g.icon) + ' ' + esc(LX(g, 'name')) + ' ' + evBadge(evOf(g)) + '</span>';
    h += '<p class="muted sm">' + esc(LX(g, 'rule')) + '</p>';
    if (!g.free && !S.plus) {
      h += '<div class="card center"><p class="big">🔒</p><p class="sm">' + esc(t('gm.locked')) + '</p>' +
        '<a class="btn" href="#/as">' + esc(t('tr.seePlans')) + '</a></div>';
      h += '<p class="note">' + esc(LX(g, 'honest')) + '</p>';
      return scr(slug, h);
    }
    h += '<div class="card" id="gameBox"></div>';
    h += '<p class="note warn"><b>' + esc(t('gm.honest')) + '</b> ' + esc(LX(g, 'honest')) + '</p>';
    h += '<div class="card flat">' + srcLine(g.src, g.id) + '</div>';
    return scr(slug, h);
  }


  /* ---------- Tinklaraštis (blog.json + people.json + the old library) ---------- */
  var BLOG_SECTIONS = [
    { id: 'kaip', icon: '🧭', key: 'bl.tutorial', slug: 'brain-learns', type: 'tutorial' },
    { id: 'straipsniai', icon: '📝', key: 'bl.articles', slug: 'reading', type: 'article' },
    { id: 'blogpod', icon: '🎧', key: 'bl.podcasts', slug: 'attention', type: 'podcast' },
    { id: 'video', icon: '🎬', key: 'bl.videos', slug: 'focus', type: 'video' },
    { id: 'zmones', icon: '👥', key: 'bl.people', slug: 'movement', type: 'people' }
  ];
  /* {"lt":…,"en":…} or a plain string — both shapes are accepted */
  function bTx(o, f) {
    var v = o ? o[f] : null;
    if (!v) return '';
    if (typeof v === 'string') return v;
    return (LANG === 'en' && v.en) ? v.en : (v.lt || v.en || '');
  }
  function blogItems(type) {
    var out = [], i, b;
    if (!C.blog || !C.blog.length) return out;
    for (i = 0; i < C.blog.length; i++) {
      b = C.blog[i];
      if (b && b.type === type && (b.status || 'published') !== 'draft') out.push(b);
    }
    return out;
  }
  /* markdown-lite: blank line = paragraph · "- " = bullet · **bold** */
  function mdLite(txt) {
    var lines = String(txt || '').split('\n'), h = '', ul = false, i, l;
    function inline(x) { return esc(x).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }
    for (i = 0; i < lines.length; i++) {
      l = lines[i].trim();
      if (!l) { if (ul) { h += '</ul>'; ul = false; } continue; }
      if (l.indexOf('- ') === 0 || l.indexOf('· ') === 0) {
        if (!ul) { h += '<ul class="plain">'; ul = true; }
        h += '<li>' + inline(l.slice(2)) + '</li>';
      } else {
        if (ul) { h += '</ul>'; ul = false; }
        h += '<p class="how">' + inline(l) + '</p>';
      }
    }
    if (ul) h += '</ul>';
    return h;
  }
  function blogCard(b) {
    var h = '<div class="item"><h3><span>' + esc(bTx(b, 'title')) + '</span>' +
      (b.grade ? evBadge(b.grade) : '') + '</h3>';
    if (bTx(b, 'summary')) h += '<p class="how muted">' + esc(bTx(b, 'summary')) + '</p>';
    if (bTx(b, 'body')) h += mdLite(bTx(b, 'body'));
    if (b.source && b.source.name) {
      h += '<p class="src"><b>' + esc(t('bl.source')) + '</b> · ' +
        (b.source.url ? '<a href="' + esc(b.source.url) + '" target="_blank" rel="noopener">' + esc(b.source.name) + '</a>' : esc(b.source.name)) +
        (b.source.lang === 'lt' ? ' 🇱🇹' : '') + '</p>';
    }
    if (b.age) h += '<p class="meta">' + esc(b.age) + '</p>';
    return h + '</div>';
  }
  /* the tutorial is guaranteed: blog.json wins, otherwise this hand-written one */
  function tutorialFallback() {
    var lt = ['Pasirink amžių — nuo jo priklauso podcast’as, praktika ir klausimai.',
      'Kasdien atidaryk „Šiandien“ ir spausk vieną raudoną mygtuką. Viskas telpa į 3 minutes.',
      'Žingsnis 1 — perklausyk vienos minutės podcast’ą ir pasakyk, ką prisimeni.',
      'Žingsnis 2 — padaryk dviejų minučių praktiką. Ji kaskart kitokia.',
      'Žingsnis 3 — atsakyk į vieną varnelės klausimą. Tada diena uždaryta ir 🔥 serija auga.',
      'Nebūtinas 4 žingsnis — skaitymo minutė. Ji serijos neskaičiuoja, ir taip ir turi būti.'];
    var en = ['Pick an age band — it decides the podcast, the practice and the questions.',
      'Open "Today" every day and press the one red button. It all fits into 3 minutes.',
      'Step 1 — listen to the one-minute podcast and say what you remember.',
      'Step 2 — do the two-minute practice. It is different every day.',
      'Step 3 — answer one check question. The day is closed and the 🔥 streak grows.',
      'Optional step 4 — the reading minute. It never counts towards the streak, on purpose.'];
    var list = isEN() ? en : lt, h = '<div class="item"><h3><span>' + esc(t('bl.tutorial')) + '</span></h3><ol class="plain">', i;
    for (i = 0; i < list.length; i++) h += '<li>' + esc(list[i]) + '</li>';
    return h + '</ol></div>';
  }
  function peopleCards() {
    var h = '', i, p;
    if (!C.people || !C.people.length) return '<div class="item"><p class="how muted">' + esc(t('bl.emptyPeople')) + '</p></div>';
    for (i = 0; i < C.people.length; i++) {
      p = C.people[i];
      h += '<div class="item"><h3><span>' + esc(p.name) + (p.lt ? ' 🇱🇹' : '') + '</span></h3>' +
        '<p class="how muted">' + esc(bTx(p, 'role')) + '</p>' +
        '<p class="how">' + esc(bTx(p, 'why')) + '</p>';
      if (p.links && p.links.length) {
        h += '<p class="src">';
        p.links.forEach(function (l, k) {
          h += (k ? ' · ' : '') + '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>';
        });
        h += '</p>';
      }
      h += '</div>';
    }
    return h;
  }
  function scrBlog(seg) {
    var h = '', i, sec = null;
    for (i = 0; i < BLOG_SECTIONS.length; i++) if (BLOG_SECTIONS[i].id === seg) sec = BLOG_SECTIONS[i];

    if (!seg) {
      h += '<span class="lbl">' + esc(t('tab.blog')) + '</span><p class="big">' + esc(t('bl.title')) + '</p>' +
        '<p class="muted sm">' + esc(t('bl.sub')) + '</p><div class="spacer"></div>';
      BLOG_SECTIONS.forEach(function (x) {
        var n = x.type === 'people' ? (C.people ? C.people.length : 0)
          : (x.type === 'tutorial' ? Math.max(1, blogItems('tutorial').length) : blogItems(x.type).length);
        h += '<a class="catrow" style="--tone:' + tone(x.slug) + '" href="#/tinklarastis/' + esc(x.id) + '">' +
          '<span class="ic">' + illMini(x.slug) + '</span>' +
          '<span class="tx"><b>' + esc(x.icon) + ' ' + esc(t(x.key)) + '</b></span>' +
          '<span class="ar">' + (n ? n + ' →' : '→') + '</span></a>';
      });
      C.library.segments.forEach(function (x) {
        var sl = LIB_SLUG[x.id] || 'hero';
        h += '<a class="catrow" style="--tone:' + tone(sl) + '" href="#/tinklarastis/' + esc(x.id) + '">' +
          '<span class="ic">' + illMini(sl) + '</span><span class="tx"><b>' + esc(x.icon) + ' ' + esc(LX(x, 'label')) + '</b></span><span class="ar">→</span></a>';
      });
      return scr('reading', h);
    }
    if (!sec) return scrLibrary(seg);

    h += '<a class="chip" href="#/tinklarastis">' + esc(t('back')) + '</a><div class="spacer"></div>' +
      ill(sec.slug, 'ill') +
      '<span class="lbl">' + esc(sec.icon) + ' ' + esc(t(sec.key)) + '</span>';
    h += '<div class="card">';
    if (sec.type === 'people') {
      h += peopleCards();
    } else {
      var items = blogItems(sec.type);
      if (items.length) items.forEach(function (b) { h += blogCard(b); });
      else if (sec.type === 'tutorial') h += tutorialFallback();
      else h += '<div class="item"><p class="how muted">' + esc(t('bl.empty')) + '</p></div>';
    }
    h += '</div>';
    return scr(sec.slug, h);
  }

  /* ---------- Biblioteka (sekcijos gyvena Tinklaraštyje) ---------- */
  function scrLibrary(seg) {
    var L = C.library, h = '';
    if (!seg) return scrBlog(null);
    var s = null, i;
    for (i = 0; i < L.segments.length; i++) if (L.segments[i].id === seg) s = L.segments[i];
    if (!s) return scrBlog(null);
    var slug = LIB_SLUG[seg] || 'hero';
    /* bureliai stays FREE on purpose: it carries the conflict-of-interest disclosure. */
    var locked = !S.plus && seg === 'irankiai';
    h = '<a class="chip" href="#/tinklarastis">' + esc(t('back')) + '</a><div class="spacer"></div>' +
      ill(slug, 'ill') +
      '<span class="lbl">' + esc(s.icon) + ' ' + esc(LX(s, 'label')) + '</span>';

    if (locked) {
      h += '<div class="card center"><p class="big">🔒</p><p class="sm">' + esc(t('bl.locked')) + '</p><a class="btn" href="#/as">' + esc(t('tr.seePlans')) + '</a></div>';
      return scr(slug, h);
    }
    if (seg === 'bureliai') h += '<p class="muted sm">' + esc(LX(L, 'bureliaiIntro')) + '</p>';
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
          '<div class="prac"><b>' + esc(t('bl.means')) + '</b> ' + esc(b.means) + '</div>' +
          srcLine(b.src, b.id) + '</div>';
      });
    } else if (seg === 'bureliai') {
      L.bureliai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.icon) + ' ' + esc(b.label) + '</span>' + evBadge(evOf(b)) + '</h3>' +
          '<p class="how">' + esc(b.trains) + '</p>' +
          '<div class="prac"><b>' + esc(t('bl.athome')) + '</b><br>· ' + esc(b.home[0]) + '<br>· ' + esc(b.home[1]) + '</div>' +
          '<p class="meta">' + esc(b.evNote) + '</p>' + srcLine(b.src, b.id) + '</div>';
      });
      h += '<div class="item"><p class="how muted">' + esc(L.bureliaiKita) + '</p></div>';
    } else if (seg === 'irankiai') {
      L.irankiai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.icon) + ' ' + esc(b.title) + '</span>' + evBadge(evOf(b)) + '</h3><ol class="plain">';
        b.steps.forEach(function (st) { h += '<li>' + esc(st) + '</li>'; });
        h += '</ol><p class="meta">' + esc(b.evNote) + '</p>' + srcLine(b.src, b.id) + '</div>';
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
        '<span class="d"></span><span class="n">' + dayName(i) + '</span></span>';
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
        '<a class="btn" href="#/siandien">' + esc(t('today.start')) + '</a></div></div>';
    }
    var h = '<div class="card">';
    keys.forEach(function (k) {
      var d = P.days[k], marks = (d.p ? '🎙' : '·') + ' ' + (d.x ? '🎯' : '·') + ' ' + (d.c ? '✅' : '·') + ' ' + (d.r ? '📖' : '·');
      var parts = k.split('-'), dt = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      h += '<div class="hrow"><span class="hd">' + dayName((dt.getDay() + 6) % 7) + ' ' + niceDate(dt) + '</span>' +
        '<span class="hm">' + marks + '</span></div>';
    });
    return h + '</div>';
  }

  /* Miegu pattern: a named human, an honest "how it is made", scientists still to come. */
  function A(sec) {
    var a = C.about && C.about[sec];
    if (!a) return null;
    return a[LANG] || a.lt || null;
  }
  function aboutHTML(cfg) {
    var h = '<p class="h2">' + esc(t('me.about')) + '</p>', au = A('author'), mk = A('maker'),
      hw = A('how'), sc = A('scientists'), pv = A('privacy'), bt = A('beta');

    /* Apie autorių */
    h += '<div class="card"><p class="lbl">' + esc(t('ab.author')) + '</p>' +
      '<h3 style="font-size:19px;margin:0 0 4px">' + esc(au ? au.name : cfg.author) + '</h3>';
    if (au && au.role) h += '<p class="meta" style="margin:0 0 10px">' + esc(au.role) + '</p>';
    (au ? au.body : LXA(cfg, 'story')).forEach(function (l) { h += '<p class="sm">' + esc(l) + '</p>'; });
    h += '<hr class="sep"><div class="coi">' + esc(au ? au.coi : LX(cfg, 'coiLong')) + '</div>' +
      '<button class="btn ghost sm" data-act="method" type="button">' + esc(t('me.method')) + '</button></div>';

    /* Apie kūrėją */
    if (mk) {
      h += '<div class="card"><p class="lbl">' + esc(t('ab.maker')) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 8px">' + esc(mk.title) + '</h3>';
      mk.body.forEach(function (l) { h += '<p class="sm">' + esc(l) + '</p>'; });
      h += '<p class="note">' + esc(mk.note) + '</p></div>';
    }
    /* Kaip tai buvo padaryta */
    if (hw) {
      h += '<div class="card"><p class="lbl">' + esc(t('ab.how')) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 8px">' + esc(hw.title) + '</h3><ol class="plain">';
      hw.steps.forEach(function (l) { h += '<li>' + esc(l) + '</li>'; });
      h += '</ol></div>';
    }
    /* Mokslininkai — placeholder roles only, no invented names */
    if (sc) {
      h += '<div class="card flat"><p class="lbl">' + esc(t('ab.scientists')) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 8px">' + esc(sc.title) + '</h3>' +
        '<p class="sm">' + esc(sc.note) + '</p><ul class="plain">';
      sc.roles.forEach(function (l) { h += '<li class="muted">' + esc(l) + '</li>'; });
      h += '</ul><p class="meta">' + esc(sc.cta) + '</p></div>';
    }
    /* Privatumas */
    if (pv) {
      h += '<div class="card"><p class="lbl">' + esc(t('ab.privacy')) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 8px">' + esc(pv.title) + '</h3><ul class="plain">';
      pv.body.forEach(function (l) { h += '<li>' + esc(l) + '</li>'; });
      h += '</ul></div>';
    }
    /* Beta */
    if (bt) {
      h += '<div class="card"><p class="lbl">' + esc(t('ab.beta')) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 8px">' + esc(bt.title) + '</h3>' +
        '<p class="sm">' + esc(bt.body) + '</p>' +
        '<a class="btn" href="' + esc(bt.url || 'https://krisvas.lt') + '" target="_blank" rel="noopener">' + esc(bt.cta) + '</a></div>';
    }
    h += '<p class="meta" style="margin:16px 0 0">' + esc(VERSION) + ' · ' + esc(cfg.build) + '</p>';
    return h;
  }

  function scrMe() {
    if (!S.onboarded || !P) return scrOnboard();
    var cfg = C.config, b = bandObj(), h = '';
    h += '<span class="lbl">' + esc(t('tab.me')) + '</span><p class="big">' + esc(P.name || LX(b, 'label')) + (S.plus ? ' · MKK+' : '') + '</p>';
    h += '<p class="muted sm">' + esc(LX(b, 'label')) + (b.parentMode ? ' · ' + esc(t('me.parentMode')) : '') + '</p>';
    if (isEN()) h += '<p class="note">' + esc(t('sh.enBeta')) + '</p>';
    h += '<div class="spacer"></div>';

    /* week + stats */
    h += '<div class="card"><p class="lbl">' + esc(t('me.week')) + '</p>' + weekHTML() +
      '<div class="stats">' +
      '<div class="stat"><div class="v">' + P.streak + '</div><div class="k">' + esc(t('me.streak')) + '</div></div>' +
      '<div class="stat"><div class="v">' + totalSessions() + '</div><div class="k">' + esc(t('me.totalSessions')) + '</div></div>' +
      '<div class="stat"><div class="v">' + totalReading() + '</div><div class="k">' + esc(t('me.readingMin')) + '</div></div>' +
      '</div>' +
      '<p class="xs muted" style="margin:16px 0 0">Nepertraukiamas dalyvavimas siejasi su 70 % mažesne tikimybe mesti. Pertrauktas — atrodo taip pat kaip nedalyvavimas. ' + evBadge('B') + ' <span class="meta">ŠALTINIS · Thouin 2020</span></p></div>';

    /* profiles */
    h += '<p class="h2">' + esc(t('me.who')) + '</p>';
    S.profiles.forEach(function (p) {
      var bb = null, i;
      for (i = 0; i < cfg.bands.length; i++) if (cfg.bands[i].id === p.band) bb = cfg.bands[i];
      h += '<button class="catrow" style="--tone:' + tone('age-' + p.band) + '" data-act="switch" data-id="' + esc(p.id) + '" type="button" aria-pressed="' + (p.id === S.active) + '">' +
        '<span class="ic">' + illMini('age-' + p.band) + '</span>' +
        '<span class="tx"><b>' + esc(p.name || (bb ? LX(bb, 'label') : '—')) + '</b><span>' + esc(bb ? LX(bb, 'label') : '') + ' · 🔥 ' + p.streak + '</span></span>' +
        '<span class="ar">' + (p.id === S.active ? '✓' : '→') + '</span></button>';
    });
    h += '<div class="btnrow"><button class="btn ghost sm" data-act="add-child" type="button">' + esc(t('me.addChild')) + '</button>';
    if (S.profiles.length > 1) h += '<button class="btn ghost sm" data-act="del-child" type="button">' + esc(t('me.delChild')) + '</button>';
    h += '</div>';

    h += '<p class="h2">' + esc(t('me.age')) + '</p><div class="chips">';
    cfg.bands.forEach(function (x) {
      h += '<button class="chip" data-act="band" data-band="' + esc(x.id) + '" aria-pressed="' + (P.band === x.id) + '" type="button">' + esc(LX(x, 'label')) + '</button>';
    });
    h += '</div>';
    h += '<button class="check' + (P.parent ? ' on' : '') + '" data-act="parent" type="button"><span class="bx">' + (P.parent ? '✓' : '') + '</span>' +
      '<span><b>' + esc(t('me.parentMode')) + '</b><br><span class="xs muted">' + esc(t('me.parentModeNote')) + '</span></span></button>';

    /* history */
    h += '<p class="h2">' + esc(t('me.history')) + '</p>' + historyHTML();

    /* reminder */
    h += '<p class="h2" style="--tone:' + tone('sleep') + '">' + esc(t('me.reminder')) + '</p><div class="chips">';
    cfg.times.forEach(function (t) {
      h += '<button class="chip" data-act="remind" data-time="' + esc(t) + '" aria-pressed="' + (S.remind === t) + '" type="button">' + esc(t) + '</button>';
    });
    h += '<button class="chip" data-act="remind" data-time="" aria-pressed="' + (!S.remind) + '" type="button">' + esc(t('me.noReminder')) + '</button></div>' +
      '<p class="xs muted">' + esc(LX(cfg.onboarding, 's2note')) + '</p>';

    /* language — LT is the complete version, EN is labelled beta */
    h += '<p class="h2">' + esc(t('me.language')) + '</p><div class="chips">';
    [['lt', '🇱🇹 Lietuvių'], ['en', '🇬🇧 English · beta']].forEach(function (lg) {
      h += '<button class="chip" data-act="lang" data-lang="' + lg[0] + '" aria-pressed="' + (S.lang === lg[0]) + '" type="button">' + lg[1] + '</button>';
    });
    h += '</div><p class="xs muted">' + esc(t('me.langNote')) + '</p>';

    h += '<p class="h2">' + esc(t('me.colors')) + '</p><div class="chips">';
    [['auto', t('me.themeAuto')], ['light', t('me.themeLight')], ['dark', t('me.themeDark')]].forEach(function (th) {
      h += '<button class="chip" data-act="theme" data-theme="' + th[0] + '" aria-pressed="' + (S.theme === th[0]) + '" type="button">' + esc(th[1]) + '</button>';
    });
    h += '</div><span class="lbl">' + esc(t('me.changeColor')) + '</span><div class="swatches">';
    ACCENTS.forEach(function (a) {
      var an = isEN() ? a.en : a.name;
      h += '<button class="sw" data-act="accent" data-accent="' + a.id + '" aria-pressed="' + (S.accent === a.id) + '" style="background:' + a.v + '" title="' + esc(an) + '" aria-label="' + esc(an) + '" type="button"></button>';
    });
    h += '</div>';

    h += '<p class="h2">' + esc(t('today.ambient')) + '</p><div class="chips">';
    AMBIENTS.forEach(function (a) {
      h += '<button class="chip" data-act="amb" data-amb="' + esc(a.id) + '" aria-pressed="' + (S.ambient === a.id) + '" type="button">' + esc(isEN() ? a.en : a.name) + '</button>';
    });
    h += '</div>';

    /* plans — 3,99 primary, 6,99 secondary, no "⚠️ tikslinama" */
    h += '<p class="h2">' + esc(t('me.plans')) + '</p><div class="card"><p class="lbl">' + esc(LX(cfg.plans.free, 'name')) + '</p>' +
      '<p class="price">' + esc(cfg.plans.free.price) + '</p><ul class="plain">';
    LXA(cfg.plans.free, 'items').forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
    h += '</ul></div>';

    h += '<div class="card">' + (S.plus ? '<span class="pill">✓ Aktyvus</span>' : '') +
      '<p class="lbl">' + esc(LX(cfg.plans.plus, 'name')) + '</p>' +
      '<p class="price">' + esc(cfg.plans.plus.priceA) + '</p>' +
      '<p class="price2">' + esc(t('me.orB')) + esc(cfg.plans.plus.priceB) + '</p><ul class="plain">';
    LXA(cfg.plans.plus, 'items').forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
    h += '</ul>' + (S.plus
      ? '<p class="sm"><b>' + esc(t('me.plusOn')) + '</b>' + (S.code ? t('me.code') + esc(S.code) : '') + '</p>'
      : '<button class="btn" data-act="pay" type="button">' + esc(t('me.buy')) + '</button>') + '</div>';

    /* gift */
    h += '<div class="card"><p class="lbl">🎁 ' + esc(LX(cfg.plans.gift, 'title')) + '</p>' +
      '<p class="sm">' + esc(LX(cfg.plans.gift, 'help')) + '</p>' +
      '<div class="coi">' + esc(LX(cfg.plans.gift, 'coi')) + '</div>';
    if (S.plus) {
      h += '<p class="sm"><b>' + esc(t('me.plusActive')) + '</b>' + (S.code ? t('me.code') + esc(S.code) : '') + '</p>' +
        '<button class="btn ghost sm" data-act="unplus" type="button">' + esc(t('me.plusOff')) + '</button>';
    } else {
      h += '<input type="text" id="code" placeholder="' + esc(cfg.plans.gift.placeholder) + '" autocapitalize="characters" autocomplete="off">' +
        '<div class="spacer"></div><button class="btn" data-act="code" type="button">' + esc(t('me.enterCode')) + '</button>';
    }
    h += '</div>';

    /* install */
    if (isIOS() && !isStandalone()) {
      h += '<p class="h2">' + esc(t('me.appOnPhone')) + '</p><div class="card flat">' +
        '<p class="sm" style="margin:0 0 12px">' + esc(t('me.appOnPhoneNote')) + '</p>' +
        '<button class="btn ghost sm" data-act="ios" type="button">' + esc(t('me.iosHow')) + '</button></div>';
    }

    /* guests */
    /* courses */
    h += '<p class="h2">' + esc(t('me.courses')) + '</p>';
    [cfg.courses.today, cfg.courses.course].forEach(function (c) {
      h += '<div class="card"><p class="lbl">' + esc(LX(c, 'title')) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 8px">' + esc(LX(c, 'name')) + ' ' + evBadge(c.evidence) + '</h3>' +
        '<p class="sm" style="margin:0">' + esc(LX(c, 'body')) + '</p></div>';
    });
    h += '<div class="card flat"><p class="lbl">' + esc(t('me.nextCourses')) + '</p><ul class="plain">';
    LXA(cfg.courses, 'next').forEach(function (x) { h += '<li class="muted">' + esc(x) + '</li>'; });
    h += '</ul></div>';

    /* about — Apie autorių · Apie kūrėją · Kaip tai buvo padaryta · Mokslininkai · Privatumas · Beta */
    h += aboutHTML(cfg);

    h += '<div class="card flat">';
    LXA(cfg, 'disclaimerFull').forEach(function (l, i) { h += '<p class="' + (i === 0 ? 'lbl' : 'xs') + '">' + esc(l) + '</p>'; });
    h += '</div>';

    h += '<p class="h2">' + esc(t('me.data')) + '</p><div class="card flat"><p class="xs">' + esc(t('me.dataNote')) + '</p>' +
      '<button class="btn ghost sm" data-act="reset" type="button">' + esc(t('me.deleteAll')) + '</button></div>';

    return scr('hero', h);
  }

  /* ---------- podcast · practice · reading sheets ---------- */
  function openPodcast(auto) {
    var pc = podcastFor(P.band), h = '';
    if (!pc) {
      h = '<p class="sm">Šiam amžiui podcast\'as dar rašomas.</p><p class="big">🎙 įrašoma</p>' +
        '<p class="muted sm">Tuo tarpu žingsnis 2 veikia — pradėk nuo praktikos.</p>';
    } else {
      h = '<span class="lbl">' + esc(LX(bandObj(), 'label')) + ' · ' + (pc.minutes || 1) + esc(t('sh.minutes')) + '</span>' +
        '<h3 style="font-size:21px">' + esc(pc.title) + '</h3>';
      if (pc.audio) {
        h += '<div class="audio-wrap"><audio id="pod" controls preload="auto" src="' + esc(pc.audio) + '"></audio>' +
          '<p class="meta">' + esc(LX(C.config, 'voiceNote')) + '</p></div>';
      } else {
        h += '<p class="big">' + esc(t('sh.recording')) + '</p>';
      }
      if (isEN()) h += '<p class="note">' + esc(t('sh.podEnBeta')) + '</p>';
      h += '<hr class="sep"><span class="lbl">' + esc(t('sh.text')) + '</span><p class="sm" style="white-space:pre-line">' + esc(pc.script || '') + '</p>';
      if (pc.status === 'needs-ear-check') h += '<p class="meta">⚠️ Įrašą dar tikrina Kristijonas — balsas gali skambėti nelygiai.</p>';
    }
    h += '<hr class="sep"><span class="lbl">' + esc(t('sh.recall')) + '</span>' +
      '<p class="xs muted">' + esc(t('sh.recallNote')) + '</p><div class="btnrow">' +
      '<button class="btn ghost" data-act="recall" data-n="1" type="button">1</button>' +
      '<button class="btn ghost" data-act="recall" data-n="2" type="button">2</button>' +
      '<button class="btn ghost" data-act="recall" data-n="3" type="button">3</button></div>';
    h += '<div class="spacer"></div><button class="btn ok" data-act="did-pod" type="button">' + esc(t('sh.listened')) + '</button>';
    sheet(t('sh.podcast'), h, CAT_SLUG[modeToday().id]);
    if (auto) {
      var a = $('#pod');
      if (a) { var p = a.play(); if (p && p.catch) p.catch(function () {}); }
    }
  }
  function openPractice() {
    var p = practiceToday(), h = '';
    h += '<span class="lbl">' + esc(t('sh.two')) + evBadge(evOf(p)) + '</span><h3 style="font-size:21px">' + esc(LX(p, 'title')) + '</h3>' +
      '<p class="sm muted">' + esc(LX(p, 'why')) + '</p><ol class="plain">';
    LXA(p, 'steps').forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
    h += '</ol><p class="meta">' + esc(t('tr.fromAge')) + p.minAge + esc(t('tr.years')) + '</p>' + srcLine(p.src, p.id) +
      '<div class="spacer"></div><button class="btn ok" data-act="did-prac" type="button">' + esc(t('sh.done')) + '</button>';
    sheet(t('sh.practice'), h, CAT_SLUG[modeToday().id]);
  }

  /* reading minute — the feature Kris asked for and v0.1 silently skipped (critic 🟠7) */
  var RD = { t: null, left: 60 };
  function stopReading() { clearInterval(RD.t); RD.t = null; }
  function openReading() {
    var R = C.config.reading, h = '';
    RD.left = 60;
    h += '<span class="lbl">' + esc(LX(R, 'sub')) + ' ' + evBadge(evOf(R)) + '</span>';
    h += '<p class="sm muted">' + esc(LX(R, 'why')) + '</p>';
    h += '<div class="clock" id="rclk">1:00</div><div class="bar"><i id="rbar"></i></div>';
    h += '<div class="btnrow"><button class="btn" data-act="read-go" id="rgo" type="button">▶ Pradėti minutę</button></div>';
    h += '<ol class="plain" style="margin-top:20px">';
    LXA(R, 'steps').forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
    h += '</ol>';
    h += '<p class="note warn">' + esc(LX(R, 'honest')) + '</p>' + srcLine(R.src);
    h += '<div class="spacer"></div><button class="btn ok" data-act="did-read" type="button">' + esc(LX(R, 'done')) + '</button>';
    h += '<p class="xs muted center" style="margin-top:10px">' + esc(LX(R, 'optional')) + '</p>';
    sheet('📖 ' + LX(R, 'title'), h, 'reading');
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
    else if (tab === 'tinklarastis' || tab === 'biblioteka') { tab = 'tinklarastis'; html = scrBlog(sub); }
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
    toast(gained ? t('sh.streakToast') + P.streak : t('sh.marked'));
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
        if (!OB.band) { toast(t('ob.pickAge')); return; }
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
      toast(t('ob.started'));
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
    if (a === 'lang') {
      S.lang = el.getAttribute('data-lang') === 'en' ? 'en' : 'lt';
      save(); applyLang(); route(); toast(t('sh.langSwitched')); return;
    }
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
      sheet(t('sh.notYet'), '<p class="sm">Mokėjimų dar nėra — MKK yra prototipas, ne parduotuvė.</p>' +
        '<p class="sm">MKK+ kainuos <b>' + esc(C.config.plans.plus.priceA) + '</b>; yra ir ' + esc(C.config.plans.plus.priceB) + ' variantas.</p>' +
        '<div class="coi">' + esc(LX(C.config.plans.gift, 'coi')) + '</div>' +
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
    applyLang();
    applyTheme();
    var tb = document.getElementById('themeBtn');
    if (tb) tb.addEventListener('click', toggleTheme);
    if (window.matchMedia) {
      try { window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', paintThemeBtn); } catch (e) {}
    }
    document.addEventListener('click', onClick);
    $('#sheetClose').addEventListener('click', closeSheet);
    $('#scrim').addEventListener('click', closeSheet);
    $('#profileBtn').addEventListener('click', profileSheet);
    $('#streakBtn').addEventListener('click', function () {
      sheet('🔥 Serija', '<p class="big">' + (P ? P.streak : 0) + '</p><p class="sm">Dienų iš eilės, kai užbaigei tris žingsnius. Skaitymo minutė neskaičiuojama — ji nebūtina.</p>' +
        '<p class="sm muted">Nepertraukiamas dalyvavimas siejasi su 70 % mažesne tikimybe mesti. Pertrauktas dalyvavimas atrodo taip pat kaip nedalyvavimas. ' + evBadge('B') + ' <span class="meta">ŠALTINIS · Thouin 2020</span></p>' +
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
    if (window.MKK_CONTENT) {
      C = window.MKK_CONTENT;
      I18 = C.i18n || I18;
      start(); return;
    }
    var names = ['config', 'techniques', 'practices', 'library', 'games', 'podcasts', 'illustrations',
      'i18n', 'about', 'blog', 'people', 'sources-lt'];
    Promise.all(names.map(function (n) {
      return fetch('./content/' + n + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    })).then(function (a) {
      C = {
        config: a[0], techniques: a[1], practices: a[2], library: a[3],
        games: a[4], podcasts: a[5], illustrations: a[6] || {},
        i18n: a[7] || null, about: a[8] || null, blog: a[9] || null,
        people: a[10] || null, sourcesLt: a[11] || null
      };
      I18 = C.i18n || I18;
      if (!C.config || !C.techniques || !C.practices || !C.library || !C.games) {
        document.getElementById('view').innerHTML =
          '<div class="card"><p class="lbl">' + esc(t('err.title')) + '</p><p class="sm">' + esc(t('err.load')) + '</p></div>';
        return;
      }
      start();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
