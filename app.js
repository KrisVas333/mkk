/* MKK v0.1.0 — Mokymosi Meistrų Klubas. Plain JS, no framework, no build. */
(function () {
  'use strict';

  var C = null;            // content
  var KEY = 'mkk.v1';
  var S = {};              // state
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

  /* ---------- state ---------- */
  function loadState() {
    var d = {};
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
    S = {
      band: d.band || null,
      parent: d.parent === true,
      theme: d.theme || 'light',
      accent: d.accent || 'raudona',
      ambient: d.ambient || 'off',
      plus: d.plus === true,
      code: d.code || '',
      streak: d.streak || 0,
      lastDone: d.lastDone || '',
      days: d.days || {},
      games: d.games || {}
    };
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
    if (!S.days[k]) S.days[k] = { p: 0, x: 0, c: 0 };
    return S.days[k];
  }
  function dayDone() { var d = dayState(); return d.p && d.x && d.c; }
  function checkStreak() {
    if (!dayDone()) return false;
    if (S.lastDone === today()) return false;
    S.streak = (S.lastDone === yesterday()) ? S.streak + 1 : 1;
    S.lastDone = today();
    save();
    return true;
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
    for (i = 0; i < b.length; i++) if (b[i].id === S.band) return b[i];
    return b[0];
  }
  function bandMinAge() { return parseInt(String(S.band).split('-')[0], 10) || 8; }
  function isYoung() { return bandMinAge() <= 7; }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 2200);
  }
  function evBadge(ev) {
    var e = ev === '✗' ? 'X' : (ev || 'C');
    var lbl = e === 'X' ? '✗' : e;
    return '<button class="ev" data-ev="' + esc(e) + '" data-act="method" type="button" aria-label="Įrodymų lygis ' + esc(lbl) + ' — kaip vertinam">' + esc(lbl) + '</button>';
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

  /* ---------- neuron canvas ---------- */
  function neurons() {
    var cv = $('#net'); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), N = [], i, W, H;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    function size() {
      W = cv.width = cv.clientWidth * (window.devicePixelRatio > 1 ? 2 : 1);
      H = cv.height = cv.clientHeight * (window.devicePixelRatio > 1 ? 2 : 1);
    }
    size();
    for (i = 0; i < 26; i++) N.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
    function tone() {
      var c = getComputedStyle(document.documentElement).getPropertyValue('--net').trim();
      return c || '10,10,10';
    }
    function frame() {
      var col = tone(), a, b, d;
      ctx.clearRect(0, 0, W, H);
      for (i = 0; i < N.length; i++) {
        a = N[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; }
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        ctx.fillStyle = 'rgba(' + col + ',1)';
        ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, 6.3); ctx.fill();
      }
      for (i = 0; i < N.length; i++) {
        for (var j = i + 1; j < N.length; j++) {
          a = N[i]; b = N[j];
          d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < W / 4) {
            ctx.strokeStyle = 'rgba(' + col + ',' + (1 - d / (W / 4)) * 0.5 + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
    window.addEventListener('resize', function () { size(); if (reduce) frame(); });
  }

  /* ---------- sheet ---------- */
  function sheet(title, html) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheet').hidden = false; $('#scrim').hidden = false;
    $('#sheet').scrollTop = 0;
  }
  function closeSheet() { $('#sheet').hidden = true; $('#scrim').hidden = true; }

  function methodSheet() {
    var m = C.config.method, e = C.config.evidence, h = '', k;
    for (k = 0; k < m.intro.length; k++) h += '<p class="sm">' + esc(m.intro[k]) + '</p>';
    h += '<div class="spacer"></div>';
    ['A', 'B', 'C', 'X'].forEach(function (id) {
      h += '<div class="item"><h3><span>' + evBadge(id) + ' ' + esc(e[id].name) + '</span></h3>' +
        '<p class="sm muted" style="margin:0">' + esc(e[id].desc) + '</p></div>';
    });
    h += '<p class="lbl" style="margin-top:22px">Taisyklės</p><ul class="plain">';
    m.rules.forEach(function (r) { h += '<li>' + esc(r) + '</li>'; });
    h += '</ul><p class="lbl" style="margin-top:22px">Šaltiniai</p><ul class="plain">';
    m.sources.forEach(function (r) { h += '<li class="xs">' + esc(r) + '</li>'; });
    h += '</ul><p class="note">' + esc(m.note) + '</p>';
    sheet(m.title, h);
  }

  /* ---------- podcast ---------- */
  function podcastFor(band) {
    var p = C.podcasts, i;
    if (!p || !p.length) return null;
    for (i = 0; i < p.length; i++) if (p[i].band === band) return p[i];
    return null;
  }

  /* ---------- daily picks ---------- */
  function practiceToday() {
    var list = C.practices.practices.filter(function (p) { return p.minAge <= bandMinAge() + 2; });
    if (!list.length) list = C.practices.practices;
    return list[seed(today() + S.band) % list.length];
  }
  function checkToday() {
    var list = C.practices.checks.filter(function (p) { return p.minAge <= bandMinAge() + 2; });
    if (!list.length) list = C.practices.checks;
    return list[seed('c' + today() + S.band) % list.length];
  }

  /* ---------- screens ---------- */
  function scrOnboard() {
    var h = '<div class="scr"><div class="card hero">' +
      '<span class="lbl">' + esc(C.config.name) + ' · ' + esc(C.config.nameNote) + '</span>' +
      '<p class="big">' + esc(C.config.tagline) + '</p>' +
      '<p class="muted sm">Pirmas klausimas: kelių metų vaikas mokysis?</p></div>';
    h += '<p class="lbl">Amžius</p>';
    C.config.bands.forEach(function (b) {
      h += '<button class="catrow" data-act="band" data-band="' + esc(b.id) + '" type="button">' +
        '<span class="ic">' + (b.parentMode ? '👪' : '🧒') + '</span>' +
        '<span class="tx"><b>' + esc(b.label) + '</b><span>' + esc(b.note) + '</span></span>' +
        '<span class="ar">→</span></button>';
    });
    h += '<p class="note">Pasirinkimą bet kada pakeisi skiltyje „Aš“. Nieko nesiunčiam į internetą — viskas lieka šitame telefone.</p>';
    h += '<p class="foot">' + esc(C.config.disclaimerShort) + '</p></div>';
    return h;
  }

  function scrToday() {
    if (!S.band) return scrOnboard();
    var b = bandObj(), d = dayState(), pc = podcastFor(S.band), pr = practiceToday(), ck = checkToday();
    var g = C.games.games[seed('g' + today()) % C.games.games.length];
    var h = '<div class="scr">';
    h += '<div class="card hero">' +
      '<span class="lbl">' + esc(b.label) + (b.parentMode ? ' · su tėvais' : '') + ' · šiandien · 🔥 ' + S.streak + '</span>' +
      '<p class="big">' + esc(C.config.tagline) + '</p>' +
      '<p class="muted sm" style="margin:0 0 16px">Trys žingsniai. Trys minutės. Tiek.</p>' +
      '<button class="btn" data-act="start-now" type="button">▶ Pradėti dabar</button>' +
      '<p class="xs muted center" style="margin:10px 0 0">Vienas paspaudimas: podcast\'as groja, paskui vienas klausimas.</p></div>';

    /* 1 — podcast */
    h += '<button class="step' + (d.p ? ' done' : '') + '" data-act="open-pod" type="button">' +
      '<span class="n">' + (d.p ? '✓' : '1') + '</span><span><span class="t">🎙 Vienos minutės podcast\'as</span>' +
      '<span class="s">' + (pc ? esc(pc.title) : 'Šiandienos mintis') + '</span></span></button>';
    h += '<p class="xs muted" style="margin:-4px 0 14px 4px">' + esc(C.config.voiceNote) + '<br>' + esc(C.config.coi) + '</p>';

    /* 2 — practice */
    h += '<button class="step' + (d.x ? ' done' : '') + '" data-act="open-prac" type="button">' +
      '<span class="n">' + (d.x ? '✓' : '2') + '</span><span><span class="t">🎯 Dviejų minučių praktika</span>' +
      '<span class="s">' + esc(pr.title) + '</span></span></button>';

    /* 3 — check */
    h += '<button class="step' + (d.c ? ' done' : '') + '" data-act="tick" type="button">' +
      '<span class="n">' + (d.c ? '✓' : '3') + '</span><span><span class="t">✅ Vienas varnelės klausimas</span>' +
      '<span class="s">' + esc(ck.text) + '</span></span></button>';

    if (dayDone()) {
      h += '<div class="card flat center"><p class="lbl" style="margin:0 0 6px">Diena uždaryta</p>' +
        '<p class="big" style="margin:0">🔥 ' + S.streak + '</p>' +
        '<p class="muted sm" style="margin:6px 0 0">' + (S.streak === 1 ? 'Pirma diena iš eilės.' : S.streak + ' dienos iš eilės.') + '</p></div>';
    }

    /* today's game — visible without finishing the podcast */
    h += '<p class="h2">Šiandienos žaidimas</p>' +
      '<a class="catrow" href="#/zaidimai/' + esc(g.id) + '">' +
      '<span class="ic">' + esc(g.icon) + '</span>' +
      '<span class="tx"><b>' + esc(g.name) + '</b><span>' + esc(g.sub) + (!g.free && !S.plus ? ' · 🔒 MKK+' : '') + '</span></span>' +
      '<span class="ar">→</span></a>';

    /* ambient */
    h += '<p class="h2">Fono garsas</p><div class="chips">';
    AMBIENTS.forEach(function (a) {
      h += '<button class="chip" data-act="amb" data-amb="' + esc(a.id) + '" aria-pressed="' + (S.ambient === a.id) + '" type="button">' + esc(a.name) + '</button>';
    });
    h += '</div><p class="xs muted">Fono garsas — be mokslinių pažadų. Kai kam padeda uždengti triukšmą, ir tiek.</p>';

    h += '<p class="foot">' + esc(C.config.disclaimerShort) + '</p>';
    h += '</div>';
    return h;
  }

  function scrTechniques(cat) {
    var T = C.techniques, h = '<div class="scr">';
    if (!cat) {
      h += '<p class="lbl">Treniruotės</p><p class="big">Ką iš tikrųjų verta daryti.</p>' +
        '<p class="muted sm">' + T.techniques.length + ' technikos ir ' + T.myths.length + ' mitai. Kiekviena su įrodymų ženkleliu — paspausk jį.</p><div class="spacer"></div>';
      T.categories.forEach(function (c) {
        var n = c.id === 'mitai' ? T.myths.length : T.techniques.filter(function (t) { return t.cat === c.id; }).length;
        h += '<a class="catrow" href="#/treniruotes/' + esc(c.id) + '">' +
          '<span class="ic">' + esc(c.icon) + '</span>' +
          '<span class="tx"><b>' + esc(c.label) + '</b><span>' + esc(c.blurb) + '</span></span>' +
          '<span class="ar">' + n + ' →</span></a>';
      });
      h += '<p class="note">Nemokamai matai 5 technikas ir VISUS mitus. Likusios — MKK+.</p>';
      return h + '</div>';
    }
    var c = null, i;
    for (i = 0; i < T.categories.length; i++) if (T.categories[i].id === cat) c = T.categories[i];
    if (!c) return scrTechniques(null);
    h += '<a class="chip" href="#/treniruotes">← Atgal</a><div class="spacer"></div>';
    h += '<p class="lbl">' + esc(c.icon) + ' ' + esc(c.label) + '</p><p class="muted sm">' + esc(c.blurb) + '</p>';
    h += '<div class="card">';
    if (cat === 'mitai') {
      T.myths.forEach(function (m) {
        h += '<div class="item"><h3><span>' + esc(m.name) + '</span>' + evBadge('X') + '</h3>' +
          '<p class="how muted">„' + esc(m.claim) + '“</p>' +
          '<p class="how">' + esc(m.truth) + '</p>' +
          '<div class="prac"><b>Vietoj to:</b> ' + esc(m.instead) + '</div>' +
          '<p class="meta">' + esc(m.src) + '</p></div>';
      });
    } else {
      var list = T.techniques.filter(function (t) { return t.cat === cat; });
      var free = freeTechIds();
      list.forEach(function (t) {
        var locked = !S.plus && free.indexOf(t.id) < 0;
        h += '<div class="item"><h3><span>' + esc(t.name) + '</span>' + evBadge(t.ev) + '</h3>';
        h += '<p class="how">' + esc(t.how) + '</p>';
        if (locked) {
          h += '<div class="prac muted">🔒 Praktika — MKK+ dalis. <a href="#/as">Žiūrėti planus</a></div>';
        } else {
          h += '<div class="prac"><b>2 min:</b> ' + esc(t.practice) + '</div>';
        }
        h += '<p class="meta">Nuo ' + t.age + ' m. · ' + esc(t.src) + '</p></div>';
      });
    }
    h += '</div></div>';
    return h;
  }
  function freeTechIds() { return ['retrieval', 'spacing', 'success', 'wm4', 'feedback-work']; }

  function scrGames(id) {
    var G = C.games.games, h = '<div class="scr">';
    if (!id) {
      h += '<p class="lbl">Žaidimai</p><p class="big">Trys žaidimai. Nulis pažadų.</p>' +
        '<p class="muted sm">Kiekvienas sako, ką jis treniruoja — ir ko NE.</p><div class="spacer"></div>';
      G.forEach(function (g) {
        h += '<a class="catrow" href="#/zaidimai/' + esc(g.id) + '">' +
          '<span class="ic">' + esc(g.icon) + '</span>' +
          '<span class="tx"><b>' + esc(g.name) + '</b><span>' + esc(g.sub) + (!g.free && !S.plus ? ' · 🔒 MKK+' : '') + '</span></span>' +
          '<span class="ar">→</span></a>';
      });
      h += '<p class="note warn">Bendri „smegenų treniruokliai“ neperkelia įgūdžio: 2024 m. tyrimas su 235 vaikais (6–13 m.) rado pagerėjimą tik treniruotoje užduotyje. Todėl čia nėra nė vieno žaidimo, kuris žadėtų „lavinti smegenis“.</p>';
      return h + '</div>';
    }
    var g = null, i;
    for (i = 0; i < G.length; i++) if (G[i].id === id) g = G[i];
    if (!g) return scrGames(null);
    h += '<a class="chip" href="#/zaidimai">← Atgal</a><div class="spacer"></div>';
    h += '<p class="lbl">' + esc(g.icon) + ' ' + esc(g.name) + ' ' + evBadge(g.ev) + '</p>';
    h += '<p class="muted sm">' + esc(g.rule) + '</p>';
    if (!g.free && !S.plus) {
      h += '<div class="card center"><p class="big">🔒</p><p class="sm">Šis žaidimas — MKK+ dalis.</p>' +
        '<a class="btn" href="#/as">Žiūrėti planus</a></div>';
      h += '<p class="note">' + esc(g.honest) + '</p></div>';
      return h;
    }
    h += '<div class="card" id="gameBox"></div>';
    h += '<p class="note warn"><b>Sąžiningai:</b> ' + esc(g.honest) + '</p>';
    h += '<p class="meta xs muted">' + esc(g.src) + '</p>';
    return h + '</div>';
  }

  function scrLibrary(seg) {
    var L = C.library, h = '<div class="scr">';
    h += '<p class="lbl">Biblioteka</p>';
    if (!seg) {
      h += '<p class="big">Kur ieškoti toliau.</p><p class="muted sm">Knygos, filmai, tyrimai ir tai, ką galima padaryti namuose šįvakar.</p><div class="spacer"></div>';
      L.segments.forEach(function (s) {
        h += '<a class="catrow" href="#/biblioteka/' + esc(s.id) + '">' +
          '<span class="ic">' + esc(s.icon) + '</span><span class="tx"><b>' + esc(s.label) + '</b></span><span class="ar">→</span></a>';
      });
      return h + '</div>';
    }
    var s = null, i;
    for (i = 0; i < L.segments.length; i++) if (L.segments[i].id === seg) s = L.segments[i];
    if (!s) return scrLibrary(null);
    /* bureliai stays FREE on purpose: it carries the conflict-of-interest disclosure. */
    var locked = !S.plus && seg === 'irankiai';
    h = '<div class="scr"><a class="chip" href="#/biblioteka">← Atgal</a><div class="spacer"></div>' +
      '<p class="lbl">' + esc(s.icon) + ' ' + esc(s.label) + '</p>';

    if (locked) {
      h += '<div class="card center"><p class="big">🔒</p><p class="sm">Ši skiltis — MKK+ dalis.</p><a class="btn" href="#/as">Žiūrėti planus</a></div>';
      return h + '</div>';
    }
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
        h += '<div class="item"><h3><span>' + esc(b.title) + '</span>' + evBadge(b.ev) + '</h3>' +
          '<p class="meta" style="margin:0 0 6px">' + esc(b.year) + '</p>' +
          '<p class="how">' + esc(b.finding) + '</p>' +
          '<div class="prac"><b>Ką tai reiškia:</b> ' + esc(b.means) + '</div></div>';
      });
    } else if (seg === 'bureliai') {
      h = h.replace('<div class="card">', '<p class="muted sm">' + esc(L.bureliaiIntro) + '</p><div class="card">');
      L.bureliai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.icon) + ' ' + esc(b.label) + '</span>' + evBadge(b.ev) + '</h3>' +
          '<p class="how">' + esc(b.trains) + '</p>' +
          '<div class="prac"><b>Namuose:</b><br>· ' + esc(b.home[0]) + '<br>· ' + esc(b.home[1]) + '</div>' +
          '<p class="meta">' + esc(b.evNote) + '</p></div>';
      });
      h += '<div class="item"><p class="how muted">' + esc(L.bureliaiKita) + '</p></div>';
    } else if (seg === 'irankiai') {
      L.irankiai.forEach(function (b) {
        h += '<div class="item"><h3><span>' + esc(b.icon) + ' ' + esc(b.title) + '</span>' + evBadge(b.ev) + '</h3><ol class="plain">';
        b.steps.forEach(function (st) { h += '<li>' + esc(st) + '</li>'; });
        h += '</ol><p class="meta">' + esc(b.evNote) + '</p></div>';
      });
    }
    h += '</div></div>';
    return h;
  }

  function scrMe() {
    var cfg = C.config, b = bandObj(), h = '<div class="scr">';
    h += '<p class="lbl">Aš</p><p class="big">' + esc(b.label) + (S.plus ? ' · MKK+' : '') + '</p>';
    h += '<div class="card"><p class="lbl">Serija</p><p class="big" style="margin:0">🔥 ' + S.streak + '</p>' +
      '<p class="muted sm" style="margin:4px 0 0">Nepertraukiamas dalyvavimas siejasi su 70 % mažesne tikimybe mesti. Pertrauktas — atrodo taip pat kaip nedalyvavimas. ' + evBadge('B') + '</p></div>';

    h += '<p class="h2">Amžius</p><div class="chips">';
    cfg.bands.forEach(function (x) {
      h += '<button class="chip" data-act="band" data-band="' + esc(x.id) + '" aria-pressed="' + (S.band === x.id) + '" type="button">' + esc(x.label) + '</button>';
    });
    h += '</div>';
    h += '<button class="check' + (S.parent ? ' on' : '') + '" data-act="parent" type="button"><span class="bx">' + (S.parent ? '✓' : '') + '</span>' +
      '<span><b>Tėvų režimas</b><br><span class="xs muted">4–7 m. — suaugęs skaito ir klausia. Rekomenduojama.</span></span></button>';

    h += '<p class="h2">Spalvos</p><div class="chips">';
    [['auto', 'Sistema'], ['light', 'Šviesi'], ['dark', 'Tamsi']].forEach(function (t) {
      h += '<button class="chip" data-act="theme" data-theme="' + t[0] + '" aria-pressed="' + (S.theme === t[0]) + '" type="button">' + t[1] + '</button>';
    });
    h += '</div><p class="lbl">Keisti spalvą</p><div class="swatches">';
    ACCENTS.forEach(function (a) {
      h += '<button class="sw" data-act="accent" data-accent="' + a.id + '" aria-pressed="' + (S.accent === a.id) + '" style="background:' + a.v + '" title="' + esc(a.name) + '" aria-label="' + esc(a.name) + '" type="button"></button>';
    });
    h += '</div>';

    h += '<p class="h2">Fono garsas</p><div class="chips">';
    AMBIENTS.forEach(function (a) {
      h += '<button class="chip" data-act="amb" data-amb="' + esc(a.id) + '" aria-pressed="' + (S.ambient === a.id) + '" type="button">' + esc(a.name) + '</button>';
    });
    h += '</div>';

    /* plans */
    h += '<p class="h2">Planai</p><div class="card"><p class="lbl">' + esc(cfg.plans.free.name) + '</p>' +
      '<p class="price">' + esc(cfg.plans.free.price) + '</p><ul class="plain">';
    cfg.plans.free.items.forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
    h += '</ul></div>';

    h += '<div class="card"><p class="lbl">' + esc(cfg.plans.plus.name) + '</p>' +
      '<p class="price">' + esc(cfg.plans.plus.priceA) + ' <span class="muted">arba</span> ' + esc(cfg.plans.plus.priceB) + '</p>' +
      '<p class="xs muted">' + esc(cfg.plans.plus.priceNote) + '</p><ul class="plain">';
    cfg.plans.plus.items.forEach(function (x) { h += '<li>' + esc(x) + '</li>'; });
    h += '</ul><button class="btn" data-act="pay" type="button">Užsisakyti MKK+</button></div>';

    /* gift */
    h += '<div class="card"><p class="lbl">🎁 ' + esc(cfg.plans.gift.title) + '</p>' +
      '<p class="sm">' + esc(cfg.plans.gift.help) + '</p>' +
      '<div class="coi">' + esc(cfg.plans.gift.coi) + '</div>';
    if (S.plus) {
      h += '<p class="sm"><b>✓ MKK+ aktyvus</b>' + (S.code ? ' · kodas ' + esc(S.code) : '') + '</p>' +
        '<button class="btn ghost sm" data-act="unplus" type="button">Išjungti (testui)</button>';
    } else {
      h += '<input type="text" id="code" placeholder="' + esc(cfg.plans.gift.placeholder) + '" autocapitalize="characters" autocomplete="off">' +
        '<div class="spacer"></div><button class="btn" data-act="code" type="button">Įvesti kodą</button>';
    }
    h += '</div>';

    /* guests */
    h += '<p class="h2">Kviestiniai svečiai</p>';
    cfg.guests.forEach(function (g) {
      h += '<div class="card flat"><p class="lbl" style="margin:0 0 4px">' + esc(g.name) + ' · ' + esc(g.status) + '</p>' +
        '<p class="sm" style="margin:0">' + esc(g.topic) + '</p></div>';
    });

    /* courses */
    h += '<p class="h2">Kursai</p>';
    [cfg.courses.today, cfg.courses.course].forEach(function (c) {
      h += '<div class="card"><p class="lbl">' + esc(c.title) + '</p>' +
        '<h3 style="font-size:19px;margin:0 0 6px">' + esc(c.name) + ' ' + evBadge(c.evidence) + '</h3>' +
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
      '<p class="meta" style="margin-top:14px">' + esc(cfg.version) + ' · ' + esc(cfg.build) + '</p></div>';

    h += '<div class="card flat">';
    cfg.disclaimerFull.forEach(function (l, i) { h += '<p class="' + (i === 0 ? 'lbl' : 'xs') + '">' + esc(l) + '</p>'; });
    h += '</div>';

    h += '<p class="h2">Duomenys</p><div class="card flat"><p class="xs">Nulis analitikos, nulis slapukų, nulis serverio. Viskas, ką čia pažymi, lieka šitame telefone.</p>' +
      '<button class="btn ghost sm" data-act="reset" type="button">Ištrinti viską</button></div>';

    return h + '</div>';
  }

  /* ---------- podcast + practice sheets ---------- */
  function openPodcast(auto) {
    var pc = podcastFor(S.band), h = '';
    if (!pc) {
      h = '<p class="sm">Šiam amžiui podcast\'as dar rašomas.</p><p class="big">🎙 įrašoma</p>' +
        '<p class="muted sm">Tuo tarpu žingsnis 2 veikia — pradėk nuo praktikos.</p>';
    } else {
      h = '<p class="lbl">' + esc(bandObj().label) + ' · ' + (pc.minutes || 1) + ' min</p>' +
        '<h3 style="font-size:21px">' + esc(pc.title) + '</h3>';
      if (pc.audio) {
        h += '<div class="audio-wrap"><audio id="pod" controls preload="auto" src="' + esc(pc.audio) + '"></audio>' +
          '<p class="meta">' + esc(C.config.voiceNote) + '</p></div>';
      } else {
        h += '<p class="big">🎙 įrašoma</p>';
      }
      h += '<hr class="sep"><p class="lbl">Tekstas</p><p class="sm" style="white-space:pre-line">' + esc(pc.script || '') + '</p>';
      if (pc.status) h += '<p class="meta">' + esc(pc.status) + '</p>';
    }
    h += '<hr class="sep"><p class="lbl">Ką prisimeni?</p>' +
      '<p class="xs muted">Vienas paspaudimas. Ne pažymys — tik tavo paties patikrinimas.</p><div class="btnrow">' +
      '<button class="btn ghost" data-act="recall" data-n="1" type="button">1</button>' +
      '<button class="btn ghost" data-act="recall" data-n="2" type="button">2</button>' +
      '<button class="btn ghost" data-act="recall" data-n="3" type="button">3</button></div>';
    h += '<div class="spacer"></div><button class="btn ok" data-act="did-pod" type="button">Perklausiau ✓</button>';
    sheet('🎙 Podcast\'as', h);
    if (auto) {
      var a = $('#pod');
      if (a) { var p = a.play(); if (p && p.catch) p.catch(function () {}); }
    }
  }
  function openPractice() {
    var p = practiceToday(), h = '';
    h += '<p class="lbl">2 minutės ' + evBadge(p.ev) + '</p><h3 style="font-size:21px">' + esc(p.title) + '</h3>' +
      '<p class="sm muted">' + esc(p.why) + '</p><ol class="plain">';
    p.steps.forEach(function (s) { h += '<li>' + esc(s) + '</li>'; });
    h += '</ol><p class="meta">Nuo ' + p.minAge + ' m. · ' + esc(p.src) + '</p>' +
      '<div class="spacer"></div><button class="btn ok" data-act="did-prac" type="button">Padaryta ✓</button>';
    sheet('🎯 Praktika', h);
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
    var st = S.games.atsimink || {};
    var repeatAvail = st.date && st.date !== today() && st.items && st.items.length === 5;
    GM.sel = []; GM.mode = 'idle';

    function intro() {
      var h = '<p class="lbl">Prisiminimo praktika</p>';
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
      var left = 10, h = '<p class="lbl">Įsimink</p><div class="clock" id="gclk">10</div><div class="bar"><i id="gbar"></i></div><div class="grid5">';
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
      var h = '<p class="lbl">Rask tuos penkis · pažymėta <span id="gsel">0</span>/5</p><div class="grid5">';
      GM.board.forEach(function (x, i) {
        h += '<button class="cell" data-g="pick" data-i="' + i + '" aria-pressed="false" type="button">' + esc(x) + '</button>';
      });
      h += '</div><button class="btn" id="gsub" disabled data-g="submit" type="button">Patikrinti</button>';
      box.innerHTML = h;
    }
    /* update in place — re-rendering the whole grid on every tap flickers on a phone
       and detaches the button that was just tapped */
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
      S.games.atsimink = { date: today(), items: GM.items, missed: missed };
      save();
      h += '<p class="lbl">Rezultatas</p><div class="clock">' + right + '/5</div>';
      h += '<div class="grid5">';
      GM.board.forEach(function (x, i) {
        var was = GM.items.indexOf(x) >= 0, pick = GM.sel.indexOf(i) >= 0;
        var cls = was ? 'right' : (pick ? 'wrong' : '');
        h += '<div class="cell ' + cls + '">' + esc(x) + '</div>';
      });
      h += '</div>';
      h += '<p class="sm">' + (right >= 4 ? 'Geras lygis. Tarp 70 ir 90 % teisingų — ten, kur treniruotė dar yra treniruotė.' :
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
        h += '<p class="lbl">Kiek minučių?</p><div class="btnrow">' +
          '<button class="btn" data-g="start" data-m="2" type="button">2</button>' +
          '<button class="btn" data-g="start" data-m="5" type="button">5</button>' +
          '<button class="btn" data-g="start" data-m="10" type="button">10</button></div>';
      } else {
        h += '<p class="lbl">' + (GM.run ? 'Vienas darbas. Nieko kito.' : 'Pauzė') + '</p>' +
          '<div class="clock">' + fmt(GM.left) + '</div><div class="bar"><i style="width:' + (100 - Math.round(GM.left / GM.total * 100)) + '%"></i></div>' +
          '<div class="btnrow"><button class="btn ghost" data-g="toggle" type="button">' + (GM.run ? 'Pauzė' : 'Tęsti') + '</button>' +
          '<button class="btn ghost" data-g="stop" type="button">Baigti</button></div>';
      }
      h += '<hr class="sep"><p class="lbl">Prieš pradedant</p>';
      C.games.timerChecklist.forEach(function (t, i) {
        h += '<button class="check' + (GM.checks[i] ? ' on' : '') + '" data-g="chk" data-i="' + i + '" type="button">' +
          '<span class="bx">' + (GM.checks[i] ? '✓' : '') + '</span><span>' + esc(t) + '</span></button>';
      });
      h += '<div class="spacer"></div><button class="btn ghost sm" data-g="gray" type="button">' +
        (document.body.classList.contains('grayscale') ? 'Grąžinti spalvas' : '⚫ Pilko ekrano iššūkis') + '</button>';
      box.innerHTML = h;
    }
    function tick() {
      if (!GM.run) return;
      GM.left--;
      if (GM.left <= 0) { GM.run = false; GM.left = 0; clearInterval(GM.t); beep(); draw(); toast('Laikas. Dabar pasakyk vieną dalyką iš atminties.'); return; }
      draw();
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
      var h = '<p class="lbl">Tema</p><p class="big" style="font-size:22px">' + esc(GM.topic) + '</p>';
      if (phase === 'run') {
        h += '<div class="clock">' + GM.left + '</div><div class="bar"><i style="width:' + ((60 - GM.left) / 60 * 100) + '%"></i></div>' +
          '<p class="sm muted">Kalbėk garsiai. Be užrašų. Jei sustoji — vis tiek kalbėk.</p>' +
          '<button class="btn ghost" data-g="stop" type="button">Baigiau</button>';
      } else if (phase === 'rate') {
        h += '<p class="lbl">Kaip sekėsi?</p>';
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
      draw('run');
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

  /* ---------- router ---------- */
  function route() {
    var hash = location.hash.replace(/^#\/?/, '') || 'siandien';
    var parts = hash.split('/');
    var tab = parts[0] || 'siandien', sub = parts[1] || '';
    var v = $('#view'), html;

    if (!S.band && tab !== 'as') { html = scrOnboard(); tab = 'siandien'; }
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
    $('#streakN').textContent = S.streak;
    if (tab === 'zaidimai' && sub) gameMount(sub);
    clearInterval(GM.t);
    if (tab === 'zaidimai' && sub) gameMount(sub);
  }

  /* ---------- actions ---------- */
  function markDone(field) {
    var d = dayState();
    d[field] = 1; save();
    var gained = checkStreak();
    closeSheet(); route();
    toast(gained ? '🔥 Serija: ' + S.streak : 'Pažymėta ✓');
  }

  function onClick(e) {
    var el = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!el) return;
    var a = el.getAttribute('data-act');

    if (a === 'method') { methodSheet(); return; }
    if (a === 'band') {
      S.band = el.getAttribute('data-band');
      var b = bandObj();
      if (b.parentMode) S.parent = true;
      save(); route(); toast('Amžius: ' + b.label); return;
    }
    if (a === 'parent') { S.parent = !S.parent; save(); route(); return; }
    if (a === 'theme') { S.theme = el.getAttribute('data-theme'); save(); applyTheme(); route(); return; }
    if (a === 'accent') { S.accent = el.getAttribute('data-accent'); save(); applyTheme(); route(); return; }
    if (a === 'amb') {
      S.ambient = el.getAttribute('data-amb'); save(); ambientStart(S.ambient); route();
      toast(S.ambient === 'off' ? 'Garsas išjungtas' : 'Fono garsas įjungtas'); return;
    }
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
    if (a === 'did-pod') { markDone('p'); return; }
    if (a === 'did-prac') { markDone('x'); return; }
    if (a === 'tick') { markDone('c'); return; }
    if (a === 'pay') {
      sheet('Netrukus', '<p class="sm">Mokėjimų dar nėra — MKK yra prototipas, ne parduotuvė.</p>' +
        '<p class="sm">Kaina dar nenuspręsta: ' + esc(C.config.plans.plus.priceA) + ' ar ' + esc(C.config.plans.plus.priceB) + '. ⚠️ tikslinama.</p>' +
        '<div class="coi">' + esc(C.config.plans.gift.coi) + '</div>' +
        '<p class="sm">Turi nuomonę apie kainą? Parašyk: krisvas.lt</p>');
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
      sheet('Ištrinti viską?', '<p class="sm">Dings amžius, serija, spalvos ir kodas. Atgal nebus.</p>' +
        '<button class="btn" data-act="reset2" type="button">Taip, ištrinti</button>');
      return;
    }
    if (a === 'reset2') {
      try { localStorage.removeItem(KEY); } catch (er) {}
      loadState(); applyTheme(); closeSheet(); location.hash = '#/siandien'; route(); toast('Ištrinta'); return;
    }
  }

  /* ---------- boot ---------- */
  function start() {
    loadState();
    applyTheme();
    document.addEventListener('click', onClick);
    $('#sheetClose').addEventListener('click', closeSheet);
    $('#scrim').addEventListener('click', closeSheet);
    $('#streakBtn').addEventListener('click', function () {
      sheet('🔥 Serija', '<p class="big">' + S.streak + '</p><p class="sm">Dienų iš eilės, kai užbaigei visus tris žingsnius.</p>' +
        '<p class="sm muted">Nepertraukiamas dalyvavimas siejasi su 70 % mažesne tikimybe mesti. Pertrauktas dalyvavimas atrodo taip pat kaip nedalyvavimas. ' + evBadge('B') + '</p>' +
        '<p class="meta">Serija skaičiuojama tik šitame telefone.</p>');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    window.addEventListener('hashchange', route);
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
    var names = ['config', 'techniques', 'practices', 'library', 'games', 'podcasts'];
    Promise.all(names.map(function (n) {
      return fetch('./content/' + n + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    })).then(function (a) {
      C = { config: a[0], techniques: a[1], practices: a[2], library: a[3], games: a[4], podcasts: a[5] };
      if (!C.config || !C.techniques || !C.practices || !C.library || !C.games) {
        document.getElementById('view').innerHTML =
          '<div class="card"><p class="lbl">Klaida</p><p class="sm">Nepavyko įkelti turinio. Paleisk per serverį: <code>python3 -m http.server</code></p></div>';
        return;
      }
      start();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
