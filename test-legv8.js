'use strict';
const LEGv8 = require('./js/legv8-cpu.js');
const LEGV8_LEVELS = require('./js/legv8-levels.js');

console.log('=== TEST SUITE: LEGv8 CODE MASTER CPU & LEVELS VERIFICATION ===\n');

let totalLevels = LEGV8_LEVELS.length;
let passedLevels = 0;
let totalTestCases = 0;
let passedTestCases = 0;

for (let i = 0; i < LEGV8_LEVELS.length; i++) {
  const lvl = LEGV8_LEVELS[i];
  console.log(`[Tier ${lvl.tier}] Checking Level ${i + 1}: ${lvl.title}...`);

  // 1. Kiểm tra solution_code
  const parsed = LEGv8.parseCode(lvl.solution_code);
  if (parsed.errors.length > 0) {
    console.error(`  ❌ LỖI PARSE CÚ PHÁP:`, parsed.errors.map(e => e.message));
    continue;
  }

  // 2. Kiểm tra ABI
  const audit = LEGv8.auditABI(parsed.instructions, { isProcedure: lvl.isProcedure });
  if (audit.errors.length > 0) {
    console.error(`  ❌ LỖI KIỂM ĐỊNH ABI:`, audit.errors.map(e => e.message));
    continue;
  }

  // 3. Chạy toàn bộ Test Cases
  const cpu = new LEGv8.VirtualCPU();
  let levelPassed = true;

  for (let t = 0; t < lvl.test_cases.length; t++) {
    totalTestCases++;
    const tc = lvl.test_cases[t];
    const res = cpu.runProgram(parsed, tc, { isProcedure: lvl.isProcedure });

    if (res.success) {
      passedTestCases++;
      console.log(`  ✓ Test Case #${t + 1} (${tc.label || 'OK'}): PASS (${res.cycles} cycles)`);
    } else {
      levelPassed = false;
      console.error(`  ❌ Test Case #${t + 1} FAIL: Expected ${res.expected}, got ${res.actual}. Error: ${res.message || 'Value mismatch'}`);
    }
  }

  if (levelPassed) {
    passedLevels++;
    console.log(`  🎉 Level ${i + 1} PASSED ALL TESTS!\n`);
  } else {
    console.error(`  ⚠️ Level ${i + 1} FAILED SOME TESTS!\n`);
  }
}

// 4. Kiểm tra các thanh ghi bị cấm (X8, X28, X29, X31)
console.log('--- Kiểm tra cấm thanh ghi X8, X28, X29, X31 ---');
const bannedCodes = [
  'ADD X8, X0, X1',
  'SUB X0, X28, X1',
  'ADDI X29, X0, #8',
  'LDUR X31, [SP, #0]'
];

let bannedCheckPass = true;
for (const bCode of bannedCodes) {
  const p = LEGv8.parseCode(bCode);
  if (p.errors.length > 0) {
    console.log(`  ✓ Phát hiện và chặn chuẩn xác: "${bCode}" -> ${p.errors[0].message}`);
  } else {
    console.error(`  ❌ Không chặn được mã bị cấm: "${bCode}"`);
    bannedCheckPass = false;
  }
}

console.log(`\n======================================================`);
console.log(`TỔNG KẾT: ${passedLevels}/${totalLevels} Levels hoàn hảo, ${passedTestCases}/${totalTestCases} Test Cases đạt PASS 100%!`);
console.log(`Kiểm tra chặn thanh ghi cấm: ${bannedCheckPass ? 'THÀNH CÔNG 100%' : 'THẤT BẠI'}`);
console.log(`======================================================`);
