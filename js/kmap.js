'use strict';
/* ===== Thành phần bản đồ Karnaugh 4×4 có thể tương tác ===== */
const PALETTE = ['#22d3ee', '#f472b6', '#a3e635', '#fbbf24', '#a78bfa', '#fb923c', '#34d399', '#60a5fa'];

function runsOf(set) {
  const a = [...set].sort((x, y) => x - y), out = [];
  for (const v of a) { const last = out[out.length - 1]; if (last && v === last[1] + 1) last[1] = v; else out.push([v, v]); }
  return out;
}

class KMapView {
  constructor(opts = {}) {
    this.opts = Object.assign({
      interactive: false, allowDC: false, swap: false, showIdx: false,
      showZeros: false, size: 'md', onChange: null, onCellClick: null,
    }, opts);
    this.state = new Array(16).fill(0); // 0 | 1 | 2 (X)
    this.painting = null;
    this.locked = false;
    this.el = document.createElement('div');
    this._up = () => { this.painting = null; };
    document.addEventListener('pointerup', this._up);
    document.addEventListener('pointercancel', this._up);
    this.build();
  }

  destroy() {
    document.removeEventListener('pointerup', this._up);
    document.removeEventListener('pointercancel', this._up);
    this.el.remove();
  }

  build() {
    const { swap, size, interactive, onCellClick, showIdx } = this.opts;
    this.el.className = `kmap size-${size}` + (interactive ? ' interactive' : '') + (onCellClick ? ' clickable' : '') + (showIdx ? ' show-idx' : '');
    const rv = swap ? 'CD' : 'AB', cv = swap ? 'AB' : 'CD';
    this.el.innerHTML = `
      <div class="km-corner"><span class="rv">${rv}</span><span class="cv">${cv}</span></div>
      <div class="km-colhead">${KM.GRAY_LABEL.map((g) => `<span>${g}</span>`).join('')}</div>
      <div class="km-rowhead">${KM.GRAY_LABEL.map((g) => `<span>${g}</span>`).join('')}</div>
      <div class="km-board"><div class="km-cells"></div><div class="km-groups"></div></div>`;
    const cells = this.el.querySelector('.km-cells');
    this.cellEls = new Array(16);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const m = KM.cellToM(r, c, swap);
      const d = document.createElement('div');
      d.className = 'cell';
      d.dataset.m = m;
      d.innerHTML = `<div class="face"><span class="idx">${m}</span><span class="val"></span></div>`;
      cells.appendChild(d);
      this.cellEls[m] = d;
    }
    if (interactive) this.bindPaint(cells);
    if (onCellClick) cells.addEventListener('pointerdown', (e) => {
      const cell = e.target.closest('.cell'); if (!cell || this.locked) return;
      e.preventDefault();
      onCellClick(+cell.dataset.m, cell);
    });
    this.render(false);
  }

  bindPaint(cells) {
    cells.addEventListener('contextmenu', (e) => e.preventDefault());
    cells.addEventListener('pointerdown', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell || this.locked) return;
      e.preventDefault();
      try { e.target.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      const m = +cell.dataset.m, s = this.state[m];
      let nv;
      if (e.button === 2) nv = this.opts.allowDC ? (s === 2 ? 0 : 2) : 0;
      else nv = this.opts.allowDC ? (s + 1) % 3 : (s ? 0 : 1);
      this.painting = nv;
      this.setCell(m, nv);
    });
    cells.addEventListener('pointerover', (e) => {
      if (this.painting === null || this.locked) return;
      const cell = e.target.closest('.cell'); if (!cell) return;
      this.setCell(+cell.dataset.m, this.painting);
    });
  }

  setOpt(k, v) { this.opts[k] = v; }
  setSwap(swap) {
    if (this.opts.swap === swap) return;
    this.opts.swap = swap;
    this.build();
  }
  setShowIdx(b) { this.opts.showIdx = b; this.el.classList.toggle('show-idx', b); }

  setCell(m, v) {
    if (this.state[m] === v) return;
    this.state[m] = v;
    this.renderCell(m, true);
    FX.sfx.click();
    this.opts.onChange?.(this.getBits());
  }

  set(on, dc = 0, anim = true) {
    for (let m = 0; m < 16; m++) this.state[m] = (on >> m) & 1 ? 1 : (dc >> m) & 1 ? 2 : 0;
    this.render(anim);
  }
  clear() { this.state.fill(0); this.clearGroups(); this.render(false); this.opts.onChange?.(this.getBits()); }
  getBits() {
    let on = 0, dc = 0;
    this.state.forEach((v, m) => { if (v === 1) on |= 1 << m; else if (v === 2) dc |= 1 << m; });
    return { on, dc };
  }

  render(anim = true) {
    for (let m = 0; m < 16; m++) {
      this.renderCell(m, false);
      if (anim) {
        const { r, c } = KM.mToCell(m, this.opts.swap);
        const el = this.cellEls[m];
        el.classList.remove('pop'); void el.offsetWidth;
        el.style.setProperty('--d', (r + c) * 28 + 'ms');
        el.classList.add('pop');
      }
    }
  }
  renderCell(m, anim) {
    const el = this.cellEls[m], v = this.state[m];
    el.classList.toggle('on', v === 1);
    el.classList.toggle('dc', v === 2);
    el.classList.toggle('zero', v === 0);
    el.querySelector('.val').textContent = v === 1 ? '1' : v === 2 ? 'X' : this.opts.showZeros ? '0' : '';
    if (anim) { el.style.setProperty('--d', '0ms'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }

  /** Vẽ khung nhóm cho danh sách implicant (tự xử lý nhóm cuộn biên / 4 góc). */
  setGroups(imps, startColor = 0) {
    const layer = this.el.querySelector('.km-groups');
    layer.innerHTML = '';
    imps.forEach((p, k) => {
      const R = new Set(), C = new Set();
      for (let m = 0; m < 16; m++) if ((p.bits >> m) & 1) { const { r, c } = KM.mToCell(m, this.opts.swap); R.add(r); C.add(c); }
      const rr = runsOf(R), cr = runsOf(C);
      const color = PALETTE[(k + startColor) % PALETTE.length];
      const ins = 3 + (k % 4) * 3;
      for (const ra of rr) for (const ca of cr) {
        const oT = rr.length > 1 && ra[0] === 0, oB = rr.length > 1 && ra[1] === 3;
        const oL = cr.length > 1 && ca[0] === 0, oR = cr.length > 1 && ca[1] === 3;
        const d = document.createElement('div');
        d.className = 'grp' + (oT ? ' ot' : '') + (oB ? ' ob' : '') + (oL ? ' ol' : '') + (oR ? ' or' : '');
        d.style.cssText = `--gc:${color};` +
          `top:calc(${ra[0] * 25}% + ${oT ? -3 : ins}px);bottom:calc(${(3 - ra[1]) * 25}% + ${oB ? -3 : ins}px);` +
          `left:calc(${ca[0] * 25}% + ${oL ? -3 : ins}px);right:calc(${(3 - ca[1]) * 25}% + ${oR ? -3 : ins}px);` +
          `animation-delay:${k * 110}ms`;
        layer.appendChild(d);
      }
    });
  }
  clearGroups() { this.el.querySelector('.km-groups').innerHTML = ''; }

  flash(bits, cls = 'wrong', ms = 900) {
    for (let m = 0; m < 16; m++) if ((bits >> m) & 1) {
      const el = this.cellEls[m];
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), ms);
    }
  }
  mark(bits, cls) { for (let m = 0; m < 16; m++) this.cellEls[m].classList.toggle(cls, !!((bits >> m) & 1)); }
  clearMarks() { this.cellEls.forEach((el) => el.classList.remove('target', 'peek', 'wrong', 'right')); }
}
