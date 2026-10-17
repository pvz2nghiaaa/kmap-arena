'use strict';
/* ===== Phiên chơi đua thời gian (dùng chung cho mọi trò) ===== */
class Session {
  constructor(game, diff, variant) {
    Object.assign(this, { game, diff, variant: variant || '' });
    this.score = 0; this.combo = 0; this.maxCombo = 0;
    this.nRight = 0; this.nTotal = 0; this.nPerfect = 0;
    this.log = [];
    this.timeLeft = game.duration(diff); this.timeMax = this.timeLeft;
    this.running = false; this.paused = false; this.holds = 0; this.ended = false;
    this.qElapsed = 0; this.lastSec = null;
  }
  get key() { return `${this.game.id}:${this.diff}:${this.variant}`; }
  get active() { return this.running && !this.paused && !this.ended && this.holds === 0; }

  mount(root) {
    const g = this.game, vLabel = g.variants ? ' · ' + g.variants.find((v) => v.id === this.variant).label : '';
    root.innerHTML = `
    <div class="game" style="--c:${g.color}">
      <div class="hud glass">
        <button class="icon-btn" data-act="pause" title="Tạm dừng (Esc)">❚❚</button>
        <div class="hud-title"><span class="hud-ico">${g.icon}</span><div><b>${g.name}</b><small style="color:${DIFF[this.diff].color}">${DIFF[this.diff].name}${vLabel}</small></div></div>
        <div class="hud-stats">
          <div class="stat"><small>Điểm</small><b data-k="score">0</b></div>
          <div class="stat combo"><small>Combo</small><b data-k="combo">0</b><i class="mult" data-k="mult">×1.0</i></div>
          <div class="stat"><small>Đúng</small><b data-k="acc">0/0</b></div>
          <div class="stat time"><small>Thời gian</small><b data-k="time">--</b></div>
        </div>
      </div>
      <div class="timebar"><i></i></div>
      <div class="stage glass"></div>
      <div class="overlay countdown"></div>
      <div class="overlay pause-ov">
        <div class="pause-box">
          <h2>Tạm dừng</h2><p class="muted">Bàn chơi được làm mờ để công bằng 😉</p>
          <button class="btn primary" data-act="resume">Tiếp tục <kbd>Esc</kbd></button>
          <button class="btn ghost" data-act="restart">Chơi lại</button>
          <button class="btn ghost" data-act="quit">Thoát về trang chủ</button>
        </div>
      </div>
    </div>`;
    this.root = root.querySelector('.game');
    this.stage = this.root.querySelector('.stage');
    this.el = {};
    $$('[data-k]', this.root).forEach((e) => (this.el[e.dataset.k] = e));
    this.el.bar = this.root.querySelector('.timebar');
    this.el.comboBox = this.root.querySelector('.stat.combo');
    this.el.timeBox = this.root.querySelector('.stat.time');

    this.root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]')?.dataset.act;
      if (a === 'pause') this.pause();
      else if (a === 'resume') this.resume();
      else if (a === 'restart') App.go('game', this.game.id, this.diff, this.variant);
      else if (a === 'quit') App.go('home');
    });
    // Giữ focus ở ô nhập khi bấm nút trong bàn chơi
    this.stage.addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });

    this._key = (e) => this.onKey(e);
    this._vis = () => { if (document.hidden) this.pause(); };
    document.addEventListener('keydown', this._key);
    document.addEventListener('visibilitychange', this._vis);

    this.ctrl = this.game.create(this);
    this.ctrl.mount(this.stage);
    this.updateHUD(); this.updateTime();
    this.countdown();
  }

  countdown() {
    const ov = this.root.querySelector('.countdown');
    ov.classList.add('show');
    this.stage.classList.add('blurred');
    const seq = ['3', '2', '1', 'GO!'];
    let i = 0;
    const step = () => {
      if (this.ended) return;
      if (i >= seq.length) {
        ov.classList.remove('show'); this.stage.classList.remove('blurred');
        this.start(); return;
      }
      ov.innerHTML = `<span class="${i === 3 ? 'go' : ''}">${seq[i]}</span>`;
      i === 3 ? FX.sfx.go() : FX.sfx.count();
      i++;
      this.cdTimer = setTimeout(step, i === 4 ? 450 : 620);
    };
    step();
  }

  start() {
    this.running = true;
    this.last = performance.now();
    this.iv = setInterval(() => this.tick(), 50);
    this.ctrl.next();
  }

  tick() {
    const now = performance.now(), dt = (now - this.last) / 1000;
    this.last = now;
    if (!this.active) return;
    this.timeLeft -= dt; this.qElapsed += dt;
    const sec = Math.ceil(this.timeLeft);
    if (sec !== this.lastSec && this.timeLeft <= 5 && this.timeLeft > 0) FX.sfx.tick();
    this.lastSec = sec;
    this.updateTime();
    if (this.timeLeft <= 0) this.end();
  }

  updateTime() {
    const t = Math.max(0, this.timeLeft);
    this.el.time.textContent = t < 10 ? t.toFixed(1) : Math.ceil(t) + 's';
    this.el.bar.firstElementChild.style.width = Math.min(100, (t / this.timeMax) * 100) + '%';
    const low = t < 10;
    this.el.bar.classList.toggle('low', low);
    this.el.timeBox.classList.toggle('low', low);
  }
  updateHUD() {
    this.el.score.textContent = fmtNum(this.score);
    this.el.combo.textContent = this.combo;
    this.el.mult.textContent = '×' + this.mult().toFixed(1);
    this.el.acc.textContent = `${this.nRight}/${this.nTotal}`;
    this.el.comboBox.classList.toggle('hot', this.combo >= 3);
    this.el.comboBox.classList.toggle('fire', this.combo >= 8);
  }
  bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  mult() { return 1 + Math.min(this.combo, 10) * 0.1; }
  newQuestion() { this.qElapsed = 0; }
  hold() { this.holds++; }
  release() { this.holds = Math.max(0, this.holds - 1); this.last = performance.now(); }

  addTime(sec) {
    this.timeLeft += sec;
    this.timeMax = Math.max(this.timeMax, this.timeLeft);
    FX.floatText(`${sec > 0 ? '+' : ''}${sec}s`, this.el.timeBox, sec > 0 ? 'time' : 'bad');
    this.updateTime();
  }

  right({ base, el, extraTime = 0, q = '', a = '' }) {
    this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.nRight++; this.nTotal++; this.nPerfect++;
    const par = this.game.par[this.diff];
    const speed = Math.max(0, 1 - this.qElapsed / par);
    const pts = Math.round(base * this.mult() + base * 0.6 * speed);
    this.score += pts;
    this.updateHUD(); this.bump(this.el.score);
    if (this.combo > 0 && this.combo % 5 === 0) {
      FX.sfx.combo();
      FX.floatText(`COMBO ×${this.combo}!`, this.el.comboBox, 'combo');
      FX.burstAt(this.el.comboBox, { count: 40, colors: ['#fbbf24', '#fb923c', '#f472b6'] });
    } else this.combo >= 3 ? FX.sfx.perfect() : FX.sfx.correct();
    FX.burstAt(el, { count: 22 + Math.min(30, this.combo * 3) });
    FX.floatText(`+${pts}`, el, 'good');
    if (extraTime) this.addTime(extraTime);
    this.log.push({ ok: true, q, a });
    return pts;
  }
  partial({ pts, el, q = '', a = '', u = '', note = '' }) {
    this.combo = 0; this.nRight++; this.nTotal++;
    this.score += pts;
    this.updateHUD(); this.bump(this.el.score);
    FX.sfx.partial();
    FX.floatText(`+${pts}`, el, 'part');
    this.log.push({ ok: 'partial', q, a, u, note });
  }
  wrong({ penalty = 3, el, q = '', a = '', u = '', note = '' }) {
    this.combo = 0; this.nTotal++;
    this.updateHUD();
    FX.sfx.wrong();
    FX.shake(this.stage);
    if (el) FX.floatText('✗', el, 'bad');
    if (penalty) this.addTime(-penalty);
    this.log.push({ ok: false, q, a, u, note });
    if (this.timeLeft <= 0) this.end();
  }
  skip({ q = '', a = '' }) {
    this.combo = 0; this.nTotal++;
    this.updateHUD();
    FX.sfx.wrong();
    this.log.push({ ok: false, q, a, u: '<i>(bỏ qua)</i>' });
  }

  pause() {
    if (!this.running || this.ended || this.paused) return;
    this.paused = true;
    this.root.querySelector('.pause-ov').classList.add('show');
    this.stage.classList.add('blurred');
  }
  resume() {
    if (!this.paused) return;
    this.paused = false; this.last = performance.now();
    this.root.querySelector('.pause-ov').classList.remove('show');
    this.stage.classList.remove('blurred');
    this.ctrl.focus?.();
  }

  onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); this.paused ? this.resume() : this.pause(); return; }
    if (!this.running || this.paused || this.ended) return;
    this.ctrl.onKey?.(e);
  }

  end() {
    if (this.ended) return;
    this.ended = true; this.running = false;
    clearInterval(this.iv);
    this.timeLeft = 0; this.updateTime();
    FX.sfx.end();
    const ov = this.root.querySelector('.countdown');
    ov.innerHTML = '<span class="over">HẾT GIỜ!</span>';
    ov.classList.add('show'); this.stage.classList.add('blurred');
    const record = this.score > 0 && Store.setBest(this.key, this.score);
    Store.data.played++;
    Store.data.bestCombo = Math.max(Store.data.bestCombo, this.maxCombo);
    Store.save();
    const result = {
      gameId: this.game.id, diff: this.diff, variant: this.variant, score: this.score, record,
      best: Store.best(this.key), right: this.nRight, total: this.nTotal, perfect: this.nPerfect,
      maxCombo: this.maxCombo, log: this.log,
    };
    this.endTimer = setTimeout(() => App.go('results', result), 1300);
  }

  destroy() {
    this.ended = true;
    clearInterval(this.iv); clearTimeout(this.cdTimer);
    document.removeEventListener('keydown', this._key);
    document.removeEventListener('visibilitychange', this._vis);
    try { this.ctrl?.destroy?.(); } catch (e) { console.error(e); }
  }
}

