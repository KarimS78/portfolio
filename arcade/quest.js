/* KARIM QUEST — le village 16-bit du mode arcade.
   Tout est dessiné au canvas (aucune image). Chaque bâtiment ouvre un contenu déjà présent dans la page :
   les projets (cartes .proj clonées), le parcours et le contact. */
(function () {
  'use strict';
  var T = 16, MW = 30, MH = 20, SCALE = 2;
  var PAL = { teal: '#34E0C4', amber: '#F2B441', magenta: '#E0567E', cream: '#F3ECDE', ink: '#12101F', grey: '#A9B2C8' };

  /* ---------- textes ---------- */
  var B = [
    { id: 'aquarys', x: 17, y: 2, w: 6, h: 5, roof: '#1f9c88', wall: '#f3ecde', proj: 'Aquarys', label: { fr: 'LABO', en: 'LAB' }, sub: 'AQUARYS',
      npc: { fr: 'GARDIENNE DU LABO', en: 'LAB KEEPER' }, line: { fr: 'Tu veux voir comment AQUARYS protège ses données ? Entre : contrôle d\'accès au niveau base, rôle par rôle.', en: 'Want to see how AQUARYS protects its data? Come in: database-level access control, role by role.' } },
    { id: 'vigie', x: 3, y: 2, w: 3, h: 5, roof: '#e0567e', wall: '#cfc7b4', tower: true, proj: 'Vigie', label: { fr: 'TOUR', en: 'TOWER' }, sub: 'VIGIE',
      npc: { fr: 'VEILLEUR', en: 'WATCHMAN' }, line: { fr: 'D\'ici, on voit qui est sur quelle zone, et depuis quand. Monte voir VIGIE.', en: 'From up here you see who is in which zone, and since when. Come up and see VIGIE.' } },
    { id: 'classifile', x: 9, y: 3, w: 5, h: 4, roof: '#b9801f', wall: '#f3ecde', proj: 'Classifile', label: { fr: 'ARCHIVES', en: 'ARCHIVES' }, sub: 'CLASSIFILE',
      npc: { fr: 'ARCHIVISTE', en: 'ARCHIVIST' }, line: { fr: 'Ici, les papiers se rangent tout seuls. Sans réseau, sans cloud. Entre voir CLASSIFILE.', en: 'In here, documents sort themselves. No network, no cloud. Come and see CLASSIFILE.' } },
    { id: 'sidequest', x: 3, y: 12, w: 5, h: 4, roof: '#7a2f47', wall: '#e2c9a0', proj: 'SideQuest', label: { fr: 'TAVERNE', en: 'TAVERN' }, sub: 'SIDEQUEST',
      npc: { fr: 'TAVERNIER', en: 'INNKEEPER' }, line: { fr: 'Tu ne sais pas à quoi jouer ce soir ? SIDEQUEST choisit pour toi, et te dit pourquoi.', en: 'Not sure what to play tonight? SIDEQUEST picks for you, and tells you why.' } },
    { id: 'lumea', x: 17, y: 12, w: 5, h: 4, roof: '#5b6cc9', wall: '#f3ecde', proj: 'Lumea', label: { fr: 'ATELIER', en: 'WORKSHOP' }, sub: 'LUMEA',
      npc: { fr: 'ARTISANE', en: 'CRAFTSWOMAN' }, line: { fr: 'Un site sur mesure, du design au nom de domaine ? C\'est l\'atelier LUMEA.', en: 'A bespoke site, from design to domain? That is the LUMEA workshop.' } },
    { id: 'about', x: 23, y: 11, w: 6, h: 5, roof: '#232043', wall: '#a9b2c8', guild: true, go: 'about', label: { fr: 'GUILDE APPSEC', en: 'APPSEC GUILD' }, sub: { fr: 'PARCOURS', en: 'BACKGROUND' },
      npc: { fr: 'MAÎTRE DE GUILDE', en: 'GUILD MASTER' }, line: { fr: 'Bienvenue à la guilde AppSec. La fiche de perso et le parcours de Karim sont affichés à l\'intérieur.', en: 'Welcome to the AppSec guild. Karim\'s character sheet and background are posted inside.' } },
    { id: 'contact', x: 9, y: 12, w: 4, h: 4, roof: '#f2b441', wall: '#f3ecde', go: 'contact', label: { fr: 'POSTE', en: 'POST' }, sub: 'CONTACT',
      npc: { fr: 'FACTEUR', en: 'POSTMAN' }, line: { fr: 'Un poste, un projet ? Laisse un message à Karim, je le lui porte.', en: 'A role, a project? Leave Karim a message, I\'ll deliver it.' } }
  ];
  var TXT = {
    enter: { fr: '▶ ENTRER', en: '▶ ENTER' }, later: { fr: 'PLUS TARD', en: 'LATER' }, ok: { fr: 'OK', en: 'OK' },
    cat: { n: { fr: 'CHAT', en: 'CAT' }, l: { fr: 'Miaou. (Il a l\'air d\'approuver ta revue de code.)', en: 'Meow. (It seems to approve of your code review.)' } },
    sign: { n: { fr: 'PANNEAU', en: 'SIGNPOST' }, l: { fr: 'KARIM QUEST — Nord : labo, archives, tour. Sud : taverne, poste, atelier, guilde. Trois bugs rôdent dans le village.', en: 'KARIM QUEST — North: lab, archives, tower. South: tavern, post, workshop, guild. Three bugs roam the village.' } },
    chest: { n: { fr: 'COFFRE', en: 'CHEST' }, l: { fr: 'Tu trouves la planque du dev : une clé « .env » qui n\'aurait jamais dû être commitée. Tu la ranges dans un coffre-fort de secrets.', en: 'You found the dev\'s stash: a ".env" key that should never have been committed. You move it into a secrets vault.' }, l2: { fr: 'Le coffre est vide. Les secrets sont au coffre-fort.', en: 'The chest is empty. The secrets are in the vault.' } },
    bugs: [
      { n: 'SQLi', fr: 'SQLi écrasée — requêtes paramétrées.', en: 'SQLi squashed — parameterized queries.' },
      { n: 'XSS', fr: 'XSS écrasée — encodage en sortie + CSP.', en: 'XSS squashed — output encoding + CSP.' },
      { n: 'IDOR', fr: 'IDOR écrasée — vérifier le propriétaire à chaque requête.', en: 'IDOR squashed — check ownership on every request.' }
    ],
    allBugs: { fr: 'TOUS LES BUGS CORRIGÉS · validé AppSec', en: 'ALL BUGS FIXED · AppSec approved' },
    allQuests: { fr: 'VILLAGE EXPLORÉ À 100 %', en: 'VILLAGE 100% EXPLORED' }
  };
  function lang() { return document.documentElement.lang === 'fr' ? 'fr' : 'en'; }
  function tr(o) { return typeof o === 'string' ? o : o[lang()]; }

  /* ---------- carte ---------- */
  var solid = [], path = [], water = [], trees = [], flowers = [];
  var i, x, y;
  for (i = 0; i < MW * MH; i++) { solid.push(false); path.push(false); water.push(false); }
  function idx(x, y) { return y * MW + x; }
  function inMap(x, y) { return x >= 0 && y >= 0 && x < MW && y < MH; }
  function setPath(x0, y0, x1, y1) { for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) path[idx(xx, yy)] = true; }
  setPath(1, 9, 28, 10); setPath(4, 7, 4, 8); setPath(11, 7, 11, 8); setPath(19, 7, 20, 8); setPath(14, 11, 15, 17); setPath(4, 17, 27, 17);
  setPath(5, 16, 5, 16); setPath(10, 16, 10, 16); setPath(19, 16, 19, 16); setPath(25, 16, 25, 16);
  for (y = 1; y <= 5; y++) for (x = 24; x <= 28; x++) { water[idx(x, y)] = true; solid[idx(x, y)] = true; }
  B.forEach(function (b) { for (var yy = b.y; yy < b.y + b.h; yy++) for (var xx = b.x; xx < b.x + b.w; xx++) solid[idx(xx, yy)] = true;
    b.dx = b.x + Math.floor((b.w - 1) / 2); b.dy = b.y + b.h; b.done = false; });
  function tree(x, y) { if (inMap(x, y) && !solid[idx(x, y)] && !path[idx(x, y)]) { solid[idx(x, y)] = true; trees.push({ x: x, y: y }); } }
  for (x = 0; x < MW; x++) { tree(x, 0); tree(x, MH - 1); }
  for (y = 0; y < MH; y++) { tree(0, y); tree(MW - 1, y); }
  [[1, 12], [2, 12], [2, 13], [2, 14], [7, 2], [7, 5], [15, 2], [15, 4], [16, 6], [23, 7], [27, 7], [8, 13], [13, 13], [16, 12], [22, 13], [1, 1], [8, 1], [28, 8], [1, 8], [6, 11], [21, 11], [12, 18], [18, 18], [24, 18]].forEach(function (p) { tree(p[0], p[1]); });
  var seed = 12345; function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  for (i = 0; i < 46; i++) { x = 1 + Math.floor(rnd() * 28); y = 1 + Math.floor(rnd() * 18); if (!solid[idx(x, y)] && !path[idx(x, y)]) flowers.push({ x: x, y: y, c: rnd() }); }

  var things = [
    { kind: 'cat', x: 8, y: 11 }, { kind: 'sign', x: 13, y: 11 }, { kind: 'chest', x: 1, y: 13, open: false }
  ];
  B.forEach(function (b, k) { things.push({ kind: 'npc', x: b.dx + 1, y: b.dy, b: b, hue: k }); });
  things.forEach(function (t) { solid[idx(t.x, t.y)] = true; });
  var bugs = [{ x: 24, y: 8 }, { x: 8, y: 18 }, { x: 16, y: 5 }].map(function (p, k) { return { x: p.x, y: p.y, px: p.x * T, py: p.y * T, k: k, alive: true, next: 0 }; });
  var player = { x: 14, y: 10, px: 14 * T, py: 10 * T, dir: 0, moving: false, tx: 14, ty: 10, route: [], bump: null, step: 0 };
  var DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]];  // bas, gauche, droite, haut

  /* ---------- DOM ---------- */
  var root, canvas, ctx, bg, dlg, toastEl, modal, hud, keys = {}, dialogOpen = false, lastTrigger = null, raf = 0, vw = 480, vh = 320, lastT = 0, time = 0, toastTimer = 0, lastCW = -1;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function bi(e, o) { e.setAttribute('data-en', typeof o === 'string' ? o : o.en); e.setAttribute('data-fr', typeof o === 'string' ? o : o.fr); e.textContent = tr(o); return e; }
  function relang() { if (window.__applyLang) window.__applyLang(); }

  function toast(o) { toastEl.textContent = tr(o); toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 3200); }
  function updateHud() {
    var q = B.filter(function (b) { return b.done; }).length, g = bugs.filter(function (b) { return !b.alive; }).length;
    hud.textContent = (lang() === 'fr' ? 'QUÊTES ' : 'QUESTS ') + q + '/' + B.length + ' · BUGS ' + g + '/' + bugs.length;
    hud.setAttribute('data-fr', 'QUÊTES ' + q + '/' + B.length + ' · BUGS ' + g + '/' + bugs.length); hud.setAttribute('data-en', 'QUESTS ' + q + '/' + B.length + ' · BUGS ' + g + '/' + bugs.length);
  }
  function closeDialog() { dialogOpen = false; dlg.classList.remove('on'); dlg.innerHTML = ''; canvas.focus({ preventScroll: true }); }
  function openDialog(name, line, buttons) {
    dialogOpen = true; player.route = []; keys = {}; dlg.innerHTML = '';
    dlg.appendChild(bi(el('div', 'q-name px'), name)); dlg.appendChild(bi(el('p', 'q-line'), line));
    var row = el('div', 'q-btns');
    buttons.forEach(function (b, k) { var bt = bi(el('button', 'q-btn px' + (k ? ' alt' : '')), b.label); bt.type = 'button'; bt.addEventListener('click', function () { closeDialog(); if (b.fn) b.fn(); }); row.appendChild(bt); });
    dlg.appendChild(row); dlg.classList.add('on'); relang();
    var first = row.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function enterBuilding(b) {
    var was = b.done; b.done = true; updateHud(); relang();
    if (!was && B.every(function (q) { return q.done; })) toast(TXT.allQuests);
    if (b.go) { if (window.__arcadeShow) window.__arcadeShow(b.go); return; }
    var src = null; document.querySelectorAll('#screen-projects .proj').forEach(function (a) { var h = a.querySelector('h3'); if (h && h.textContent.trim() === b.proj) src = a; });
    if (!src) { if (window.__arcadeShow) window.__arcadeShow('projects'); return; }
    var body = modal.querySelector('.q-modal-body'); body.innerHTML = ''; var c = src.cloneNode(true); c.classList.add('boss'); body.appendChild(c);
    modal.classList.add('on'); relang(); modal.querySelector('.q-close').focus({ preventScroll: true });
  }
  function talkBuilding(b) { openDialog(b.npc, b.line, [{ label: TXT.enter, fn: function () { enterBuilding(b); } }, { label: TXT.later }]); }
  function interact(t) {
    if (t.kind === 'npc') talkBuilding(t.b);
    else if (t.kind === 'cat') openDialog(TXT.cat.n, TXT.cat.l, [{ label: TXT.ok }]);
    else if (t.kind === 'sign') openDialog(TXT.sign.n, TXT.sign.l, [{ label: TXT.ok }]);
    else if (t.kind === 'chest') { openDialog(TXT.chest.n, t.open ? TXT.chest.l2 : TXT.chest.l, [{ label: TXT.ok }]); t.open = true; }
  }
  function thingAt(x, y) { for (var k = 0; k < things.length; k++) if (things[k].x === x && things[k].y === y) return things[k]; return null; }
  function buildingAt(x, y) { for (var k = 0; k < B.length; k++) { var b = B[k]; if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b; } return null; }
  function doorOf(x, y) { for (var k = 0; k < B.length; k++) if (B[k].dx === x && B[k].dy === y) return B[k]; return null; }

  /* ---------- déplacement ---------- */
  function free(x, y) { return inMap(x, y) && !solid[idx(x, y)]; }
  function route(tx, ty) {
    if (!free(tx, ty)) return null;
    var prev = {}, q = [[player.tx, player.ty]], s = idx(player.tx, player.ty); prev[s] = -1;
    while (q.length) { var c = q.shift(); if (c[0] === tx && c[1] === ty) break;
      for (var d = 0; d < 4; d++) { var nx = c[0] + DIRS[d][0], ny = c[1] + DIRS[d][1], n = idx(nx, ny); if (free(nx, ny) && prev[n] === undefined) { prev[n] = idx(c[0], c[1]); q.push([nx, ny]); } } }
    var e = idx(tx, ty); if (prev[e] === undefined) return null;
    var out = []; while (e !== s) { out.unshift([e % MW, Math.floor(e / MW)]); e = prev[e]; } return out;
  }
  function goTo(tx, ty) {
    var b = buildingAt(tx, ty), th = thingAt(tx, ty); player.bump = null;
    if (b) { tx = b.dx; ty = b.dy; }
    else if (th) { var best = null; for (var d = 0; d < 4; d++) { var r = route(th.x + DIRS[d][0], th.y + DIRS[d][1]); if (r && (!best || r.length < best.length)) best = r; }
      if (best) { player.route = best; player.bump = th; if (!best.length) { interact(th); player.bump = null; } } return; }
    var r2 = route(tx, ty); if (r2) player.route = r2;
  }
  function tryStep(d) {
    var nx = player.tx + DIRS[d][0], ny = player.ty + DIRS[d][1]; player.dir = d;
    if (free(nx, ny)) { player.tx = nx; player.ty = ny; player.moving = true; return true; }
    var th = thingAt(nx, ny); if (th) interact(th); else { var b = buildingAt(nx, ny); if (b && nx === b.dx && d === 3) talkBuilding(b); }
    return false;
  }
  function update(dt) {
    time += dt;
    if (!dialogOpen && !modal.classList.contains('on')) {
      if (!player.moving) {
        var d = keys.down ? 0 : keys.left ? 1 : keys.right ? 2 : keys.up ? 3 : -1;
        if (d >= 0) { player.route = []; player.bump = null; tryStep(d); }
        else if (player.route.length) { var n = player.route.shift(), dd = n[0] > player.tx ? 2 : n[0] < player.tx ? 1 : n[1] > player.ty ? 0 : 3; if (!tryStep(dd)) player.route = []; }
        else if (player.bump) { var t = player.bump; player.bump = null; player.dir = t.x > player.tx ? 2 : t.x < player.tx ? 1 : t.y > player.ty ? 0 : 3; interact(t); }
      }
      if (player.moving) {
        var sp = 88 * dt, gx = player.tx * T, gy = player.ty * T; player.step += dt * 9;
        player.px += Math.max(-sp, Math.min(sp, gx - player.px)); player.py += Math.max(-sp, Math.min(sp, gy - player.py));
        if (player.px === gx && player.py === gy) { player.moving = false; var b = doorOf(player.tx, player.ty);
          if (b && lastTrigger !== b) { lastTrigger = b; player.dir = 3; talkBuilding(b); } else if (!b) lastTrigger = null; }
      }
    }
    bugs.forEach(function (g) {
      if (!g.alive) return;
      if (time > g.next) { g.next = time + 0.5 + Math.random() * 0.9; var d = DIRS[Math.floor(Math.random() * 4)], nx = g.x + d[0], ny = g.y + d[1]; if (free(nx, ny) && !doorOf(nx, ny)) { g.x = nx; g.y = ny; } }
      g.px += Math.max(-1, Math.min(1, g.x * T - g.px)); g.py += Math.max(-1, Math.min(1, g.y * T - g.py));
      if (Math.abs(g.px - player.px) < 10 && Math.abs(g.py - player.py) < 10) { g.alive = false; g.dead = time; updateHud(); relang();
        toast(bugs.every(function (q) { return !q.alive; }) ? { fr: TXT.bugs[g.k].fr + ' ' + TXT.allBugs.fr, en: TXT.bugs[g.k].en + ' ' + TXT.allBugs.en } : TXT.bugs[g.k]); }
    });
  }

  /* ---------- dessin ---------- */
  function R(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
  function buildBg() {
    bg = document.createElement('canvas'); bg.width = MW * T; bg.height = MH * T; var g = bg.getContext('2d'), s = 99;
    function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    g.fillStyle = '#3a8f55'; g.fillRect(0, 0, bg.width, bg.height);
    for (var k = 0; k < 2600; k++) { g.fillStyle = r() > 0.5 ? '#348350' : '#46a062'; g.fillRect(Math.floor(r() * bg.width), Math.floor(r() * bg.height), 2, 1); }
    for (var yy = 0; yy < MH; yy++) for (var xx = 0; xx < MW; xx++) if (path[idx(xx, yy)]) {
      g.fillStyle = '#d9c38a'; g.fillRect(xx * T, yy * T, T, T);
      for (var q = 0; q < 5; q++) { g.fillStyle = r() > 0.5 ? '#c9b074' : '#e6d4a2'; g.fillRect(xx * T + Math.floor(r() * 14), yy * T + Math.floor(r() * 14), 2, 2); }
      g.fillStyle = '#b89c62';
      if (!inMap(xx, yy - 1) || !path[idx(xx, yy - 1)]) g.fillRect(xx * T, yy * T, T, 1);
      if (!inMap(xx, yy + 1) || !path[idx(xx, yy + 1)]) g.fillRect(xx * T, yy * T + T - 1, T, 1);
      if (!inMap(xx - 1, yy) || !path[idx(xx - 1, yy)]) g.fillRect(xx * T, yy * T, 1, T);
      if (!inMap(xx + 1, yy) || !path[idx(xx + 1, yy)]) g.fillRect(xx * T + T - 1, yy * T, 1, T);
    }
    flowers.forEach(function (f) { var c = f.c < 0.33 ? '#f3ecde' : f.c < 0.66 ? '#f2b441' : '#e0567e'; g.fillStyle = c; g.fillRect(f.x * T + 4, f.y * T + 6, 2, 2); g.fillRect(f.x * T + 10, f.y * T + 10, 2, 2); g.fillStyle = '#2a6e40'; g.fillRect(f.x * T + 4, f.y * T + 8, 2, 2); g.fillRect(f.x * T + 10, f.y * T + 12, 2, 2); });
  }
  function hourNow() { var d = new Date(); return typeof window.__questHour === 'number' ? window.__questHour : d.getHours() + d.getMinutes() / 60; }
  function sky() { var h = hourNow(), t = (h - 6) / 13, e = t >= 0 && t <= 1 ? Math.sin(Math.PI * t) : -Math.sin(Math.PI * (((h - 19 + 24) % 24) / 11));
    var night = Math.max(0, Math.min(1, (0.02 - e) / 0.32)), dusk = Math.max(0, 1 - Math.abs(e) / 0.4); return { night: night, dusk: dusk }; }
  function drawTree(x, y) { R('#5a3d2e', x + 6, y + 9, 4, 6); R('#1d5a37', x + 1, y - 4, 14, 13); R('#1d5a37', x + 3, y - 6, 10, 2); R('#2a7a48', x + 3, y - 4, 7, 5); R('#174a2d', x + 2, y + 6, 12, 3); }
  function drawPerson(x, y, dir, step, hoodie, hairC, headphones) {
    var bob = step !== null ? (Math.floor(step) % 2) : 0; y -= 4;
    R('rgba(0,0,0,.25)', x + 2, y + 18, 12, 2);
    R('#2a3350', x + 4, y + 14, 3, 4 - bob); R('#2a3350', x + 9, y + 14, 3, 3 + bob);
    R(hoodie, x + 3, y + 8, 10, 7); R(hoodie, x + 2, y + 9, 1, 4); R(hoodie, x + 13, y + 9, 1, 4);
    R('#c98b66', x + 4, y + 2, 8, 7); R(hairC, x + 4, y + 1, 8, 3);
    if (dir === 3) R(hairC, x + 4, y + 1, 8, 7);
    else if (dir === 0) { R('#12101f', x + 5, y + 5, 1, 2); R('#12101f', x + 10, y + 5, 1, 2); }
    else if (dir === 1) { R(hairC, x + 8, y + 1, 4, 6); R('#12101f', x + 5, y + 5, 1, 2); }
    else { R(hairC, x + 4, y + 1, 4, 6); R('#12101f', x + 10, y + 5, 1, 2); }
    if (headphones) { R('#12101f', x + 4, y, 8, 1); R(PAL.teal, x + 3, y + 3, 1, 3); R(PAL.teal, x + 12, y + 3, 1, 3); }
  }
  function drawBuilding(b, sk) {
    var x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T, rh = b.tower ? 14 : Math.floor(h * 0.42), lit = sk.night > 0.3;
    R('rgba(0,0,0,.22)', x + 3, y + h - 2, w, 4);
    R(b.wall, x + 1, y + rh, w - 2, h - rh); R('rgba(0,0,0,.14)', x + 1, y + h - 4, w - 2, 4); R('rgba(0,0,0,.18)', x + 1, y + rh, w - 2, 3);
    R(b.roof, x - 1, y, w + 2, rh); for (var k = 4; k < rh; k += 4) R('rgba(0,0,0,.18)', x - 1, y + k, w + 2, 1); R('rgba(255,255,255,.18)', x - 1, y, w + 2, 2);
    if (b.tower) { for (var c = 0; c < w; c += 8) R(b.wall, x + c, y - 4, 5, 5); R(PAL.amber, x + w / 2 - 1, y - 14, 2, 10); R(PAL.magenta, x + w / 2 + 1, y - 14, 7, 5); }
    if (b.guild) { R(PAL.teal, x + w / 2 - 6, y + 4, 12, 10); R('#232043', x + w / 2 - 4, y + 6, 8, 6); R(PAL.teal, x + w / 2 - 1, y + 7, 2, 4); }
    var dxp = b.dx * T + 2; R('#12101f', dxp, y + h - 15, 12, 15); R('#5a3d2e', dxp + 1, y + h - 14, 10, 14); R(PAL.amber, dxp + 8, y + h - 7, 2, 2);
    var wy = y + rh + 6; for (var wx = x + 5; wx + 9 <= x + w - 4; wx += 14) { if (wx + 9 > dxp - 2 && wx < dxp + 14 && wy + 9 > y + h - 16) continue; R('#12101f', wx, wy, 9, 9); R(lit ? '#ffd58a' : '#7fb2ff', wx + 1, wy + 1, 7, 7); R('rgba(18,16,31,.55)', wx + 4, wy + 1, 1, 7); }
    if (b.done) { R(PAL.teal, x + w - 9, y + rh + 1, 7, 7); R('#12101f', x + w - 7, y + rh + 4, 1, 2); R('#12101f', x + w - 6, y + rh + 5, 1, 2); R('#12101f', x + w - 5, y + rh + 3, 1, 3); R('#12101f', x + w - 4, y + rh + 2, 1, 2); }
  }
  function drawLabel(b) {
    var a = tr(b.label), s = tr(b.sub), cx = b.x * T + b.w * T / 2, top = b.y * T - (b.tower ? 40 : 24);
    ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var w = Math.max(ctx.measureText(a).width, ctx.measureText(s).width) + 8, x0 = Math.round(Math.max(2, Math.min(MW * T - w - 2, cx - w / 2)));
    top = Math.max(2, top); R('#12101f', x0, top, w, 22); R(b.done ? PAL.teal : PAL.amber, x0, top + 21, w, 1);
    ctx.fillStyle = PAL.cream; ctx.fillText(a, x0 + w / 2, top + 3); ctx.fillStyle = PAL.amber; ctx.fillText(s, x0 + w / 2, top + 12);
  }
  function draw() {
    var sk = sky(), camX = Math.round(Math.max(0, Math.min(MW * T - vw, player.px + 8 - vw / 2))), camY = Math.round(Math.max(0, Math.min(MH * T - vh, player.py + 8 - vh / 2)));
    if (vw >= MW * T) camX = 0; if (vh >= MH * T) camY = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.fillStyle = '#12101f'; ctx.fillRect(0, 0, vw, vh);
    ctx.translate(-camX, -camY); ctx.drawImage(bg, 0, 0);
    var ph = Math.floor(time * 2) % 2;
    for (var yy = 1; yy <= 5; yy++) for (var xx = 24; xx <= 28; xx++) { R('#2b6fb0', xx * T, yy * T, T, T); R('#7fb2ff', xx * T + ((xx + yy + ph) % 2 ? 3 : 8), yy * T + 5 + ((xx * 3 + yy) % 3) * 3, 5, 1); if (yy === 1) R('#d9c38a', xx * T, yy * T, T, 2); }
    R('#f2b441', 26 * T + 4 + Math.round(Math.sin(time) * 10), 3 * T + 6, 4, 2);
    var list = [];
    trees.forEach(function (t) { list.push({ y: t.y * T, f: function () { drawTree(t.x * T, t.y * T); } }); });
    B.forEach(function (b) { list.push({ y: (b.y + b.h - 1) * T, f: function () { drawBuilding(b, sk); } }); });
    things.forEach(function (t) { list.push({ y: t.y * T, f: function () { var x = t.x * T, y = t.y * T;
      if (t.kind === 'npc') { var cols = ['#34a0c4', '#8a5fd0', '#b9801f', '#3f9a5f', '#d07a3a', '#5b6cc9', '#c04a6a']; drawPerson(x, y, 0, null, cols[t.hue % cols.length], t.hue % 2 ? '#5a3d2e' : '#2b2230', false);
        if (!t.b.done && Math.floor(time * 2) % 2) { R(PAL.amber, x + 6, y - 14, 4, 6); R(PAL.amber, x + 6, y - 6, 4, 3); } }
      else if (t.kind === 'cat') { R('rgba(0,0,0,.25)', x + 3, y + 13, 10, 2); R('#2b2230', x + 3, y + 7, 10, 6); R('#2b2230', x + 3, y + 4, 2, 3); R('#2b2230', x + 7, y + 4, 2, 3); R(PAL.amber, x + 4, y + 8, 1, 1); R(PAL.amber, x + 7, y + 8, 1, 1); R('#2b2230', x + 13, y + 5 + ph, 1, 6); }
      else if (t.kind === 'sign') { R('#5a3d2e', x + 7, y + 6, 2, 9); R('#9a6b45', x + 2, y + 1, 12, 7); R('#12101f', x + 4, y + 3, 8, 1); R('#12101f', x + 4, y + 5, 5, 1); }
      else if (t.kind === 'chest') { R('rgba(0,0,0,.25)', x + 2, y + 13, 12, 2); R('#7a4a22', x + 2, y + 5, 12, 9); R('#5a3d2e', x + 2, y + (t.open ? 2 : 5), 12, 3); R(PAL.amber, x + 7, y + 8, 2, 3); if (t.open) R('#12101f', x + 3, y + 5, 10, 2); }
    } }); });
    bugs.forEach(function (g) { if (g.alive) list.push({ y: g.py, f: function () { var x = Math.round(g.px), y = Math.round(g.py), w = Math.floor(time * 6) % 2;
      R('rgba(0,0,0,.25)', x + 4, y + 13, 8, 2); R(PAL.magenta, x + 4, y + 6, 8, 6); R('#12101f', x + 5, y + 8, 2, 2); R('#12101f', x + 9, y + 8, 2, 2); R(PAL.magenta, x + 2, y + 6 + w, 2, 1); R(PAL.magenta, x + 12, y + 7 - w, 2, 1); R(PAL.magenta, x + 2, y + 10 - w, 2, 1); R(PAL.magenta, x + 12, y + 10 + w, 2, 1); R(PAL.magenta, x + 5, y + 4, 1, 2); R(PAL.magenta, x + 10, y + 4, 1, 2); } });
      else if (time - g.dead < 0.5) list.push({ y: g.py, f: function () { var k = (time - g.dead) / 0.5, x = Math.round(g.px) + 8, y = Math.round(g.py) + 8; for (var a = 0; a < 6; a++) R(a % 2 ? PAL.amber : PAL.cream, x + Math.cos(a) * k * 12, y + Math.sin(a) * k * 12, 2, 2); } }); });
    list.push({ y: player.py + 1, f: function () { drawPerson(Math.round(player.px), Math.round(player.py), player.dir, player.moving ? player.step : null, '#c75d43', '#1f1820', true); } });
    list.sort(function (a, b) { return a.y - b.y; }); for (var k = 0; k < list.length; k++) list[k].f();
    if (player.route.length) { var e = player.route[player.route.length - 1]; R('rgba(52,224,196,.8)', e[0] * T + 6, e[1] * T + 6 + (ph ? 1 : 0), 4, 4); }
    if (sk.dusk > 0.02 && sk.night < 0.6) { ctx.fillStyle = 'rgba(255,120,60,' + (0.16 * sk.dusk).toFixed(3) + ')'; ctx.fillRect(camX, camY, vw, vh); }
    if (sk.night > 0.02) { ctx.fillStyle = 'rgba(10,14,60,' + (0.5 * sk.night).toFixed(3) + ')'; ctx.fillRect(camX, camY, vw, vh);
      B.forEach(function (b) { var x = b.x * T, y = b.y * T, w = b.w * T, rh = b.tower ? 14 : Math.floor(b.h * T * 0.42), dxp = b.dx * T + 2, wy = y + rh + 6;
        for (var wx = x + 5; wx + 9 <= x + w - 4; wx += 14) { if (wx + 9 > dxp - 2 && wx < dxp + 14 && wy + 9 > y + b.h * T - 16) continue; ctx.fillStyle = 'rgba(255,213,138,' + (0.9 * sk.night).toFixed(2) + ')'; ctx.fillRect(wx + 1, wy + 1, 7, 7); ctx.fillStyle = 'rgba(255,213,138,' + (0.14 * sk.night).toFixed(2) + ')'; ctx.fillRect(wx - 3, wy - 3, 15, 17); } }); }
    B.forEach(drawLabel);
  }
  function frame(t) {
    raf = requestAnimationFrame(frame);
    var active = root.classList.contains('active') && document.body.classList.contains('entered') && !document.hidden;
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t; if (!active) return;
    if (root.clientWidth !== lastCW) resize();
    update(dt); draw();
  }
  function resize() {
    lastCW = root.clientWidth; var cw = Math.min(lastCW, 960); if (cw < 100) return;
    vw = Math.min(MW * T, Math.floor(cw / SCALE)); vh = Math.min(MH * T, Math.max(200, Math.floor(Math.min(window.innerHeight * 0.62, 640) / SCALE)));
    canvas.width = vw; canvas.height = vh; canvas.style.width = (vw * SCALE) + 'px'; canvas.style.height = (vh * SCALE) + 'px';
  }

  function init() {
    root = document.getElementById('screen-quest'); if (!root) return;
    canvas = root.querySelector('canvas'); ctx = canvas.getContext('2d'); dlg = root.querySelector('.q-dialog'); toastEl = root.querySelector('.q-toast'); hud = root.querySelector('.q-count'); modal = document.getElementById('q-modal');
    buildBg(); resize(); updateHud(); window.addEventListener('resize', resize);
    var KM = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', z: 'up', s: 'down', a: 'left', q: 'left', d: 'right' };
    document.addEventListener('keydown', function (ev) {
      if (!root.classList.contains('active') || !document.body.classList.contains('entered')) return;
      if (modal.classList.contains('on')) { if (ev.key === 'Escape') modal.classList.remove('on'); return; }
      if (dialogOpen) { if (ev.key === 'Escape') closeDialog(); return; }
      var tag = (ev.target && ev.target.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      var k = KM[ev.key.length === 1 ? ev.key.toLowerCase() : ev.key];
      if (k) { keys[k] = true; ev.preventDefault(); }
      else if (ev.key === 'm' || ev.key === 'M') { if (window.__arcadeShow) window.__arcadeShow('menu'); }
      else if (ev.key === 'e' || ev.key === 'E' || ev.key === 'Enter' || ev.key === ' ') { var th = thingAt(player.tx + DIRS[player.dir][0], player.ty + DIRS[player.dir][1]); if (th && !player.moving) { ev.preventDefault(); interact(th); } }
    });
    document.addEventListener('keyup', function (ev) { var k = KM[ev.key.length === 1 ? ev.key.toLowerCase() : ev.key]; if (k) keys[k] = false; });
    window.addEventListener('blur', function () { keys = {}; });
    canvas.addEventListener('click', function (ev) {
      if (dialogOpen) return; var r = canvas.getBoundingClientRect();
      var camX = vw >= MW * T ? 0 : Math.round(Math.max(0, Math.min(MW * T - vw, player.px + 8 - vw / 2))), camY = vh >= MH * T ? 0 : Math.round(Math.max(0, Math.min(MH * T - vh, player.py + 8 - vh / 2)));
      var tx = Math.floor(((ev.clientX - r.left) / r.width * vw + camX) / T), ty = Math.floor(((ev.clientY - r.top) / r.height * vh + camY) / T);
      if (inMap(tx, ty)) goTo(tx, ty);
    });
    modal.querySelector('.q-close').addEventListener('click', function () { modal.classList.remove('on'); canvas.focus({ preventScroll: true }); });
    root.querySelector('.q-fast').addEventListener('click', function () { if (window.__arcadeShow) window.__arcadeShow('menu'); });
    raf = requestAnimationFrame(frame);
    window.__quest = { player: player, B: B, bugs: bugs, goTo: goTo, state: function () { return { x: player.tx, y: player.ty, dialog: dialogOpen, modal: modal.classList.contains('on') }; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
