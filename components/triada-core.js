/* ═══════════════════════════════════════════════════════════════
   triada-core.js — standalone "living core" renderer (variant: Tríada).

   Framework-agnostic. No globals, no store singleton, no localStorage.
   You drive it with an explicit state object and it renders a boiling
   three-force plasma core onto any <canvas>.

   ── Communication contract (what the visual says) ─────────────
     • energy (0..1)     → outer gauge fill + nucleus brightness + agitation
     • pillars (levels)  → the 3 lobes' size + colour blend + which leads
     • level (1..50)     → overall size + structural complexity (facets)
     • systemState       → 'idle' (cool cyan, calm, "beckons" you when empty)
                           vs 'flow' (hot violet, alive, agitated)
     • pulse()           → inward "processing" shockwave (e.g. a braindump)

   ── Usage ─────────────────────────────────────────────────────
     const core = new TriadaCore(canvasEl, {
       systemState: 'idle',           // 'idle' | 'flow'
       level: 4,                      // 1..50
       energy: 0.32,                  // 0..1
       pillars: { Intelecto: 7, Vigor: 4, Voluntad: 3 }, // each 1..40
     });
     core.start();                    // begins the animation loop
     core.setState({ energy: 0.8, systemState: 'flow' }); // smooth transition
     core.pulse();                    // one-shot shockwave
     core.stop();                     // when unmounting — ALWAYS call this

   Transitions are eased internally, so jumping straight to new values
   animates smoothly rather than snapping. Safe to call setState often.
   ═══════════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TriadaCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── identity ─────────────────────────────────────────────────
  var PILLARS = ['Intelecto', 'Vigor', 'Voluntad'];
  var PILLAR_COLOR = {
    Intelecto: '#22d3ee', // cyan
    Vigor: '#10b981',     // emerald
    Voluntad: '#d946ef',  // magenta
  };
  var ACCENT = {
    idle: '#22d3ee',
    flow: '#a855f7',
    violetSoft: '#c084fc',
    violetDeeper: '#5b21b6',
  };
  var MOTION = 0.42;                 // movement intensity (0..1)
  var SPD = 0.55 + MOTION * 0.9;     // global speed multiplier

  // ── math / colour utils ──────────────────────────────────────
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(cur, target, k) { return cur + (target - cur) * k; }
  function tier(level) { return Math.min(5, Math.floor((level - 1) / 9)); }

  function hex(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgba(c, a) { var r = typeof c === 'string' ? hex(c) : c; return 'rgba(' + (r[0] | 0) + ',' + (r[1] | 0) + ',' + (r[2] | 0) + ',' + a + ')'; }
  function mix(a, b, t) {
    var x = typeof a === 'string' ? hex(a) : a, y = typeof b === 'string' ? hex(b) : b;
    return [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t];
  }
  function blendPillars(sh) {
    var I = hex(PILLAR_COLOR.Intelecto), V = hex(PILLAR_COLOR.Vigor), Vo = hex(PILLAR_COLOR.Voluntad);
    return [
      I[0] * sh.Intelecto + V[0] * sh.Vigor + Vo[0] * sh.Voluntad,
      I[1] * sh.Intelecto + V[1] * sh.Vigor + Vo[1] * sh.Voluntad,
      I[2] * sh.Intelecto + V[2] * sh.Vigor + Vo[2] * sh.Voluntad,
    ];
  }

  function sharesOf(pillars) {
    var tot = pillars.Intelecto + pillars.Vigor + pillars.Voluntad || 1;
    return {
      Intelecto: pillars.Intelecto / tot,
      Vigor: pillars.Vigor / tot,
      Voluntad: pillars.Voluntad / tot,
    };
  }
  function dominantOf(pillars) {
    var best = 'Intelecto';
    PILLARS.forEach(function (k) { if (pillars[k] > pillars[best]) best = k; });
    return best;
  }

  // ── shared draw helpers ──────────────────────────────────────
  function glow(ctx, cx, cy, R, color, strength) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.9);
    g.addColorStop(0, rgba(color, 0.22 * strength));
    g.addColorStop(0.5, rgba(color, 0.08 * strength));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
    ctx.restore();
  }

  function beckon(ctx, cx, cy, R, color, intensity, t) {
    if (intensity <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 2; i++) {
      var ph = ((t * 0.18 * SPD + i * 0.5) % 1);
      var rr = R * (1.0 + ph * 0.7);
      var a = (1 - ph) * intensity * 0.4;
      ctx.lineWidth = 1.4 * (1 - ph) + 0.3;
      ctx.strokeStyle = rgba(color, a);
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function processing(ctx, cx, cy, R, color, p) {
    if (p <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var rr = R * (1.7 - p * 1.55);
    var a = p * 0.55;
    ctx.lineWidth = 2.2 * p + 0.4;
    ctx.strokeStyle = rgba(color, a);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6);
    g.addColorStop(0, rgba('#ffffff', 0.22 * p));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
  }

  // orbiting satellites — body size + glow scale with that pillar's level
  function satellites(ctx, cx, cy, orbitR, o) {
    var t = o.t, levels = o.levels, heat = o.heat;
    var order = PILLARS;
    var spin = t * 0.16 * SPD * (1 + heat * 0.5);
    for (var i = 0; i < 3; i++) {
      var k = order[i];
      var ang = spin + i * (Math.PI * 2 / 3);
      var lvl = levels[k];
      var r = orbitR + Math.sin(t * 0.5 + i) * 2;
      var sx = cx + Math.cos(ang) * r;
      var sy = cy + Math.sin(ang) * r;
      var bodyR = 2.4 + Math.min(lvl, 30) * 0.13;
      var col = PILLAR_COLOR[k];
      var bright = 0.45 + Math.min(lvl, 30) / 30 * 0.55;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var hg = ctx.createRadialGradient(sx, sy, 0, sx, sy, bodyR * 4.5);
      hg.addColorStop(0, rgba(col, 0.5 * bright));
      hg.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = hg;
      ctx.fillRect(sx - bodyR * 5, sy - bodyR * 5, bodyR * 10, bodyR * 10);
      ctx.restore();

      var bg = ctx.createRadialGradient(sx - bodyR * 0.4, sy - bodyR * 0.5, 0, sx, sy, bodyR);
      bg.addColorStop(0, rgba(mix(col, '#ffffff', 0.4), 0.95));
      bg.addColorStop(0.55, rgba(col, 0.5));
      bg.addColorStop(1, 'rgba(5,7,13,0.95)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(sx, sy, bodyR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(col, 0.9 * bright);
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(sx, sy, bodyR, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(sx - bodyR * 0.35, sy - bodyR * 0.4, bodyR * 0.28, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── the Tríada variant ───────────────────────────────────────
  function drawTriada(ctx, g) {
    var cx = g.cx, cy = g.cy, t = g.t;
    var R = g.baseR * (0.86 + g.level01 * 0.16) * g.breath;
    var accent = g.heat ? ACCENT.flow : ACCENT.idle;
    var order = PILLARS;
    var baseAng = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
    var rot = t * 0.06 * SPD * (1 + g.heat * 0.6);
    var TAU = Math.PI * 2;

    glow(ctx, cx, cy, R, mix(g.tint, accent, 0.3), 0.7 + g.energy * 0.7 + g.heat * 0.5);
    beckon(ctx, cx, cy, R + 16, accent, g.beckon, t);

    // crystalline structure rings (behind) — gain facets with level
    for (var c = 0; c <= g.comp; c++) {
      var segs = 6 + c * 3;
      var rrc = R * 1.04 + c * 6;
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(rot * (c % 2 ? -1.4 : 1) + c); ctx.translate(-cx, -cy);
      ctx.strokeStyle = rgba(mix(g.tint, accent, 0.4), 0.15);
      ctx.lineWidth = 0.7;
      for (var sgi = 0; sgi < segs; sgi++) {
        var a0c = sgi / segs * TAU + 0.08, a1c = (sgi + 1) / segs * TAU - 0.08;
        ctx.beginPath(); ctx.arc(cx, cy, rrc, a0c, a1c); ctx.stroke();
        var am = (a0c + a1c) / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(am) * (rrc - 2.5), cy + Math.sin(am) * (rrc - 2.5));
        ctx.lineTo(cx + Math.cos(am) * (rrc + 2.5), cy + Math.sin(am) * (rrc + 2.5));
        ctx.stroke();
      }
      ctx.restore();
    }

    // precompute lobe geometry
    var lobe = [];
    for (var i = 0; i < 3; i++) {
      var k = order[i];
      var share = g.shares[k];
      var seq = 0.5 + 0.5 * Math.sin(t * 1.5 * SPD - i * (TAU / 3));
      var pulse = 1 + (g.beckon * 0.16 + g.heat * 0.07) * seq;
      var d = R * 0.4;
      var ang = baseAng[i] + rot;
      lobe.push({
        k: k, col: PILLAR_COLOR[k], share: share, seq: seq,
        r: R * (0.46 + share * 0.8) * pulse,
        x: cx + Math.cos(ang) * d, y: cy + Math.sin(ang) * d, ang: ang,
      });
    }

    // filaments: lobe centre → nucleus
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var f = 0; f < 3; f++) {
      var L = lobe[f];
      var fg = ctx.createLinearGradient(L.x, L.y, cx, cy);
      fg.addColorStop(0, rgba(L.col, 0.05 + L.share * 0.1));
      fg.addColorStop(1, rgba(mix(L.col, '#ffffff', 0.4), 0.16 + g.energy * 0.16 + L.seq * 0.12));
      ctx.strokeStyle = fg;
      ctx.lineWidth = 0.8 + L.share * 2.4;
      var mx = (L.x + cx) / 2 + Math.cos(L.ang + 1.6) * R * 0.12;
      var my = (L.y + cy) / 2 + Math.sin(L.ang + 1.6) * R * 0.12;
      ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.quadraticCurveTo(mx, my, cx, cy); ctx.stroke();
    }
    ctx.restore();

    // three plasma lobes — radius ∝ share, internal boil
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i2 = 0; i2 < 3; i2++) {
      var Lo = lobe[i2];
      var lg = ctx.createRadialGradient(Lo.x, Lo.y, 0, Lo.x, Lo.y, Lo.r);
      lg.addColorStop(0, rgba(mix(Lo.col, '#ffffff', 0.34), 0.5 + g.energy * 0.2 + Lo.seq * 0.16));
      lg.addColorStop(0.45, rgba(Lo.col, 0.3));
      lg.addColorStop(1, rgba(Lo.col, 0));
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(Lo.x, Lo.y, Lo.r, 0, TAU); ctx.fill();
      for (var bc = 0; bc < 2; bc++) {
        var ba = t * (0.5 + 0.2 * bc) * SPD + i2 * 2.1 + bc * 2.6;
        var bd = Lo.r * 0.4 * (0.5 + 0.5 * Math.sin(t * 0.6 + bc + i2));
        var bx = Lo.x + Math.cos(ba) * bd, by = Lo.y + Math.sin(ba) * bd;
        var br = Lo.r * (0.34 + 0.16 * Math.sin(t * 0.7 + bc * 2));
        var bg2 = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        bg2.addColorStop(0, rgba(mix(Lo.col, '#ffffff', 0.5), 0.12 + g.energy * 0.1));
        bg2.addColorStop(1, rgba(Lo.col, 0));
        ctx.fillStyle = bg2;
        ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill();
      }
    }
    // bright merged nucleus
    var nucR = R * (0.32 + g.energy * 0.18 + g.heat * 0.1);
    var nuc = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucR);
    nuc.addColorStop(0, rgba('#ffffff', 0.62 + g.heat * 0.2));
    nuc.addColorStop(0.38, rgba(ACCENT.violetSoft, 0.42));
    nuc.addColorStop(1, rgba(g.tint, 0));
    ctx.fillStyle = nuc;
    ctx.beginPath(); ctx.arc(cx, cy, nucR, 0, TAU); ctx.fill();
    ctx.restore();

    // energy fill ring (outer) + glowing head
    var er = R * 1.04 + (g.comp + 1) * 6 + 5;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = rgba(accent, 0.1);
    ctx.beginPath(); ctx.arc(cx, cy, er, 0, TAU); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(accent, 0.85);
    ctx.shadowColor = accent; ctx.shadowBlur = 7;
    var eEnd = -Math.PI / 2 + TAU * g.energy;
    ctx.beginPath(); ctx.arc(cx, cy, er, -Math.PI / 2, eEnd); ctx.stroke();
    ctx.shadowBlur = 0;
    var hx = cx + Math.cos(eEnd) * er, hy = cy + Math.sin(eEnd) * er;
    var hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 6);
    hg.addColorStop(0, rgba('#ffffff', 0.95)); hg.addColorStop(0.5, rgba(accent, 0.8)); hg.addColorStop(1, rgba(accent, 0));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill();
    ctx.restore();

    // satellites that FEED their lobe (tether when aligned)
    var spin = t * 0.16 * SPD * (1 + g.heat * 0.5);
    var orbitR = er + 16;
    for (var si = 0; si < 3; si++) {
      var Ls = lobe[si];
      var sang = spin + si * (TAU / 3);
      var sr = orbitR + Math.sin(t * 0.5 + si) * 2;
      var sx = cx + Math.cos(sang) * sr, sy = cy + Math.sin(sang) * sr;
      var da = Math.atan2(Math.sin(sang - Ls.ang), Math.cos(sang - Ls.ang));
      var near = Math.max(0, 1 - Math.abs(da) / 0.9);
      if (near > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var tg = ctx.createLinearGradient(sx, sy, Ls.x, Ls.y);
        tg.addColorStop(0, rgba(Ls.col, 0.5 * near));
        tg.addColorStop(1, rgba(Ls.col, 0.05 * near));
        ctx.strokeStyle = tg; ctx.lineWidth = 0.6 + near * 1.4;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(Ls.x, Ls.y); ctx.stroke();
        ctx.restore();
      }
    }
    satellites(ctx, cx, cy, orbitR, { t: t, levels: g.levels, heat: g.heat });
    processing(ctx, cx, cy, R, accent, g.proc);
  }

  // ── the renderer / public class ──────────────────────────────
  function normState(s) {
    s = s || {};
    var p = s.pillars || {};
    return {
      systemState: s.systemState === 'flow' ? 'flow' : 'idle',
      level: clamp(+s.level || 4, 1, 50),
      energy: clamp(s.energy != null ? +s.energy : 0.32, 0, 1),
      pillars: {
        Intelecto: clamp(+p.Intelecto || 7, 1, 40),
        Vigor: clamp(+p.Vigor || 4, 1, 40),
        Voluntad: clamp(+p.Voluntad || 3, 1, 40),
      },
    };
  }

  function TriadaCore(canvas, initialState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = normState(initialState);
    this.raf = 0;
    this.last = 0;
    this.t = 3; // seed so the first static frame already has structure
    this.processingAt = 0;
    var sh = sharesOf(this.state.pillars);
    this.s = {
      level: this.state.level,
      energy: this.state.energy,
      heat: this.state.systemState === 'flow' ? 1 : 0,
      sh: { Intelecto: sh.Intelecto, Vigor: sh.Vigor, Voluntad: sh.Voluntad },
    };
    this._loop = this._loop.bind(this);
  }

  // merge a partial state patch; transitions ease automatically
  TriadaCore.prototype.setState = function (patch) {
    patch = patch || {};
    var next = {
      systemState: patch.systemState != null ? patch.systemState : this.state.systemState,
      level: patch.level != null ? patch.level : this.state.level,
      energy: patch.energy != null ? patch.energy : this.state.energy,
      pillars: Object.assign({}, this.state.pillars, patch.pillars || {}),
    };
    this.state = normState(next);
  };

  // fire a one-shot inward "processing" shockwave
  TriadaCore.prototype.pulse = function () { this.processingAt = performance.now(); };

  TriadaCore.prototype.size = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.canvas.clientWidth || 300, h = this.canvas.clientHeight || 300;
    if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
    }
    this.dpr = dpr; this.cw = w; this.ch = h;
  };

  TriadaCore.prototype.start = function () {
    try { this.draw(performance.now(), 0.016); } catch (e) {}
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this._loop); }
  };
  TriadaCore.prototype.stop = function () { if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } };

  TriadaCore.prototype._loop = function (now) {
    this.raf = requestAnimationFrame(this._loop);
    var dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.t += dt;
    this.draw(now, dt);
  };

  TriadaCore.prototype.draw = function (now, dt) {
    this.size();
    var ctx = this.ctx, dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.cw, this.ch);

    var st = this.state;
    var targetSh = sharesOf(st.pillars);
    var target = { level: st.level, energy: st.energy, heat: st.systemState === 'flow' ? 1 : 0 };
    var k = 1 - Math.pow(0.001, dt); // frame-rate independent easing
    this.s.level = ease(this.s.level, target.level, k);
    this.s.energy = ease(this.s.energy, target.energy, k);
    this.s.heat = ease(this.s.heat, target.heat, k);
    this.s.sh.Intelecto = ease(this.s.sh.Intelecto, targetSh.Intelecto, k);
    this.s.sh.Vigor = ease(this.s.sh.Vigor, targetSh.Vigor, k);
    this.s.sh.Voluntad = ease(this.s.sh.Voluntad, targetSh.Voluntad, k);
    var tot = this.s.sh.Intelecto + this.s.sh.Vigor + this.s.sh.Voluntad || 1;
    var sh = { Intelecto: this.s.sh.Intelecto / tot, Vigor: this.s.sh.Vigor / tot, Voluntad: this.s.sh.Voluntad / tot };

    var energy = this.s.energy, heat = this.s.heat, level = this.s.level;
    var level01 = clamp((level - 1) / 49, 0, 1);
    var comp = tier(Math.round(level));
    var tint = blendPillars(sh);

    var beck = st.systemState === 'idle' ? (0.3 + (1 - energy) * 0.7) : 0;
    var breath = 1 + Math.sin(this.t * (0.7 + heat * 0.8) * SPD) * (0.012 + beck * 0.02 + heat * 0.01);

    var proc = 0;
    if (this.processingAt) {
      var dtp = (now - this.processingAt) / 1500;
      proc = dtp >= 1 ? 0 : 1 - dtp;
    }

    var cx = this.cw / 2, cy = this.ch / 2;
    var baseR = Math.min(this.cw, this.ch) * 0.26;

    drawTriada(ctx, {
      cx: cx, cy: cy, t: this.t, baseR: baseR,
      energy: energy, heat: heat, level: level, level01: level01, comp: comp,
      shares: sh, dominant: dominantOf(st.pillars), levels: st.pillars,
      tint: tint, beckon: beck, breath: breath, proc: proc,
    });
  };

  // expose palette so host UIs can match the pillar colours
  TriadaCore.PILLAR_COLOR = PILLAR_COLOR;
  TriadaCore.ACCENT = ACCENT;

  return TriadaCore;
}));
