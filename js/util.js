'use strict';
/* ===== Tiện ích DOM + lưu trữ cục bộ ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');

const Store = {
  key: 'kmapArena.v1',
  data: null,
  load() {
    try { this.data = JSON.parse(localStorage.getItem(this.key)) || {}; } catch { this.data = {}; }
    const d = this.data;
    d.best = d.best || {};
    d.settings = Object.assign({ notation: 'bar', sound: true }, d.settings || {});
    d.played = d.played || 0;
    d.bestCombo = d.bestCombo || 0;
    d.lastDiff = d.lastDiff || {};
    d.lastVar = d.lastVar || {};
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch { /* ignore */ } },
  get settings() { return this.data.settings; },
  best(key) { return this.data.best[key] || 0; },
  setBest(key, score) {
    if (score > this.best(key)) { this.data.best[key] = score; this.save(); return true; }
    return false;
  },
};
Store.load();

const nt = () => Store.settings.notation;

const DIFF = [
  { id: 0, name: 'Cơ bản', short: 'I', color: '#34d399' },
  { id: 1, name: 'Nâng cao', short: 'II', color: '#fbbf24' },
  { id: 2, name: 'Địa ngục', short: 'III', color: '#fb7185' },
];
