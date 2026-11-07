'use strict';
/**
 * ============================================================================
 * LEGv8 Code Master — UI Controller & Interactive IDE Engine
 * Handles Editor, CPU Stepping, Timer, Test Runner, Scaffold & Audio FX
 * ============================================================================
 */

const LEGv8UI = (() => {
  let currentLevelIdx = 0;
  let currentLevel = null;
  let timerInterval = null;
  let timeLeft = 180;
  let wrongTries = 0;
  let isRunning = false;
  let isStepping = false;
  let stepCPU = null;
  let stepParsed = null;
  let totalScore = 0;
  let editorMode = 'pro'; // 'pro' | 'scaffold'
  let scaffoldSelections = {};

  // Audio Synthesizer (Web Audio API, không cần file rời)
  let audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, dur = 0.12, type = 'triangle', vol = 0.08, when = 0) {
    const ctx = getAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  const sfx = {
    click: () => playTone(600, 0.04, 'sine', 0.03),
    success: () => {
      playTone(523, 0.12, 'triangle', 0.07, 0);
      playTone(659, 0.12, 'triangle', 0.07, 0.07);
      playTone(784, 0.14, 'triangle', 0.07, 0.14);
      playTone(1046, 0.22, 'triangle', 0.08, 0.21);
    },
    error: () => playTone(180, 0.2, 'sawtooth', 0.06),
    step: () => playTone(880, 0.04, 'square', 0.02)
  };

  // DOM Elements cache
  const el = {};

  function init() {
    cacheElements();
    bindEvents();
    loadSavedProgress();
    renderLevelSelector();
    loadLevel(0);
  }

  function cacheElements() {
    el.levelSelect = document.getElementById('level-select');
    el.tierBadge = document.getElementById('tier-badge');
    el.levelTitle = document.getElementById('level-title');
    el.timerBox = document.getElementById('timer-box');
    el.timerVal = document.getElementById('timer-val');
    el.scoreVal = document.getElementById('total-score-val');
    el.cCodeCard = document.getElementById('c-code-card');
    el.levelDesc = document.getElementById('level-desc');
    el.hintsContainer = document.getElementById('hints-container');
    el.codeArea = document.getElementById('code-textarea');
    el.lineNumbers = document.getElementById('line-numbers');
    el.scaffoldView = document.getElementById('scaffold-view');
    el.modeBtn = document.getElementById('toggle-mode-btn');
    el.runBtn = document.getElementById('btn-run');
    el.stepBtn = document.getElementById('btn-step');
    el.resetBtn = document.getElementById('btn-reset');
    el.regGrid = document.getElementById('reg-grid');
    el.stackView = document.getElementById('stack-view');
    el.testConsole = document.getElementById('test-console');
    el.victoryModal = document.getElementById('victory-modal');
    el.nextLevelBtn = document.getElementById('btn-next-level');

    el.handbookModal = document.getElementById('handbook-modal');
    el.openHandbookBtn = document.getElementById('btn-open-handbook');
    el.closeHandbookBtn = document.getElementById('btn-close-handbook');

    el.flagN = document.getElementById('flag-n');
    el.flagZ = document.getElementById('flag-z');
    el.flagC = document.getElementById('flag-c');
    el.flagV = document.getElementById('flag-v');
  }

  function bindEvents() {
    if (el.openHandbookBtn && el.handbookModal) {
      el.openHandbookBtn.addEventListener('click', () => {
        el.handbookModal.classList.add('show');
        sfx.click();
      });
    }

    if (el.closeHandbookBtn && el.handbookModal) {
      el.closeHandbookBtn.addEventListener('click', () => {
        el.handbookModal.classList.remove('show');
        sfx.click();
      });
    }

    if (el.handbookModal) {
      el.handbookModal.addEventListener('click', (e) => {
        if (e.target === el.handbookModal) el.handbookModal.classList.remove('show');
      });
    }
    if (el.levelSelect) {
      el.levelSelect.addEventListener('change', (e) => {
        loadLevel(parseInt(e.target.value, 10));
      });
    }

    if (el.codeArea) {
      el.codeArea.addEventListener('input', () => {
        updateLineNumbers();
        resetStepState();
      });

      el.codeArea.addEventListener('scroll', () => {
        if (el.lineNumbers) el.lineNumbers.scrollTop = el.codeArea.scrollTop;
      });

      // Hỗ trợ phím Tab thụt lề 4 space & Ctrl + Enter để Run
      el.codeArea.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = el.codeArea.selectionStart;
          const end = el.codeArea.selectionEnd;
          el.codeArea.value = el.codeArea.value.substring(0, start) + '    ' + el.codeArea.value.substring(end);
          el.codeArea.selectionStart = el.codeArea.selectionEnd = start + 4;
          updateLineNumbers();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          compileAndRun();
        }
      });
    }

    if (el.runBtn) el.runBtn.addEventListener('click', compileAndRun);
    if (el.stepBtn) el.stepBtn.addEventListener('click', stepExecution);
    if (el.resetBtn) el.resetBtn.addEventListener('click', resetCode);
    if (el.modeBtn) el.modeBtn.addEventListener('click', toggleEditorMode);

    // Chuyển tab trong Inspector
    document.querySelectorAll('.inspector-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        switchInspectorTab(tabBtn.dataset.tab);
        sfx.click();
      });
    });

    if (el.nextLevelBtn) {
      el.nextLevelBtn.addEventListener('click', () => {
        el.victoryModal.classList.remove('show');
        if (currentLevelIdx + 1 < LEGV8_LEVELS.length) {
          loadLevel(currentLevelIdx + 1);
        } else {
          loadLevel(0);
        }
      });
    }
  }

  function switchInspectorTab(tabId) {
    document.querySelectorAll('.inspector-tab').forEach((b) => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.inspector-tab-content').forEach((content) => {
      content.classList.toggle('active', content.id === `tab-content-${tabId}`);
    });
  }

  function loadSavedProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem('legv8_progress')) || {};
      totalScore = saved.totalScore || 0;
      if (el.scoreVal) el.scoreVal.textContent = totalScore.toLocaleString();
    } catch {
      totalScore = 0;
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem('legv8_progress', JSON.stringify({ totalScore }));
    } catch { /* ignore */ }
  }

  function renderLevelSelector() {
    if (!el.levelSelect) return;
    el.levelSelect.innerHTML = LEGV8_LEVELS.map((lvl, idx) => `
      <option value="${idx}">Tier ${lvl.tier}: ${lvl.title}</option>
    `).join('');
  }

  function loadLevel(idx) {
    currentLevelIdx = idx;
    currentLevel = LEGV8_LEVELS[idx];
    if (!currentLevel) return;

    if (el.levelSelect) el.levelSelect.value = idx;
    if (el.levelTitle) el.levelTitle.textContent = currentLevel.title;

    // Cập nhật Tier Badge
    if (el.tierBadge) {
      el.tierBadge.textContent = `Tier ${currentLevel.tier}`;
      el.tierBadge.className = `legv8-tier-badge tier-${currentLevel.tier}`;
    }

    // Hiển thị mã C
    if (el.cCodeCard) {
      el.cCodeCard.innerHTML = highlightCCode(currentLevel.c_code);
    }

    if (el.levelDesc) {
      el.levelDesc.textContent = currentLevel.desc;
    }

    // Render Gợi ý Hints
    if (el.hintsContainer) {
      el.hintsContainer.innerHTML = currentLevel.hints.map((hint, hIdx) => `
        <div class="hint-item">
          <div class="hint-header" onclick="this.parentElement.classList.toggle('open')">
            <span>💡 Gợi ý ${hIdx + 1}</span>
            <span>▼</span>
          </div>
          <div class="hint-body">${hint}</div>
        </div>
      `).join('');
    }

    // Nạp mã khởi tạo
    if (el.codeArea) {
      el.codeArea.value = currentLevel.starter_code || '';
      updateLineNumbers();
    }

    // Render Scaffold nếu có
    scaffoldSelections = {};
    renderScaffoldMode();

    // Reset Timer
    wrongTries = 0;
    startTimer(currentLevel.time_limit || 180);

    // Reset CPU & Test Console
    resetStepState();
    renderRegisterGrid();
    renderStackView();
    renderInitialTests();
    switchInspectorTab('tests');
  }

  function highlightCCode(code) {
    if (!code) return '';
    return code
      .replace(/\/\/.*/g, '<span class="c-comment">$&</span>')
      .replace(/\b(long long|int|void|char)\b/g, '<span class="c-type">$1</span>')
      .replace(/\b(if|else|while|for|return)\b/g, '<span class="c-kw">$1</span>')
      .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span class="c-func">$1</span>(')
      .replace(/\b(\d+)\b/g, '<span class="c-num">$1</span>');
  }

  function startTimer(seconds) {
    clearInterval(timerInterval);
    timeLeft = seconds;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        showTimeOutNotice();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!el.timerVal) return;
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    el.timerVal.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (timeLeft <= 60) {
      el.timerBox.classList.add('timer-urgent');
    } else {
      el.timerBox.classList.remove('timer-urgent');
    }
  }

  function showTimeOutNotice() {
    if (el.testConsole) {
      el.testConsole.innerHTML = `
        <div class="test-card fail">
          <div class="test-head"><span class="badge-fail">⏱ HẾT GIỜ THỬ THÁCH!</span></div>
          <p style="margin-top:0.3rem; color:#f87171;">Thời gian quy định của bài tập đã kết thúc. Bạn vẫn có thể tiếp tục hoàn thành và nộp bài với điểm chuẩn cơ sở.</p>
        </div>
      `;
    }
  }

  function updateLineNumbers() {
    if (!el.codeArea || !el.lineNumbers) return;
    const lines = el.codeArea.value.split('\n');
    el.lineNumbers.innerHTML = lines.map((_, i) => `<span id="ln-${i}">${i + 1}</span>`).join('');
  }

  function resetCode() {
    if (currentLevel && el.codeArea) {
      el.codeArea.value = currentLevel.starter_code || '';
      updateLineNumbers();
      resetStepState();
      sfx.click();
    }
  }

  function toggleEditorMode() {
    editorMode = editorMode === 'pro' ? 'scaffold' : 'pro';
    if (editorMode === 'scaffold' && currentLevel.scaffold) {
      el.codeArea.style.display = 'none';
      if (el.lineNumbers) el.lineNumbers.style.display = 'none';
      if (el.scaffoldView) el.scaffoldView.style.display = 'block';
      if (el.modeBtn) el.modeBtn.textContent = 'Chế Độ Pro Editor';
      renderScaffoldMode();
    } else {
      el.codeArea.style.display = 'block';
      if (el.lineNumbers) el.lineNumbers.style.display = 'block';
      if (el.scaffoldView) el.scaffoldView.style.display = 'none';
      if (el.modeBtn) el.modeBtn.textContent = 'Chế Độ Điền Khuyết';
    }
    sfx.click();
  }

  function renderScaffoldMode() {
    if (!el.scaffoldView) return;
    if (!currentLevel.scaffold) {
      el.scaffoldView.innerHTML = `<p class="muted">Bài tập này chỉ hỗ trợ Pro Editor.</p>`;
      return;
    }

    const sc = currentLevel.scaffold;
    let html = sc.template;

    sc.blanks.forEach((b) => {
      const selected = scaffoldSelections[b.id] || '[ ? ]';
      const isFilled = scaffoldSelections[b.id] !== undefined;
      const selectHtml = `
        <select class="scaffold-blank ${isFilled ? 'filled' : ''}" onchange="LEGv8UI.onScaffoldSelect(${b.id}, this.value)">
          <option value="">[ ? ]</option>
          ${b.options.map((opt) => `<option value="${opt}" ${selected === opt ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      `;
      html = html.replace(`{{${b.id}}}`, selectHtml);
    });

    el.scaffoldView.innerHTML = `<pre style="white-space:pre-wrap; font-family:var(--font-code);">${html}</pre>`;
  }

  function onScaffoldSelect(blankId, val) {
    scaffoldSelections[blankId] = val;
    // Tự động sinh mã sang Pro Editor
    if (currentLevel.scaffold) {
      let code = currentLevel.scaffold.template;
      currentLevel.scaffold.blanks.forEach((b) => {
        code = code.replace(`{{${b.id}}}`, scaffoldSelections[b.id] || b.expected);
      });
      el.codeArea.value = code;
      updateLineNumbers();
    }
  }

  /**
   * =========================================================================
   * GIAI ĐOẠN BIÊN DỊCH & CHẤM ĐIỂM HOÀN CHỈNH (3-STAGE VALIDATION)
   * =========================================================================
   */
  function compileAndRun() {
    sfx.click();
    switchInspectorTab('tests');
    resetStepState();
    const source = el.codeArea.value;

    // Giai đoạn 1: Linting
    const parsed = LEGv8.parseCode(source);
    if (parsed.errors.length > 0) {
      sfx.error();
      wrongTries++;
      renderLintErrors(parsed.errors);
      return;
    }

    // Giai đoạn 2: ABI Audit
    const audit = LEGv8.auditABI(parsed.instructions, { isProcedure: currentLevel.isProcedure });
    if (audit.errors.length > 0) {
      sfx.error();
      wrongTries++;
      renderABIErrors(audit.errors);
      return;
    }

    // Giai đoạn 3: Virtual CPU Test Runner
    const cpu = new LEGv8.VirtualCPU();
    const testCases = currentLevel.test_cases || [];
    const results = [];
    let allPassed = true;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const res = cpu.runProgram(parsed, tc, { isProcedure: currentLevel.isProcedure });
      results.push({ testCase: tc, result: res });
      if (!res.success) allPassed = false;
    }

    renderTestResults(results, audit.warnings);

    if (allPassed) {
      clearInterval(timerInterval);
      sfx.success();
      handleVictory();
    } else {
      sfx.error();
      wrongTries++;
    }

    // Cập nhật giao diện thanh ghi theo snapshot của test case cuối
    if (results.length > 0 && results[0].result.registersSnapshot) {
      renderRegisterGrid(results[0].result.registersSnapshot);
    }
  }

  function renderLintErrors(errors) {
    if (!el.testConsole) return;
    el.testConsole.innerHTML = `
      <div class="test-card fail">
        <div class="test-head"><span class="badge-fail">✗ LỖI CÚ PHÁP (STAGE 1: SYNTAX LINTING)</span></div>
        <div class="test-diff" style="color:#f87171;">
          ${errors.map((e) => `• ${e.message}`).join('<br>')}
        </div>
      </div>
    `;
  }

  function renderABIErrors(errors) {
    if (!el.testConsole) return;
    el.testConsole.innerHTML = `
      <div class="test-card fail">
        <div class="test-head"><span class="badge-fail">✗ VI PHẠM CHUẨN ABI (STAGE 2: ABI AUDIT)</span></div>
        <div class="test-diff" style="color:#f87171;">
          ${errors.map((e) => `• ${e.message}`).join('<br>')}
        </div>
      </div>
    `;
  }

  function renderTestResults(results, warnings = []) {
    if (!el.testConsole) return;
    let html = '';

    if (warnings.length > 0) {
      html += `
        <div class="test-card" style="border-color:var(--c-amber); background:rgba(251,191,36,0.08);">
          <div class="test-head" style="color:var(--c-amber);"><span>⚠ CẢNH BÁO AN TOÀN:</span></div>
          <div style="font-size:0.75rem; color:#fde68a;">${warnings.join('<br>')}</div>
        </div>
      `;
    }

    results.forEach((r, idx) => {
      const res = r.result;
      const isPass = res.success;

      html += `
        <div class="test-card ${isPass ? 'pass' : 'fail'}">
          <div class="test-head">
            <span>Bộ Kiểm Thử #${idx + 1}</span>
            <span class="${isPass ? 'badge-pass' : 'badge-fail'}">${isPass ? '✓ ĐẠT (PASS)' : '✗ THẤT BẠI (FAIL)'}</span>
          </div>
          ${!isPass ? `
            <div class="test-diff">
              ${res.message ? `<div style="color:#f87171; margin-bottom:4px;">• ${res.message}</div>` : ''}
              ${res.memDiff ? `
                <div style="color:#f87171; font-weight:600; margin-bottom:3px;">
                  ⚠️ Lỗi cập nhật bộ nhớ: Giá trị phần tử A[i] chưa đúng!
                </div>
                <div>Giá trị trong ô nhớ: <b style="color:var(--c-rose);">${res.memDiff.actual}</b> (kỳ vọng: <b style="color:var(--c-emerald);">${res.memDiff.expected}</b>)</div>
                <div style="color:#fde68a; font-size:0.72rem; margin-top:0.3rem;">💡 Lưu ý kiến trúc: Trong LEGv8 64-bit, mỗi phần tử là 8 bytes. Độ dời byte = i * 8 (dùng LSL #3, không phải #2)!</div>
              ` : `
                <div>Kết quả thực tế tại thanh ghi ${res.targetReg}: <b style="color:var(--c-rose);">${res.actual}</b></div>
                <div style="color:#fde68a; font-size:0.7rem; margin-top:0.2rem;">💡 Gợi ý: Kiểm tra lại phép tính, thứ tự nạp/lưu mảng hoặc điều kiện rẽ nhánh.</div>
              `}
            </div>
          ` : `
            <div style="font-size:0.72rem; color:#94a3b8;">
              ✓ Hoàn thành chuẩn xác trong <b>${res.cycles}</b> chu kỳ CPU ảo.
            </div>
          `}
        </div>
      `;
    });

    el.testConsole.innerHTML = html;
  }

  function renderInitialTests() {
    if (!el.testConsole) return;
    const testCases = currentLevel.test_cases || [];
    el.testConsole.innerHTML = `
      <div style="padding: 1.2rem; text-align: center; color: #94a3b8; font-size: 0.8rem; background: rgba(15, 23, 42, 0.4); border-radius: 8px; border: 1px dashed var(--ide-border); margin-bottom: 0.8rem;">
        <div style="font-size: 1.6rem; margin-bottom: 0.4rem;">🔒</div>
        <b style="color: #cbd5e1; font-size: 0.86rem;">Hệ Thống Kiểm Thử Ẩn Danh (${testCases.length} Test Cases)</b>
        <p style="margin-top: 0.35rem; line-height: 1.5;">Các bộ tham số kiểm thử được bảo mật tự động. Nhấn <b>COMPILE & RUN (Ctrl + Enter)</b> để bắt đầu biên dịch và chạy kiểm thử.</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${testCases.map((_, idx) => `
          <div class="test-card" style="opacity: 0.7;">
            <div class="test-head">
              <span>🔒 Bộ Kiểm Thử #${idx + 1} (Ẩn danh)</span>
              <span style="color: #64748b; font-size: 0.72rem;">Sẵn sàng</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function handleVictory() {
    // Công thức tính điểm: Base + (Remaining Secs * 10) - (Wrong Tries * 50)
    const basePts = currentLevel.base_score || 500;
    const timeBonus = Math.max(0, timeLeft * 10);
    const penalty = wrongTries * 50;
    const earnedScore = Math.max(50, basePts + timeBonus - penalty);

    totalScore += earnedScore;
    saveProgress();

    if (el.scoreVal) el.scoreVal.textContent = totalScore.toLocaleString();

    // Hiển thị modal chiến thắng
    document.getElementById('modal-base-score').textContent = `+${basePts}`;
    document.getElementById('modal-time-bonus').textContent = `+${timeBonus} (${timeLeft}s)`;
    document.getElementById('modal-penalty').textContent = `-${penalty} (${wrongTries} lần thử sai)`;
    document.getElementById('modal-total-score').textContent = `+${earnedScore}`;

    if (el.victoryModal) el.victoryModal.classList.add('show');
  }

  /**
   * =========================================================================
   * STEP-BY-STEP INTERACTIVE DEBUGGER
   * =========================================================================
   */
  function stepExecution() {
    sfx.step();
    if (!isStepping || !stepCPU) {
      // Khởi tạo phiên Stepping mới
      switchInspectorTab('regs');
      const source = el.codeArea.value;
      stepParsed = LEGv8.parseCode(source);
      if (stepParsed.errors.length > 0) {
        renderLintErrors(stepParsed.errors);
        return;
      }

      stepCPU = new LEGv8.VirtualCPU();
      const firstTest = currentLevel.test_cases[0] || {};
      if (Array.isArray(firstTest.params)) {
        firstTest.params.forEach((v, i) => stepCPU.setReg(`X${i}`, BigInt(v)));
      }
      if (firstTest.registers) {
        for (const [r, v] of Object.entries(firstTest.registers)) stepCPU.setReg(r, BigInt(v));
      }
      if (firstTest.memory) {
        for (const [a, v] of Object.entries(firstTest.memory)) stepCPU.writeMem(BigInt(a), BigInt(v));
      }
      isStepping = true;
    }

    if (stepCPU.pc >= stepParsed.instructions.length) {
      resetStepState();
      return;
    }

    const currentInstr = stepParsed.instructions[stepCPU.pc];
    highlightLine(currentInstr.lineNo - 1);

    const result = stepCPU.step(stepParsed.instructions, stepParsed.labels);

    // Cập nhật giao diện thanh ghi & Stack
    renderRegisterGrid(stepCPU.registers, result.modifiedReg);
    renderFlags(stepCPU.flags);
    renderStackView(stepCPU.memory, stepCPU.getReg('SP'));

    if (result.halted) {
      highlightLine(-1);
      isStepping = false;
    }
  }

  function resetStepState() {
    isStepping = false;
    stepCPU = null;
    stepParsed = null;
    highlightLine(-1);
  }

  function highlightLine(lineIdx) {
    if (!el.lineNumbers) return;
    const spans = el.lineNumbers.querySelectorAll('span');
    spans.forEach((sp, idx) => {
      sp.classList.toggle('current-line', idx === lineIdx);
    });
  }

  function renderRegisterGrid(registersMap = null, modifiedReg = null) {
    if (!el.regGrid) return;
    const regsToShow = [
      'X0', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7',
      'X9', 'X10', 'X11', 'X12', 'X13', 'X14', 'X15',
      'X19', 'X20', 'X21', 'X22', 'X23', 'X24', 'X25',
      'SP', 'LR', 'XZR'
    ];

    el.regGrid.innerHTML = regsToShow.map((reg) => {
      let valStr = '0';
      if (registersMap && registersMap.has(reg)) {
        valStr = registersMap.get(reg).toString();
      }
      const isMod = modifiedReg === reg;

      return `
        <div class="reg-cell ${isMod ? 'highlight' : ''}">
          <span class="reg-name">${reg}</span>
          <span class="reg-val" title="${valStr}">${valStr}</span>
        </div>
      `;
    }).join('');
  }

  function renderFlags(flags = { N: 0, Z: 0, C: 0, V: 0 }) {
    if (el.flagN) el.flagN.classList.toggle('active', flags.N === 1);
    if (el.flagZ) el.flagZ.classList.toggle('active', flags.Z === 1);
    if (el.flagC) el.flagC.classList.toggle('active', flags.C === 1);
    if (el.flagV) el.flagV.classList.toggle('active', flags.V === 1);
  }

  function renderStackView(memoryMap = null, currentSP = LEGv8.STACK_BASE) {
    if (!el.stackView) return;
    const rows = [];
    const base = currentSP;

    // Hiển thị 5 khung stack quanh SP
    for (let offset = 32n; offset >= -16n; offset -= 8n) {
      const addr = base + offset;
      let valStr = '0x0';
      if (memoryMap && memoryMap.has(addr)) {
        valStr = `0x${memoryMap.get(addr).toString(16)}`;
      }
      const isSP = offset === 0n;

      rows.push(`
        <div class="stack-row ${isSP ? 'sp-pointer' : ''}">
          <span class="stack-addr">SP ${offset >= 0n ? '+' : ''}${offset}</span>
          <span class="stack-val">${valStr}</span>
        </div>
      `);
    }

    el.stackView.innerHTML = rows.join('');
  }

  return {
    init,
    compileAndRun,
    stepExecution,
    resetCode,
    toggleEditorMode,
    onScaffoldSelect
  };
})();

window.addEventListener('DOMContentLoaded', LEGv8UI.init);