/* ===== Ô nhập biểu thức có xem trước + bàn phím ảo ===== */
function createExprInput({ onSubmit, onSkip, placeholder = "VD: A'B + CD'" }) {
  const keys = ['A', 'B', 'C', 'D', "'", '~', '+', '(', ')'];
  const el = h(`<div class="expr">
    <div class="expr-field"><span class="expr-f">f =</span>
      <input type="text" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="characters" placeholder="${placeholder}">
    </div>
    <div class="expr-preview"></div>
    <div class="keypad">${keys.map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}<button type="button" data-k="BS" title="Xóa">⌫</button></div>
  </div>`);
  const input = el.querySelector('input'), prev = el.querySelector('.expr-preview');
  const idle = '<span class="muted small">Xem trước hiển thị ở đây · NOT gắn chặt nhất, rồi AND, XOR (^), OR (+)</span>';
  function update() {
    const v = input.value;
    if (!v.trim()) { prev.innerHTML = idle; prev.classList.remove('err'); return; }
    try {
      const ast = KM.parse(v);
      prev.innerHTML = `<span class="expr-math">${KM.astHTML(ast, nt())}</span>`;
      prev.classList.remove('err');
    } catch (e) {
      prev.innerHTML = `<span class="err-msg">⚠ ${esc(e.message)}</span>`;
      prev.classList.add('err');
    }
  }
  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (e.shiftKey) onSkip?.(); else onSubmit(input.value); }
  });
  el.querySelector('.keypad').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || input.disabled) return;
    const k = b.dataset.k, v = input.value;
    let s = input.selectionStart ?? v.length, t = input.selectionEnd ?? s;
    if (k === 'BS') {
      if (s === t && s > 0) s--;
      input.value = v.slice(0, s) + v.slice(t);
      input.setSelectionRange(s, s);
    } else {
      input.value = v.slice(0, s) + k + v.slice(t);
      input.setSelectionRange(s + k.length, s + k.length);
    }
    FX.sfx.click();
    input.focus(); update();
  });
  update();
  return {
    el, input,
    focus() { input.focus(); },
    clear() { input.value = ''; update(); },
    value: () => input.value,
    setDisabled(b) { input.disabled = b; el.classList.toggle('disabled', b); },
  };
}

const listStr = (b) => KM.bitsToList(b).join(', ');
const fbBox = (cls, html) => `<div class="fb ${cls}">${html}</div>`;

/* =====================================================================
   1) ĐUA RÚT GỌN — bản đồ → biểu thức tối giản
   ===================================================================== */
const GameSprint = {
  id: 'sprint', name: 'Đua Rút Gọn', icon: '⚡', color: '#22d3ee',
  tagline: 'Bản đồ → biểu thức tối giản',
  desc: 'Nhìn bảng Karnaugh 4×4 và gõ biểu thức tối giản nhanh nhất có thể. Mọi biểu thức tương đương đều được chấp nhận, nhưng chỉ dạng tối giản (ít số hạng nhất, rồi ít literal nhất) mới ăn trọn điểm.',
  rules: [
    "Biến A, B, C, D · phủ định: <code>A'</code> hoặc <code>~A</code> · OR: <code>+</code> · AND: viết liền hoặc <code>*</code>",
    '<kbd>Enter</kbd> kiểm tra · <kbd>Shift</kbd>+<kbd>Enter</kbd> bỏ qua · <kbd>Esc</kbd> tạm dừng',
    'Tối giản hoàn hảo: trọn điểm + cộng giây · Đúng nhưng chưa tối giản: 35% điểm, mất combo',
    'Sai: −3 giây, mất combo. Ô X (tùy định) có thể coi là 0 hoặc 1 tùy ý',
  ],
  levels: ['2–3 nhóm, không có X, nhóm kề nhau cơ bản', '3–4 nhóm, cuộn biên & 4 góc, vài ô X', '4–6 nhóm, nhiều X, có PI không cốt yếu — phải chọn phủ tối ưu'],
  variants: [{ id: 'sop', label: 'SOP' }, { id: 'pos', label: 'POS' }, { id: 'mix', label: 'Trộn' }],
  duration: (diff) => [120, 160, 200][diff], par: [20, 36, 56],
  create(s) {
    const L = s.diff, BASE = [100, 240, 520][L], BONUS_T = [4, 7, 12][L];
    let map, inp, cur, busy = false;
    const els = {}, recent = [];
    const target = () => (cur.mode === 'sop' ? cur.sop.terms : cur.pos.clauses);
    const solHTML = () => (cur.mode === 'sop' ? KM.sopHTML(cur.sop.terms, nt(), true) : KM.posHTML(cur.pos.clauses, nt(), true));
    const qHTML = () => `<b>${cur.mode.toUpperCase()}</b> · Σm(${listStr(cur.on)})${cur.dc ? ` + d(${listStr(cur.dc)})` : ''}`;
    const later = (ms) => { s.hold(); setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, ms); };

    function submit(text) {
      if (busy || !s.active || !text.trim()) return;
      let ast;
      try { ast = KM.parse(text); } catch (e) { els.fb.innerHTML = fbBox('warn', '⚠ ' + esc(e.message)); FX.shake(inp.el); return; }
      const care = KM.FULL & ~cur.dc, bits = KM.truth(ast), uHTML = KM.astHTML(ast, nt());
      if ((bits & care) !== (cur.on & care)) {
        s.wrong({ penalty: 3, el: inp.el, q: qHTML(), u: uHTML, a: solHTML() });
        els.fb.innerHTML = fbBox('bad', `✗ Chưa đúng — biểu thức chưa khớp với bảng logic. −3s`);
        return;
      }
      const want = cur.mode === 'sop' ? cur.sop.cost : cur.pos.cost;
      const cost = cur.mode === 'sop' ? KM.sopCost(ast) : KM.posCost(ast);
      busy = true; inp.setDisabled(true);
      map.setGroups(target());
      if (cost && cost[0] === want[0] && cost[1] <= want[1]) {
        s.right({ base: BASE, el: inp.el, extraTime: BONUS_T, q: qHTML(), a: solHTML() });
        els.fb.innerHTML = fbBox('good', `✓ Tối giản hoàn hảo! <span class="sol expr-math">${solHTML()}</span>`);
        later(1100);
      } else {
        const why = cost
          ? `Đúng nhưng chưa tối giản: bạn dùng <b>${cost[0]}</b> số hạng / <b>${cost[1]}</b> literal — tối ưu là <b>${want[0]}</b> / <b>${want[1]}</b>.`
          : `Đúng giá trị nhưng không ở dạng ${cur.mode.toUpperCase()} thuần (${cur.mode === 'sop' ? 'tổng của các tích literal' : 'tích của các tổng literal'}).`;
        s.partial({ pts: Math.round(BASE * 0.35), el: inp.el, q: qHTML(), u: uHTML, a: solHTML(), note: why });
        els.fb.innerHTML = fbBox('part', `◐ ${why}<div class="sol expr-math">${solHTML()}</div>`);
        later(3000);
      }
    }
    function skip() {
      if (busy || !s.active) return;
      busy = true; inp.setDisabled(true);
      s.skip({ q: qHTML(), a: solHTML() });
      map.setGroups(target());
      els.fb.innerHTML = fbBox('part', `Đáp án: <span class="sol expr-math">${solHTML()}</span>`);
      later(2600);
    }

    const ctrl = {
      mount(stage) {
        stage.innerHTML = `<div class="split">
          <div class="pane-map">
            <div class="map-slot"></div>
            <div class="map-legend"><span><i class="lg on"></i>1</span><span><i class="lg zero"></i>0</span><span><i class="lg dc"></i>X tùy định</span></div>
          </div>
          <div class="pane-ans">
            <div class="prompt"></div>
            <div class="hint"></div>
            <div class="inp-slot"></div>
            <div class="actions">
              <button class="btn primary" data-a="submit">Kiểm tra <kbd>Enter</kbd></button>
              <button class="btn ghost" data-a="skip">Bỏ qua <kbd>⇧ Enter</kbd></button>
            </div>
            <div class="feedback"></div>
          </div></div>`;
        map = new KMapView({ showZeros: true, size: 'lg' });
        stage.querySelector('.map-slot').appendChild(map.el);
        inp = createExprInput({ onSubmit: submit, onSkip: skip });
        stage.querySelector('.inp-slot').appendChild(inp.el);
        els.prompt = stage.querySelector('.prompt'); els.hint = stage.querySelector('.hint'); els.fb = stage.querySelector('.feedback');
        stage.querySelector('[data-a=submit]').onclick = () => submit(inp.value());
        stage.querySelector('[data-a=skip]').onclick = skip;
      },
      next() {
        busy = false;
        const mode = s.variant === 'mix' ? KM.pick(['sop', 'pos']) : s.variant;
        const f = KM.genFunction(L, mode, recent);
        recent.push(f.on + ':' + f.dc); if (recent.length > 12) recent.shift();
        cur = { ...f, mode };
        map.clearGroups();
        map.el.classList.toggle('pos-mode', mode === 'pos');
        map.set(cur.on, cur.dc);
        els.prompt.innerHTML = mode === 'sop'
          ? 'Viết dạng <b class="hl-1">tổng các tích (SOP)</b> tối giản — gom các ô <b class="hl-1">1</b>'
          : 'Viết dạng <b class="hl-0">tích các tổng (POS)</b> tối giản — gom các ô <b class="hl-0">0</b>';
        els.hint.innerHTML = L === 0 ? '<span class="chip">Mẹo: Quan sát các ô 1 cô lập trước để tìm nhóm cốt yếu</span>'
          : L === 1 ? '<span class="chip">Nhớ: nhóm có thể cuộn qua mép & 4 góc</span>'
          : '<span class="chip warn">Cẩn thận các nhóm dư thừa!</span>';
        inp.setDisabled(false); inp.clear(); inp.focus();
        els.fb.innerHTML = '';
        s.newQuestion();
      },
      focus() { inp.focus(); },
      onKey(e) {
        if (document.activeElement === inp.input) return;
        if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? skip() : submit(inp.value()); }
        else if (/^[a-dA-D~'+()]$/.test(e.key)) inp.focus();
      },
      destroy() { map?.destroy(); },
    };
    return ctrl;
  },
};

