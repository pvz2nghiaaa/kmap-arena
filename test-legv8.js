'use strict';
const LEGv8 = require('./js/legv8-cpu.js');
const LEGV8_LEVELS = require('./js/legv8-levels.js');
const { DECOMPILE_LEVELS, evaluateCCode } = require('./js/legv8-decompile.js');
const LEETCODE_PROBLEMS = require('./js/legv8-leetcode.js');

console.log('================================================================');
console.log('LEGv8 COMPLETE TEST SUITE: 3 MINIGAMES & HARDWARE VERIFICATION');
console.log('================================================================\n');

// -------------------------------------------------------------
// PART 1: MINIGAME 1 — C ➔ LEGv8 CODE MASTER (22 LEVELS)
// -------------------------------------------------------------
console.log('>>> [PHẦN 1] KIỂM TRA MINIGAME 1: C ➔ LEGv8 CODE MASTER (22 LEVELS)');
let gm1Passed = 0;
let gm1TotalCases = 0;
let gm1PassedCases = 0;

for (let i = 0; i < LEGV8_LEVELS.length; i++) {
  const lvl = LEGV8_LEVELS[i];
  const parsed = LEGv8.parseCode(lvl.solution_code);
  if (parsed.errors.length > 0) {
    console.error(`  ❌ LỖI PARSE Level ${i + 1}:`, parsed.errors.map(e => e.message));
    continue;
  }
  const audit = LEGv8.auditABI(parsed.instructions, { isProcedure: lvl.isProcedure });
  if (audit.errors.length > 0) {
    console.error(`  ❌ LỖI ABI Level ${i + 1}:`, audit.errors.map(e => e.message));
    continue;
  }

  const cpu = new LEGv8.VirtualCPU();
  let ok = true;
  for (const tc of lvl.test_cases) {
    gm1TotalCases++;
    const res = cpu.runProgram(parsed, tc, { isProcedure: lvl.isProcedure });
    if (res.success) {
      gm1PassedCases++;
    } else {
      ok = false;
      console.error(`  ❌ Level ${i + 1} (${lvl.title}) FAIL case:`, res);
    }
  }
  if (ok) {
    gm1Passed++;
    console.log(`  ✓ Level ${i + 1} [Tier ${lvl.tier}] "${lvl.title}": PASS ALL (${lvl.test_cases.length} cases)`);
  }
}
console.log(`--> KẾT QUẢ PHẦN 1: ${gm1Passed}/${LEGV8_LEVELS.length} levels, ${gm1PassedCases}/${gm1TotalCases} test cases đạt 100%!\n`);

// -------------------------------------------------------------
// PART 2: MINIGAME 2 — LEGv8 ➔ C REVERSE DECOMPILER (10 LEVELS)
// -------------------------------------------------------------
console.log('>>> [PHẦN 2] KIỂM TRA MINIGAME 2: LEGv8 ➔ C DECOMPILER (10 LEVELS)');
let gm2Passed = 0;
let gm2TotalCases = 0;
let gm2PassedCases = 0;

for (let i = 0; i < DECOMPILE_LEVELS.length; i++) {
  const lvl = DECOMPILE_LEVELS[i];
  let ok = true;

  // Sử dụng solution_c_code hoặc starter_c_code đã hoàn thiện
  const refC = lvl.solution_c_code || lvl.starter_c_code;
  for (const tc of lvl.test_cases) {
    gm2TotalCases++;
    const res = evaluateCCode(refC, tc);
    if (res.success) {
      gm2PassedCases++;
    } else {
      ok = false;
      console.error(`  ❌ Decompile Level ${i + 1} (${lvl.title}) FAIL case:`, res);
    }
  }
  if (ok) {
    gm2Passed++;
    console.log(`  ✓ Decompile Level ${i + 1} "${lvl.title}": PASS ALL (${lvl.test_cases.length} cases)`);
  }
}
console.log(`--> KẾT QUẢ PHẦN 2: ${gm2Passed}/${DECOMPILE_LEVELS.length} levels, ${gm2PassedCases}/${gm2TotalCases} test cases đạt 100%!\n`);

