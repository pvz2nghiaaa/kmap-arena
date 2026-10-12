'use strict';
/* ===== Hiệu ứng: âm thanh tổng hợp, hạt, confetti, chữ bay, nền ===== */
const FX = (() => {
  /* ---------- Âm thanh (WebAudio, không cần file) ---------- */
  let actx = null;
  function ac() {
    if (!actx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; actx = new A(); }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.08, when = 0, slideTo = null) {
    if (!Store.settings.sound) return;
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + when;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  const sfx = {
    click: () => tone(540, 0.05, 'triangle', 0.035),
    correct: () => { tone(660, 0.1, 'triangle', 0.07); tone(990, 0.14, 'triangle', 0.07, 0.07); },
    perfect: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, i * 0.055)),
    partial: () => { tone(520, 0.12, 'triangle', 0.06); tone(600, 0.16, 'triangle', 0.05, 0.08); },
    wrong: () => tone(190, 0.24, 'sawtooth', 0.05, 0, 85),
    tick: () => tone(1250, 0.04, 'square', 0.025),
    count: () => tone(440, 0.12, 'triangle', 0.07),
    go: () => { tone(880, 0.25, 'triangle', 0.08); tone(1320, 0.3, 'sine', 0.05, 0.05); },
    combo: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.1, 'square', 0.03, i * 0.04)),
    end: () => [784, 659, 523, 392].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.1)),
    record: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.24, 'triangle', 0.08, i * 0.085)),
  };

  /* ---------- Hạt & confetti trên canvas ---------- */
  const cv = document.getElementById('fx-canvas');
  const g = cv.getContext('2d');
  let parts = [], raf = 0, dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  }
  resize(); addEventListener('resize', resize);
  const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];

  function loop() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav;
      p.x += p.vx; p.y += p.vy; p.life--; p.rot += p.vr;
      const a = Math.max(0, Math.min(1, p.life / p.fade));
      g.globalAlpha = a;
      g.fillStyle = p.color;
      if (p.shape === 'rect') {
        g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
        g.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9); g.restore();
      } else {
        g.shadowColor = p.color; g.shadowBlur = 10;
        g.beginPath(); g.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, Math.PI * 2); g.fill();
        g.shadowBlur = 0;
      }
    }
    g.globalAlpha = 1;
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) g.clearRect(0, 0, innerWidth, innerHeight);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  function burst(x, y, { count = 26, colors = COLORS, speed = 7, grav = 0.18, size = [2, 4.5] } = {}) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2, sp = speed * (0.35 + Math.random() * 0.75);
      parts.push({
        x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 2, drag: 0.94, grav,
        life: 40 + Math.random() * 25, fade: 30, size: size[0] + Math.random() * (size[1] - size[0]),
        color: colors[i % colors.length], shape: 'dot', rot: 0, vr: 0,
      });
    }
    kick();
  }
  function burstAt(el, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
  }
  function confetti(n = 180) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, drag: 0.995, grav: 0.05,
        life: 260 + Math.random() * 120, fade: 60, size: 4 + Math.random() * 4,
        color: COLORS[i % COLORS.length], shape: 'rect', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
      });
    }
    kick();
  }

  /* ---------- Chữ bay, rung, đếm số ---------- */
  function floatText(text, el, cls = 'good') {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const d = document.createElement('div');
    d.className = 'float-text ' + cls;
    d.textContent = text;
    d.style.left = r.left + r.width / 2 + 'px';
    d.style.top = r.top + r.height / 2 + 'px';
    document.body.appendChild(d);
    d.addEventListener('animationend', () => d.remove());
  }
  function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  function countUp(el, to, dur = 1000) {
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmtNum(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Nền: các chữ số nhị phân trôi ---------- */
  function startBackground() {
    const c = document.getElementById('bg-canvas'), x = c.getContext('2d');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let W, H, glyphs = [];
    const fit = () => {
      W = c.width = innerWidth; H = c.height = innerHeight;
      glyphs = Array.from({ length: Math.round((W * H) / 26000) }, () => mk(true));
    };
    const mk = (any) => ({
      x: Math.random() * W, y: any ? Math.random() * H : H + 20, v: 0.15 + Math.random() * 0.45,
      s: 10 + Math.random() * 14, a: 0.03 + Math.random() * 0.09,
      t: Math.random() < 0.82 ? (Math.random() < 0.5 ? '0' : '1') : KM.pick(['00', '01', '11', '10', 'AB', 'CD', '2ⁿ', 'Σ']),
    });
    fit(); addEventListener('resize', fit);
    (function frame() {
      x.clearRect(0, 0, W, H);
      for (const gl of glyphs) {
        gl.y -= gl.v;
        if (gl.y < -20) Object.assign(gl, mk(false));
        x.globalAlpha = gl.a; x.fillStyle = '#9fb4ff';
        x.font = `600 ${gl.s}px "JetBrains Mono", monospace`;
        x.fillText(gl.t, gl.x, gl.y);
      }
      requestAnimationFrame(frame);
    })();
  }

  return { sfx, burst, burstAt, confetti, floatText, shake, countUp, startBackground };
})();