/* =====================================================================
   2) GIẢI MÃ Σ — minterm/maxterm ⇄ bản đồ
   ===================================================================== */
const GameDecode = {
  id: 'decode', name: 'Giải Mã Σ', icon: 'Σ', color: '#a78bfa',
  tagline: 'Σm / ΠM ⇄ vị trí ô',
  desc: 'Chuyển đổi qua lại giữa danh sách minterm Σm(…), maxterm ΠM(…) và bản đồ. Kỹ năng nền tảng: định vị ô theo mã Gray 00‑01‑11‑10 mà không cần đếm.',
  rules: [
    'Dạng 1: cho Σm / ΠM → tô bản đồ (nhấp hoặc kéo để tô, chuột phải = X)',
    'Dạng 2: cho bản đồ → gõ danh sách chỉ số, cách nhau bởi dấu phẩy hoặc khoảng trắng',
    'ΠM liệt kê các ô <b>0</b>; d(…) là các ô tùy định X',
    '<kbd>Enter</kbd> nộp · Sai: −3s, mất combo',
  ],
  levels: ['3–6 ô, chỉ Σm, không có X', '5–9 ô, có ô X tùy định', 'Có ΠM, X, và trục AB/CD có thể bị hoán đổi!'],
  duration: (diff) => [80, 110, 140][diff], par: [12, 20, 30],
  create(s) {
    const L = s.diff, BASE = [60, 150, 320][L];
    let map, cur, busy = false;
    const els = {};

    function answerHTML() {
      const zeros = KM.FULL & ~cur.on & ~cur.dc;
      return cur.usePi ? `ΠM(${listStr(zeros)})${cur.dc ? ` · d(${listStr(cur.dc)})` : ''}` : `Σm(${listStr(cur.on)})${cur.dc ? ` + d(${listStr(cur.dc)})` : ''}`;
    }
    function submit() {
      if (busy || !s.active) return;
      const zeros = KM.FULL & ~cur.on & ~cur.dc;
      let diff, uHTML;
      if (cur.kind === 'toMap') {
        const { on, dc } = map.getBits();
        diff = (on ^ cur.on) | (dc ^ cur.dc);
        uHTML = `Σm(${listStr(on)})${dc ? ` + d(${listStr(dc)})` : ''}`;
      } else {
        const nums = els.listIn.value.split(/[^0-9]+/).filter(Boolean).map(Number);
        if (!nums.length) { FX.shake(els.listIn); return; }
        if (nums.some((n) => n > 15)) { els.fb.innerHTML = fbBox('warn', '⚠ Chỉ số phải nằm trong 0–15'); return; }
        const got = KM.listToBits(nums), want = cur.usePi ? zeros : cur.on;
        diff = got ^ want;
        uHTML = `${cur.usePi ? 'ΠM' : 'Σm'}(${listStr(got)})`;
      }
      const q = cur.kind === 'toMap' ? `Tô bản đồ: ${answerHTML()}${cur.swap ? ' <i>(trục hoán đổi)</i>' : ''}` : `Bản đồ → ${cur.usePi ? 'ΠM' : 'Σm'}${cur.swap ? ' <i>(trục hoán đổi)</i>' : ''}`;
      if (!diff) {
        busy = true;
        s.right({ base: BASE, el: els.submit, q, a: answerHTML() });
        map.flash(cur.kind === 'toMap' ? cur.on | cur.dc : cur.usePi ? zeros : cur.on, 'right', 600);
        els.fb.innerHTML = fbBox('good', '✓ Chính xác!');
        s.hold(); setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 600);
      } else {
        s.wrong({ penalty: 3, el: els.submit, q, a: answerHTML(), u: uHTML });
        els.fb.innerHTML = fbBox('bad', `✗ Chưa chính xác — hãy kiểm tra lại tọa độ Gray (AB \\ CD). −3s`);
      }
    }
    function skip() {
      if (busy || !s.active) return;
      busy = true;
      s.skip({ q: 'Giải mã', a: answerHTML() });
      map.set(cur.on, cur.dc, true);
      els.fb.innerHTML = fbBox('part', `Đáp án: ${answerHTML()}`);
      s.hold(); setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 2000);
    }

    const ctrl = {
      mount(stage) {
        stage.innerHTML = `<div class="split">
          <div class="pane-map">
            <div class="axis-warn"></div>
            <div class="map-slot"></div>
            <div class="map-tools"><button class="btn ghost sm" data-a="clear">Xóa bản đồ</button><span class="muted small paint-hint"></span></div>
          </div>
          <div class="pane-ans">
            <div class="prompt"></div>
            <div class="qbig"></div>
            <div class="list-row"><input class="list-in mono-in" placeholder="VD: 1, 3, 7, 12" spellcheck="false" autocomplete="off"></div>
            <div class="actions">
              <button class="btn primary" data-a="submit">Nộp <kbd>Enter</kbd></button>
              <button class="btn ghost" data-a="skip">Bỏ qua</button>
            </div>
            <div class="feedback"></div>
          </div></div>`;
        map = new KMapView({ interactive: true, allowDC: true, size: 'lg' });
        stage.querySelector('.map-slot').appendChild(map.el);
        Object.assign(els, {
          prompt: stage.querySelector('.prompt'), q: stage.querySelector('.qbig'), fb: stage.querySelector('.feedback'),
          listIn: stage.querySelector('.list-in'), listRow: stage.querySelector('.list-row'), submit: stage.querySelector('[data-a=submit]'),
          axis: stage.querySelector('.axis-warn'), tools: stage.querySelector('.map-tools'), hint: stage.querySelector('.paint-hint'),
        });
        els.submit.onclick = submit;
        stage.querySelector('[data-a=skip]').onclick = skip;
        stage.querySelector('[data-a=clear]').onclick = () => { if (cur?.kind === 'toMap') map.clear(); };
      },
      next() {
        busy = false; els.fb.innerHTML = '';
        const swap = L === 2 && Math.random() < 0.5;
        map.setSwap(swap);
        els.axis.innerHTML = swap ? '⚠ Trục đã hoán đổi — hàng là <b>CD</b>, cột là <b>AB</b>' : '';
        const nOn = [[3, 6], [5, 9], [6, 10]][L], nDc = [[0, 0], [1, 2], [0, 3]][L];
        const on = KM.randomSubset(KM.FULL, KM.rnd(...nOn));
        const kind = Math.random() < 0.55 ? 'toMap' : 'toList';
        const dc = kind === 'toMap' ? KM.randomSubset(KM.FULL & ~on, KM.rnd(...nDc)) : 0;
        const usePi = L === 2 && Math.random() < 0.5;
        cur = { on, dc, kind, usePi, swap };
        map.clearGroups(); map.clearMarks();
        if (kind === 'toMap') {
          map.locked = false;
          map.setOpt('allowDC', !!dc); map.setOpt('showZeros', false);
          map.clear();
          els.tools.style.visibility = 'visible';
          els.hint.textContent = dc ? 'Nhấp: 0→1→X · Kéo để tô · Chuột phải: X' : 'Nhấp để bật/tắt · Kéo để tô nhanh';
          els.prompt.innerHTML = usePi ? 'Tô các ô <b class="hl-1">1</b> của hàm (ΠM liệt kê các ô <b class="hl-0">0</b>!)' : 'Tô bản đồ tương ứng' + (dc ? ' — ô tùy định đánh <b class="hl-x">X</b>' : '');
          els.q.innerHTML = `f = ${answerHTML()}`;
          els.listRow.style.display = 'none';
          els.listIn.blur();
        } else {
          map.locked = true;
          map.setOpt('showZeros', usePi);
          map.set(on, 0);
          els.tools.style.visibility = 'hidden';
          els.prompt.innerHTML = usePi ? 'Liệt kê các <b class="hl-0">maxterm</b> (ô 0)' : 'Liệt kê các <b class="hl-1">minterm</b> (ô 1)';
          els.q.innerHTML = usePi ? 'f = ΠM( ? )' : 'f = Σm( ? )';
          els.listRow.style.display = '';
          els.listIn.value = ''; els.listIn.focus();
        }
        s.newQuestion();
      },
      focus() { if (cur?.kind === 'toList') els.listIn.focus(); },
      onKey(e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } },
      destroy() { map?.destroy(); },
    };
    return ctrl;
  },
};