// -------------------------------------------------------------
// PART 3: MINIGAME 3 — LEGv8 LEETCODE ARENA (8 PROBLEMS)
// -------------------------------------------------------------
console.log('>>> [PHẦN 3] KIỂM TRA MINIGAME 3: LEGv8 LEETCODE ARENA (8 PROBLEMS)');
let gm3Passed = 0;
let gm3TotalCases = 0;
let gm3PassedCases = 0;

for (let i = 0; i < LEETCODE_PROBLEMS.length; i++) {
  const prob = LEETCODE_PROBLEMS[i];
  const parsed = LEGv8.parseCode(prob.solution_code);
  if (parsed.errors.length > 0) {
    console.error(`  ❌ LỖI PARSE LeetCode ${i + 1}:`, parsed.errors.map(e => e.message));
    continue;
  }
  const audit = LEGv8.auditABI(parsed.instructions, { isProcedure: true });
  if (audit.errors.length > 0) {
    console.error(`  ❌ LỖI ABI LeetCode ${i + 1}:`, audit.errors.map(e => e.message));
    continue;
  }

  const allCases = [...prob.sample_cases, ...prob.hidden_cases];
  const cpu = new LEGv8.VirtualCPU();
  let ok = true;
  for (const tc of allCases) {
    gm3TotalCases++;
    const res = cpu.runProgram(parsed, tc, { isProcedure: true });
    if (res.success) {
      gm3PassedCases++;
    } else {
      ok = false;
      console.error(`  ❌ LeetCode ${prob.title} FAIL case:`, res);
    }
  }
  if (ok) {
    gm3Passed++;
    console.log(`  ✓ LeetCode Problem ${i + 1} [${prob.difficulty}] "${prob.title}": PASS ALL (${allCases.length} cases)`);
  }
}
console.log(`--> KẾT QUẢ PHẦN 3: ${gm3Passed}/${LEETCODE_PROBLEMS.length} problems, ${gm3PassedCases}/${gm3TotalCases} test cases đạt 100%!\n`);

// -------------------------------------------------------------
// PART 4: KIỂM TRA CHẶN THANH GHI BỊ CẤM (X8, X28, X29, X31)
// -------------------------------------------------------------
console.log('>>> [PHẦN 4] KIỂM TRA CHẶN THANH GHI BỊ CẤM (X8, X28, X29, X31)');
const bannedCodes = [
  'ADD X8, X0, X1',
  'SUB X0, X28, X1',
  'ADDI X29, X0, #8',
  'LDUR X31, [SP, #0]',
  'LDURB X8, [X0, #0]',
  'STURW X28, [SP, #4]'
];

let bannedCheckPass = true;
for (const bCode of bannedCodes) {
  const p = LEGv8.parseCode(bCode);
  if (p.errors.length > 0) {
    console.log(`  ✓ Chặn chuẩn xác: "${bCode}" -> ${p.errors[0].message}`);
  } else {
    console.error(`  ❌ Không chặn được mã bị cấm: "${bCode}"`);
    bannedCheckPass = false;
  }
}

console.log('\n================================================================');
console.log(`TỔNG KẾT TOÀN DIỆN:`);
console.log(`- Minigame 1 (C ➔ LEGv8):        ${gm1Passed}/${LEGV8_LEVELS.length} Levels PASS 100% (${gm1PassedCases}/${gm1TotalCases} tests)`);
console.log(`- Minigame 2 (LEGv8 ➔ C):        ${gm2Passed}/${DECOMPILE_LEVELS.length} Levels PASS 100% (${gm2PassedCases}/${gm2TotalCases} tests)`);
console.log(`- Minigame 3 (LEGv8 LeetCode):   ${gm3Passed}/${LEETCODE_PROBLEMS.length} Problems PASS 100% (${gm3PassedCases}/${gm3TotalCases} tests)`);
console.log(`- Kiểm tra bảo vệ thanh ghi cấm: ${bannedCheckPass ? 'THÀNH CÔNG 100%' : 'THẤT BẠI'}`);
console.log('================================================================');
