'use strict';
/**
 * K-Map Arena — Bộ máy Boolean.
 * 4 biến A,B,C,D; minterm m = 8A + 4B + 2C + D.
 * Bản đồ chuẩn: hàng = AB, cột = CD theo thứ tự Gray 00, 01, 11, 10.
 * Ví dụ: ô thứ 2 (hàng 00, cột 01) = m1 = A'B'C'D ; ô thứ 3 (hàng 00, cột 11) = m3 = A'B'CD.
 */
const KM = (() => {
  const VARS = ['A', 'B', 'C', 'D'];
  const GRAY = [0, 1, 3, 2];
  const GRAY_LABEL = ['00', '01', '11', '10'];
  const FULL = 0xFFFF;

  /* ---------- helpers ---------- */
  const popcount = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const bitsToList = (b) => { const a = []; for (let m = 0; m < 16; m++) if ((b >> m) & 1) a.push(m); return a; };
  const listToBits = (l) => l.reduce((b, m) => b | (1 << m), 0);
  const bin4 = (m) => m.toString(2).padStart(4, '0');
  const randomSubset = (pool, n) => listToBits(shuffle(bitsToList(pool)).slice(0, Math.max(0, n)));

  function cellToM(r, c, swap = false) {
    return swap ? ((GRAY[c] << 2) | GRAY[r]) : ((GRAY[r] << 2) | GRAY[c]);
  }
  function mToCell(m, swap = false) {
    const hi = GRAY.indexOf(m >> 2), lo = GRAY.indexOf(m & 3);
    return swap ? { r: lo, c: hi } : { r: hi, c: lo };
  }

  /* ---------- implicant: {mask, value} — bit 8=A, 4=B, 2=C, 1=D ---------- */
  function makeImp(mask, value) {
    let bits = 0;
    for (let m = 0; m < 16; m++) if ((m & mask) === value) bits |= 1 << m;
    return { mask, value, bits, lits: popcount(mask), size: popcount(bits) };
  }
  const ALL_IMPS = [];
  for (let mask = 0; mask < 16; mask++)
    for (let value = 0; value < 16; value++)
      if ((value & ~mask & 15) === 0) ALL_IMPS.push(makeImp(mask, value));
  const impOf = (mask, value) => ALL_IMPS.find((p) => p.mask === mask && p.value === value);

  function termLits(p, forPOS = false) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const b = 8 >> i;
      if (p.mask & b) { const one = !!(p.value & b); out.push({ i, neg: forPOS ? one : !one }); }
    }
    return out;
  }
  const impSortKey = (p) => termLits(p).map((l) => l.i * 2 + (l.neg ? 1 : 0)).join(',');
  const sortImps = (arr) => arr.sort((a, b) => a.lits - b.lits || (impSortKey(a) < impSortKey(b) ? -1 : 1));

  function primeImplicants(on, dc = 0) {
    const allowed = (on | dc) & FULL;
    const valid = ALL_IMPS.filter((p) => (p.bits & ~allowed & FULL) === 0);
    const primes = valid.filter((p) => !valid.some((q) => q !== p && (q.bits & p.bits) === p.bits && q.bits !== p.bits));
    return primes.filter((p) => p.bits & on);
  }

  function essentialPrimes(primes, on) {
    return primes.filter((p) => {
      for (let m = 0; m < 16; m++) {
        if (!((on >> m) & 1) || !((p.bits >> m) & 1)) continue;
        if (primes.every((q) => q === p || !((q.bits >> m) & 1))) return true;
      }
      return false;
    });
  }

  /** Phủ tối thiểu: ít số hạng nhất, sau đó ít literal nhất (branch & bound). */
  function minimalSOP(on, dc = 0) {
    on &= FULL; dc &= FULL & ~on;
    if (!on) return { terms: [], cost: [0, 0], primes: [] };
    const primes = primeImplicants(on, dc);
    let best = null, bT = Infinity, bL = Infinity;
    const chosen = [];
    (function rec(unc, t, l) {
      if (!unc) {
        if (t < bT || (t === bT && l < bL)) { bT = t; bL = l; best = chosen.slice(); }
        return;
      }
      if (t + 1 > bT || (t + 1 === bT && l >= bL)) return;
      let cands = null;
      for (let m = 0; m < 16; m++) {
        if (!((unc >> m) & 1)) continue;
        const c = primes.filter((p) => (p.bits >> m) & 1);
        if (!cands || c.length < cands.length) cands = c;
        if (cands.length === 1) break;
      }
      cands.sort((a, b) => b.size - a.size);
      for (const p of cands) { chosen.push(p); rec(unc & ~p.bits, t + 1, l + p.lits); chosen.pop(); }
    })(on, 0, 0);
    return { terms: sortImps(best), cost: [bT, bL], primes };
  }

  /** POS tối giản = phủ tối thiểu các ô 0 (f'), mỗi implicant của f' thành một mệnh đề tổng. */
  function minimalPOS(on, dc = 0) {
    on &= FULL; dc &= FULL & ~on;
    const off = FULL & ~on & ~dc;
    const r = minimalSOP(off, dc);
    return { clauses: r.terms, cost: r.cost, primes: r.primes };
  }

  /* ---------- định dạng ---------- */
  function litHTML(i, neg, style) {
    const v = VARS[i];
    if (!neg) return `<span class="lit">${v}</span>`;
    if (style === 'tilde') return `<span class="lit">~${v}</span>`;
    if (style === 'prime') return `<span class="lit">${v}'</span>`;
    return `<span class="lit"><span class="ov">${v}</span></span>`;
  }
  const litText = (i, neg, style) => (neg ? (style === 'tilde' ? '~' + VARS[i] : VARS[i] + "'") : VARS[i]);

  function termHTML(p, style) {
    const l = termLits(p);
    return l.length ? l.map((x) => litHTML(x.i, x.neg, style)).join('') : '<span class="lit">1</span>';
  }
  function termText(p, style) {
    const l = termLits(p);
    return l.length ? l.map((x) => litText(x.i, x.neg, style)).join('') : '1';
  }
  function clauseHTML(p, style) {
    const l = termLits(p, true);
    if (!l.length) return '<span class="lit">0</span>';
    const s = l.map((x) => litHTML(x.i, x.neg, style)).join('<span class="op">+</span>');
    return l.length > 1 ? `<span class="par">(</span>${s}<span class="par">)</span>` : s;
  }
  function sopHTML(terms, style, colored = false) {
    if (!terms.length) return '<span class="lit">0</span>';
    return terms.map((t, k) => (colored ? `<span class="term g${k % 8}">${termHTML(t, style)}</span>` : termHTML(t, style)))
      .join('<span class="op">+</span>');
  }
  function posHTML(clauses, style, colored = false) {
    if (!clauses.length) return '<span class="lit">1</span>';
    return clauses.map((c, k) => (colored ? `<span class="term g${k % 8}">${clauseHTML(c, style)}</span>` : clauseHTML(c, style)))
      .join(colored ? '' : '');
  }

  /* ---------- parser ---------- */
  class ParseError extends Error {}
  function tokenize(s) {
    const toks = [];
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (/\s/.test(ch)) continue;
      const u = ch.toUpperCase();
      if ('ABCD'.includes(u)) toks.push({ t: 'var', i: 'ABCD'.indexOf(u), s: u });
      else if (ch === '0' || ch === '1') toks.push({ t: 'const', v: +ch, s: ch });
      else if ('~!¬'.includes(ch)) toks.push({ t: 'not', s: ch });
      else if ("'’`′".includes(ch)) toks.push({ t: 'post', s: ch });
      else if ('+|∨'.includes(ch)) toks.push({ t: 'or', s: ch });
      else if ('*&·.∧'.includes(ch)) toks.push({ t: 'and', s: ch });
      else if ('^⊕'.includes(ch)) toks.push({ t: 'xor', s: ch });
      else if ('(['.includes(ch)) toks.push({ t: '(', s: ch });
      else if (')]'.includes(ch)) toks.push({ t: ')', s: ch });
      else throw new ParseError(`Ký tự không hợp lệ: “${ch}” — chỉ dùng A–D, 0, 1, ' ~ + * ^ ( )`);
    }
    return toks;
  }
  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    if (!toks.length) throw new ParseError('Biểu thức trống');
    const eat = (t) => (toks[p] && toks[p].t === t ? (p++, true) : false);
    const startsFactor = (k) => k && (k.t === 'var' || k.t === 'const' || k.t === 'not' || k.t === '(');
    function expr() { const a = [xr()]; while (eat('or')) a.push(xr()); return a.length > 1 ? { t: 'or', a } : a[0]; }
    function xr() { const a = [term()]; while (eat('xor')) a.push(term()); return a.length > 1 ? { t: 'xor', a } : a[0]; }
    function term() {
      const a = [factor()];
      for (;;) {
        if (eat('and')) { a.push(factor()); continue; }
        if (startsFactor(toks[p])) { a.push(factor()); continue; }
        break;
      }
      return a.length > 1 ? { t: 'and', a } : a[0];
    }
    function factor() {
      if (eat('not')) return { t: 'not', a: factor() };
      let n = primary();
      while (eat('post')) n = { t: 'not', a: n };
      return n;
    }
    function primary() {
      const k = toks[p];
      if (!k) throw new ParseError('Biểu thức kết thúc đột ngột');
      if (k.t === 'var') { p++; return { t: 'var', i: k.i }; }
      if (k.t === 'const') { p++; return { t: 'const', v: k.v }; }
      if (k.t === '(') {
        p++;
        const e = expr();
        if (!eat(')')) throw new ParseError('Thiếu dấu “)”');
        return e;
      }
      throw new ParseError(`Không mong đợi “${k.s}” ở vị trí này`);
    }
    const e = expr();
    if (p < toks.length) throw new ParseError(`Thừa “${toks[p].s}”`);
    return e;
  }

  function evalAst(n, m) {
    switch (n.t) {
      case 'var': return (m >> (3 - n.i)) & 1;
      case 'const': return n.v;
      case 'not': return evalAst(n.a, m) ^ 1;
      case 'and': return n.a.every((c) => evalAst(c, m)) ? 1 : 0;
      case 'or': return n.a.some((c) => evalAst(c, m)) ? 1 : 0;
      case 'xor': return n.a.reduce((acc, c) => acc ^ evalAst(c, m), 0);
    }
    return 0;
  }
  function truth(ast) { let b = 0; for (let m = 0; m < 16; m++) if (evalAst(ast, m)) b |= 1 << m; return b; }

  const literalOf = (n) => (n.t === 'var' ? { i: n.i, neg: false } : n.t === 'not' && n.a.t === 'var' ? { i: n.a.i, neg: true } : null);

  /** Chi phí nếu biểu thức ở dạng SOP thuần: [số hạng, số literal]; null nếu không phải SOP. */
  function sopCost(ast) {
    const items = ast.t === 'or' ? ast.a : [ast];
    let terms = 0, lits = 0;
    for (const it of items) {
      if (it.t === 'const') { if (items.length === 1 && it.v === 0) return [0, 0]; terms++; continue; }
      const fs = it.t === 'and' ? it.a : [it];
      for (const f of fs) { if (f.t !== 'const' && !literalOf(f)) return null; lits++; }
      terms++;
    }
    return [terms, lits];
  }
  function posCost(ast) {
    const items = ast.t === 'and' ? ast.a : [ast];
    let cl = 0, lits = 0;
    for (const it of items) {
      if (it.t === 'const') { if (items.length === 1 && it.v === 1) return [0, 0]; cl++; continue; }
      const fs = it.t === 'or' ? it.a : [it];
      for (const f of fs) { if (f.t !== 'const' && !literalOf(f)) return null; lits++; }
      cl++;
    }
    return [cl, lits];
  }

  const PREC = { or: 1, xor: 2, and: 3, not: 4, var: 5, const: 5 };
  function astHTML(n, style, pp = 0) {
    let s;
    switch (n.t) {
      case 'var': s = litHTML(n.i, false, style); break;
      case 'const': s = `<span class="lit">${n.v}</span>`; break;
      case 'not':
        if (n.a.t === 'var') { s = litHTML(n.a.i, true, style); break; }
        if (style === 'bar') { s = `<span class="ov">${astHTML(n.a, style, 0)}</span>`; break; }
        s = style === 'tilde' ? `~${astHTML(n.a, style, 5)}` : `${astHTML(n.a, style, 5)}'`;
        break;
      case 'and': {
        const hasConst = n.a.some((c) => c.t === 'const');
        s = n.a.map((c) => astHTML(c, style, 3)).join(hasConst ? '<span class="op dot">·</span>' : '');
        break;
      }
      case 'or': s = n.a.map((c) => astHTML(c, style, 1)).join('<span class="op">+</span>'); break;
      case 'xor': s = n.a.map((c) => astHTML(c, style, 2)).join('<span class="op">⊕</span>'); break;
    }
    return PREC[n.t] < pp ? `<span class="par">(</span>${s}<span class="par">)</span>` : s;
  }

  /* ---------- sinh ngẫu nhiên ---------- */
  const V = (i) => ({ t: 'var', i });
  const NOT = (a) => ({ t: 'not', a });
  const lit = (i, neg) => (neg ? NOT(V(i)) : V(i));
  function randImp(lits) { return pick(ALL_IMPS.filter((p) => p.lits === lits)); }
  function productAst(p) { const l = termLits(p).map((x) => lit(x.i, x.neg)); return l.length === 1 ? l[0] : { t: 'and', a: l }; }
  function sumAst(p) { const l = termLits(p, true).map((x) => lit(x.i, x.neg)); return l.length === 1 ? l[0] : { t: 'or', a: l }; }

  function randomExpr(level) {
    for (let tries = 0; tries < 400; tries++) {
      let ast;
      if (level === 0) {
        ast = { t: 'or', a: Array.from({ length: rnd(2, 3) }, () => productAst(randImp(rnd(2, 3)))) };
      } else if (level === 1) {
        if (Math.random() < 0.5) {
          const a = Array.from({ length: rnd(3, 4) }, () => productAst(randImp(pick([1, 2, 3, 3, 4]))));
          ast = { t: 'or', a };
        } else {
          ast = { t: 'and', a: Array.from({ length: rnd(2, 3) }, () => sumAst(randImp(rnd(2, 3)))) };
        }
      } else {
        const block = () => {
          const k = rnd(0, 5);
          if (k === 0) return productAst(randImp(2));
          if (k === 1) return sumAst(randImp(rnd(2, 3)));
          if (k === 2) { const [x, y] = shuffle([0, 1, 2, 3]); return { t: 'xor', a: [lit(x, Math.random() < 0.3), lit(y, false)] }; }
          if (k === 3) return NOT(productAst(randImp(2)));
          if (k === 4) return NOT(sumAst(randImp(2)));
          return productAst(randImp(3));
        };
        const item = () => (Math.random() < 0.45 ? { t: 'and', a: [block(), block()] } : block());
        ast = Math.random() < 0.65 ? { t: 'or', a: [item(), item()] } : { t: 'and', a: [block(), block()] };
      }
      const b = truth(ast), n = popcount(b);
      const lo = [3, 3, 3][level], hi = [11, 12, 13][level];
      if (n < lo || n > hi) continue;
      return { ast, bits: b };
    }
    const ast = parse("A'B + CD'");
    return { ast, bits: truth(ast) };
  }

  const GEN = [
    { terms: [2, 3], dc: [0, 0], ones: [3, 10], union: 0.85, choice: 0 },
    { terms: [3, 4], dc: [0, 2], ones: [5, 11], union: 0.55, choice: 0.15 },
    { terms: [4, 6], dc: [1, 4], ones: [6, 11], union: 0.3, choice: 0.5 },
  ];
  /** Sinh hàm ngẫu nhiên theo độ khó; mode = 'sop' | 'pos' quyết định đo độ khó theo dạng nào. */
  function genFunction(level, mode = 'sop', recent = []) {
    const P = GEN[level];
    const wantChoice = Math.random() < P.choice;
    const wantDcMatter = level === 2;
    for (let t = 0; t < 3000; t++) {
      let on = 0;
      if (Math.random() < P.union) {
        const k = rnd(P.terms[0], P.terms[1] + 1);
        for (let i = 0; i < k; i++) on |= randImp(pick(level === 0 ? [1, 2, 2, 3, 3] : [2, 3, 3, 3])).bits;
      } else {
        on = randomSubset(FULL, rnd(P.ones[0], P.ones[1]));
      }
      if (mode === 'pos' && Math.random() < 0.5) on = FULL & ~on;
      const ones = popcount(on);
      if (ones < P.ones[0] || ones > P.ones[1] + (mode === 'pos' ? 3 : 0)) continue;
      const dc = randomSubset(FULL & ~on, rnd(P.dc[0], P.dc[1]));
      if (recent.includes(on + ':' + dc)) continue;
      const sop = minimalSOP(on, dc), pos = minimalPOS(on, dc);
      const main = mode === 'pos' ? pos : sop;
      const n = main.cost[0];
      if (n < P.terms[0] || n > P.terms[1]) continue;
      if (wantChoice && t < 2200) {
        const onSet = mode === 'pos' ? FULL & ~on & ~dc : on;
        const ess = essentialPrimes(main.primes, onSet);
        const chosen = mode === 'pos' ? pos.clauses : sop.terms;
        if (chosen.every((x) => ess.includes(x))) continue;
      }
      if (wantDcMatter && dc && t < 1500) {
        const noDc = mode === 'pos' ? minimalPOS(on, 0) : minimalSOP(on, 0);
        if (noDc.cost[0] === main.cost[0] && noDc.cost[1] === main.cost[1]) continue;
      }
      return { on, dc, sop, pos };
    }
    const on = listToBits([0, 2, 5, 7, 8, 10, 13, 15]);
    return { on, dc: 0, sop: minimalSOP(on, 0), pos: minimalPOS(on, 0) };
  }

  /** Câu hỏi phân loại implicant cho trò Thợ Săn. */
  function genHunter(level) {
    const f = genFunction(level, 'sop');
    const { on, dc } = f;
    const off = FULL & ~on & ~dc;
    const primes = f.sop.primes;
    const ess = essentialPrimes(primes, on);
    const classify = (p) => (p.bits & off ? 'X' : ess.includes(p) ? 'E' : primes.includes(p) ? 'P' : 'I');
    const poolE = ess.slice();
    const poolP = primes.filter((p) => !ess.includes(p));
    const poolI = ALL_IMPS.filter((p) => p.lits > 0 && !(p.bits & off) && (p.bits & on) && !primes.includes(p));
    const poolX = ALL_IMPS.filter((p) => p.lits > 0 && (p.bits & off) && (p.bits & on) && popcount(p.bits & on) * 2 >= p.size);
    const n = [4, 5, 6][level];
    const chosen = new Set();
    const take = (pool, k) => { for (const p of shuffle(pool).slice(0, k)) if (chosen.size < n) chosen.add(p); };
    take(poolE, rnd(1, 2));
    take(poolP, level === 0 ? 1 : 2);
    take(poolI, 1);
    take(poolX, 1);
    const rest = shuffle([...poolE, ...poolP, ...poolI, ...poolX]);
    for (const p of rest) { if (chosen.size >= n) break; chosen.add(p); }
    const cands = shuffle([...chosen]).map((p) => ({ p, cat: classify(p) }));
    return { ...f, primes, ess, cands };
  }

  return {
    VARS, GRAY, GRAY_LABEL, FULL, ALL_IMPS,
    popcount, rnd, pick, shuffle, bitsToList, listToBits, bin4, randomSubset,
    cellToM, mToCell, impOf, termLits, sortImps,
    primeImplicants, essentialPrimes, minimalSOP, minimalPOS,
    litHTML, termHTML, termText, clauseHTML, sopHTML, posHTML,
    parse, truth, evalAst, sopCost, posCost, astHTML, ParseError,
    randomExpr, genFunction, genHunter, productAst,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = KM;
}