/* =====================================================================
   3) VẼ NGƯỢC — biểu thức → bản đồ
   ===================================================================== */
const GameReverse = {
  id: 'reverse', name: 'Vẽ Ngược', icon: '✎', color: '#f472b6',
  tagline: 'Biểu thức → bản đồ',
  desc: 'Cho một biểu thức Boolean (không nhất thiết tối giản: có thể là POS, phủ định cả cụm, XOR, lồng ngoặc…). Hãy tô đúng mọi ô làm f = 1. Sau mỗi câu đúng, bạn được xem luôn dạng rút gọn.',
  rules: ['Nhấp hoặc kéo để tô ô 1', '<kbd>Enter</kbd> nộp · Bỏ qua: xem đáp án', 'Sai: −3s, mất combo'],
  levels: ['Tổng 2–3 tích', 'SOP dài hoặc tích các tổng (POS)', 'Lồng nhau: phủ định cụm, XOR, tích-của-tổng…'],
  duration: (diff) => [90, 125, 160][diff], par: [14, 25, 42],
  create(s) {
    const L = s.diff, BASE = [80, 190, 420][L];
    let map, cur, busy = false;
    const els = {};
    const qHTML = () => `<span class="expr-math">${KM.astHTML(cur.ast, nt())}</span>`;
    const minHTML = () => KM.sopHTML(KM.minimalSOP(cur.bits).terms, nt(), true);
    function submit() {
      if (busy || !s.active) return;
      const { on } = map.getBits();
      const diff = on ^ cur.bits;
      if (!diff) {
        busy = true;
        s.right({ base: BASE, el: els.submit, q: qHTML(), a: `Σm(${listStr(cur.bits)})` });
        map.setGroups(KM.minimalSOP(cur.bits).terms);
        els.fb.innerHTML = fbBox('good', `✓ Chuẩn! Rút gọn: <span class="sol expr-math">${minHTML()}</span>`);
        s.hold(); setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 1300);
      } else {
        s.wrong({ penalty: 3, el: els.submit, q: qHTML(), a: `Σm(${listStr(cur.bits)})`, u: `Σm(${listStr(on)})` });
        els.fb.innerHTML = fbBox('bad', `✗ Chưa đúng — các ô đã tô chưa khớp với biểu thức. −3s`);
      }
    }
    function skip() {
      if (busy || !s.active) return;
      busy = true;
      s.skip({ q: qHTML(), a: `Σm(${listStr(cur.bits)})` });
      map.set(cur.bits, 0, true);
      map.setGroups(KM.minimalSOP(cur.bits).terms);
      els.fb.innerHTML = fbBox('part', `Đáp án: Σm(${listStr(cur.bits)}) = <span class="expr-math">${minHTML()}</span>`);
      s.hold(); setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 2400);
    }
    const ctrl = {
      mount(stage) {
        stage.innerHTML = `<div class="split">
          <div class="pane-map"><div class="map-slot"></div>
            <div class="map-tools"><button class="btn ghost sm" data-a="clear">Xóa bản đồ</button><span class="muted small">Nhấp để bật/tắt · Kéo để tô nhanh</span></div></div>
          <div class="pane-ans">
            <div class="prompt">Tô mọi ô làm <b class="hl-1">f = 1</b></div>
            <div class="qbig expr-big"></div>
            <div class="actions">
              <button class="btn primary" data-a="submit">Nộp <kbd>Enter</kbd></button>
              <button class="btn ghost" data-a="skip">Bỏ qua</button>
            </div>
            <div class="feedback"></div>
          </div></div>`;
        map = new KMapView({ interactive: true, size: 'lg' });
        stage.querySelector('.map-slot').appendChild(map.el);
        Object.assign(els, { q: stage.querySelector('.qbig'), fb: stage.querySelector('.feedback'), submit: stage.querySelector('[data-a=submit]') });
        els.submit.onclick = submit;
        stage.querySelector('[data-a=skip]').onclick = skip;
        stage.querySelector('[data-a=clear]').onclick = () => map.clear();
      },
      next() {
        busy = false; els.fb.innerHTML = '';
        cur = KM.randomExpr(L);
        map.clear();
        els.q.innerHTML = `f = ${qHTML()}`;
        els.q.classList.remove('pop-in'); void els.q.offsetWidth; els.q.classList.add('pop-in');
        s.newQuestion();
      },
      onKey(e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Delete' || e.key === 'Backspace') map.clear(); },
      destroy() { map?.destroy(); },
    };
    return ctrl;
  },
};

/* =====================================================================
   4) THỢ SĂN NGUYÊN TỐ — phân loại implicant
   ===================================================================== */
