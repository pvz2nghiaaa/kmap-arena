'use strict';
/**
 * K-Map Arena — App Router & Screen Controllers
 * Hỗ trợ các màn hình:
 * - Home (chọn trò chơi, độ khó, biến thể, điểm kỷ lục)
 * - Game (phiên chơi Session tương tác)
 * - Results (tổng kết điểm, huy hiệu kỷ lục, xem lại chi tiết từng câu)
 * - Sandbox (Phòng thí nghiệm K-Map 4x4 tự do, giải SOP/POS, trực quan hóa EPI/PI)
 * - Learn (Cẩm nang toàn diện Karnaugh, mã Gray, phương pháp rút gọn & mẹo tính 2ⁿ)
 * - Settings (Đổi kiểu ký hiệu Ā / A' / ~A, âm thanh, xóa dữ liệu)
 */
const App = (() => {
  let curSession = null;
  let curScreen = null;
  const appEl = () => document.getElementById('app');

  function init() {
    FX.startBackground();
    bindNav();
    // Khôi phục màn hình gần nhất hoặc về Home
    go('home');
  }

  function bindNav() {
    $$('header nav button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        go(tab);
      });
    });
  }

  function setActiveNav(tab) {
    $$('header nav button[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  }

  function go(screen, ...args) {
    if (curSession) {
      curSession.destroy();
      curSession = null;
    }
    curScreen = screen;
    const root = appEl();
    root.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (screen === 'home') {
      setActiveNav('home');
      renderHome(root);
    } else if (screen === 'game') {
      const [gameId, diff = 0, variant = ''] = args;
      const game = GAMES.find((g) => g.id === gameId);
      if (!game) return go('home');
      setActiveNav('home');
      curSession = new Session(game, diff, variant);
      curSession.mount(root);
    } else if (screen === 'results') {
      setActiveNav('home');
      const [result] = args;
      renderResults(root, result);
    } else if (screen === 'sandbox') {
      setActiveNav('sandbox');
      renderSandbox(root);
    } else if (screen === 'learn') {
      setActiveNav('learn');
      renderLearn(root);
    } else if (screen === 'settings') {
      setActiveNav('settings');
      renderSettings(root);
    }
  }

  /* =========================================================================
     MÀN HÌNH TRANG CHỦ / CHỌN TRÒ CHƠI
     ========================================================================= */
  function renderHome(root) {
    const totalPlayed = Store.data.played || 0;
    const bestCombo = Store.data.bestCombo || 0;
    let totalScore = 0;
    Object.values(Store.data.best || {}).forEach((sc) => (totalScore += sc));

    const html = `
    <div class="home-view">
      <section class="hero glass glow-hero">
        <div class="hero-badge"><span class="pulse-dot"></span> Đấu Trường Đại Học · Boolean &amp; 2ⁿ Mastery</div>
        <h1 class="hero-title">BẢNG KARNAUGH <span class="gradient-text">&amp; LŨY THỪA 2</span></h1>
        <p class="hero-sub">
          Luyện phản xạ lập trình mạch số &amp; kiến trúc máy tính qua <b>6 trò chơi đua thời gian</b>. 
          Rút gọn biểu thức 4 biến \(A,B,C,D\) trên mã Gray, săn Implicant cốt yếu, và thành thạo \(2^0\) đến \(2^{16}\) chớp nhoáng.
        </p>
        <div class="hero-stats">
          <div class="hstat"><small>Lượt đã chơi</small><b>${fmtNum(totalPlayed)}</b></div>
          <div class="hstat"><small>Tổng điểm kỷ lục</small><b>${fmtNum(totalScore)}</b></div>
          <div class="hstat"><small>Chuỗi Combo dài nhất</small><b class="combo-accent">×${bestCombo}</b></div>
        </div>
      </section>

      <section class="game-select-section">
        <div class="section-head">
          <h2>Chọn Chế Độ Luyện Tập</h2>
          <p class="muted">Mỗi trò chơi được thiết kế riêng biệt để rèn luyện một kỹ năng then chốt</p>
        </div>

        <div class="game-grid">
          ${GAMES.map((g) => renderGameCard(g)).join('')}
        </div>
      </section>

      <section class="quick-banner glass">
        <div class="qb-icon">🧪</div>
        <div class="qb-content">
          <h3>Phòng Thí Nghiệm Bản Đồ Tự Do</h3>
          <p>Tô ô tùy ý, thử mọi dạng hàm Boolean, xem phân giải Quine–McCluskey và khoanh nhóm trực quan.</p>
        </div>
        <button class="btn primary" onclick="App.go('sandbox')">Mở Sandbox →</button>
      </section>
    </div>`;

    root.innerHTML = html;
    bindGameCards(root);
  }

  function renderGameCard(g) {
    const savedDiff = Store.data.lastDiff?.[g.id] ?? 0;
    const savedVar = Store.data.lastVar?.[g.id] ?? (g.variants ? g.variants[0].id : '');
    const bestKey = `${g.id}:${savedDiff}:${savedVar}`;
    const bestScore = Store.best(bestKey);

    return `
    <div class="game-card glass" data-gid="${g.id}" style="--gc:${g.color}">
      <div class="gc-head">
        <div class="gc-icon">${g.icon}</div>
        <div class="gc-meta">
          <span class="gc-tagline">${g.tagline}</span>
          <h3 class="gc-name">${g.name}</h3>
        </div>
        <div class="gc-best" data-k="best" title="Điểm cao nhất ở chế độ hiện tại">
          ${bestScore > 0 ? `★ ${fmtNum(bestScore)}` : 'Chưa đấu'}
        </div>
      </div>

      <p class="gc-desc">${g.desc}</p>

      <div class="gc-options">
        <div class="gc-row">
          <span class="gc-label">Độ khó:</span>
          <div class="pill-group diff-picker">
            ${DIFF.map((d) => `
              <button type="button" class="pill ${d.id === savedDiff ? 'active' : ''}" data-diff="${d.id}" style="--pc:${d.color}">
                ${d.name}
              </button>
            `).join('')}
          </div>
        </div>

        ${g.variants ? `
          <div class="gc-row">
            <span class="gc-label">Dạng:</span>
            <div class="pill-group var-picker">
              ${g.variants.map((v) => `
                <button type="button" class="pill ${v.id === savedVar ? 'active' : ''}" data-var="${v.id}">
                  ${v.label}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="gc-level-desc muted small" data-k="lvl-desc">
        ${g.levels[savedDiff]}
      </div>

      <div class="gc-foot">
        <button type="button" class="btn primary start-btn" data-a="start">
          Bắt Đầu Đua ➔
        </button>
      </div>
    </div>`;
  }

  function bindGameCards(root) {
    $$('.game-card', root).forEach((card) => {
      const gid = card.dataset.gid;
      const g = GAMES.find((item) => item.id === gid);
      let diff = Store.data.lastDiff?.[gid] ?? 0;
      let variant = Store.data.lastVar?.[gid] ?? (g.variants ? g.variants[0].id : '');

      const updateCard = () => {
        Store.data.lastDiff = Store.data.lastDiff || {};
        Store.data.lastDiff[gid] = diff;
        if (g.variants) {
          Store.data.lastVar = Store.data.lastVar || {};
          Store.data.lastVar[gid] = variant;
        }
        Store.save();

        const bestEl = card.querySelector('[data-k="best"]');
        const b = Store.best(`${gid}:${diff}:${variant}`);
        bestEl.textContent = b > 0 ? `★ ${fmtNum(b)}` : 'Chưa đấu';

        const lvlEl = card.querySelector('[data-k="lvl-desc"]');
        lvlEl.textContent = g.levels[diff];
      };

      card.querySelectorAll('.diff-picker .pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          diff = +btn.dataset.diff;
          card.querySelectorAll('.diff-picker .pill').forEach((p) => p.classList.toggle('active', p === btn));
          FX.sfx.click();
          updateCard();
        });
      });

      card.querySelectorAll('.var-picker .pill')?.forEach((btn) => {
        btn.addEventListener('click', () => {
          variant = btn.dataset.var;
          card.querySelectorAll('.var-picker .pill').forEach((p) => p.classList.toggle('active', p === btn));
          FX.sfx.click();
          updateCard();
        });
      });

      card.querySelector('[data-a="start"]').addEventListener('click', () => {
        FX.sfx.click();
        go('game', gid, diff, variant);
      });
    });
  }

  /* =========================================================================
     MÀN HÌNH TỔNG KẾT KẾT QUẢ (RESULTS)
     ========================================================================= */
  function renderResults(root, res) {
    if (!res) return go('home');
    const g = GAMES.find((item) => item.id === res.gameId);
    const diffObj = DIFF[res.diff];
    const acc = res.total > 0 ? Math.round((res.right / res.total) * 100) : 0;

    if (res.record) {
      FX.sfx.record();
      setTimeout(() => FX.confetti(220), 200);
    }

    const html = `
    <div class="results-view glass">
      <div class="res-badge ${res.record ? 'gold' : ''}">
        ${res.record ? '🏆 KỶ LỤC MỚI ĐƯỢC THIẾT LẬP!' : 'KẾT THÚC PHIÊN ĐẤU'}
      </div>

      <div class="res-title">
        <span class="res-ico">${g.icon}</span>
        <h2>${g.name}</h2>
        <span class="pill" style="--pc:${diffObj.color}">${diffObj.name}</span>
      </div>

      <div class="res-score-box">
        <div class="res-score-num" data-k="res-num">0</div>
        <small class="muted">Điểm tổng kết · Kỷ lục hiện tại: <b>${fmtNum(res.best)}</b></small>
      </div>

      <div class="res-stats-grid">
        <div class="rstat">
          <small>Độ chính xác</small>
          <b>${acc}%</b>
          <span>(${res.right}/${res.total} câu)</span>
        </div>
        <div class="rstat">
          <small>Chuỗi Combo Max</small>
          <b class="combo-accent">×${res.maxCombo}</b>
          <span>${res.maxCombo >= 8 ? '🔥 Hỏa lực!' : res.maxCombo >= 4 ? '⚡ Tốt!' : 'Cố gắng thêm'}</span>
        </div>
        <div class="rstat">
          <small>Hoàn hảo (tối giản)</small>
          <b>${res.perfect}</b>
          <span>câu trọn vẹn</span>
        </div>
      </div>

      <div class="res-actions">
        <button class="btn primary lg" data-a="again">Chơi lại chế độ này ↺</button>
        <button class="btn ghost lg" data-a="home">Chọn trò chơi khác 🏠</button>
        <button class="btn ghost lg" data-a="sandbox">Vào phòng thí nghiệm 🧪</button>
      </div>

      <div class="res-log-section">
        <h3>Chi Tiết Lượt Chơi (${res.log.length} câu)</h3>
        <div class="res-log-list">
          ${res.log.map((item, idx) => `
            <div class="log-item ${item.ok === true ? 'good' : item.ok === 'partial' ? 'part' : 'bad'}">
              <span class="log-idx">#${idx + 1}</span>
              <span class="log-status">${item.ok === true ? '✓' : item.ok === 'partial' ? '◐' : '✗'}</span>
              <div class="log-q">${item.q}</div>
              <div class="log-details">
                ${item.u ? `<span class="log-u">Gõ: ${item.u}</span>` : ''}
                <span class="log-a">Đáp án: ${item.a}</span>
                ${item.note ? `<small class="log-note muted">${item.note}</small>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;

    root.innerHTML = html;
    const scoreNumEl = root.querySelector('[data-k="res-num"]');
    FX.countUp(scoreNumEl, res.score, 1200);

    root.querySelector('[data-a="again"]').onclick = () => go('game', res.gameId, res.diff, res.variant);
    root.querySelector('[data-a="home"]').onclick = () => go('home');
    root.querySelector('[data-a="sandbox"]').onclick = () => go('sandbox');
  }

  /* =========================================================================
     MÀN HÌNH PHÒNG THÍ NGHIỆM TỰ DO (SANDBOX)
     ========================================================================= */
  function renderSandbox(root) {
    const html = `
    <div class="sandbox-view">
      <div class="sb-head glass">
        <div>
          <h2>🧪 Phòng Thí Nghiệm Karnaugh &amp; Boolean</h2>
          <p class="muted">Nhấp hoặc kéo chuột để đổi trạng thái các ô (0 → 1 → X). Hệ thống tự giải SOP/POS và phân tích Prime Implicants theo thời gian thực.</p>
        </div>
        <div class="sb-tools">
          <button class="btn ghost sm" data-a="clear">Xóa sạch</button>
          <button class="btn ghost sm" data-a="invert">Đảo 0 ⇄ 1</button>
          <button class="btn ghost sm" data-a="rand">Ngẫu nhiên</button>
          <button class="btn ghost sm" data-a="swap-axis">Hoán đổi trục (CD-AB)</button>
          <button class="btn ghost sm" data-a="toggle-idx">Hiện số ô (m): TẮT</button>
        </div>
      </div>

      <div class="sb-layout">
        <div class="sb-left glass">
          <div class="sb-map-wrap"></div>
          <div class="sb-click-hint muted small center">
            Chuột trái: Đổi 0 → 1 → X · Chuột phải: X · Kéo để tô nhanh
          </div>
          <div class="sb-expr-input-box">
            <label><b>Hoặc nhập biểu thức / danh sách minterm:</b></label>
            <div class="sb-in-row">
              <input type="text" class="mono-in" id="sb-input" placeholder="VD: A'B + CD' hoặc m(1,3,7,15) hoặc d(2,6)" spellcheck="false">
              <button class="btn primary sm" id="sb-apply">Nạp</button>
            </div>
            <div id="sb-input-err" class="err-msg"></div>
          </div>
        </div>

        <div class="sb-right glass">
          <div class="sb-tabs">
            <button class="sb-tab active" data-sbt="sop">Dạng Tối Giản (SOP)</button>
            <button class="sb-tab" data-sbt="pos">Dạng Tối Giản (POS)</button>
            <button class="sb-tab" data-sbt="primes">Danh Sách Implicant (PI/EPI)</button>
          </div>

          <div class="sb-pane" id="sb-sop-pane">
            <div class="sb-result-box">
              <span class="sb-result-title">SOP Tối Giản (Tổng các tích):</span>
              <div class="sb-formula expr-math" id="sb-sop-formula">0</div>
              <div class="sb-cost muted small" id="sb-sop-cost">0 số hạng, 0 literal</div>
            </div>
            <div class="sb-minterms-info" id="sb-sop-minterms"></div>
          </div>

          <div class="sb-pane" id="sb-pos-pane" style="display:none">
            <div class="sb-result-box">
              <span class="sb-result-title">POS Tối Giản (Tích các tổng):</span>
              <div class="sb-formula expr-math" id="sb-pos-formula">1</div>
              <div class="sb-cost muted small" id="sb-pos-cost">0 mệnh đề, 0 literal</div>
            </div>
            <div class="sb-minterms-info" id="sb-pos-maxterms"></div>
          </div>

          <div class="sb-pane" id="sb-primes-pane" style="display:none">
            <div class="sb-primes-table-wrap">
              <table class="sb-table">
                <thead>
                  <tr>
                    <th>Implicant</th>
                    <th>Phủ minterms</th>
                    <th>Kích thước</th>
                    <th>Phân loại</th>
                  </tr>
                </thead>
                <tbody id="sb-primes-body"></tbody>
              </table>
            </div>
          </div>

          <div class="sb-pow-box">
            <h4>Bảng Tham Chiếu Lũy Thừa 2</h4>
            <div class="sb-pow-scroll">
              <table class="pow-mini-table">
                <thead><tr><th>n</th><th>2ⁿ</th><th>Hex</th><th>Nhị phân (ABCD/Bit)</th><th>Ý nghĩa</th></tr></thead>
                <tbody>
                  ${Array.from({ length: 17 }, (_, i) => {
                    const val = 2 ** i;
                    return `<tr>
                      <td><b>${i}</b></td>
                      <td class="hl-1">${fmtNum(val)}</td>
                      <td class="mono">0x${val.toString(16).toUpperCase()}</td>
                      <td class="mono small">${val.toString(2)}</td>
                      <td class="muted small">${i <= 4 ? `Ô K-Map cỡ ${val}` : i === 8 ? 'Byte (256)' : i === 10 ? '1 KB (1024)' : i === 16 ? '64 KB (Word 16-bit)' : ''}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    root.innerHTML = html;

    let swapAxis = false;
    const map = new KMapView({
      interactive: true,
      allowDC: true,
      showZeros: true,
      size: 'lg',
      swap: swapAxis,
      onChange: () => updateSolver(),
    });

    root.querySelector('.sb-map-wrap').appendChild(map.el);

    function updateSolver() {
      const { on, dc } = map.getBits();
      const sop = KM.minimalSOP(on, dc);
      const pos = KM.minimalPOS(on, dc);

      // Render SOP
      const sopEl = root.querySelector('#sb-sop-formula');
      sopEl.innerHTML = KM.sopHTML(sop.terms, nt(), true);
      root.querySelector('#sb-sop-cost').textContent = `${sop.cost[0]} số hạng, ${sop.cost[1]} literal`;
      root.querySelector('#sb-sop-minterms').innerHTML = `
        <b>Minterms:</b> Σm(${KM.bitsToList(on).join(', ') || '∅'})
        ${dc ? `<br><b>Don't-cares:</b> d(${KM.bitsToList(dc).join(', ')})` : ''}
      `;

      // Render POS
      const posEl = root.querySelector('#sb-pos-formula');
      posEl.innerHTML = KM.posHTML(pos.clauses, nt(), true);
      root.querySelector('#sb-pos-cost').textContent = `${pos.cost[0]} mệnh đề, ${pos.cost[1]} literal`;
      const zeros = KM.FULL & ~on & ~dc;
      root.querySelector('#sb-pos-maxterms').innerHTML = `
        <b>Maxterms:</b> ΠM(${KM.bitsToList(zeros).join(', ') || '∅'})
        ${dc ? `<br><b>Don't-cares:</b> d(${KM.bitsToList(dc).join(', ')})` : ''}
      `;

      // Render Implicants table
      const primes = sop.primes;
      const ess = KM.essentialPrimes(primes, on);
      const primesBody = root.querySelector('#sb-primes-body');
      if (!primes.length) {
        primesBody.innerHTML = `<tr><td colspan="4" class="center muted">Không có implicant nào</td></tr>`;
      } else {
        primesBody.innerHTML = primes.map((p) => {
          const isEss = ess.includes(p);
          const inSol = sop.terms.includes(p);
          return `
            <tr class="${isEss ? 'is-ess' : ''}">
              <td class="expr-math">${KM.termHTML(p, nt())}</td>
              <td class="mono small">${KM.bitsToList(p.bits).join(', ')}</td>
              <td>${p.size} ô (2<sup>${Math.log2(p.size)}</sup>)</td>
              <td>
                ${isEss ? '<span class="pill sm" style="--pc:#34d399">EPI (Cốt yếu)</span>' : inSol ? '<span class="pill sm" style="--pc:#60a5fa">PI (Được chọn)</span>' : '<span class="pill sm" style="--pc:#fbbf24">PI (Dư thừa)</span>'}
              </td>
            </tr>`;
        }).join('');
      }

      // Highlight groups
      const activeTab = root.querySelector('.sb-tab.active')?.dataset.sbt;
      if (activeTab === 'pos') {
        map.setGroups(pos.clauses);
      } else {
        map.setGroups(sop.terms);
      }
    }

    // Tabs
    root.querySelectorAll('.sb-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        root.querySelectorAll('.sb-tab').forEach((t) => t.classList.toggle('active', t === tabBtn));
        const sbt = tabBtn.dataset.sbt;
        root.querySelector('#sb-sop-pane').style.display = sbt === 'sop' ? '' : 'none';
        root.querySelector('#sb-pos-pane').style.display = sbt === 'pos' ? '' : 'none';
        root.querySelector('#sb-primes-pane').style.display = sbt === 'primes' ? '' : 'none';
        updateSolver();
      });
    });

    // Tools
    root.querySelector('[data-a="clear"]').onclick = () => map.clear();
    root.querySelector('[data-a="invert"]').onclick = () => {
      const { on, dc } = map.getBits();
      map.set(KM.FULL & ~on & ~dc, dc);
      updateSolver();
    };
    root.querySelector('[data-a="rand"]').onclick = () => {
      const f = KM.genFunction(1, 'sop');
      map.set(f.on, f.dc);
      updateSolver();
    };
    root.querySelector('[data-a="swap-axis"]').onclick = () => {
      swapAxis = !swapAxis;
      map.setSwap(swapAxis);
      updateSolver();
    };
    let showIdx = false;
    root.querySelector('[data-a="toggle-idx"]').onclick = (e) => {
      showIdx = !showIdx;
      map.setShowIdx(showIdx);
      e.target.textContent = showIdx ? 'Hiện số ô (m): BẬT' : 'Hiện số ô (m): TẮT';
      e.target.classList.toggle('active', showIdx);
    };

    // Text parser
    const applyBtn = root.querySelector('#sb-apply');
    const inputEl = root.querySelector('#sb-input');
    const errEl = root.querySelector('#sb-input-err');

    const handleApply = () => {
      errEl.textContent = '';
      const val = inputEl.value.trim();
      if (!val) return;
      try {
        // Kiểm tra cú pháp m(1,2,3) hoặc d(4,5)
        const mMatch = val.match(/m\s*\(([^)]+)\)/i);
        const dMatch = val.match(/d\s*\(([^)]+)\)/i);
        if (mMatch || dMatch) {
          let on = 0, dc = 0;
          if (mMatch) {
            const arr = mMatch[1].split(/[^0-9]+/).filter(Boolean).map(Number);
            on = KM.listToBits(arr);
          }
          if (dMatch) {
            const arr = dMatch[1].split(/[^0-9]+/).filter(Boolean).map(Number);
            dc = KM.listToBits(arr);
          }
          map.set(on, dc);
          updateSolver();
          return;
        }

        // Hoặc parse biểu thức boolean
        const ast = KM.parse(val);
        const bits = KM.truth(ast);
        map.set(bits, 0);
        updateSolver();
      } catch (err) {
        errEl.textContent = '⚠ ' + err.message;
        FX.shake(inputEl);
      }
    };

    applyBtn.onclick = handleApply;
    inputEl.onkeydown = (e) => { if (e.key === 'Enter') handleApply(); };

    // Initial state: User example Σ(1,3)
    map.set(KM.listToBits([1, 3]), 0);
    updateSolver();
  }

  /* =========================================================================
     MÀN HÌNH CẨM NANG & KIẾN THỨC (LEARN)
     ========================================================================= */
  function renderLearn(root) {
    const html = `
    <div class="learn-view glass">
      <div class="learn-hero">
        <h2>📚 Cẩm Nang Bảng Karnaugh &amp; Toán Nhị Phân 2ⁿ</h2>
        <p class="muted">Tài liệu tham khảo đại học: Bản đồ Karnaugh 4 biến, mã Gray, phương pháp rút gọn Quine–McCluskey, định lý De Morgan và siêu phản xạ lũy thừa bậc 2.</p>
      </div>

      <div class="learn-grid">
        <article class="learn-card glass">
          <h3>1. Trục Tọa Độ Mã Gray (00 - 01 - 11 - 10)</h3>
          <p>
            Bảng Karnaugh 4 biến có 2 trục: Hàng \(AB\) và Cột \(CD\). Điều kiện tiên quyết là các ô kề nhau chỉ được khác biệt <b>đúng 1 bit</b> (mã Gray).
          </p>
          <div class="kmap-mini-guide">
            <table class="learn-table">
              <thead><tr><th>AB \\ CD</th><th>00</th><th>01</th><th>11</th><th>10</th></tr></thead>
              <tbody>
                <tr><th>00</th><td>m0 (0000)</td><td class="hl-1">m1 (0001)</td><td class="hl-1">m3 (0011)</td><td>m2 (0010)</td></tr>
                <tr><th>01</th><td>m4 (0100)</td><td>m5 (0101)</td><td>m7 (0111)</td><td>m6 (0110)</td></tr>
                <tr><th>11</th><td>m12 (1100)</td><td>m13 (1101)</td><td>m15 (1111)</td><td>m14 (1110)</td></tr>
                <tr><th>10</th><td>m8 (1000)</td><td>m9 (1001)</td><td>m11 (1011)</td><td>m10 (1010)</td></tr>
              </tbody>
            </table>
          </div>
          <p class="small muted">
            <b>Ví dụ của bạn:</b> \(\\Sigma(1, 3) = 0001 + 0011 = \\bar{A}\\bar{B}\\bar{C}D + \\bar{A}\\bar{B}CD\). 
            Nhìn trên bảng, đây chính là hàng \(AB = 00\), cột \(CD = 01\) và cột \(CD = 11\) (ô 2 và ô 3 từ trái sang).
            Hai ô này chung \(A=0, B=0, D=1\), biến \(C\) thay đổi (\(0 \\to 1\)) bị triệt tiêu \(\\to\) dạng rút gọn là <b>\(\\bar{A}\\bar{B}D\)</b>.
          </p>
        </article>

        <article class="learn-card glass">
          <h3>2. Quy Tắc Gom Nhóm &amp; Cuộn Tròn Không Gian Torus</h3>
          <ul class="learn-list">
            <li><b>Kích thước nhóm bắt buộc là \(2^k\):</b> 1, 2, 4, 8, hoặc 16 ô. Không bao giờ gom nhóm 3, 5, 6 ô!</li>
            <li><b>Cuộn mép (Wrap-around):</b> Cột đầu (00) kề với cột cuối (10). Hàng đầu (00) kề với hàng cuối (10).</li>
            <li><b>4 Góc Thần Thánh:</b> 4 ô ở 4 góc \((m0, m2, m8, m10)\) tạo thành một nhóm 4 ô hợp lệ, rút gọn thành <b>\(\\bar{B}\\bar{D}\)</b>!</li>
            <li><b>Ô tùy định (\(X\) / Don't-care):</b> Cho phép mượn để phóng to nhóm thành kích thước \(2^k\) lớn hơn nhằm bớt literal; không bắt buộc phải phủ hết mọi ô \(X\).</li>
          </ul>
        </article>

        <article class="learn-card glass">
          <h3>3. Phân Loại Implicant: EPI vs PI vs Dư Thừa</h3>
          <ul class="learn-list">
            <li><b style="color:#34d399">EPI (Essential Prime Implicant):</b> Nhóm nguyên tố cốt yếu. Bắt buộc phải có trong mọi hàm tối giản vì nó là nhóm duy nhất phủ một minterm nào đó.</li>
            <li><b style="color:#60a5fa">PI (Prime Implicant):</b> Nhóm nguyên tố không thể mở rộng thêm, nhưng có thể bị thay thế bởi các nhóm khác.</li>
            <li><b style="color:#fb7185">Nhóm dư thừa (Redundant):</b> Khi mọi ô của nó đã được các nhóm khác phủ kín thì không đưa vào kết quả.</li>
          </ul>
        </article>

        <article class="learn-card glass">
          <h3>4. Bảng Tra Phản Xạ Nhanh Lũy Thừa 2 (0 Đến 16)</h3>
          <div class="pow-grid-learn">
            ${Array.from({ length: 17 }, (_, i) => `
              <div class="pow-chip">
                <span>2<sup>${i}</sup></span>
                <b>${fmtNum(2 ** i)}</b>
              </div>
            `).join('')}
          </div>
          <p class="small muted mt-2">
            <b>Mẹo nhớ siêu tốc:</b> \(2^{10} = 1024\) (gần 1K), \(2^{16} = 65,536\) (kích thước địa chỉ con trỏ 16-bit huyền thoại). 
            Muốn tính \(2^{13}\)? Lấy \(2^{10} \\times 2^3 = 1024 \\times 8 = 8192\)!
          </p>
        </article>
      </div>
    </div>`;

    root.innerHTML = html;
  }

  /* =========================================================================
     MÀN HÌNH CÀI ĐẶT (SETTINGS)
     ========================================================================= */
  function renderSettings(root) {
    const s = Store.settings;
    const html = `
    <div class="settings-view glass">
      <h2>⚙ Cài Đặt Ứng Dụng</h2>

      <div class="st-group">
        <label><b>Kiểu ký hiệu phủ định (NOT):</b></label>
        <div class="pill-group not-picker">
          <button class="pill ${s.notation === 'bar' ? 'active' : ''}" data-not="bar">
            Gạch trên: <span class="lit"><span class="ov">A</span></span>
          </button>
          <button class="pill ${s.notation === 'prime' ? 'active' : ''}" data-not="prime">
            Dấu phẩy: <span class="lit">A'</span>
          </button>
          <button class="pill ${s.notation === 'tilde' ? 'active' : ''}" data-not="tilde">
            Dấu ngã: <span class="lit">~A</span>
          </button>
        </div>
        <small class="muted">Tùy chọn hiển thị công thức Boolean theo chuẩn giáo trình của bạn.</small>
      </div>

      <div class="st-group">
        <label><b>Hiệu ứng âm thanh (WebAudio):</b></label>
        <button class="btn ghost toggle-sound ${s.sound ? 'active' : ''}">
          ${s.sound ? '🔊 Đang bật' : '🔇 Đang tắt'}
        </button>
      </div>

      <div class="st-group danger-zone">
        <label><b>Dữ liệu người dùng:</b></label>
        <p class="muted small">Xóa toàn bộ điểm kỷ lục và lịch sử chơi đã lưu trong trình duyệt.</p>
        <button class="btn ghost danger" data-a="reset-data">Xóa toàn bộ điểm kỷ lục</button>
      </div>
    </div>`;

    root.innerHTML = html;

    root.querySelectorAll('.not-picker .pill').forEach((btn) => {
      btn.onclick = () => {
        Store.settings.notation = btn.dataset.not;
        Store.save();
        root.querySelectorAll('.not-picker .pill').forEach((p) => p.classList.toggle('active', p === btn));
        FX.sfx.click();
      };
    });

    const sndBtn = root.querySelector('.toggle-sound');
    sndBtn.onclick = () => {
      Store.settings.sound = !Store.settings.sound;
      Store.save();
      sndBtn.textContent = Store.settings.sound ? '🔊 Đang bật' : '🔇 Đang tắt';
      sndBtn.classList.toggle('active', Store.settings.sound);
      if (Store.settings.sound) FX.sfx.correct();
    };

    root.querySelector('[data-a="reset-data"]').onclick = () => {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ điểm kỷ lục không?')) {
        Store.data.best = {};
        Store.data.played = 0;
        Store.data.bestCombo = 0;
        Store.save();
        alert('Đã xóa dữ liệu thành công!');
        go('home');
      }
    };
  }

  return { init, go };
})();

// Tự động khởi động khi tải trang
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => App.init());
}