const CATS = {
  E: { label: 'Bắt buộc', sub: 'EPI', name: 'Nhóm to nhất & gánh ô độc quyền', color: '#34d399' },
  P: { label: 'Dự bị', sub: 'PI', name: 'Nhóm to nhất nhưng bị trùng', color: '#60a5fa' },
  I: { label: 'Quá nhỏ', sub: 'Imp', name: 'Chưa gom hết cỡ', color: '#fbbf24' },
  X: { label: 'Phạm luật', sub: '✗', name: 'Khoanh dính vào ô 0', color: '#fb7185' },
};
const GameHunter = {
  id: 'hunter', name: 'Thợ Săn Nguyên Tố', icon: '◎', color: '#fbbf24',
  tagline: 'Phân loại nhóm: Bắt buộc · Dự bị · Quá nhỏ · Phạm luật',
  desc: 'Mỗi bản đồ đi kèm một danh sách các nhóm khoanh. Nhiệm vụ của bạn là phân loại từng nhóm: nhóm nào bắt buộc phải có trong công thức, nhóm nào là dự bị (bị trùng), nhóm nào khoanh quá nhỏ (chưa nở hết cỡ), và nhóm nào phạm luật (khoanh dính ô 0).',
  rules: [
    '<b style="color:#34d399">Bắt buộc (EPI)</b>: Nhóm to nhất VÀ là nhóm duy nhất che được ít nhất một ô 1 cô đơn',
    '<b style="color:#60a5fa">Dự bị (PI)</b>: Đã to hết cỡ, nhưng mọi ô 1 của nó đều đã có nhóm khác che giúp rồi',
    '<b style="color:#fbbf24">Quá nhỏ (Imp)</b>: Chỉ chứa ô 1/X nhưng khoanh quá bé, còn gộp to gấp đôi được',
    '<b style="color:#fb7185">Phạm luật (✗)</b>: Khoanh dính vào ít nhất một ô 0',
    'Đúng toàn bộ mới được điểm · Sai: −5s và xem giải thích chi tiết',
  ],
  levels: ['4 tích, không có X, phân loại độc lập', '5 tích, có ô X tùy định', '6 tích, nhiều X, nhóm vòng cyclic — tư duy độc lập'],
  duration: (diff) => [130, 175, 220][diff], par: [30, 45, 65],
  create(s) {
    const L = s.diff, BASE = [150, 360, 780][L];
    let map, cur, busy = false, reviewing = false, picks = [];
    const els = {};
    const qHTML = () => `Σm(${listStr(cur.on)})${cur.dc ? ` + d(${listStr(cur.dc)})` : ''}`;
    function renderList() {
      els.list.innerHTML = cur.cands.map((c, i) => `
        <div class="cand" data-i="${i}">
          <div class="cand-term expr-math">${KM.termHTML(c.p, nt())}</div>
          <div class="seg4">${Object.entries(CATS).map(([k, v]) => `<button data-v="${k}" style="--cc:${v.color}" title="${v.name}">${v.label}</button>`).join('')}</div>
          <div class="cand-verdict"></div>
        </div>`).join('');
    }
    function submit() {
      if (reviewing) { cont(); return; }
      if (busy || !s.active) return;
      if (picks.some((p) => !p)) {
        els.fb.innerHTML = fbBox('warn', '⚠ Hãy phân loại tất cả các tích trước khi nộp');
        $$('.cand', els.list).forEach((r, i) => { if (!picks[i]) FX.shake(r); });
        return;
      }
      busy = true;
      let nOk = 0;
      $$('.cand', els.list).forEach((r, i) => {
        const c = cur.cands[i], ok = picks[i] === c.cat;
        if (ok) nOk++;
        r.classList.add(ok ? 'ok' : 'no');
        r.querySelector('.cand-verdict').innerHTML = ok ? '✓' : `→ <b style="color:${CATS[c.cat].color}">${CATS[c.cat].label}</b>`;
      });
      map.setGroups(cur.ess);
      const a = cur.cands.map((c) => `${KM.termHTML(c.p, nt())}: <b style="color:${CATS[c.cat].color}">${CATS[c.cat].label}</b>`).join(' · ');
      if (nOk === cur.cands.length) {
        s.right({ base: BASE, el: els.submit, q: qHTML(), a });
        els.fb.innerHTML = fbBox('good', `✓ Hoàn hảo! Các EPI đang được khoanh trên bản đồ.`);
        s.hold(); setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 1500);
      } else {
        s.wrong({ penalty: 5, el: els.submit, q: qHTML(), a, u: `${nOk}/${cur.cands.length} đúng` });
        const sopTxt = KM.sopHTML(cur.sop.terms, nt(), true);
        els.fb.innerHTML = fbBox('bad', `✗ Đúng ${nOk}/${cur.cands.length}. Bản đồ đang khoanh <b>${cur.ess.length}</b> EPI` +
          ` (tổng ${cur.primes.length} PI). SOP tối giản: <span class="expr-math">${sopTxt}</span>` +
          `<div class="cont-row"><button class="btn primary sm" data-a="cont">Tiếp tục <kbd>Enter</kbd></button></div>`);
        els.fb.querySelector('[data-a=cont]').onclick = cont;
        reviewing = true; s.hold();
      }
    }
    function cont() { if (!reviewing) return; reviewing = false; s.release(); if (!s.ended) ctrl.next(); }
    const ctrl = {
      mount(stage) {
        stage.innerHTML = `<div class="split">
          <div class="pane-map"><div class="map-slot"></div>
            <div class="map-legend"><span><i class="lg on"></i>1</span><span><i class="lg zero"></i>0</span><span><i class="lg dc"></i>X tùy định</span></div></div>
          <div class="pane-ans">
            <div class="prompt">Phân loại từng nhóm khoanh:</div>
            <div class="cat-legend">${Object.values(CATS).map((v) => `<span style="--cc:${v.color}"><b>${v.label}</b> <i>(${v.sub})</i>: ${v.name}</span>`).join('')}</div>
            <div class="cand-list"></div>
            <div class="actions"><button class="btn primary" data-a="submit">Nộp <kbd>Enter</kbd></button></div>
            <div class="feedback"></div>
          </div></div>`;
        map = new KMapView({ showZeros: true, size: 'lg' });
        stage.querySelector('.map-slot').appendChild(map.el);
        Object.assign(els, { list: stage.querySelector('.cand-list'), fb: stage.querySelector('.feedback'), submit: stage.querySelector('[data-a=submit]') });
        els.submit.onclick = submit;
        els.list.addEventListener('click', (e) => {
          const b = e.target.closest('button[data-v]'); if (!b || busy) return;
          const row = b.closest('.cand'), i = +row.dataset.i;
          picks[i] = b.dataset.v;
          $$('button', row).forEach((x) => x.classList.toggle('sel', x === b));
          FX.sfx.click();
        });
      },
      next() {
        busy = false; reviewing = false;
        cur = KM.genHunter(L);
        picks = new Array(cur.cands.length).fill(null);
        map.clearGroups(); map.clearMarks();
        map.set(cur.on, cur.dc);
        renderList();
        els.fb.innerHTML = '';
        s.newQuestion();
      },
      onKey(e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } },
      destroy() { map?.destroy(); },
    };
    return ctrl;
  },
};

/* =====================================================================
   5) TỌA ĐỘ GRAY — phản xạ ô ⇄ chỉ số
   ===================================================================== */
const GameCoords = {
  id: 'coords', name: 'Tọa Độ Gray', icon: '⌖', color: '#34d399',
  tagline: 'Phản xạ ô ⇄ chỉ số minterm',
  desc: 'Phản xạ chớp nhoáng: ô sáng lên → chọn chỉ số minterm; hoặc cho chỉ số / mã nhị phân / tích literal → nhấp đúng ô. Combo dài nhân điểm rất mạnh — đây là bài khởi động trước khi đua rút gọn.',
  rules: ['Dạng 1: gõ số trên bàn phím (hoặc nhấp bảng số 0–15)', 'Dạng 2: nhấp vào đúng ô trên bản đồ', 'Sai: −2s, mất combo, ô đúng sẽ được chỉ ra'],
  levels: ['Chỉ số thập phân, trục chuẩn', 'Thêm mã nhị phân ABCD và tích literal', 'Trục AB/CD hoán đổi ngẫu nhiên từng câu'],
  duration: (diff) => [50, 65, 85][diff], par: [2.5, 3.8, 5.5],
  create(s) {
    const L = s.diff, BASE = [25, 60, 130][L];
    let map, cur, busy = false, buf = '', bufT = 0;
    const els = {};
    function reprOf(m) {
      const kind = L === 0 ? 'dec' : KM.pick(['dec', 'bin', 'term']);
      if (kind === 'dec') return `m<sub>${m}</sub>`;
      if (kind === 'bin') return `<span class="mono">${KM.bin4(m)}</span><sub>ABCD</sub>`;
      return `<span class="expr-math">${KM.termHTML(KM.impOf(15, m), nt())}</span>`;
    }
    function answer(m, el) {
      if (busy || !s.active) return;
      const ok = m === cur.m;
      const q = cur.type === 'A' ? `Ô sáng → chỉ số${cur.swap ? ' (trục hoán đổi)' : ''}` : `Tìm ô ${cur.repr}${cur.swap ? ' (trục hoán đổi)' : ''}`;
      if (ok) {
        s.right({ base: BASE, el: el || els.q, q, a: `m${cur.m}` });
        map.flash(1 << cur.m, 'right', 300);
        busy = true; setTimeout(() => { if (!s.ended) ctrl.next(); }, 160);
      } else {
        s.wrong({ penalty: 2, el: el || els.q, q, a: `m${cur.m} = ${KM.bin4(cur.m)}`, u: `m${m}` });
        busy = true; s.hold();
        map.clearMarks(); map.mark(1 << cur.m, 'right');
        if (cur.type === 'B') map.flash(1 << m, 'wrong', 700);
        els.fb.innerHTML = fbBox('bad', `Đáp án: m${cur.m} = ${KM.bin4(cur.m)}`);
        setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 900);
      }
    }
    const ctrl = {
      mount(stage) {
        stage.innerHTML = `<div class="split">
          <div class="pane-map"><div class="axis-warn"></div><div class="map-slot"></div></div>
          <div class="pane-ans">
            <div class="prompt"></div>
            <div class="qbig center coords-q"></div>
            <div class="numpad">${Array.from({ length: 16 }, (_, i) => `<button data-n="${i}">${i}</button>`).join('')}</div>
            <div class="feedback"></div>
          </div></div>`;
        map = new KMapView({ size: 'lg', onCellClick: (m, el) => { if (cur?.type === 'B') answer(m, el); } });
        stage.querySelector('.map-slot').appendChild(map.el);
        Object.assign(els, { prompt: stage.querySelector('.prompt'), q: stage.querySelector('.coords-q'), pad: stage.querySelector('.numpad'), fb: stage.querySelector('.feedback'), axis: stage.querySelector('.axis-warn') });
        els.pad.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && cur?.type === 'A') answer(+b.dataset.n, b); });
      },
      next() {
        busy = false; buf = ''; clearTimeout(bufT); els.fb.innerHTML = '';
        const swap = L === 2 && Math.random() < 0.5;
        map.setSwap(swap);
        els.axis.innerHTML = swap ? '⚠ Trục hoán đổi — hàng <b>CD</b>, cột <b>AB</b>' : '';
        let m;
        do { m = KM.rnd(0, 15); } while (cur && m === cur.m);
        const type = Math.random() < 0.5 ? 'A' : 'B';
        cur = { m, type, swap };
        map.clearMarks(); map.set(0, 0, false);
        if (type === 'A') {
          map.mark(1 << m, 'target');
          els.prompt.innerHTML = 'Ô đang sáng là minterm số mấy?';
          els.q.innerHTML = '<span class="muted">m = ?</span>';
          els.pad.classList.remove('dim');
          map.el.classList.remove('clickable');
        } else {
          cur.repr = reprOf(m);
          els.prompt.innerHTML = 'Nhấp vào ô tương ứng';
          els.q.innerHTML = cur.repr;
          els.pad.classList.add('dim');
          map.el.classList.add('clickable');
        }
        els.q.classList.remove('pop-in'); void els.q.offsetWidth; els.q.classList.add('pop-in');
        s.newQuestion();
      },
      onKey(e) {
        if (cur?.type !== 'A' || !/^[0-9]$/.test(e.key)) return;
        e.preventDefault();
        clearTimeout(bufT);
        buf += e.key;
        els.q.innerHTML = `m = ${buf}`;
        const n = +buf;
        if (buf.length === 2 || n >= 2 || buf === '0') { buf = ''; if (n <= 15) answer(n); else { els.q.innerHTML = 'm = ?'; } }
        else bufT = setTimeout(() => { const v = +buf; buf = ''; answer(v); }, 420);
      },
      destroy() { clearTimeout(bufT); map?.destroy(); },
    };
    return ctrl;
  },
};

/* =====================================================================
   6) LŨY THỪA 2 — 2^0 … 2^16
   ===================================================================== */
const sup = (n) => `<sup>${n}</sup>`;
const GamePow = {
  id: 'pow2', name: 'Lũy Thừa 2', icon: '2ⁿ', color: '#60a5fa',
  tagline: '2⁰ … 2¹⁶ phản xạ hai chiều',
  desc: 'Thuộc lòng 2⁰ đến 2¹⁶ theo cả hai chiều rồi vận dụng: nhân/chia lũy thừa, hex, nhị phân, phân tích một số thành tổng lũy thừa 2, số bit cần thiết…',
  rules: ['Gõ đáp án rồi <kbd>Enter</kbd> · có thể gõ 65536, 65 536 hay 65.536', 'Câu phân tích: gõ các số mũ cách nhau bởi dấu cách, VD <code>15 9 3</code>', 'Sai: −2s và hiện đáp án'],
  levels: ['2ⁿ ⇄ n', 'Thêm nhị phân, hex, nhân, chia', 'Phân tích tổng, 2ⁿ−1, số bit, lũy thừa lớn nhất ≤ N'],
  duration: (diff) => [60, 80, 105][diff], par: [4.0, 7.0, 12.0],
  gen(L) {
    const types = L === 0 ? ['val', 'exp'] : L === 1 ? ['val', 'exp', 'bin', 'hex', 'mul', 'div'] : ['val', 'exp', 'sum', 'sum', 'minus1', 'bits', 'floor', 'mul', 'div', 'hex'];
    const t = KM.pick(types), P = (n) => 2 ** n;
    let n, a, b;
    switch (t) {
      case 'val': n = KM.rnd(0, 16); return { tag: 'Giá trị', q: `2${sup(n)} = ?`, ans: P(n), show: fmtNum(P(n)) };
      case 'exp': n = KM.rnd(0, 16); return { tag: 'Số mũ', q: `2${sup('?')} = ${fmtNum(P(n))}`, ans: n, show: n };
      case 'bin':
        n = KM.rnd(1, 16);
        return Math.random() < 0.5
          ? { tag: 'Nhị phân', q: `<span class="mono">1${'0'.repeat(n)}</span><sub>2</sub> = 2${sup('?')}`, ans: n, show: n }
          : { tag: 'Nhị phân → thập phân', q: `<span class="mono">1${'0'.repeat(n)}</span><sub>2</sub> = ?<sub>10</sub>`, ans: P(n), show: fmtNum(P(n)) };
      case 'hex': n = KM.rnd(1, 16); return { tag: 'Hex', q: `0x${P(n).toString(16).toUpperCase()} = 2${sup('?')}`, ans: n, show: n };
      case 'mul': a = KM.rnd(1, 10); b = KM.rnd(1, 16 - a); return { tag: 'Nhân', q: `${fmtNum(P(a))} × ${fmtNum(P(b))} = ?`, ans: P(a + b), show: fmtNum(P(a + b)) };
      case 'div': a = KM.rnd(6, 16); b = KM.rnd(1, a - 1); return { tag: 'Chia', q: `${fmtNum(P(a))} ÷ ${fmtNum(P(b))} = ?`, ans: P(a - b), show: fmtNum(P(a - b)) };
      case 'sum': {
        const k = KM.rnd(2, 3), ex = KM.shuffle(Array.from({ length: 17 }, (_, i) => i)).slice(0, k).sort((x, y) => y - x);
        const v = ex.reduce((s, e) => s + P(e), 0);
        return { tag: 'Phân tích', q: `${fmtNum(v)} = ${ex.map(() => `2${sup('?')}`).join(' + ')}`, set: ex, show: ex.join(' ') };
      }
      case 'minus1': n = KM.rnd(2, 16); return { tag: '2ⁿ − 1', q: `2${sup(n)} − 1 = ?`, ans: P(n) - 1, show: fmtNum(P(n) - 1) };
      case 'bits': { const v = KM.rnd(2, 65535); const bl = v.toString(2).length; return { tag: 'Số bit', q: `Cần tối thiểu bao nhiêu bit (không dấu) để biểu diễn ${fmtNum(v)}?`, ans: bl, show: bl }; }
      case 'floor': { const v = KM.rnd(3, 65535); const f = v.toString(2).length - 1; return { tag: 'Sàn log₂', q: `2${sup('?')} lớn nhất mà ≤ ${fmtNum(v)}`, ans: f, show: f }; }
    }
  },
  create(s) {
    const L = s.diff, BASE = [30, 70, 160][L];
    let cur, busy = false;
    const els = {};
    function submit() {
      if (busy || !s.active) return;
      const raw = els.inp.value.trim(); if (!raw) return;
      let ok;
      if (cur.set) {
        const got = raw.split(/[\s,;+]+/).filter(Boolean).map(Number);
        ok = got.length === cur.set.length && cur.set.every((e) => got.includes(e));
      } else {
        const v = Number(raw.replace(/[\s.,_\u2009]/g, ''));
        ok = v === cur.ans;
      }
      if (ok) {
        s.right({ base: BASE, el: els.inp, q: cur.q, a: cur.show });
        els.card.classList.remove('ok-flash'); void els.card.offsetWidth; els.card.classList.add('ok-flash');
        busy = true; setTimeout(() => { if (!s.ended) ctrl.next(); }, 180);
      } else {
        s.wrong({ penalty: 2, el: els.inp, q: cur.q, a: cur.show, u: esc(raw) });
        els.fb.innerHTML = fbBox('bad', `Đáp án: <b class="mono">${cur.show}</b>`);
        busy = true; s.hold();
        setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 1100);
      }
    }
    const ctrl = {
      mount(stage) {
        stage.innerHTML = `<div class="pow-stage">
          <div class="pow-card">
            <div class="pow-tag"></div>
            <div class="pow-q"></div>
            <input class="pow-in mono-in" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="Gõ đáp án…">
            <div class="actions center"><button class="btn primary" data-a="submit">Trả lời <kbd>Enter</kbd></button></div>
            <div class="feedback"></div>
          </div>
        </div>`;
        Object.assign(els, { tag: stage.querySelector('.pow-tag'), q: stage.querySelector('.pow-q'), inp: stage.querySelector('.pow-in'), fb: stage.querySelector('.feedback'), card: stage.querySelector('.pow-card') });
        stage.querySelector('[data-a=submit]').onclick = submit;
      },
      next() {
        busy = false;
        let c; do { c = GamePow.gen(L); } while (cur && c.q === cur.q);
        cur = c;
        els.tag.textContent = cur.tag;
        els.q.innerHTML = cur.q;
        els.q.classList.remove('pop-in'); void els.q.offsetWidth; els.q.classList.add('pop-in');
        els.inp.value = ''; els.fb.innerHTML = ''; els.inp.focus();
        s.newQuestion();
      },
      focus() { els.inp.focus(); },
      onKey(e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (document.activeElement !== els.inp) els.inp.focus(); },
    };
    return ctrl;
  },
};

/* =====================================================================
   7) ĐẤU TRƯỜNG SỐ NGUYÊN — Dấu lượng, Bù 1, Bù 2, Excess-K
   ===================================================================== */
const GameInt = {
  id: 'int_arena', name: 'Đấu Trường Số Nguyên', icon: '🔢', color: '#38bdf8',
  tagline: 'Dấu Lượng ⇄ Bù 1 ⇄ Bù 2 ⇄ Excess-K',
  desc: 'Chinh phục 4 dạng biểu diễn số nguyên then chốt trong kiến trúc máy tính. Phản xạ giải mã 2 chiều nhị phân ⇄ thập phân, nhận diện bẫy hai số 0 (+0 / -0) và điểm cực trị âm bất đối xứng.',
  rules: [
    'Phản xạ chuyển đổi nhị phân ⇄ thập phân qua 4 hệ biểu diễn',
    'Phím tắt: bấm 1, 2, 3, 4 trên bàn phím hoặc nhấp chuột để chọn phương án',
    'Trả lời đúng cộng điểm + combo; sai trừ 2s và hiển thị phân tích từng bit'
  ],
  levels: [
    '4-bit cơ bản: các số nguyên chuẩn và dải giá trị [-8, 7]',
    '8-bit nâng cao: hỗn hợp 4 hệ, mã lệch Excess-128 / Excess-127',
    'Địa ngục 8-bit & 16-bit: bẫy cực trị âm (-128, -32768) và bẫy hai số 0'
  ],
  duration: (diff) => [55, 75, 100][diff], par: [3.5, 5.5, 8.5],
  create(s) {
    const L = s.diff, BASE = [30, 75, 165][L];
    let cur, busy = false;
    const els = {};

    function renderChoices(opts) {
      return opts.map((opt, i) => `
        <button type="button" class="choice-btn" data-idx="${i}">
          <span class="choice-key">${i + 1}</span>
          <span class="choice-text">${opt}</span>
        </button>
      `).join('');
    }

    function renderBitBoxes(binStr) {
      if (!binStr || typeof binStr !== 'string') return '';
      const n = binStr.length;
      return `<div class="bit-strip">${binStr.split('').map((b, i) => `
        <div class="bit-box">
          <div class="bit-val hl-${b}">${b}</div>
          <div class="bit-idx">${n - 1 - i}</div>
        </div>
      `).join('')}</div>`;
    }

    function answer(idx, btnEl) {
      if (busy || !s.active) return;
      const ok = idx === cur.correctIndex;
      const buttons = els.grid.querySelectorAll('.choice-btn');

      if (ok) {
        if (btnEl) btnEl.classList.add('ok');
        s.right({ base: BASE, el: btnEl || els.card, q: cur.prompt, a: cur.options[cur.correctIndex] });
        els.card.classList.remove('ok-flash'); void els.card.offsetWidth; els.card.classList.add('ok-flash');
        busy = true;
        setTimeout(() => { if (!s.ended) ctrl.next(); }, 250);
      } else {
        if (btnEl) btnEl.classList.add('bad');
        if (buttons[cur.correctIndex]) buttons[cur.correctIndex].classList.add('ok');
        s.wrong({ penalty: 2, el: btnEl || els.card, q: cur.prompt, a: cur.options[cur.correctIndex], u: cur.options[idx] });
        els.fb.innerHTML = fbBox('bad', `✗ ${cur.explanation}`);
        busy = true; s.hold();
        setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 1400);
      }
    }

    const ctrl = {
      mount(stage) {
        stage.innerHTML = `
        <div class="num-stage">
          <div class="num-card glass">
            <div class="num-tag"></div>
            <div class="num-q"></div>
            <div class="num-visual"></div>
            <div class="choices-grid"></div>
            <div class="feedback"></div>
          </div>
        </div>`;
        Object.assign(els, {
          card: stage.querySelector('.num-card'),
          tag: stage.querySelector('.num-tag'),
          q: stage.querySelector('.num-q'),
          visual: stage.querySelector('.num-visual'),
          grid: stage.querySelector('.choices-grid'),
          fb: stage.querySelector('.feedback')
        });

        els.grid.addEventListener('click', (e) => {
          const btn = e.target.closest('.choice-btn');
          if (btn && !busy) {
            const idx = parseInt(btn.dataset.idx, 10);
            answer(idx, btn);
          }
        });
      },
      next() {
        busy = false;
        cur = NumEngine.Gen.genIntQuestion(L);
        els.tag.textContent = cur.title;
        els.q.innerHTML = cur.prompt;
        els.visual.innerHTML = cur.bin ? renderBitBoxes(cur.bin) : '';
        els.grid.innerHTML = renderChoices(cur.options);
        els.fb.innerHTML = '';
        els.q.classList.remove('pop-in'); void els.q.offsetWidth; els.q.classList.add('pop-in');
        s.newQuestion();
      },
      focus() {},
      onKey(e) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          const btns = els.grid.querySelectorAll('.choice-btn');
          if (btns[idx]) answer(idx, btns[idx]);
        }
      }
    };
    return ctrl;
  }
};

/* =====================================================================
   8) VÕ ĐÀI ALU — Phép toán +, -, SAL, SAR, SHR & Cờ Tràn
   ===================================================================== */
const GameALU = {
  id: 'alu_arena', name: 'Võ Đài ALU', icon: '⚔️', color: '#f59e0b',
  tagline: 'Phép toán +, -, SAL, SAR, SHR & Cờ Tràn',
  desc: 'Mô phỏng bộ xử lý ALU thực thụ: tính nhanh các phép dịch bit (SAR giữ dấu vs SHR chèn 0), cộng trừ Bù 2, phát hiện cờ Tràn (Overflow V=1) và quy tắc End-Around Carry trong Bù 1.',
  rules: [
    'SAR: dịch phải số học giữ nguyên bit dấu MSB (chia nguyên cho 2)',
    'SHR: dịch phải logic luôn chèn 0 · SAL: dịch trái chèn 0',
    'Cộng Bù 2: kiểm tra tràn khi 2 số cùng dấu sinh kết quả ngược dấu',
    'Bù 1: quy tắc End-around carry dồn bit nhớ MSB về lại LSB'
  ],
  levels: [
    '4-bit: Lệnh dịch bit (SAR, SHR, SAL) và cộng Bù 2 cơ bản',
    '8-bit: Cộng/Trừ Bù 2, soi cờ Tràn Overflow (V) và Carry-out',
    'Địa ngục: Quy tắc End-Around Carry Bù 1, xoay bit ROL/ROR'
  ],
  duration: (diff) => [55, 80, 105][diff], par: [4.0, 7.0, 11.0],
  create(s) {
    const L = s.diff, BASE = [35, 85, 190][L];
    let cur, busy = false;
    const els = {};

    function renderChoices(opts) {
      return opts.map((opt, i) => `
        <button type="button" class="choice-btn" data-idx="${i}">
          <span class="choice-key">${i + 1}</span>
          <span class="choice-text">${opt}</span>
        </button>
      `).join('');
    }

    function renderOperands(operands) {
      if (!operands || !operands.length) return '';
      return `<div style="display:flex; flex-direction:column; gap:0.5rem; align-items:center;">
        ${operands.map((op, i) => `
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span class="mono muted small">Thanh ghi ${i === 0 ? 'A' : 'B'}:</span>
            <div class="bit-strip">${op.split('').map((b, bi) => `
              <div class="bit-box">
                <div class="bit-val hl-${b}">${b}</div>
                <div class="bit-idx">${op.length - 1 - bi}</div>
              </div>
            `).join('')}</div>
          </div>
        `).join('')}
      </div>`;
    }

    function answer(idx, btnEl) {
      if (busy || !s.active) return;
      const ok = idx === cur.correctIndex;
      const buttons = els.grid.querySelectorAll('.choice-btn');

      if (ok) {
        if (btnEl) btnEl.classList.add('ok');
        s.right({ base: BASE, el: btnEl || els.card, q: cur.prompt, a: cur.options[cur.correctIndex] });
        els.card.classList.remove('ok-flash'); void els.card.offsetWidth; els.card.classList.add('ok-flash');
        busy = true;
        setTimeout(() => { if (!s.ended) ctrl.next(); }, 250);
      } else {
        if (btnEl) btnEl.classList.add('bad');
        if (buttons[cur.correctIndex]) buttons[cur.correctIndex].classList.add('ok');
        s.wrong({ penalty: 2, el: btnEl || els.card, q: cur.prompt, a: cur.options[cur.correctIndex], u: cur.options[idx] });
        els.fb.innerHTML = fbBox('bad', `✗ ${cur.explanation}`);
        busy = true; s.hold();
        setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 1600);
      }
    }

    const ctrl = {
      mount(stage) {
        stage.innerHTML = `
        <div class="num-stage">
          <div class="num-card glass">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div class="num-tag"></div>
              <div class="alu-header-badge"></div>
            </div>
            <div class="num-q"></div>
            <div class="num-visual"></div>
            <div class="choices-grid"></div>
            <div class="feedback"></div>
          </div>
        </div>`;
        Object.assign(els, {
          card: stage.querySelector('.num-card'),
          tag: stage.querySelector('.num-tag'),
          badge: stage.querySelector('.alu-header-badge'),
          q: stage.querySelector('.num-q'),
          visual: stage.querySelector('.num-visual'),
          grid: stage.querySelector('.choices-grid'),
          fb: stage.querySelector('.feedback')
        });

        els.grid.addEventListener('click', (e) => {
          const btn = e.target.closest('.choice-btn');
          if (btn && !busy) {
            const idx = parseInt(btn.dataset.idx, 10);
            answer(idx, btn);
          }
        });
      },
      next() {
        busy = false;
        cur = NumEngine.Gen.genALUQuestion(L);
        els.tag.textContent = cur.title;
        els.badge.innerHTML = `<span class="alu-op-badge">${cur.opcode}</span>`;
        els.q.innerHTML = cur.prompt;
        els.visual.innerHTML = renderOperands(cur.operands);
        els.grid.innerHTML = renderChoices(cur.options);
        els.fb.innerHTML = '';
        els.q.classList.remove('pop-in'); void els.q.offsetWidth; els.q.classList.add('pop-in');
        s.newQuestion();
      },
      focus() {},
      onKey(e) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          const btns = els.grid.querySelectorAll('.choice-btn');
          if (btns[idx]) answer(idx, btns[idx]);
        }
      }
    };
    return ctrl;
  }
};

/* =====================================================================
   9) PHI HÀNH GIA CHẤM ĐỘNG — IEEE 754 & Mini-float
   ===================================================================== */
const GameFloat = {
  id: 'float_studio', name: 'Phi Hành Gia Chấm Động', icon: '🛸', color: '#ec4899',
  tagline: 'Giải mã IEEE 754 & Mini-float',
  desc: 'Mổ xẻ số chấm động chuẩn quốc tế IEEE 754: 3 trường bit Dấu (Sign), Số mũ lệch (Exponent), Phần định trị (Mantissa). Làm chủ số chuẩn, số dưới chuẩn (Denormalized) và các giá trị đặc biệt (±0, ±∞, NaN).',
  rules: [
    '3 trường màu: Cyan (Dấu S) · Amber (Số mũ E) · Tím (Định trị M)',
    'Normalized: (-1)^S × 2^(E - Bias) × (1 + M)',
    'Denormalized: E=0 → bit ẩn = 0, công thức 2^(1 - Bias) × M',
    'E tối đa: M=0 → Vô cực (±∞) · M ≠ 0 → NaN',
    'Phím tắt 1, 2, 3, 4 để chọn nhanh đáp án'
  ],
  levels: [
    '8-bit Mini-float (1-4-3, Bias 7): Số chuẩn Normalized đẹp (1.0, 1.5, 2.0, 3.5, ...)',
    '8-bit Mini-float: Số dưới chuẩn Denormalized, Zeros (±0), Infinities (±∞), NaN',
    'Địa ngục: IEEE 754 Bán chính xác FP16 (16-bit) & Đơn chính xác FP32 (32-bit)'
  ],
  duration: (diff) => [60, 85, 115][diff], par: [4.5, 8.0, 13.0],
  create(s) {
    const L = s.diff, BASE = [35, 90, 200][L];
    let cur, busy = false;
    const els = {};

    function renderChoices(opts) {
      return opts.map((opt, i) => `
        <button type="button" class="choice-btn" data-idx="${i}">
          <span class="choice-key">${i + 1}</span>
          <span class="choice-text">${opt}</span>
        </button>
      `).join('');
    }

    function renderFloatVisual(binStr, spec) {
      if (!binStr || !spec) return '';
      const sBit = binStr[0];
      const eBits = binStr.slice(1, 1 + spec.expBits);
      const mBits = binStr.slice(1 + spec.expBits);

      return `
      <div style="display:flex; flex-direction:column; align-items:center; gap:0.6rem;">
        <div class="fp-bit-strip" style="font-size:1.4rem;">
          <span class="fp-s" title="Bit Dấu (Sign: ${sBit === '0' ? '+ (0)' : '- (1)'})">${sBit}</span>
          <span class="fp-e" title="Số Mũ (Exp: ${eBits} = ${parseInt(eBits, 2)})">${eBits}</span>
          <span class="fp-m" title="Định Trị (Mantissa: ${mBits})">${mBits}</span>
        </div>
        <div style="display:flex; gap:1.2rem; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted);">
          <span><b style="color:var(--c-cyan);">S</b>: Dấu (1-bit)</span>
          <span><b style="color:var(--c-amber);">E</b>: Mũ (Bias ${spec.bias})</span>
          <span><b style="color:var(--c-purple);">M</b>: Định trị (${spec.mantBits}-bit)</span>
        </div>
      </div>`;
    }

    function answer(idx, btnEl) {
      if (busy || !s.active) return;
      const ok = idx === cur.correctIndex;
      const buttons = els.grid.querySelectorAll('.choice-btn');

      if (ok) {
        if (btnEl) btnEl.classList.add('ok');
        s.right({ base: BASE, el: btnEl || els.card, q: cur.prompt, a: cur.options[cur.correctIndex] });
        els.card.classList.remove('ok-flash'); void els.card.offsetWidth; els.card.classList.add('ok-flash');
        busy = true;
        setTimeout(() => { if (!s.ended) ctrl.next(); }, 250);
      } else {
        if (btnEl) btnEl.classList.add('bad');
        if (buttons[cur.correctIndex]) buttons[cur.correctIndex].classList.add('ok');
        s.wrong({ penalty: 2, el: btnEl || els.card, q: cur.prompt, a: cur.options[cur.correctIndex], u: cur.options[idx] });
        els.fb.innerHTML = fbBox('bad', `✗ ${cur.explanation}`);
        busy = true; s.hold();
        setTimeout(() => { s.release(); if (!s.ended) ctrl.next(); }, 1600);
      }
    }

    const ctrl = {
      mount(stage) {
        stage.innerHTML = `
        <div class="num-stage">
          <div class="num-card glass">
            <div class="num-tag"></div>
            <div class="num-q"></div>
            <div class="num-visual"></div>
            <div class="choices-grid"></div>
            <div class="feedback"></div>
          </div>
        </div>`;
        Object.assign(els, {
          card: stage.querySelector('.num-card'),
          tag: stage.querySelector('.num-tag'),
          q: stage.querySelector('.num-q'),
          visual: stage.querySelector('.num-visual'),
          grid: stage.querySelector('.choices-grid'),
          fb: stage.querySelector('.feedback')
        });

        els.grid.addEventListener('click', (e) => {
          const btn = e.target.closest('.choice-btn');
          if (btn && !busy) {
            const idx = parseInt(btn.dataset.idx, 10);
            answer(idx, btn);
          }
        });
      },
      next() {
        busy = false;
        cur = NumEngine.Gen.genFloatQuestion(L);
        els.tag.textContent = cur.title;
        els.q.innerHTML = cur.prompt;
        els.visual.innerHTML = cur.binStr ? renderFloatVisual(cur.binStr, cur.spec) : '';
        els.grid.innerHTML = renderChoices(cur.options);
        els.fb.innerHTML = '';
        els.q.classList.remove('pop-in'); void els.q.offsetWidth; els.q.classList.add('pop-in');
        s.newQuestion();
      },
      focus() {},
      onKey(e) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const idx = parseInt(e.key, 10) - 1;
          const btns = els.grid.querySelectorAll('.choice-btn');
          if (btns[idx]) answer(idx, btns[idx]);
        }
      }
    };
    return ctrl;
  }
};

const GAMES = [GameSprint, GameDecode, GameReverse, GameHunter, GameCoords, GamePow, GameInt, GameALU, GameFloat];
